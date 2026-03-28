# AGENTS.md — Bildung in Bildern (für Codex + andere Agents)

## Projekt
Visuelles Lernformat: Bildsequenzen + Quiz für Menschen mit IDD/ASD.
Stack: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui.
Deploy: Cloudflare Pages (Static Export). Analytics: Cloudflare D1.

## Zielgruppe
Kyrill (22J, nonverbal, Autismus Level 2-3). Touch-only (iPad).

---

## Review-Prioritäten (in dieser Reihenfolge)

### 1. Korrektheit & Logik
- Macht der Code was die Issue-Beschreibung verlangt?
- Edge Cases: leere Arrays, null/undefined, fehlende Daten, Netzwerkfehler
- State Management: Race Conditions, stale State, ungewollte Re-Renders
- Datenfluss: Props korrekt durchgereicht, keine impliziten Abhängigkeiten
- Algorithmen: Off-by-one, falsche Vergleiche, fehlende Break/Return

### 2. Typsicherheit & Fehlerbehandlung
- TypeScript strict: keine `any`, keine `as`-Casts ohne Begründung
- Zod-Validierung für externe Daten (API, User Input, JSON-Configs)
- Error Boundaries für React-Komponenten
- Graceful Degradation: was passiert wenn ein Bild nicht lädt? Wenn D1 nicht erreichbar?
- Keine stillen Fehler (leere catch-Blöcke)

### 3. Security
- Kein Credential-Leak (Tokens, Keys, Passwörter)
- Input-Sanitization bei User-Daten
- CORS/CSP-Konfiguration bei API-Routen
- Cloudflare D1: parametrisierte Queries, kein String-Concatenation für SQL

### 4. Testabdeckung
- Neue Funktionalität = neue Tests (Unit oder E2E)
- Kritische Pfade getestet: Quiz-Logik, Sequenz-Navigation, Analytics-Events
- Edge Cases in Tests: leere Lektion, einzelner Step, alle Antworten falsch
- Bestehende Tests nicht gebrochen

### 5. Performance
- Server Components by default, `"use client"` nur wo nötig
- next/image: IMMER width+height (verhindert CLS)
- Keine unnötigen Re-Renders (useMemo/useCallback wo sinnvoll)
- CSS-only Responsive bevorzugen, kein useMediaQuery (SSR-Hydration!)
- Nur transform + opacity animieren (GPU-accelerated)
- Bundle Size: keine unnötigen Dependencies

### 6. Accessibility (WCAG 2.2 AA)
- Touch Targets ≥ 44×44px (wir zielen auf 80-100px für Kyrill)
- Farbkontrast: 4.5:1 Text, 3:1 UI-Komponenten
- Semantisches HTML: `<button>` nicht `<div onClick>`
- Focus-Indicator sichtbar, `prefers-reduced-motion` respektieren (ASD-kritisch!)
- Drag-Interaktionen brauchen Single-Pointer-Alternativen (WCAG 2.5.7)
- Minimum 16px Body Text

### 7. UX / Kyrill-spezifisch (IDD/ASD)
- Max 3 Quiz-Optionen pro Frage
- KEINE Ja/Nein-Fragen (Acquiescence Bias!)
- Pro Bildschritt nur 1 Konzept
- Kein Auto-Play, kein Auto-Advance — Nutzer kontrolliert Tempo
- Feedback sofort (< 100ms), Richtig = grün, Falsch = sanftes Highlight
- Kognitive Last minimieren: weniger ist mehr

### 8. Code-Qualität & Stil
- Lesbare Benennung, keine kryptischen Abkürzungen
- Kleine Funktionen mit einem klaren Zweck
- Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`
- Keine toten Code-Pfade, keine auskommentierten Blöcke
- DRY, aber nicht auf Kosten der Lesbarkeit

### 9. Ästhetik (Anti-AI-Slop)
- Intentionale Designentscheidungen, keine generischen Defaults
- Flat vector Stil, warm, freundlich, nicht bedrohlich
- 4px Grid (Tailwind Spacing Scale), großzügiger Whitespace
