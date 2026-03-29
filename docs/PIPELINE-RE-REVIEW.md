# Pipeline Re-Review

Basis: aktueller Dateistand auf `HEAD` (`a7603ce`) plus Gegenprüfung der genannten Commits `f931ae3`, `9007e7d`, `ed61b4b`. Hinweis: Der eigentliche M4-Fix liegt im aktuellen `HEAD`; `ed61b4b` war dafür noch nicht ausreichend.

## B1: `gh_issue_comments()` jq query
**FIXED**

`gh_issue_comments()` verwendet jetzt Array-Slicing statt `last($n)` und iteriert korrekt über die letzten Kommentare: `scripts/agents/_common.sh:64-67`. Der ursprüngliche jq-Fehler, der `refinement.sh` und `implement.sh` sofort abbrechen ließ, ist damit behoben.

## B2: `set -e` vor Claude-Aufruf in `implement.sh`
**FIXED**

Der Claude-Aufruf in `scripts/agents/implement.sh:62-68` läuft jetzt unter `set +e`, der Exit-Code wird explizit in `EXIT_CODE` übernommen und danach ausgewertet. Damit erreicht ein Claude-Fehler wieder den vorgesehenen Fehlerpfad mit Diagnose-Kommentar statt das Skript vorzeitig zu terminieren.

## B3: Workspace-Isolation (`git worktree`)
**PARTIALLY FIXED**

Die Implementierung ist jetzt sauber isoliert: `scripts/agents/implement.sh:20-33` und `scripts/agents/implement.sh:51-58` legen einen issue-spezifischen Branch plus Worktree an. Das schließt den gefährlichsten Commit-/Edit-Pfad.

Die Pipeline ist aber nicht durchgängig isoliert. `scripts/agents/review.sh:24-37` arbeitet weiterhin im Shared-Workspace und stasht nur lokal, und `scripts/agents/test.sh:12-30` läuft komplett direkt im Shared-Workspace. Damit bleibt das ursprüngliche Risiko aus dem Finding für Review/Test zumindest teilweise bestehen.

## M1: Lock atomicity + persistent state
**PARTIALLY FIXED**

Persistent State ist verbessert: Der Lock-State liegt jetzt im Workspace (`scripts/poll-board.mjs:57-58`) statt in `/tmp` und überlebt Reboots. Zusätzlich verhindert der `flock`-basierte Poller-Mutex parallele Poller auf demselben Host (`scripts/poll-board.mjs:22-36`).

Die eigentliche Issue-Lock-Akquise ist aber weiter nicht atomar. Der Poller prüft erst den Snapshot und setzt das Label danach separat (`scripts/poll-board.mjs:308-326`). Zwei Poller auf unterschiedlichen Hosts oder ein anderer externer Dispatcher können denselben Issue weiterhin doppelt starten. Das ursprüngliche CAS-Problem ist also nicht vollständig gelöst.

## M2: Pagination + `STATUS_FIELD_ID`
**FIXED**

Die Board-Abfrage paginiert jetzt über `pageInfo/endCursor` (`scripts/poll-board.mjs:112-168`), und der Status wird per `field.id === CFG.STATUS_FIELD_ID` erkannt (`scripts/poll-board.mjs:180-183`). Damit sind sowohl die 50-Item-Grenze als auch die brittle Feldnamenerkennung behoben.

## M3: Prompt injection / token exposure
**PARTIALLY FIXED**

Es gibt zwei sinnvolle Härtungen: Untrusted Issue-/Diff-Inhalte werden in Dateien ausgelagert statt inline in den Prompt interpoliert (`scripts/agents/implement.sh:24-41`, `scripts/agents/review.sh:34-71`, `scripts/agents/refinement.sh:16-35`), und `GH_TOKEN` wird aus der Agent-Umgebung entfernt (`scripts/agents/implement.sh:63-67`, `scripts/agents/review.sh:89-94`, `scripts/agents/refinement.sh:44-47`).

Die Trust Boundary ist trotzdem nicht wirklich hergestellt. Die Agents lesen weiterhin attacker-kontrollierte Inhalte aus Dateien und laufen weiter mit privilegierten Modi wie `claude --permission-mode bypassPermissions` (`scripts/agents/implement.sh:66`, `scripts/agents/review.sh:93`). `docs/PIPELINE.md:199-207` dokumentiert das selbst ausdrücklich als akzeptiertes Rest-Risiko. Außerdem schützt `env -u GH_TOKEN` nicht davor, dass ein Agent andere lokale Secret-Quellen liest, z.B. `~/.config/git-token`.

## M4: Synchronous poller
**FIXED**

Im aktuellen Dateistand dispatcht der Poller Agents detached via `spawn(..., { detached: true, stdio: 'ignore' })` plus `unref()` (`scripts/poll-board.mjs:237-271`). Damit blockiert ein langlaufender Agent den Board-Lauf nicht mehr.

Wichtig: Dieser Fix ist im aktuellen `HEAD` vorhanden, aber noch nicht in `ed61b4b`. In `ed61b4b` war der Poller weiterhin synchron über `spawnSync(...)` (`ed61b4b:scripts/poll-board.mjs:246-272`).
