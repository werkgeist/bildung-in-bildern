#!/usr/bin/env node
/**
 * BiB Board Poller — scripts/poll-board.mjs
 *
 * Liest das GitHub Projects Board und dispatched passende Agents pro Spalte.
 *
 * Usage:
 *   node scripts/poll-board.mjs            # Normal run
 *   DRYRUN=1 node scripts/poll-board.mjs   # Dry run (kein Agent-Dispatch)
 *   VERBOSE=1 node scripts/poll-board.mjs  # Verbose logging
 */

import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const DRYRUN = process.env.DRYRUN === '1';
const VERBOSE = process.env.VERBOSE === '1';

// ── Config ──────────────────────────────────────────────────────────────────

const ENV_FILE = resolve(__dir, 'bib-board.env');
const STATE_FILE = '/tmp/bib-poll-state.json';
const LOCK_FILE = '/tmp/bib-poller.lock';

// ── PID Lockfile (verhindert parallele Poller-Instanzen) ─────────────────────

function acquireLock() {
  try {
    // flag 'wx' = O_WRONLY | O_CREAT | O_EXCL — atomar, schlägt fehl wenn Datei existiert
    writeFileSync(LOCK_FILE, String(process.pid), { flag: 'wx' });
  } catch (e) {
    if (e.code === 'EEXIST') {
      let stalePid = '';
      try { stalePid = readFileSync(LOCK_FILE, 'utf-8').trim(); } catch { /* ignore */ }
      if (stalePid) {
        try {
          process.kill(Number(stalePid), 0); // wirft wenn Prozess nicht existiert
          log(`Poller läuft bereits (PID ${stalePid}). Beende.`);
          process.exit(0);
        } catch {
          warn(`Veraltetes Lockfile gefunden (PID ${stalePid}). Entferne und starte neu.`);
          try { unlinkSync(LOCK_FILE); } catch { /* ignore */ }
          acquireLock();
        }
      } else {
        try { unlinkSync(LOCK_FILE); } catch { /* ignore */ }
        acquireLock();
      }
    } else {
      throw e;
    }
  }
}

function releaseLock() {
  try { unlinkSync(LOCK_FILE); } catch { /* ignore */ }
}

// Cleanup bei Exit/Signals
process.on('exit', releaseLock);
process.on('SIGINT', () => { releaseLock(); process.exit(130); });
process.on('SIGTERM', () => { releaseLock(); process.exit(143); });

function loadEnv(filePath) {
  const env = {};
  const lines = readFileSync(filePath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    env[key.trim()] = rest.join('=').replace(/\${HOME}/g, process.env.HOME || '~');
  }
  return env;
}

const CFG = loadEnv(ENV_FILE);
const GH_TOKEN = readFileSync(CFG.GH_TOKEN_FILE, 'utf-8').trim();

// ── Logging ──────────────────────────────────────────────────────────────────

const ts = () => new Date().toISOString();
const log = (msg) => console.log(`[${ts()}] ${msg}`);
const dbg = (msg) => { if (VERBOSE) console.log(`[${ts()}] [DBG] ${msg}`); };
const warn = (msg) => console.warn(`[${ts()}] [WARN] ${msg}`);

if (DRYRUN) log('=== DRYRUN MODE — kein Agent-Dispatch ===');

// ── State (Lock-Timeout-Tracking) ────────────────────────────────────────────

