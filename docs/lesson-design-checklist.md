# Lektions-Design-Checkliste

Basiert auf Mayer (2002), Höffler & Leutner (2007), Cook (2006), Paivio (1991).
Referenz: `memory/recherche-visuelles-lernen-2026-03-27.md`

## Vor der Lektion

### Thema & Lernziel
- [ ] **Ein klares Lernziel** pro Lektion (z.B. "Lebenszyklus des Schmetterlings verstehen")
- [ ] Zielgruppe beachten: Kyrill-Level (visuell-räumlich stark, Sprache ~8-10J, max 6-7 Optionen)
- [ ] Abstrakt → Schema/Flat; Alltagstransfer → realistischer Stil

### Sequenz-Planung
- [ ] **4-6 Frames** (Segmenting-Prinzip — nicht zu viele, nicht zu wenige)
- [ ] Jeder Frame = **ein Konzept/Schritt** (Coherence — kein Deko-Overload)
- [ ] Klare **zeitliche/logische Reihenfolge** (was kommt zuerst → zuletzt)
- [ ] Übergänge zwischen Frames sind visuell erkennbar (z.B. gleicher Ort, Objekt verändert sich)

## Bild-Erstellung

### Stil-Konsistenz (über alle Frames einer Lektion)
- [ ] **Gleicher Bildstil** durchgängig (Flat Vector / Schema / Foto — nicht mischen!)
- [ ] **Gleiche Farbpalette** (max 5-6 Hauptfarben)
- [ ] **Gleiche Perspektive/Kamerawinkel** wenn möglich
- [ ] **Gleicher Hintergrund** oder konsistente Hintergrund-Progression
- [ ] Gleiche Figuren/Objekte sind **wiedererkennbar** (Form, Farbe, Größe)

### Prompt-Template (FLUX.2)
```
[Stil]: Clean flat vector illustration, soft warm colors, solid white background,
        simple rounded shapes, no outlines, educational style
[Szene]: [Was passiert in diesem Frame]
[Fokus]: Centered composition, single focal point, no distracting details
[Konsistenz]: Same art style as previous frames, matching color palette
```

### Signaling (visuelle Hinweise)
- [ ] **Nummerierung** der Frames sichtbar (1, 2, 3, 4...)
- [ ] Optional: **Pfeile** zwischen Frames für Richtung/Fluss
- [ ] **Hervorhebungen** für das Wichtigste im Frame (Größe, Farbe, Position)
- [ ] Kein Text IN den Bildern (Text gehört ins UI, nicht ins Bild)

## Quiz-Design

### Fragen
- [ ] **2-3 Fragen** pro Lektion (nicht überfordern)
- [ ] Fragen testen **Verständnis**, nicht Auswendiglernen
- [ ] "Was kommt nach X?" (Sequenz-Verständnis)
- [ ] "Welches Bild zeigt Y?" (Konzept-Erkennung)

### Antwort-Optionen
- [ ] **3 Bild-Optionen** pro Frage (nicht zu viele — max 6-7 für Kyrill)
- [ ] Optionen sind **visuell unterscheidbar** (nicht zu ähnlich)
- [ ] **KEINE Ja/Nein-Fragen** (Acquiescence Bias bei IDD!)
- [ ] Distraktoren sind plausibel aber klar falsch
- [ ] Große Touch-Targets (min 80px)

### Feedback
- [ ] **Sofortiges visuelles Feedback** (richtig = grün/Häkchen, falsch = nochmal versuchen)
- [ ] Kein bestrafendes Feedback (kein Rot/X/Buzzer bei Fehler)
- [ ] Bei Fehler: richtige Antwort zeigen + kurz erklären (visuell)

## Qualitäts-Check (vor Deploy)

- [ ] Alle Bilder laden korrekt
- [ ] Sequenz ergibt auch OHNE Text Sinn (rein visuell verständlich?)
- [ ] Quiz-Antworten sind eindeutig richtig/falsch
- [ ] Response-Time-Logging funktioniert
- [ ] Auf Mobilgerät getestet (Touch, Swipe)
- [ ] `pnpm test` grün
- [ ] `pnpm build` grün

## Themen-Ideen (priorisiert)

### Naturwissenschaften
- [x] Schmetterlings-Lebenszyklus ✅
- [ ] Wasserzyklus (Verdunstung → Wolke → Regen → Fluss → Meer)
- [ ] Pflanzenwachstum (Samen → Keimling → Pflanze → Blüte → Frucht)
- [ ] Frosch-Metamorphose (Ei → Kaulquappe → Frosch)
- [ ] Tag und Nacht (Erde dreht sich)

### Geografie
- [ ] Jahreszeiten (Frühling → Sommer → Herbst → Winter)
- [ ] Vulkan-Entstehung (Magma → Ausbruch → Lava → Erstarrung)

### Technik/Alltag
- [ ] Wie ein Computer funktioniert (Eingabe → Verarbeitung → Ausgabe)
- [ ] Strom: Vom Kraftwerk zur Steckdose
- [ ] Recycling-Kreislauf

### Mathe (visuell)
- [ ] Brüche verstehen (Pizza/Kuchen aufteilen)
- [ ] Symmetrie (Schmetterlingsflügel, Schneeflocke)
