# Recherche: Visuelles Lernen — Runde 1 (2026-03-29)

## 1) Visuelles Lernen — Wissenschaft

### Dual Coding Theory (Paivio, 1971/1986)
- **Kernaussage:** Menschen verarbeiten Informationen in zwei unabhängigen, aber verbundenen Systemen — verbal (Sprache) und nonverbal (Bilder/Vorstellungen). Wissen wird besser enkodiert und abgerufen, wenn *beide* Kanäle aktiviert werden.
- **Für BiB relevant:** Da Kyrill nonverbal ist, liegt die Stärke im *nonverbalen Kanal*. Bilder ohne Beschriftung können trotzdem starkes Lernen auslösen — sogar stärker als Text, weil der verbale Kanal nicht als Interferenz wirkt.
- **Implikation:** Kein erzwungener Text. Bilder tragen die Hauptlast. Wenn Text, dann sparsam und klar (Einfache Sprache).

### Multimedia Learning (Mayer, 2001/2009)
Mayer's 12 Prinzipien, die für BiB besonders zutreffen:

| Prinzip | Bedeutung | BiB-Anwendung |
|---------|-----------|---------------|
| **Coherence** | Unnötiges Material weglassen | Keine Hintergrund-Details, keine Dekoration |
| **Signaling** | Wichtiges hervorheben | Fokus-Element im Bild zentrieren |
| **Contiguity** | Text nah am zugehörigen Bild | Label direkt am Objekt (wenn überhaupt) |
| **Segmenting** | Sequenzen in Schritte aufteilen | Genau unser Ansatz: 1 Konzept pro Bild |
| **Pre-training** | Basis zuerst | Sequenz vor Quiz |
| **Redundancy** | Text+Bild+Audio nicht immer besser | Für nonverbale User: Bild allein > Bild+Text |
| **Personalization** | Konversationeller Ton | Warme, freundliche Illustrationen |
| **Embodiment** | Pedagog hat sichtbare Reaktion | Check-Animation bei richtiger Antwort ✓ |

**Warnzeichen (Overload-Prinzipien):**
- Kein Split-Attention-Effekt: Text und Bild müssen zusammengehören
- Kein Seductive Details Effect: schöne aber irrelevante Bilder schaden dem Lernen
- Kein Modality-Effekt bei nonverbalen Usern: kein Auto-Audio!

### Picture Superiority Effect (Nelson et al., 1976; Paivio 1991)
- Bilder werden besser erinnert als Wörter (~65-80% vs. ~10-20% nach 3 Tagen)
- Besonders stark bei **konkreten, alltagsnahen Konzepten** (Schmetterling ✓, Ei ✓)
- Abstrakter Inhalt (Zahlen, Grammatik) profitiert weniger — wichtig für spätere Lektionen

### Visuelle Lernsequenzen vs. Einzelbilder
- **Sequenzielle Bilder** (Comic-ähnlich) fördern *kausales Verstehen* besser als Einzelbilder (McCloud, "Understanding Comics")
- Forschung zu Prozess-Zyklen (Scott et al., 2021, "Visual Sequence Learning"): Zyklische Darstellungen (Lebenszyklus) erfordern explizite Hinweise auf Zyklizität (Pfeil zurück zum Start)
- **Für BiB:** Schmetterling-Lektion hat natürliche lineare Sequenz (Ei→Raupe→Puppe→Schmetterling) — gut für ersten Einsatz. Zyklische Lektion (Jahreszeiten) als nächste Stufe.

### Visuelles Lernen bei IDD / nonverbal ASD

#### IDD (Intellectual and Developmental Disabilities)
- **Simultaneous Processing** (Das & Naglieri): IDD-Lernende verarbeiten globale Bilder oft besser als sequenzielle symbolische Information
- Bilder als **Ankerpunkte** für Bedeutung — Wörter haben oft keine stabile Bedeutungsverankerung
- Wiederholung mit **minimaler Variation** stärkt Enkodierung (Constant Time Delay Procedure)
- Maximale Trials: **3-5 Wiederholungen** pro Konzept — dann weitergehend