function loadState() {
  if (!existsSync(STATE_FILE)) return {};
  try { return JSON.parse(readFileSync(STATE_FILE, 'utf-8')); }
  catch { return {}; }
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ── GitHub API ───────────────────────────────────────────────────────────────

function ghGraphQL(query, variables = {}) {
  const varArgs = Object.entries(variables)
    .flatMap(([k, v]) => ['-f', `${k}=${v}`]);

  const result = spawnSync(
    'gh', ['api', 'graphql', '-f', `query=${query}`, ...varArgs],
    { env: { ...process.env, GH_TOKEN }, encoding: 'utf-8' }
  );

  if (result.status !== 0) {
    throw new Error(`GraphQL error: ${result.stderr}`);
  }
  return JSON.parse(result.stdout);
}

function ghRun(...args) {
  const result = spawnSync('gh', args, {
    env: { ...process.env, GH_TOKEN },
    encoding: 'utf-8',
  });
  if (result.status !== 0) {
    throw new Error(`gh ${args.join(' ')} failed: ${result.stderr}`);
  }
  return result.stdout.trim();
}

// ── Board Query ───────────────────────────────────────────────────────────────

const BOARD_QUERY = `
query($boardId: ID!) {
  node(id: $boardId) {
    ... on ProjectV2 {
      items(first: 50) {
        nodes {
          id
          updatedAt
          fieldValues(first: 8) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field { ... on ProjectV2FieldCommon { name } }
              }
            }
          }
          content {
            ... on Issue {
              number
              title
              state
              body
              url
              labels(first: 20) {
                nodes { name }
              }
              comments(last: 5) {
                nodes {
                  body
                  createdAt
                  author { login }
                }
              }
            }
          }
        }
      }
    }
  }
}`;

async function fetchBoardItems() {
  dbg(`Querying board ${CFG.BOARD_ID}...`);
  const data = ghGraphQL(BOARD_QUERY, { boardId: CFG.BOARD_ID });
  return data.data.node.items.nodes;
}

// ── Column → Agent Mapping ────────────────────────────────────────────────────

const COLUMN_AGENTS = {
  'Ready':       'refinement',
  'In Progress': 'implement',
  'Code Review': 'review',
  'Testing':     'test',
};

function getItemStatus(item) {
  for (const fv of item.fieldValues.nodes) {
    if (fv.field?.name === 'Status') return fv.name;
  }
  return null;
}

// ── Lock Mechanism ────────────────────────────────────────────────────────────

function isLocked(issue) {
  return issue.labels.nodes.some((l) => l.name === CFG.LOCK_LABEL);
}

function lockTimedOut(issueNumber, state) {
  const entry = state[`lock_${issueNumber}`];
  if (!entry) return false; // kein lokaler Eintrag (z.B. nach Reboot) → nicht als Timeout werten
  const ageMin = (Date.now() - new Date(entry).getTime()) / 60000;
  return ageMin > Number(CFG.LOCK_TIMEOUT_MINUTES);
}

function recordLock(issueNumber, state) {
  state[`lock_${issueNumber}`] = new Date().toISOString();
  saveState(state);
}

function clearLock(issueNumber, state) {
  delete state[`lock_${issueNumber}`];
  saveState(state);
}

function removeLockLabel(issueNumber) {
  try {
    ghRun('issue', 'edit', String(issueNumber),
      '--remove-label', CFG.LOCK_LABEL,
      '--repo', CFG.REPO);
    log(`#${issueNumber}: Lock-Label entfernt (Timeout).`);
  } catch (e) {
    warn(`#${issueNumber}: Konnte Lock-Label nicht entfernen: ${e.message}`);
  }
}

function addLockLabel(issueNumber) {
  // Ensure label exists first (idempotent)
  try {
    ghRun('label', 'create', CFG.LOCK_LABEL,
      '--color', 'F9D0C4',
      '--description', 'Agent läuft gerade',
      '--repo', CFG.REPO);
  } catch { /* label already exists */ }

  ghRun('issue', 'edit', String(issueNumber),
    '--add-label', CFG.LOCK_LABEL,
    '--repo', CFG.REPO);
}

// ── Agent Dispatch ────────────────────────────────────────────────────────────

function dispatchAgent(agentName, issueNumber, itemId) {
  const scriptPath = resolve(__dir, 'agents', `${agentName}.sh`);
  log(`#${issueNumber}: Dispatching [${agentName}] (item: ${itemId})`);

  if (DRYRUN) {
    log(`  [DRYRUN] würde ausführen: bash ${scriptPath} ${issueNumber} ${itemId}`);
    return;
  }

  // Run agent in background (detached) so poller doesn't block
  const result = spawnSync(
    'bash', [scriptPath, String(issueNumber), itemId],
    {
      detached: false, // wait for it (agents are quick-launching, actual work is async via claude)
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GH_TOKEN,
        REPO: CFG.REPO,
        BOARD_ID: CFG.BOARD_ID,
        STATUS_FIELD_ID: CFG.STATUS_FIELD_ID,
        STATUS_BACKLOG: CFG.STATUS_BACKLOG,
        STATUS_READY: CFG.STATUS_READY,
        STATUS_IN_PROGRESS: CFG.STATUS_IN_PROGRESS,
        STATUS_CODE_REVIEW: CFG.STATUS_CODE_REVIEW,
        STATUS_TESTING: CFG.STATUS_TESTING,
        STATUS_DONE: CFG.STATUS_DONE,
        LOCK_LABEL: CFG.LOCK_LABEL,
        WORKSPACE: CFG.WORKSPACE,
      },
    }
  );

  if (result.status !== 0) {
    warn(`Agent [${agentName}] für #${issueNumber} fehlgeschlagen:\n${result.stderr}`);
  }
}

// ── Main Poll Loop ────────────────────────────────────────────────────────────

async function poll() {
  const state = loadState();
  let items;

  try {
    items = await fetchBoardItems();
  } catch (e) {
    warn(`Board-Abfrage fehlgeschlagen: ${e.message}`);
    process.exit(1);
  }

  log(`${items.length} Items auf dem Board gefunden.`);
  if (items.length === 50) {
    warn('Board-Limit erreicht (50 Items) — Items jenseits von 50 werden nicht verarbeitet. Pagination fehlt.');
  }

  let dispatched = 0;
  let skipped = 0;
  let locked = 0;

  for (const item of items) {
    const issue = item.content;
    if (!issue || !issue.number) { dbg(`Item ohne Issue übersprungen: ${item.id}`); continue; }
    if (issue.state === 'CLOSED') { dbg(`#${issue.number} geschlossen, übersprungen.`); continue; }

    const status = getItemStatus(item);
    const agent = COLUMN_AGENTS[status];

    if (!agent) {
      dbg(`#${issue.number} in Spalte "${status}" — kein Agent.`);
      skipped++;
      continue;
    }

    // Lock check
    if (isLocked(issue)) {
      if (lockTimedOut(issue.number, state)) {
        warn(`#${issue.number}: Lock-Timeout! Entferne Label und verarbeite neu.`);
        if (!DRYRUN) removeLockLabel(issue.number);
        clearLock(issue.number, state);
      } else {
        log(`#${issue.number}: Agent läuft (${status}) — übersprungen.`);
        locked++;
        continue;
      }
    }

    log(`#${issue.number} [${status}]: "${issue.title}" → dispatch [${agent}]`);

    if (!DRYRUN) {
      try {
        addLockLabel(issue.number);
        recordLock(issue.number, state);
      } catch (e) {
        warn(`#${issue.number}: Lock-Label konnte nicht gesetzt werden — übersprungen: ${e.message}`);
        skipped++;
        continue;
      }
    }

    dispatchAgent(agent, issue.number, item.id);
    dispatched++;
  }

  log(`Poll abgeschlossen: ${dispatched} dispatched, ${locked} locked, ${skipped} skipped.`);
}

acquireLock();
poll().catch((e) => {
  console.error(`[FATAL] ${e.message}`);
  process.exit(1);
});
