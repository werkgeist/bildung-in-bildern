# BiB Automatische Issue-Pipeline

Vollautomatische CI/CD-Pipeline über GitHub Projects Board-Polling.
Kein eigener Server — alles über GitHub CLI + Claude Code CLI.

## Überblick

```
Backlog → Ready → In Progress → Code Review → Testing → Done
                     ↑              ↓              ↓
                     └──────────────┴──────────────┘
                           (bei Fehler zurück)
```

Der **Poller** läuft alle 15 Minuten (Cron) und prüft den Board-Status.
Für jede aktive Spalte wird der passende Agent aufgerufen.

## Dateien

| Datei | Zweck |
|-------|-------|
| `scripts/poll-board.mjs` | Haupt-Poller (Node.js, standalone) |
| `scripts/bib-board.env` | Board-Konfiguration (Field-IDs, Repo) |
| `scripts/agents/_common.sh` | Gemeinsame Hilfsfunktionen |
| `scripts/agents/refinement.sh` | Ready → prüft Spec → In Progress |
| `scripts/agents/implement.sh` | In Progress → Claude Code → Code Review |
| `scripts/agents/review.sh` | Code Review → Codex → Testing |
| `scripts/agents/test.sh` | Testing → pnpm test+build → Done |

## Usage

### Poller manuell starten

```bash
# Normaler Lauf
node scripts/poll-board.mjs

# Dry-Run (kein Dispatch, nur Logging)
DRYRUN=1 node scripts/poll-board.mjs

# Verbose (alle Debug-Meldungen)
VERBOSE=1 node scripts/poll-board.mjs

# Beides
DRYRUN=1 VERBOSE=1 node scripts/poll-board.mjs
```

### Einzelnen Agent manuell aufrufen

```bash
# Umgebung setzen
source scripts/bib-board.env
export GH_TOKEN=$(cat ~/.config/git-token)

# Agent aufrufen: <issue_number> <project_item_id>
bash scripts/agents/refinement.sh 42 PVTI_lAHOD2hGtM4BTAVOzg...
bash scripts/agents/implement.sh  42 PVTI_lAHOD2hGtM4BTAVOzg...
bash scripts/agents/review.sh     42 PVTI_lAHOD2hGtM4BTAVOzg...
bash scripts/agents/test.sh       42 PVTI_lAHOD2hGtM4BTAVOzg...
```

### Cron einrichten (alle 15 Minuten)

```bash
# Crontab bearbeiten
crontab -e

# Eintrag hinzufügen:
*/15 * * * * cd /home/werkgeist/.openclaw/workspace/bildung-in-bildern && node scripts/poll-board.mjs >> /tmp/bib-poll.log 2>&1
```

Oder mit dem Claude Code Cron-System:

```bash
# Via openclaw schedule
openclaw schedule create --cron "*/15 * * * *" --command "node /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/poll-board.mjs"
```

## Board-Spalten & Agents

### Backlog
- Manuell befüllt — kein Agent
- Issues werden hier erstellt und warten auf Priorisierung

### Ready → Refinement Agent
**Script:** `scripts/agents/refinement.sh`
**Tool:** Claude (claude --permission-mode bypassPermissions)

Prüft ob das Issue implementierbar ist (Definition of Ready):
- Akzeptanzkriterien klar und testbar?
- Technischer Scope abgegrenzt?
- Keine offenen Abhängigkeiten?

**Outcomes:**
- ✅ READY → verschiebt nach _In Progress_
- ⚠️ NOT_READY → Kommentar mit Rückfragen, bleibt in _Ready_

### In Progress → Implementation Agent
**Script:** `scripts/agents/implement.sh`
**Tool:** Claude Code (claude --permission-mode bypassPermissions --print)

Implementiert das Issue vollständig:
- Erstellt isolierten Git-Worktree (`/tmp/bib-worktree-<N>`) auf Branch `issue-<N>` von `origin/main`
- Liest Issue-Body + Kommentare als Kontext (aus Datei, nicht inline)
- Folgt CLAUDE.md (WCAG 2.2 AA, Touch-Targets, etc.)
- Commitiert mit Conventional Commits
- Mergt Branch nach Erfolg zurück in Workspace-`main` und pushed
- Cleanup: Worktree + Branch werden immer entfernt (via EXIT-Trap)
- `GH_TOKEN` wird dem Claude-Prozess **nicht** übergeben (nur Shell-Wrapper)

**Outcomes:**
- ✅ Erfolg → verschiebt nach _Code Review_
- ❌ Fehler → Kommentar mit Fehler-Log, bleibt in _In Progress_

