# APP-KONZEPT: Bildung in Bildern

> Perspektive: Kyrill, 22 Jahre, frühkindlicher Autismus (Level 2–3), nonverbal, visuell-räumlich stark, nutzt iPad touch-only.

---

## 1. Seiten-Übersicht

### Bestehende Seiten

| Route | Name | Status |
|---|---|---|
| `/` | Startseite / Lektions-Picker | ✅ vorhanden |
| `/lesson/[id]` | Lektions-Flow (Sequenz → Quiz → Ergebnis) | ✅ vorhanden |

### Fehlende Seiten (nach Priorität)

| Route | Name | Warum wichtig für Kyrill |
|---|---|---|
| `/fortschritt` | Fortschritts-Übersicht | Kyrill sieht, was er schon kann — Belohnung, Struktur |
| `/lektion/[id]/wiederholung` | Wiederholungs-Modus | Nur Quiz, ohne Bildsequenz — für bereits bekannte Lektionen |
| `/einstellungen` | Einstellungen | Lautstärke aus/an, Animationen reduzieren, Schriftgröße |
| `/favoriten` | Lieblings-Lektionen | Schnellzugriff auf bevorzugte Themen |

### Seiten-Beschreibung

#### Startseite `/`
- Raster aus Lektions-Karten (max 2 Spalten auf iPad)
- Jede Karte: großes Bild (Vorschau), kurzer Titel, Schwierigkeits-Sterne
- Keine Beschreibungstexte — nur Bild + Titel
- "Neu" oder "Fertig" Badge auf Karte (Fortschritt sichtbar)

#### Lektions-Flow `/lesson/[id]`
Drei Phasen in einer Route (kein Seitenwechsel, nur State-Transition):
1. **Bildsequenz** — Bilder mit Beschriftung, Schritt für Schritt
2. **Quiz** — Bildauswahl-Fragen
3. **Ergebnis** — Score + Feedback + Weiter-Option

#### Fortschritts-Übersicht `/fortschritt` *(neu)*
- Zeigt alle Lektionen als Raster
- Abgeschlossene Lektionen: grüner Haken, Datum
- Noch nicht gestartet: grau
- Teilweise: gelber Halbkreis
- Kein Zahlen-Fokus — visuelle Symbole (Sterne, Häkchen, Bäume die wachsen)

---

## 2. Navigation & Übergänge

### Touch-Navigation (iPad)

```
Startseite
    │ Tap auf Lektion
    ▼
Bildsequenz
    │ Tap "Weiter" oder Swipe links
    ▼
Quiz
    │ Tap auf Antwort-Bild
    ▼
Ergebnis
    │ Tap "Nochmal" → zurück zu Bildsequenz
    │ Tap "Fertig" → zurück zur Startseite
    │ Tap "Nächste Lektion" → nächste Bildsequenz
```

### Zurück-Navigation

- **Keine Browser-Back-Geste in der Lektion** — würde Flow unterbrechen
- **Expliziter "Zurück zur Übersicht" Button** (oben links, immer sichtbar)
- Sicherheitsfrage bei Quiz: "Willst du aufhören?" mit Ja/Nein Bildern
- Auf der Startseite: kein Zurück nötig

### Übergänge zwischen Phasen

| Übergang | Animation | Motion-Reduce Fallback |
|---|---|---|
| Karte → Lektion | Zoom-in aus Karte (shared layout) | Sofortige Anzeige |
| Schritt → nächster Schritt | Slide links (horizontal) | Cross-fade |
| Sequenz → Quiz | Slide von unten (Sheet) | Fade |
| Quiz-Frage → nächste | Fade + Scale-down | Fade |
| Quiz → Ergebnis | Konfetti-Animation (sanft) | Nur Ergebnis-Screen |
| Ergebnis → Startseite | Slide zurück nach rechts | Sofortige Anzeige |

**Regel**: Nur `transform` + `opacity`, immer `prefers-reduced-motion` prüfen.

### Nächste Lektion

- Auf dem Ergebnis-Screen: "Nächste Lektion" Button mit Vorschau-Bild
- Reihenfolge: sortiert nach Schwierigkeit → Thema
- Keine automatische Weiterleitung — Kyrill entscheidet

---

## 3. User Flow (Schritt für Schritt)

### Kompletter Flow: App öffnen → Lektion abschließen