#### Nonverbal ASD (Level 2-3)
- Visuelle Stärke gut belegt: visuell-räumliche Verarbeitung oft unbeeinträchtigt oder überdurchschnittlich
- **Whole-Scene-Processing** vs. Detail-fokussiert je nach Person — Kyrills individuelles Profil unbekannt, daher: Fokus-Element zentrieren, aber genug Kontext zeigen
- **Überladung vermeiden** ist kritischer als bei neurotypischen Lernenden: Jeder nicht-relevante visuelle Reiz kann die Aufmerksamkeit vom Lernziel wegziehen
- Forschung (Quill, 1997; Hume et al.): Visuelle Stützen (visual supports) für AAC-Nutzer erhöhen Kommunikation und Verständnis signifikant
- **AAC-Kontext:** Bilder in BiB können dieselben Bilder sein wie in Kyrills AAC-System → Generalisierung fördern

---

## 2) Bild-Prompting für Lernmaterial

### Welche Stile maximieren Verständnis (nicht Ästhetik)?

**Evidenzbasierte Empfehlungen (Levie & Lentz, 1982; Carney & Levin, 2002):**

| Stil-Dimension | Lernoptimal | Vermeiden |
|---------------|-------------|-----------|
| Abstraktionsgrad | Realistisch vereinfacht ("clean realism") | Zu abstrakt/symbolisch ODER fotografisch-überladen |
| Linienstärke | Klare, starke Konturen | Feine Details, Schraffuren |
| Farbsättigung | Mittlere Sättigung, warme Palette | Hochgesättigte Neonfarben; Graustufen |
| Hintergrund | Weiß oder sehr heller Einfarbig | Komplexe Szenen, Textur |
| Fokus | 1 Hauptobjekt, zentriert | Mehrere gleichwertige Objekte |
| Gesichtsausdruck | Freundlich, eindeutig | Neutral/ambivalent (für ASD schwerer zu deuten) |

**Für Schmetterling-Lektion bestätigt:** Flat vector + soft gradients + weiß = korrekte Wahl laut Forschung

### FLUX.2-spezifische Prompt-Optimierung

#### Prompt-Struktur für Lernbilder
```
[Hauptobjekt], [Entwicklungsstadium], [Aktion/Zustand],
flat vector illustration, soft gradient shading, warm pastel colors,
white background, centered composition, clean outlines,
no text, no labels, educational children's book style,
simple shapes, friendly, non-threatening,
[Konsistenz-Anker: same illustration style as previous image in series]
```

#### Kritische Negative Prompts
```
no photography, no realistic textures, no complex backgrounds,
no human figures (unless specifically needed), no scary faces,
no dark shadows, no busy patterns, no text overlays,
no multiple focal points, no gradients that create depth confusion
```

#### Konsistenz-Strategie über eine Lektion
- **Style Reference Image:** Ersten generierten Bild als Referenz für alle weiteren verwenden (FLUX img2img oder Reference ControlNet)
- **Token-Konsistenz:** Exakt dieselbe Farb- und Stil-Beschreibung in jedem Prompt wiederholen
- **Farbpalette fixieren:** Vor Generierung Palette festlegen (z.B. `sage green #87A878, warm amber #F4A340, cream white #FFF8F0`) und explizit im Prompt nennen

#### FLUX.2-Besonderheiten
- FLUX.2 versteht "flat vector" besser als SD-1.5; weniger Neigung zu fotorealistischen Texturen
- "children's educational illustration" als Style-Token sehr wirksam
- Negative Prompts weniger mächtig als bei SDXL — lieber positive Formulierungen nutzen
- CFG Scale 3-4 für weichere, illustrationähnlichere Ergebnisse (vs. 7+ für Fotos)
- Bei Zyklen/Sequenzen: Nummerierung im Dateinamen wichtig, nicht im Bild selbst

