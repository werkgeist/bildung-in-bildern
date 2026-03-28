# Design-Checkliste für BiB-Lektionen

Basierend auf Mayer (Multimedia Learning), Dual Coding Theory, und IDD/ASD Visual Supports Forschung.
Jede neue Lektion sollte diese Punkte erfüllen.

## 1. Sequenz-Struktur (Segmenting)
- [ ] 4–6 Frames pro Lektion (nicht mehr, nicht weniger)
- [ ] Jeder Frame = **ein** Lernziel / **ein** Schritt
- [ ] Klare Reihenfolge: Nummerierung oder Pfeile zwischen Frames
- [ ] Fortschrittsanzeige sichtbar (Frame X von Y)

## 2. Bildgestaltung (Coherence + Signaling)
- [ ] **Kein dekorativer Ballast** — nur was zum Verständnis beiträgt
- [ ] Konsistenter Stil über alle Frames (Flat Vector, gleiche Farbpalette)
- [ ] Wichtige Elemente hervorgehoben (Farbe, Größe, Pfeile)
- [ ] Hintergrund: neutral/weiß (kein Ablenkungspotenzial)
- [ ] Perspektive/Blickwinkel konsistent über die Sequenz

## 3. Text + Bild (Contiguity)
- [ ] Text **direkt am/im Bild** (nicht weit entfernt)
- [ ] Kurze, einfache Sätze (max. 8-10 Wörter)
- [ ] Text immer an gleicher Position (oben/unten — konsistent)
- [ ] Schrift groß genug (min. 18px rendered)

## 4. Quiz-Design (für Kyrill/IDD)
- [ ] **Keine Ja/Nein-Fragen** (Acquiescence Bias!)
- [ ] 3 Bild-Optionen pro Frage (MC mit Bildern, nicht Text)
- [ ] Optionen visuell gleichwertig (keine "offensichtlich falsch" durch Qualität)
- [ ] **Große Hit-Targets** (min. 80x80px, besser 100x100px)
- [ ] Feedback: Richtig = grüner Rahmen/Check, Falsch = sanftes Highlight der richtigen Antwort

## 5. Abstraktionslevel (Bildstil)
- [ ] **Abstrakte Themen** (Biologie, Mathe, Geografie): Flat Vector / Schemata / Icons
- [ ] **Alltagsthemen** (Kochen, Einkaufen): Realistischere Illustrationen ODER Fotos
- [ ] Keine Mischung innerhalb einer Lektion (Konsistenz!)

## 6. Kognitive Last minimieren
- [ ] Kein Audio automatisch abspielen
- [ ] Keine ablenkenden Animationen
- [ ] Nutzer kontrolliert Tempo (Swipe/Tap, kein Auto-Advance)
- [ ] Keine Timer oder Zeitdruck

## 7. Bild-Generierung (FLUX.2)
- [ ] Prompt-Template pro Lektion fixieren (gleicher Stil-Suffix)
- [ ] Gleicher Seed pro Sequenz versuchen (für Konsistenz)
- [ ] Bei Inkonsistenz: Img2Img/Inpainting statt komplett neu generieren
- [ ] Referenzbild der Lektion vor Generation festlegen
- [ ] Ergebnis prüfen: Sind alle Frames visuell als "Familie" erkennbar?

## 8. IDD/ASD-spezifisch
- [ ] Max. 6-7 Optionen pro Screen
- [ ] Keine lauten/überraschenden Geräusche
- [ ] Klare visuelle Zustände (aktiv/inaktiv/ausgewählt)
- [ ] Touch-Feedback dezent (kein Overstimulation-Risiko)
- [ ] Session-Länge: max. 3-5 Minuten pro Lektion

---

## Lektions-Template (Checkliste für neue Inhalte)

Beim Erstellen einer neuen Lektion ausfüllen:

```
Thema: ___
Kategorie: Biologie / Geografie / Mathe / Alltag / ...
Frames: ___ (Ziel: 4-6)
Bildstil: Flat Vector / Realistisch / Schema
Quiz-Fragen: ___ (Ziel: 2-3)
Schwierigkeit: Einfach / Mittel
Lernziel in 1 Satz: ___
```