```
1. App öffnen
   └─ AuthGate prüft Token/Cookie
   └─ Falls neu: "Wer bist du?" (Username mit Bild-Avatar-Auswahl)
   └─ Startseite lädt

2. Startseite
   └─ Kyrill sieht Lektions-Raster (z.B. 4 Karten)
   └─ Jede Karte: Vorschau-Bild + Titel
   └─ Er tippt auf eine Karte (z.B. "Der Schmetterling")

3. Bildsequenz beginnt
   └─ Bild 1 erscheint (Ei auf Blatt)
   └─ Unten: Beschriftung "Das Ei"
   └─ Unten rechts: großer "Weiter" Button
   └─ Fortschrittsbalken zeigt 1 von 4
   └─ Kyrill tippt "Weiter" oder swipet links

4. Alle Bilder durchgeschaut
   └─ Letztes Bild: "Weiter" wird zu "Quiz starten"
   └─ Oder: automatischer Übergang nach letztem Bild (nach Bestätigung)

5. Quiz startet
   └─ Frage erscheint als Text + Bild oben
   └─ 3 Antwort-Bilder unten (groß, touchable)
   └─ Kyrill tippt auf ein Bild

6a. Richtige Antwort
    └─ Grüner Rahmen um gewähltes Bild
    └─ Sanfte Haptic-Feedback-Anforderung (navigator.vibrate)
    └─ 1.2s Pause → automatisch nächste Frage

6b. Falsche Antwort
    └─ Sanftes Highlight der richtigen Antwort (grün)
    └─ Keine roten Elemente, kein Alarm
    └─ 2s Pause → automatisch nächste Frage
    └─ Kein erneutes Versuchen (verhindert Frustration)

7. Alle Fragen beantwortet → Ergebnis-Screen
   └─ Großes Symbol: Stern / Herz / Smiley (je nach Score)
   └─ "Gut gemacht!" oder "Super!" (kurzer Text)
   └─ Visuelle Score-Anzeige (z.B. 3 von 3 Sterne)
   └─ Drei Optionen:
      - "Nochmal" (Pfeile-Symbol)
      - "Startseite" (Haus-Symbol)
      - "Nächste Lektion" (Pfeil rechts + Vorschau)

8. Nach Abschluss
   └─ Fortschritt wird gespeichert (localStorage + optional D1)
   └─ Lektions-Karte auf Startseite zeigt Häkchen
```

### Ablauf bei falschem Quiz-Antwort (Detail)

```
Kyrill tippt falsche Antwort
    │
    ▼
Gewähltes Bild: leichter roter Schatten (KEIN roter Rahmen)
Richtige Antwort: grüner Rahmen + sanftes Pulsieren
    │ 2 Sekunden warten
    ▼
Automatisch nächste Frage
(Keine Erklärung, kein Text — nur visuelles Signal)
```

**Begründung**: Kein Wiederholungsversuch, da dies bei IDD oft zu Frustrations-Schleifen führt. Das korrekte Bild wird gezeigt (implizites Lernen), dann weiter.

---

## 4. Fehlende Features (priorisiert)

### Priorität 1 — Kern-UX (sofort umsetzen)

#### 1.1 Fortschritt speichern + anzeigen
- **Was**: localStorage-basierter Fortschritt pro Lektion (abgeschlossen, Score, Datum)
- **Wo sichtbar**: Badge auf Lektions-Karten (✓ Häkchen), `/fortschritt` Seite
- **Kyrill-Nutzen**: Struktur, Vorhersehbarkeit, Belohnungs-Erlebnis
- **Aufwand**: Klein (localStorage-Hook + Badge-Komponente)

#### 1.2 "Nächste Lektion" auf Ergebnis-Screen
- **Was**: Nach Abschluss direkt nächste Lektion vorschlagen (mit Vorschau-Bild)
- **Kyrill-Nutzen**: Klare Weiterführung, kein Navigations-Aufwand
- **Aufwand**: Klein

#### 1.3 Haptic Feedback (Vibration API)
- **Was**: `navigator.vibrate(50)` bei richtig, `navigator.vibrate([50, 30, 50])` bei falsch
- **Kyrill-Nutzen**: Taktile Bestätigung — wichtig für nonverbale Kommunikation
- **Aufwand**: Minimal (2 Zeilen pro Event)

#### 1.4 Lautstärke-/Sound-Toggle (Vorbereitung)
- **Was**: Einfacher On/Off Toggle in Einstellungen für zukünftige Audio-Features
- **Kyrill-Nutzen**: Vorhersehbare Kontrolle
- **Aufwand**: Klein

### Priorität 2 — Lernerfahrung verbessern

#### 2.1 Wiederholungs-Modus
- **Was**: Quiz ohne Bildsequenz für bereits bekannte Lektionen
- **Trigger**: Erst verfügbar nach erstem Abschluss
- **Kyrill-Nutzen**: Festigung, schneller Einstieg
- **Aufwand**: Mittel (neue Route + UI-Variante)

