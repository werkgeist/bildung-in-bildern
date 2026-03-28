# AGENTS.md — Bildung in Bildern

## Projekt
Visuelles Lernformat: Bildsequenzen + Quiz für Menschen mit IDD/ASD.
Stack: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui.
Deploy: Cloudflare Pages (Static Export). Analytics: Cloudflare D1.
Zielgerät: iPad (Touch-only). Nutzer: Kyrill (22J, nonverbal, Autismus Level 2-3).

---

## Review-Prioritäten

### Severity Labels
- **blocker**: Falsches Verhalten, Produktregel verletzt, Security-/Accessibility-Risiko → kein Merge
- **major**: Hohes Regressionsrisiko, fehlende Guards/Tests, Data Integrity → sollte gefixt werden
- **minor**: Wartbarkeit, Stil, kleine Performance-Themen → nice to fix

---

### 1. Korrektheit & Regressionen
- Macht der Code was die Issue-Beschreibung verlangt?
- Control Flow, State-Updates, Async-Verhalten, Fehlerpfade
- Edge Cases: leere Arrays, null/undefined, fehlende Daten, Netzwerkfehler
- Typänderungen, Vertragsänderungen bei Props/API/Config

### 2. Harte Produkt-Constraints (Release-Blocker!)
Diese Regeln sind Kernfunktionalität, nicht Deko:
- **Max 3 Quiz-Optionen** pro Frage
- **KEINE Ja/Nein-Fragen** (Acquiescence Bias bei IDD)
- **Kein Auto-Play, kein Auto-Advance** — Nutzer kontrolliert Tempo
- **Pro Bildschritt nur 1 Konzept**
- **Feedback sofort** (< 100ms), Richtig = grün, Falsch = sanftes Highlight (kein Rot/Alarm)
- **Erhöht die Änderung kognitive Last?** → blocker

### 3. Accessibility (WCAG 2.2 AA)
- Touch Targets ≥ 44×44px (Ziel: 80-100px), 8px Abstand zwischen Targets
- Farbkontrast: 4.5:1 Text, 3:1 UI-Komponenten
- Semantisches HTML: `<button>` nicht `<div onClick>`
- Focus-Indicator sichtbar
- `prefers-reduced-motion` MUSS respektiert werden (ASD-kritisch!)
- Drag-Interaktionen brauchen Single-Pointer-Alternativen (WCAG 2.5.7)
- Minimum 16px Body Text

### 4. Typsicherheit & Fehlerbehandlung
- TypeScript strict: keine `any`, keine `as`-Casts ohne Begründung
- Zod-Validierung für externe Daten (API, User Input, JSON-Configs)
- Error Boundaries für React-Komponenten
- Keine stillen Fehler (leere catch-Blöcke)
- Was passiert wenn ein Bild nicht lädt? Wenn D1 nicht erreichbar?

### 5. Data Integrity
- Lesson-Config validiert? (Schema-Checks bei Load)
- Stabile, deterministische IDs?
- Fehlende Bilder/Assets abgefangen?
- Inkonsistente Quizdaten erkannt? (correctOptionId existiert in options?)
- Doppelte IDs in Steps oder Fragen?

### 6. Security
- Kein Credential-Leak (Tokens, Keys, Passwörter)
- Input-Sanitization bei User-Daten
- D1: parametrisierte Queries, KEIN String-Concatenation für SQL

### 7. Testabdeckung
- Neue Funktionalität = neue Tests
- Sind die **richtigen Dinge** getestet? (nicht nur Happy Path)
- Kritische Pfade: Quiz-Logik, Sequenz-Navigation, Analytics-Events
- Edge Cases: leere Lektion, einzelner Step, alle Antworten falsch
- Ist die Testbarkeit des Codes gut genug?

### 8. Next.js / Deployment Checks
- Static Export kompatibel? (kein Server-only Code in exportierten Routes)
- Server/Client Boundary korrekt? (`"use client"` nur wo nötig)
- Hydration-Risiko? (kein useMediaQuery, kein window/document ohne Check)
- Cloudflare Pages / D1 kompatibel?
- Env-/Build-Risiken?

### 9. Performance
- Nur adressieren wenn konkret problematisch (keine prophylaktische Optimierung)
- next/image: width+height setzen (CLS)
- Keine unnötigen Re-Renders (Memoisierung nur bei nachgewiesenem Nutzen)
- CSS-only Responsive bevorzugen
- Nur transform + opacity animieren (GPU-accelerated)

### 10. Code-Qualität & Wartbarkeit
- Lesbare Benennung, kleine Funktionen mit klarem Zweck
- Keine toten Code-Pfade, keine auskommentierten Blöcke
- Neue Dependencies: wirklich nötig? Wartbar? Aktiv maintained?

---

## Schnell-Checkliste für jeden Review
- [ ] Was kann bei leeren/kaputten Daten passieren?
- [ ] Was passiert offline oder bei Fehlern?
- [ ] Ist die Interaktion auf iPad touch-only robust?
- [ ] Erhöht die Änderung kognitive Last?
- [ ] Ist die Nutzerkontrolle über Tempo erhalten?
- [ ] Ist die Änderung mit Static Export kompatibel?

---

## Design-Prinzipien (Kontext, nicht Review-Priorität)
- Flat vector Stil, warm, freundlich, nicht bedrohlich
- 4px Grid (Tailwind Spacing Scale), großzügiger Whitespace
- Intentionale Designentscheidungen, keine generischen Defaults
