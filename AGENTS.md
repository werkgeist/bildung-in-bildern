# AGENTS.md — Bildung in Bildern (für Codex + andere Agents)

## Projekt
Visuelles Lernformat: Bildsequenzen + Quiz für Menschen mit IDD/ASD.
Stack: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui.
Deploy: Cloudflare Pages (Static Export).

## Zielgruppe
Kyrill (22J, nonverbal, Autismus Level 2-3). Touch-only (iPad).

---

## Review-Checkliste

Bei Code Reviews diese Prinzipien prüfen:

### Accessibility (WCAG 2.2 AA)
- Touch Targets ≥ 44×44px (wir zielen auf 80-100px)
- 8px Mindestabstand zwischen Targets
- Farbkontrast: 4.5:1 Text, 3:1 UI-Komponenten
- Semantisches HTML: `<button>` nicht `<div onClick>`
- Focus-Indicator: 3px solid Outline, 3:1+ Kontrast
- `prefers-reduced-motion` MUSS respektiert werden (ASD!)
- Drag-Interaktionen MÜSSEN Single-Pointer-Alternativen haben (WCAG 2.5.7)
- Minimum 16px Body Text

### Performance
- Server Components by default, Client Components nur an den Blättern
- next/image: IMMER width+height (verhindert CLS)
- LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1
- CSS-only Responsive bevorzugen, kein useMediaQuery (SSR-Hydration!)
- Nur transform + opacity animieren (GPU-accelerated)

### Kyrill-spezifisch (IDD/ASD)
- Max 3 Quiz-Optionen pro Frage
- KEINE Ja/Nein-Fragen (Acquiescence Bias!)
- Pro Bildschritt nur 1 Konzept
- Kein Auto-Play, kein Auto-Advance — Nutzer kontrolliert Tempo
- Feedback sofort (< 100ms), Richtig = grün, Falsch = sanftes Highlight
- Kognitive Last minimieren: weniger ist mehr

### Code-Qualität
- TypeScript strict
- Conventional Commits
- Tests für neue Funktionalität
- Keine unnötigen Dependencies

### Ästhetik (Anti-AI-Slop)
- Intentionale Designentscheidungen, keine Defaults
- Flat vector Stil, warm, freundlich, nicht bedrohlich
- 4px Grid (Tailwind Spacing Scale)
- Großzügiger Whitespace
- Keine generischen Fonts (kein Inter/Arial)
