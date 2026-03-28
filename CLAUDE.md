# CLAUDE.md — Bildung in Bildern

## Projekt
Visuelles Lernformat: Bildsequenzen + Quiz für Menschen mit IDD/ASD.
Stack: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui.
Deploy: Cloudflare Pages (Static Export).

## Design-Zielgruppe
Kyrill (22J, nonverbal, Autismus Level 2-3). Touch-only (iPad).
Einfache Sprache, große Buttons, klare visuelle Hierarchie, keine Überladung.

---

## Layer 1: Ästhetik (via frontend-design Plugin)
Das installierte Plugin übernimmt Anti-AI-Slop. Zusätzlich für BiB:
- **Bildstil:** Flat vector, soft gradients, warm pastels, white background, zentriert
- **Keine ablenkenden Details**, keine komplexen Texturen
- **Freundlich, nicht bedrohlich** — keine dunklen Farben, keine scharfen Kanten

## Layer 2: Accessibility & WCAG 2.2 AA

### Touch Targets (WCAG 2.5.8)
- **Minimum 44×44px** für alle interaktiven Elemente (wir zielen auf 80-100px für Kyrill)
- **8px Mindestabstand** zwischen Targets
- Für Quiz-Optionen: volle Breite, große Bilder, großer Tap-Bereich

### Kontrast
- **Text:** 4.5:1 Kontrast (normal), 3:1 (groß ≥18.5px bold / ≥24px)
- **UI-Komponenten:** 3:1 Kontrast gegen Hintergrund
- **Feedback:** Richtig = grüner Rahmen, Falsch = sanftes Highlight der richtigen Antwort

### Focus & Navigation
- **3px solid Outline**, 3:1+ Kontrast, 2px Offset für Focus-Indicator
- `scroll-padding-top` für sticky Elemente (SC 2.4.11)
- Semantisches HTML: `<button>` nicht `<div onClick>`

### Motion (ASD-kritisch!)
- **`prefers-reduced-motion` IMMER respektieren** via Tailwind `motion-reduce:` Variant
- Nur `transform` + `opacity` animieren (GPU-accelerated)
- Keine Auto-Play-Animationen, kein Auto-Advance
- Nutzer kontrolliert Tempo (Swipe/Tap)

### Drag-and-Drop (WCAG 2.5.7)
- Jede Drag-Interaktion MUSS eine Single-Pointer-Alternative haben
- Für Sequenz-Ordnen: Tap-to-select + Tap-to-place als Alternative

### Text
- **Minimum 16px** Body Text, nie unter 11px
- `max-w-prose` (~65ch) für Lesetexte
- `leading-relaxed` (1.625) für Body Line-Height

## Layer 3: React/Next.js/Tailwind Performance

### Mobile-First (Tailwind v4)
- Unprefixed = Mobile, `sm:` = 640px+, `md:` = 768px+
- **CSS-only Responsive** bevorzugen, kein `useMediaQuery` (SSR-Hydration!)
- Container Queries (`@container`) für Komponenten-Responsiveness
- `hidden md:block` Pattern für Breakpoint-Wechsel

### Server Components
- Server Components by default
- Client Components (`"use client"`) nur an den Blättern für Interaktivität
- `loading.tsx` für automatisches Suspense Streaming

### Images (next/image)
- IMMER `width` + `height` setzen (verhindert CLS)
- `priority` für Above-the-Fold Bilder
- `sizes` Attribut konfigurieren
- WebP/AVIF, Lazy Loading default
- LCP-Bild im Head preloaden

### Fonts (next/font)
- Self-hosted Variable Fonts (zero Layout Shift, zero externe Requests)
- Distinctive Fonts, keine Inter/Arial

### Performance-Budgets
- LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1
- < 50 Network Requests, < 170KB compressed JS
- Sub-400ms Interaction Response (Doherty Threshold)
- Skeleton Screens mit `aria-busy="true"` für Ladezustände

### Animation (Motion / Framer Motion)
- Import von `motion/react`
- `layout` Prop für Smooth Layout Animations
- Spring Physics für natürliche Bewegung
- `AnimatePresence` für Exit-Animationen
- Motion `useReducedMotion()` Hook nutzen

## Layer 4: Kyrill-spezifisch

### Kognitive Last minimieren
- Max 3 Quiz-Optionen pro Frage
- Pro Bildschritt nur 1 Konzept
- Kein Audio automatisch
- Keine ablenkenden Animationen
- Progressive Disclosure: nur das Wichtigste zeigen

### Keine Ja/Nein-Fragen
- Acquiescence Bias bei IDD! IMMER offene Fragen mit gleichwertigen Optionen

### Visuelles Feedback
- Sofort (< 100ms)
- Richtig: Grüner Rahmen / Check-Animation
- Falsch: Sanftes Highlight der richtigen Antwort (kein Rot/Alarm)

### Spacing (4px Grid)
- Tailwind Spacing Scale: p-1=4px, p-2=8px, p-4=16px, p-6=24px, p-8=32px
- Großzügiger Whitespace zwischen Elementen

---

## Commits
- Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`
- Tests vor Commit: `npm test`
- Build prüfen: `npm run build`
