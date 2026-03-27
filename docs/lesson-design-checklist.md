# Lesson Design Checklist — Bildung in Bildern

Basierend auf Mayer's Multimedia Learning Principles, Dual Coding Theory, und
IDD/ASD Visual Supports Forschung. Jede Lektion muss diese Checkliste erfüllen.

## 1. Thema & Zielgruppe

- [ ] **Ein klares Lernziel** pro Lektion (z.B. "Lebenszyklus des Schmetterlings verstehen")
- [ ] **Abstraktionslevel** passt zur Zielgruppe (Kyrill: konkret, visuell, ohne Textlastigkeit)
- [ ] **Alltagsrelevanz** oder **Faszination** vorhanden (Warum sollte jemand das wissen wollen?)

## 2. Bildsequenz (4–6 Frames)

### Coherence (kein Ballast)
- [ ] Jedes Bild zeigt **genau einen Schritt/Zustand** — keine Doppelbelegung
- [ ] Keine dekorativen Elemente, die vom Inhalt ablenken
- [ ] Hintergrund einheitlich und ruhig (vorzugsweise weiß/neutral)

### Signaling (visuelle Hinweise)
- [ ] Nummerierung der Schritte sichtbar (1, 2, 3, 4...)
- [ ] Pfeile/Übergänge zwischen Schritten wo nötig
- [ ] Farbliche Konsistenz: gleiche Farben für gleiche Objekte über alle Frames
- [ ] Wichtige Elemente hervorgehoben (Größe, Farbe, Position)

### Contiguity (Text nah am Bild)
- [ ] Beschreibung **direkt unter/über** dem zugehörigen Bild (nicht auf separater Seite)
- [ ] Text kurz: max. 1 Satz pro Frame, einfache Sprache

### Segmenting (schrittweise)
- [ ] Nutzer steuert das Tempo (Swipe/Tap für nächsten Schritt)
- [ ] Kein Auto-Advance — Kyrill entscheidet wann er weitergeht
- [ ] Rückwärts-Navigation möglich

## 3. Bildstil

- [ ] **Flat Vector** für abstrakte Themen (Biologie, Geografie, Mathe, Physik)
- [ ] **Fotos/Realismus** nur wenn Objekterkennung im Alltag das Ziel ist
- [ ] Weiche, warme Farben — keine grellen Kontraste
- [ ] Rundliche Formen bevorzugen (nicht bedrohlich)
- [ ] Konsistenter Stil über alle Frames einer Lektion
- [ ] Keine Text-im-Bild (Beschriftungen separat im UI)

### Prompt-Template (FLUX.2)
```
[Beschreibung des Schritts]. Clean flat vector illustration, warm colorful style,
soft rounded shapes, solid white background, educational diagram style,
no text, centered composition, [spezifische Details].
```

### Konsistenz-Techniken
- Gleicher Seed + ähnlicher Prompt-Aufbau für alle Frames
- Bei Bedarf: ControlNet/IP-Adapter für strukturelle Konsistenz
- Vor Generierung: Skizze/Storyboard der Sequenz erstellen

## 4. Quiz-Fragen

- [ ] **Keine Ja/Nein-Fragen** (Acquiescence Bias bei IDD!)
- [ ] 3 Bild-Optionen pro Frage (nicht Text-Optionen)
- [ ] Fragen testen **Verständnis der Reihenfolge/Zusammenhänge**, nicht Faktenwissen
- [ ] Mindestens 2 Fragen pro Lektion
- [ ] Falsche Optionen sind **plausibel** (nicht offensichtlich falsch)
- [ ] Große Hit-Targets (min. 80px Höhe)

## 5. Barrierefreiheit

- [ ] Kein Zeitdruck — keine Timer, keine verschwindenden Elemente
- [ ] Max. 6–7 Elemente pro Screen
- [ ] Touch-Targets ≥ 48px
- [ ] Keine lauten/überraschenden Geräusche oder Animationen
- [ ] Ohne Text verständlich (Bilder allein erzählen die Geschichte)

## 6. Qualitätskontrolle

- [ ] **Mental durchgehen aus Kyrills Perspektive**: Versteht ER das? Ergibt die Sequenz für IHN Sinn?
- [ ] **Sequenz-Test**: Bilder in zufälliger Reihenfolge zeigen — kann man die richtige Reihenfolge erkennen?
- [ ] **Ablenkungstest**: Gibt es Elemente die vom Kerninhalt ablenken? → Entfernen
- [ ] **Quiz-Test**: Sind die Fragen ohne Vorwissen der Lektion lösbar? → Frage zu leicht. Sind sie unlösbar? → Frage zu schwer

## Lektions-Ideen (Backlog)

### Naturwissenschaften
- [x] Schmetterling Lebenszyklus (Prototyp)
- [ ] Wasserzyklus (Verdunstung → Wolke → Regen → Fluss → Meer)
- [ ] Pflanze wächst (Samen → Keimling → Pflanze → Blüte → Frucht)
- [ ] Tag und Nacht (Erdrotation, vereinfacht)

### Technik
- [ ] Computer-Hardware (Tastatur → Computer → Monitor → Drucker)
- [ ] Wie funktioniert ein Kühlschrank? (vereinfacht)
- [ ] Brief verschicken (Schreiben → Briefkasten → Sortierung → Zustellung)

### Geografie
- [ ] Jahreszeiten (Frühling → Sommer → Herbst → Winter)
- [ ] Vom Berg zum Meer (Quelle → Bach → Fluss → Meer)

### Mathe (visuell)
- [ ] Brüche (Pizza teilen: 1/2, 1/4, 1/8)
- [ ] Symmetrie (Beispiele aus der Natur)