#### 2.2 Lektion neu starten (mit Bestätigung)
- **Was**: Expliziter "Nochmal von vorne" Flow mit 1-Tap-Bestätigung
- **Kyrill-Nutzen**: Kyrill liebt Wiederholung — klare Struktur wichtig
- **Aufwand**: Klein (bereits teilweise vorhanden)

#### 2.3 Fortschritts-Seite `/fortschritt`
- **Was**: Visuelles Raster aller Lektionen mit Status-Symbolen
- **Kein Text-Heavy**: Sterne, Häkchen, Bilder
- **Kyrill-Nutzen**: Übersicht, Stolz auf Abgeschlossenes
- **Aufwand**: Mittel

#### 2.4 Bilder-Wiederholung nach Quiz (optional)
- **Was**: Nach falscher Antwort: kurze Rückkehr zum relevanten Bild aus der Sequenz
- **Kyrill-Nutzen**: Direktes Lernen aus Fehler (visuell, nicht verbal)
- **Aufwand**: Mittel

### Priorität 3 — Nice-to-have

#### 3.1 Favoriten / Lieblingslektion
- **Was**: Herz-Button auf Karten, `/favoriten` Seite
- **Aufwand**: Klein

#### 3.2 "Heute lernen" Empfehlung
- **Was**: Eine empfohlene Lektion auf der Startseite (groß, hervorgehoben)
- **Kyrill-Nutzen**: Reduziert Entscheidungsaufwand
- **Aufwand**: Klein

#### 3.3 Einstellungen-Seite
- **Was**: Animationen an/aus, zukünftige Audio-Kontrolle
- **Aufwand**: Mittel

#### 3.4 Offline-Fähigkeit (PWA)
- **Was**: Service Worker + Cache für Bilder und Lektionsdaten
- **Kyrill-Nutzen**: App funktioniert ohne WLAN (zuhause, unterwegs)
- **Aufwand**: Groß (PWA-Setup, Cache-Strategie)

#### 3.5 Einfache Statistik für Begleiter
- **Was**: `/admin`-Route für Eltern/Betreuer: welche Lektionen, wann, Score
- **Kyrill-Nutzen**: Indirekt — Begleiter können Lernfortschritt verfolgen
- **Aufwand**: Groß (D1 + Auth)

---

## 5. Design-Prinzipien

### Screen-Kapazität

| Element | Max pro Screen |
|---|---|
| Navigationsoptionen | 2–3 |
| Quiz-Antworten | 3 (nie mehr) |
| Lektionen auf Startseite | 4–6 (2 Spalten) |
| Textelemente | 1 Titel + 1 kurze Beschriftung |

### Touch-Targets

- **Minimum**: 80×80px für alle interaktiven Elemente
- **Quiz-Antworten**: mindestens 120×120px, volle Breite ausnutzen
- **Abstände**: min 16px zwischen Targets
- **"Weiter"-Button**: immer unten rechts, immer groß (min 64px Höhe, volle Breite auf Mobile)

### Farb-Feedback-System

| Zustand | Farbe | Bedeutung |
|---|---|---|
| Richtig | Grün (`#22c55e`) | ✓ Gut gemacht |
| Falsch/Hinweis | Bernstein/Orange | Schau hier hin |
| Ausgewählt | Blau-Rahmen | Ich hab das gewählt |
| Deaktiviert | Grau | Noch nicht verfügbar |
| Neutral | Weiß/Bernstein | Standard |

**Kein Rot für Fehler** — Rot ist alarmierend (ASD-kritisch!). Stattdessen: Richtiges hervorheben.

### Typografie

- **Überschriften**: min 24px, max 2 Zeilen
- **Beschriftungen**: min 18px, fett
- **Keine Fließtexte** in der Lektion — nur Bezeichnungen
- **Distinctive Font**: keine Inter/Arial (laut CLAUDE.md)

### Bilder

- **Flat vector, warm pastels, weißer Hintergrund** (laut CLAUDE.md)
- **Kein Text in Bildern** (Accessibility, Lokalisierung)
- **Eindeutige Hauptmotive** — keine komplexen Szenen
- **Konsistenter Stil** über alle Bilder einer Lektion (Character DNA)

### Struktur & Vorhersehbarkeit

- **Gleiche Seitenstruktur** für alle Lektionen (Kyrill weiß was kommt)
- **Gleiche Position** für "Weiter"-Button immer unten rechts
- **Fortschrittsanzeige** immer oben (Dots oder Balken)
- **Keine Überraschungen** — kein Auto-Advance ohne User-Action

---

## 6. Technische Architektur

### Aktueller Stack