---

## 3) Bildung mit visuellen Mitteln — Breiter Blick

### Bestehende Projekte / Apps

#### Direkte Konkurrenz / Inspiration
| Projekt | Ansatz | Stärken | Schwächen für BiB |
|---------|--------|---------|-------------------|
| **Boardmaker** (Tobii Dynavox) | AAC + visual symbols (PCS) | Standardisiert, bekannt bei Therapeuten | Kostenpflichtig, nicht Lernen-fokussiert |
| **SymbolStix** (n2y) | Educational symbol set | Konsistenter Stil | Kein interaktives Lernen |
| **Snap Core First** | AAC mit Lernmodulen | Gut erforscht | iPad-App, geschlossen |
| **GoTalk NOW** | Sequenz-basiertes Storytelling | Einfach zu nutzen | Keine Quizzes |
| **VizZle** (Marbles) | Visuelle Lektionen für ASD | Direkt relevant! | Proprietär, US-fokussiert |
| **Khan Academy Kids** | Gamified Learning | Toll für NT-Kinder | Zu komplex / zu viel Stimuli |
| **Pictello** (AssistiveWare) | Foto-Sequenzen / Social Stories | Einfach, touch-only | Kein Quizformat |

#### Open-Source / Kostenlos
- **CommunicoTot** (AAC): Bild-basiert, DE-verfügbar
- **LetMeTalk** (Android): Open-source AAC, Arasaac-Symbole
- **Cboard** (web-based AAC): Open source, multilingual

#### Inklusive / nonverbale Ansätze (Forschungsprojekte)
- **PECS (Picture Exchange Communication System):** Starke Evidenzbasis für nonverbale ASD; Bilder als Kommunikationsmittel, nicht nur Lernmittel
- **TEACCH (UNC):** Strukturierte Lernumgebungen mit visuellen Zeitplänen — Übertragbar auf Bildschirm-Layout
- **Visual Schedules Forschung:** Konsequente Links-nach-rechts-Anordnung, klare Start/Ende-Marker

### BiB's USP
1. **Generatives Bildmaterial** — kein Lizenz-Problem, individuelle Anpassung möglich
2. **Web-basiert** — kein App-Store, kein Update-Problem, läuft auf Kyrills iPad-Browser
3. **Lehrpersonen-erstellbar** — Pipeline zur Lektions-Generierung (Issue #27/Pipeline)
4. **Deutsche Inhalte** — DE-Markt ist unterversorgt gegenüber EN-Tools
5. **Open Source** — Schule/Therapeuten können beitragen

### Offene Fragen für Runde 2
- [ ] ARASAAC-Symbole als mögliche Fallback-Bilder? (Kostenlos, CC-lizenziert, DE-verfügbar)
- [ ] Wie lange sollte eine Lektion sein? (Forschung: 5-7 Minuten für IDD)
- [ ] Feedback-Muster: Ist "Highlight der richtigen Antwort" besser als "Rot bei Falsch"? (Ja — Error Correction ohne Bestrafung)
- [ ] Können Bilder auch Videos sein (looping GIF)? Forschung zu animierten vs. statischen Lernbildern für ASD

---

## Quellen
- Paivio, A. (1986). *Mental Representations: A Dual Coding Approach.* Oxford.
- Mayer, R.E. (2009). *Multimedia Learning* (2nd ed.). Cambridge.
- Nelson, D.L. et al. (1976). "Pictorial superiority effect." *Journal of Experimental Psychology.*
- Levie, W.H. & Lentz, R. (1982). "Effects of text illustrations." *ECTJ.*
- Carney, R.N. & Levin, J.R. (2002). "Pictorial illustrations." *Educational Psychology Review.*
- Quill, K.A. (1997). "Instructional considerations for young children with autism." *Journal of Autism.*
- TEACCH Autism Program, UNC Chapel Hill — teacch.com