### Code Review → Review Agent
**Script:** `scripts/agents/review.sh`
**Tool:** Codex (codex exec --full-auto), Fallback: Claude

Überprüft den Diff gegen `origin/main`:
- `git stash` am Anfang (saubere Basis), `git stash pop` via EXIT-Trap
- Spec-Compliance (Issue-Anforderungen erfüllt?)
- Bugs, Typen-Fehler, Sicherheit
- WCAG 2.2 AA, Performance, Conventional Commits
- `GH_TOKEN` wird dem Agent-Prozess **nicht** übergeben

**Outcomes:**
- ✅ APPROVE → verschiebt nach _Testing_
- 🔄 REQUEST_CHANGES → Kommentar mit Befunden, zurück nach _In Progress_

### Testing → Test Agent
**Script:** `scripts/agents/test.sh`
**Tool:** Shell (`pnpm test && pnpm build`)

Führt automatisierte Tests aus:
- `pnpm test` (Vitest Unit Tests)
- `pnpm build` (Next.js Static Export)

**Outcomes:**
- ✅ Beide grün → verschiebt nach _Done_ + schließt Issue
- ❌ Fehler → Kommentar mit Fehler-Excerpt, zurück nach _In Progress_

### Done
- Issue ist geschlossen
- Kein Agent

## Poller-Verhalten

- **Max. 1 Issue pro Poll-Lauf** (break nach erstem Dispatch, passt zu 15-Min-Cron)
- **Cursor-Pagination** für Board-Items (kein Limit bei >50 Issues)
- **Field-ID-Matching** für Status-Spalte (stabil gegen Feldnamen-Umbenennung)

## Lock-Mechanismus

### Ablauf

```
Poller: Issue in Ready → kein agent-working Label?
  → addLabel(agent-working)
  → recordLock(issue_number, timestamp) in .pipeline-state.json
  → dispatch refinement.sh (break — nur 1 pro Lauf)

Agent startet:
  → trap EXIT: gh_unlock() entfernt agent-working Label automatisch

Poller nächste Runde:
  → agent-working Label da?
    → lockTimeout (> 30min)? → Label entfernen, neu dispatchen
    → sonst: übersprungen (Agent läuft noch)
```

### Timeout

Wenn ein Agent länger als 30 Minuten läuft (z.B. wegen Absturz), entfernt der Poller
das `agent-working` Label automatisch beim nächsten Lauf.

Der Timeout ist in `scripts/bib-board.env` konfigurierbar:
```
LOCK_TIMEOUT_MINUTES=30
```

## Kommunikation via Issue-Kommentare

Jeder Agent schreibt Kommentare im Format:
```
**[AgentName]** Ergebnis ✅/❌

Details...

→ Verschiebe nach _Spalte_.
```

Prefix-Konvention:
- `**[Refinement]**` — Refinement Agent
- `**[Claude Code]**` — Implementation Agent
- `**[Codex]**` — Review Agent
- `**[Test]**` — Test Agent

## Auth

Alle Agents und der Poller nutzen das Classic PAT aus `~/.config/git-token`.
Das PAT braucht **repo** + **project** Scopes.

Das Fine-grained PAT (`github_pat_...`) hat **keine** project:write Scopes
und funktioniert nicht für Board-Verschiebungen!

## Debugging

```bash
# Poll-State ansehen
cat /tmp/bib-poll-state.json

# Poll-Log (wenn als Cron eingerichtet)
tail -f /tmp/bib-poll.log

# Verbose Dry-Run
DRYRUN=1 VERBOSE=1 node scripts/poll-board.mjs

# agent-working Label manuell entfernen
GH_TOKEN=$(cat ~/.config/git-token) gh issue edit 42 --remove-label agent-working --repo werkgeist/bildung-in-bildern
```

## Board-Konfiguration

Board-IDs sind in `scripts/bib-board.env`:

| Variable | Wert | Beschreibung |
|----------|------|--------------|
| `BOARD_ID` | `PVT_kwHOD2hGtM4BTAVO` | GitHub Projects Board ID |
| `STATUS_FIELD_ID` | `PVTSSF_lAHOD2hGtM4BTAVOzhAX8dI` | Status-Feld ID |
| `STATUS_BACKLOG` | `183cd778` | Backlog Option ID |
| `STATUS_READY` | `22daa807` | Ready Option ID |
| `STATUS_IN_PROGRESS` | `ab4711aa` | In Progress Option ID |
| `STATUS_CODE_REVIEW` | `710d75be` | Code Review Option ID |
| `STATUS_TESTING` | `cacd3144` | Testing Option ID |
| `STATUS_DONE` | `3acfe748` | Done Option ID |