```
Frontend:   Next.js 16.2.1 (App Router, Static Export)
Styling:    Tailwind CSS v4
UI:         shadcn/ui (geplant), manuelle Komponenten
Types:      TypeScript 5
Validation: Zod
Deploy:     Cloudflare Pages (Static Export)
Backend:    Cloudflare D1 (SQLite) via Cloudflare Functions
Auth:       Token + Username Cookie
Analytics:  Custom Event Tracking (POST /api/track)
Tests:      Vitest
```

### Was sich ändern muss

#### State Management für Fortschritt

**Aktuell**: Kein persistierter Fortschritt
**Ziel**: Hybrid-Persistenz

```typescript
// src/lib/progress.ts
interface LessonProgress {
  lessonId: string;
  completedAt: string;        // ISO timestamp
  score: number;              // 0–1
  attempts: number;
  lastScore: number;
}

// Schicht 1: localStorage (offline, sofort)
// Schicht 2: D1-Sync wenn online (optional, für Betreuer-Ansicht)
```

**Empfehlung**: Erst nur localStorage, D1-Sync als optionales späteres Feature.

#### Routing-Erweiterungen

```
/                          → Startseite (vorhanden)
/lesson/[id]               → Lektions-Flow (vorhanden)
/fortschritt               → Neue Seite
/einstellungen             → Neue Seite (optional)
/api/track                 → Cloudflare Function (vorhanden)
```

#### Komponenten-Erweiterungen

```
src/components/
├── LessonCard.tsx          # Erweitern: Progress-Badge
├── ProgressBadge.tsx       # Neu: ✓ / Sterne-Anzeige
├── ResultScreen.tsx        # Auslagern aus LessonFlow
├── NextLessonButton.tsx    # Neu: Vorschau + Tap
└── ProgressPage.tsx        # Neu: /fortschritt View
```

#### Hooks

```typescript
// src/hooks/useProgress.ts
function useProgress() {
  // Liest/schreibt localStorage
  // Gibt Progress-Map zurück: lessonId → LessonProgress
  // Exponiert: markComplete(lessonId, score), getProgress(lessonId), reset()
}

// src/hooks/useHaptic.ts
function useHaptic() {
  // navigator.vibrate Wrapper
  // Respektiert prefers-reduced-motion
  // correct(), incorrect()
}
```

### Offline-Fähigkeit

**Aktuell**: Keine Service Worker
**Kurzfristig**: Bilder über `next/image` gecacht (Browser-Cache)
**Mittelfristig**: PWA mit Workbox

```
// next.config.ts (zukünftig)
// next-pwa oder @ducanh2912/next-pwa
// Cache-Strategie: CacheFirst für /public/lessons/**
// NetworkFirst für API-Calls
```

**Wichtig**: Cloudflare Pages unterstützt Service Worker — kein Blocker.

### Datenhaltung Übersicht

| Daten | Wo | Sync |
|---|---|---|
| Lektionsinhalte | Build-time (static) | Kein Sync nötig |
| Generierte Bilder | `/public/lessons/[id]/` | Git / Build |
| Nutzer-Fortschritt | localStorage | Optional → D1 |
| Quiz-Antworten | localStorage + D1 | POST /api/track |
| Auth-Token | Cookie (30 Tage) | Manuell gesetzt |
| Username | Cookie (1 Jahr) | Lokal |

### Lektions-Erweiterung (neue Lektionen hinzufügen)

Der aktuelle Workflow:

```
1. LessonSpec JSON schreiben (data/examples/*.json)
2. Bilder generieren (FLUX via scripts/)
3. AssetManifest erstellen
4. Lektion in data/lessons.ts registrieren
5. Build + Deploy
```

**Verbesserung**: Lektion-Loader aus `/public/lessons/` ohne Rebuild (JSON-basiertes Lazy Loading)

```typescript
// Zukünftig: dynamisches Laden
// /public/lessons/[id]/spec.json + manifest.json
// fetch() im Server Component → kein Rebuild bei neuen Lektionen
```

---

## Zusammenfassung: Was als nächstes bauen

### Sprint 1 (diese Woche)
1. **Fortschritt localStorage** — `useProgress` Hook + `markComplete()` in LessonFlow
2. **Progress Badge** auf Lektionskarten — kleines Häkchen wenn abgeschlossen
3. **"Nächste Lektion" Button** auf Ergebnis-Screen
4. **Haptic Feedback** — 2 Zeilen bei richtig/falsch

### Sprint 2
5. **Fortschritts-Seite** `/fortschritt` — visuelles Raster mit Status
6. **Wiederholungs-Modus** — Quiz ohne Sequenz für bekannte Lektionen

### Sprint 3 (optional)
7. **PWA / Offline** — Service Worker für Bilder
8. **Einstellungen** — Animationen, Audio (Vorbereitung)
9. **Betreuer-Ansicht** — /admin mit D1-gespeicherten Antworten
