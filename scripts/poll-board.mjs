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

import { spawnSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, openSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const DRYRUN = process.env.DRYRUN === '1';
const VERBOSE = process.env.VERBOSE === '1';

// ── flock-basierter Prozess-Mutex ────────────────────────────────────────────
// Self-re-execution unter flock: Der äußere Prozess startet sich selbst mit
// `flock -n LOCKFILE node script.mjs`. flock hält den Lock atomar für die
// gesamte Laufzeit des inneren Prozesses — verhindert parallele Cron-Instanzen.
const POLL_LOCK_FILE = '/tmp/bib-poller.lock';
if (!process.env._BIB_FLOCKED) {
  const result = spawnSync(
    'flock', ['-n', POLL_LOCK_FILE, process.execPath, ...process.argv.slice(1)],
    { stdio: 'inherit', env: { ...process.env, _BIB_FLOCKED: '1' } }
  );
  if (result.status === 1) {
    console.log(`[${new Date().toISOString()}] Poller läuft bereits (flock aktiv) — beende.`);
  }
  process.exit(result.status ?? 0);
}

// ── Config ──────────────────────────────────────────────────────────────────

const ENV_FILE = resolve(__dir, 'bib-board.env');

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

// STATE_FILE im Workspace (nicht /tmp) — überlebt Reboots
const STATE_FILE = resolve(CFG.WORKSPACE, '.pipeline-state.json');

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
    .filter(([, v]) => v != null)
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
query($boardId: ID!, $cursor: String) {
  node(id: $boardId) {
    ... on ProjectV2 {
      items(first: 50, after: $cursor) {
        pageInfo { endCursor hasNextPage }
        nodes {
          id
          updatedAt
          fieldValues(first: 8) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field { ... on ProjectV2FieldCommon { name id } }
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
  const allNodes = [];
  let cursor = null;

  do {
    const vars = { boardId: CFG.BOARD_ID };
    if (cursor) vars.cursor = cursor;
    const data = ghGraphQL(BOARD_QUERY, vars);
    const items = data.data.node.items;
    allNodes.push(...items.nodes);
    cursor = items.pageInfo.hasNextPage ? items.pageInfo.endCursor : null;
  } while (cursor);

  return allNodes;
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
    if (fv.field?.id === CFG.STATUS_FIELD_ID) return fv.name;
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

// ── Pipeline Guard ────────────────────────────────────────────────────────────
// Detects issues that are CLOSED or in Done without all three required agent
// markers. Such issues were closed outside the proper pipeline (e.g. #46).
// Action: post explanatory comment → reopen (if closed) → move to target column.
//
// Marker logic is duplicated in src/lib/pipeline-guard.ts for testability.
// Keep both in sync when adding new markers.

const REQUIRED_MARKERS = [
  { key: 'dev',    pattern: /agent:(?:dev|implement):v1/, targetStatus: 'STATUS_IN_PROGRESS', label: 'Implementierung' },
  { key: 'review', pattern: /agent:review:v1/,            targetStatus: 'STATUS_CODE_REVIEW',  label: 'Code Review' },
  { key: 'test',   pattern: /agent:test:v1/,              targetStatus: 'STATUS_TESTING',       label: 'Testing' },
];

function checkMarkers(commentsText) {
  return REQUIRED_MARKERS.map((m) => ({ ...m, found: m.pattern.test(commentsText) }));
}

function targetColumnForMissing(results) {
  for (const m of results) {
    if (!m.found) return m.targetStatus;
  }
  return null;
}

async function guardClosedAndDone(items) {
  let guarded = 0;

  for (const item of items) {
    const issue = item.content;
    if (!issue || !issue.number) continue;

    const status = getItemStatus(item);
    const isClosed = issue.state === 'CLOSED';
    const isDone   = status === 'Done';

    if (!isClosed && !isDone) continue;

    // Fetch all issue comments (not just the last 5 from the board query)
    let allComments = '';
    try {
      allComments = ghRun('issue', 'view', String(issue.number),
        '--repo', CFG.REPO,
        '--json', 'comments',
        '--jq', '[.comments[].body] | join("\n")');
    } catch (e) {
      warn(`#${issue.number}: Konnte Kommentare nicht laden (Guard): ${e.message}`);
      continue;
    }

    // Skip items already processed by the guard (avoid repeated comments on re-polls)
    if (allComments.includes('pipeline-guard:v1')) {
      dbg(`#${issue.number}: Guard-Kommentar bereits vorhanden — übersprungen.`);
      continue;
    }

    const markerResults = checkMarkers(allComments);
    const missing = markerResults.filter((m) => !m.found);

    if (missing.length === 0) {
      dbg(`#${issue.number}: Pipeline-Marker vollständig ✅`);
      continue;
    }

    const target = targetColumnForMissing(markerResults);
    const targetLabel = target.replace('STATUS_', '').replace('_', ' ');
    const missingList = missing
      .map((m) => `- \`<!-- agent:${m.key}:v1 -->\` (${m.label})`)
      .join('\n');

    log(`#${issue.number}: [Guard] prozesswidrig ${isClosed ? 'geschlossen' : 'in Done'} — Marker fehlen: ${missing.map((m) => m.key).join(', ')} → ${targetLabel}`);

    if (DRYRUN) {
      log(`  [DRYRUN] würde ${isClosed ? 'reopenen + ' : ''}nach "${targetLabel}" verschieben`);
      continue;
    }

    try {
      const guardComment = `<!-- pipeline-guard:v1 -->
**[Pipeline Guard]** ⛔ Issue prozesswidrig ${isClosed ? 'geschlossen' : 'nach Done verschoben'}.

Fehlende Pflicht-Marker:
${missingList}

Alle drei Marker müssen vorhanden sein, bevor ein Issue Done/closed sein darf:
- \`<!-- agent:dev:v1 -->\` — Implementierung durch Agent
- \`<!-- agent:review:v1 -->\` — Code Review durch Agent
- \`<!-- agent:test:v1 -->\` — Tests durch Agent

→ Verschiebe zurück nach _${targetLabel}_.`;

      ghRun('issue', 'comment', String(issue.number),
        '--body', guardComment,
        '--repo', CFG.REPO);

      if (isClosed) {
        ghRun('issue', 'reopen', String(issue.number), '--repo', CFG.REPO);
        log(`#${issue.number}: Issue wiedereröffnet.`);
      }

      const moveQuery = `mutation {
        updateProjectV2ItemFieldValue(input: {
          projectId: "${CFG.BOARD_ID}"
          itemId: "${item.id}"
          fieldId: "${CFG.STATUS_FIELD_ID}"
          value: { singleSelectOptionId: "${CFG[target]}" }
        }) { projectV2Item { id } }
      }`;
      ghGraphQL(moveQuery);
      log(`#${issue.number}: → ${targetLabel} ✅`);
      guarded++;
    } catch (e) {
      warn(`#${issue.number}: Guard-Aktion fehlgeschlagen: ${e.message}`);
    }
  }

  if (guarded > 0) log(`Pipeline-Guard: ${guarded} Issue(s) zurückgesetzt.`);
}

// ── Auto-Prioritization (1x täglich) ─────────────────────────────────────────

const PRIORITY_LABELS = {
  critical: { color: 'B60205', description: 'Kaputte Wahrheitsschicht / Kernlogik' },
  high:     { color: 'D93F0B', description: 'UX-Blocker für Nutzer' },
  medium:   { color: 'FBCA04', description: 'Verbesserung / Content-Qualität' },
  low:      { color: '0E8A16', description: 'Nice-to-have / Kosmetik' },
};

function classifyPriority(title, body, labels) {
  const text = `${title} ${body}`.toLowerCase();
  const labelNames = labels.map((l) => l.name.toLowerCase());

  // Already has a priority label → skip
  if (labelNames.some((l) => l.startsWith('priority:'))) return null;

  // Critical: wrong feedback, broken core logic, false positive/negative
  if (/\b(falsch|wrong|kaputt|broken|lüg|misleading|0\s*(von|\/)\s*\d.*gut gemacht|gut gemacht.*0)\b/.test(text)) return 'critical';
  if (/\b(inkonsistent|inconsistent).*stern/i.test(text) || /stern.*inkonsistent/i.test(text)) return 'critical';
  if (/\bkein(e)?\s*(rück|feed\s*back|unmittelbar)/i.test(text)) return 'critical';
  if (/fortschritt.*quiz.*trenn|abgeschlossen.*unklar/i.test(text)) return 'critical';

  // High: UX blockers, broken visuals, navigation issues
  if (/\b(navigation|kryptisch|kaputt.*icon|icon.*kaputt|überlag|overlapping|nicht lesbar|unlesbar)\b/.test(text)) return 'high';
  if (/\bbug\b/i.test(text) && !labelNames.includes('analysis')) return 'high';

  // Medium: Content quality, missing content, wrong content
  if (/\b(content|inhalt|mehrdeutig|ambiguous|zu wenig|too few|immer gleich|immer\s*🦋)\b/.test(text)) return 'medium';
  if (/\b(quiz.*frag|frag.*quiz).*wenig/i.test(text)) return 'medium';

  // Low: infra, dupes, nice-to-have
  if (/\b(infra|pipeline|agent|refinement|poller|duplikat|dupe)\b/.test(text)) return 'low';

  // Default for Backlog items without clear signals
  return 'medium';
}

function ensurePriorityLabels() {
  for (const [level, meta] of Object.entries(PRIORITY_LABELS)) {
    try {
      ghRun('label', 'create', `priority:${level}`,
        '--color', meta.color,
        '--description', meta.description,
        '--repo', CFG.REPO);
    } catch { /* already exists */ }
  }
}

function autoPrioritize(items, state) {
  // Run once per day
  const lastRun = state._lastPrioritize || 0;
  const hoursSince = (Date.now() - lastRun) / 3600000;
  if (hoursSince < 20) {
    dbg(`Auto-Prioritize: Letzter Lauf vor ${hoursSince.toFixed(1)}h — überspringe (< 20h).`);
    return;
  }

  log('Auto-Prioritize: Starte tägliche Priorisierung...');
  if (!DRYRUN) ensurePriorityLabels();

  let labeled = 0;
  for (const item of items) {
    const issue = item.content;
    if (!issue || !issue.number) continue;
    if (issue.state === 'CLOSED') continue;

    const status = getItemStatus(item);
    if (status === 'Done') continue;

    const priority = classifyPriority(
      issue.title || '',
      issue.body || '',
      issue.labels?.nodes || []
    );

    if (!priority) continue; // already labeled

    log(`#${issue.number}: → priority:${priority} ("${issue.title}")`);
    if (!DRYRUN) {
      try {
        ghRun('issue', 'edit', String(issue.number),
          '--add-label', `priority:${priority}`,
          '--repo', CFG.REPO);
        labeled++;
      } catch (e) {
        warn(`#${issue.number}: Label setzen fehlgeschlagen: ${e.message}`);
      }
    }
  }

  state._lastPrioritize = Date.now();
  saveState(state);
  if (labeled > 0) log(`Auto-Prioritize: ${labeled} Issue(s) gelabelt.`);
  else log('Auto-Prioritize: Alle Issues bereits priorisiert.');
}

// ── Agent Dispatch ────────────────────────────────────────────────────────────

function dispatchAgent(agentName, issueNumber, itemId) {
  const scriptPath = resolve(__dir, 'agents', `${agentName}.sh`);
  log(`#${issueNumber}: Dispatching [${agentName}] (item: ${itemId})`);

  if (DRYRUN) {
    log(`  [DRYRUN] würde ausführen: bash ${scriptPath} ${issueNumber} ${itemId}`);
    return;
  }

  // M4: Agents laufen detached (spawn + unref) — Poller blockiert nicht auf Agent-Laufzeit.
  // Max 1 Dispatch pro Poll-Lauf (break im Haupt-Loop) verhindert Überlastung.
  // Agent-Log in eigene Datei schreiben
  const logDir = '/tmp/bib-agent-logs';
  spawnSync('mkdir', ['-p', logDir]);
  const logPath = `${logDir}/${issueNumber}-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
  const logFd = openSync(logPath, 'a');
  log(`#${issueNumber}: Log → ${logPath}`);

  const child = spawn(
    'bash', [scriptPath, String(issueNumber), itemId],
    {
      detached: true,
      stdio: ['ignore', logFd, logFd],
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
  child.unref();
  log(`#${issueNumber}: Agent [${agentName}] gestartet (PID ${child.pid})`);

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

  let dispatched = 0;
  let skipped = 0;
  let locked = 0;
  let autoMoved = 0;

  // Auto-fix: Items ohne Status → Backlog schieben
  for (const item of items) {
    const issue = item.content;
    if (!issue || !issue.number) continue;
    if (issue.state === 'CLOSED') continue;

    const status = getItemStatus(item);
    if (status === null) {
      log(`#${issue.number}: Kein Status gesetzt — schiebe nach Backlog.`);
      if (!DRYRUN) {
        try {
          const moveQuery = `mutation {
            updateProjectV2ItemFieldValue(input: {
              projectId: "${CFG.BOARD_ID}"
              itemId: "${item.id}"
              fieldId: "${CFG.STATUS_FIELD_ID}"
              value: { singleSelectOptionId: "${CFG.STATUS_BACKLOG}" }
            }) { projectV2Item { id } }
          }`;
          ghGraphQL(moveQuery);
          log(`#${issue.number}: → Backlog ✅`);
        } catch (e) {
          warn(`#${issue.number}: Auto-Move nach Backlog fehlgeschlagen: ${e.message}`);
        }
      }
      autoMoved++;
    }
  }

  if (autoMoved > 0) log(`${autoMoved} Item(s) automatisch nach Backlog verschoben.`);

  // Pipeline Guard: enforce required markers on Done/closed issues
  await guardClosedAndDone(items);

  // Daily auto-prioritize
  autoPrioritize(items, state);

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
    break; // M4: Max 1 Issue pro Poll-Lauf (passt zu 15-Min-Cron, vermeidet Komplexität)
  }

  log(`Poll abgeschlossen: ${dispatched} dispatched, ${locked} locked, ${skipped} skipped.`);
}

poll().catch((e) => {
  console.error(`[FATAL] ${e.message}`);
  process.exit(1);
});
