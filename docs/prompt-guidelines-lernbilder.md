# Prompt-Guidelines: Lernbilder für Bildung in Bildern

*Stand: 2026-03-29 — Runde 1*

## Zweck
Dieses Dokument definiert Standards für die Generierung von Lernbildern mit FLUX.2 (oder kompatiblen Diffusion-Modellen) für das BiB-Projekt. Ziel: Bilder, die **Verständnis fördern**, nicht nur gut aussehen.

---

## Prinzip 1: Ein Bild = Ein Konzept

Jedes Bild zeigt genau eine Idee, ein Objekt, einen Zustand.

**Gut:** Raupe auf einem Blatt
**Schlecht:** Raupe + Schmetterling + Ei gleichzeitig

---

## Prinzip 2: Zentriertes Hauptobjekt, leerer Hintergrund

- Hauptobjekt nimmt 40-60% der Bildfläche ein
- Hintergrund: weiß oder sehr helles Einfarbig (cream, soft sky blue)
- Keine Szenen, keine Umgebungsdetails (außer wenn für Konzept notwendig)

---

## Prinzip 3: Konsistenter Stil innerhalb einer Lektion

Alle Bilder einer Lektion müssen denselben Stil haben:
- Gleicher Abstraktionsgrad
- Gleiche Linienstärke
- Gleiche Farbpalette

**Warum:** Stilwechsel zwischen Bildern erhöht kognitive Last unnötig.

---

## Basisvorlage (FLUX.2)

### Positiver Prompt
```
[HAUPTOBJEKT], [ZUSTAND/AKTION],
flat vector illustration, soft gradient shading,
warm pastel color palette, white background,
centered composition, bold clean outlines,
no text, no labels, no numbers,
children's educational book style, friendly, approachable,
simple geometric shapes, high contrast edges,
[STIL-ANKER aus Lektion]
```

### Negativer Prompt
```
photorealistic, photograph, complex texture, dark shadows,
multiple objects competing for attention, scary, threatening,
busy background, text overlay, watermark, noise, grain,
realistic human skin, horror, violence, adult content
```

### Technische Parameter
- **CFG Scale:** 3–4 (weicher, illustrativer)
- **Steps:** 25–30
- **Auflösung:** 1024×1024 (square) → Zuschneiden auf 800×800 für BiB
- **Format:** Ausgabe als PNG → Konvertierung zu WebP (cwebp -q 85)

---

## Farbpaletten pro Thema

### Natur / Tiere (z.B. Schmetterling)
```
Salbeigrün:    #87A878
Warmes Amber:  #F4A340
Creme-Weiß:    #FFF8F0
Himmelblau:    #A8D8EA
Sanftes Rosa:  #F7CAC9
```

### Jahreszeiten
```
Frühling: #B5D99C, #F2A7BB, #FFF4B8
Sommer:   #FFD166, #06D6A0, #118AB2
Herbst:   #E76F51, #F4A261, #E9C46A
Winter:   #CAF0F8, #90E0EF, #ADE8F4
```

### Körper / Gesundheit
```
Hautton-neutral: #FDDBB4, #D4956A
Blau (Wasser):   #A8D8EA
Grün (Gemüse):   #87A878
```

---

## Lektionsspezifische Prompts: Schmetterling (Referenz)

### Bild 1: Ei auf Blatt
```
Prompt: tiny white butterfly egg on a green leaf, close-up view,
flat vector illustration, soft gradient shading,
warm pastel color palette #87A878 #FFF8F0, white background,
centered composition, bold clean outlines, no text,
children's educational book style, friendly, simple shapes

Negativ: photorealistic, complex texture, dark shadows, busy background
CFG: 3.5 | Steps: 28
```

### Bild 2: Raupe
```
Prompt: cute green caterpillar with small dots, on a simple leaf,
flat vector illustration, soft gradient shading,
warm pastel color palette #87A878 #F4A340, white background,
centered composition, bold clean outlines, no text,
children's educational book style, friendly, approachable, chubby round body

Negativ: photorealistic, scary, many legs detailed, dark, complex background
CFG: 3.5 | Steps: 28
```

### Bild 3: Puppe / Kokon
```
Prompt: green chrysalis pupa hanging from a twig, simple branch,
flat vector illustration, soft gradient shading,
warm pastel color palette #87A878 #A8D8EA, white background,
centered composition, bold clean outlines, no text,
children's educational book style, peaceful, simple

Negativ: photorealistic, complex texture, scary, dark
CFG: 3.5 | Steps: 28
```

### Bild 4: Schmetterling
```
Prompt: beautiful butterfly with open wings, symmetrical, vibrant but soft colors,
flat vector illustration, soft gradient shading,
warm pastel color palette #F4A340 #F7CAC9 #87A878, white background,
centered composition, bold clean outlines, no text,
children's educational book style, joyful, friendly, clear wing patterns

Negativ: photorealistic, complex wing patterns, dark, scary
CFG: 3.5 | Steps: 28
```

---

## Qualitäts-Checkliste vor Verwendung

- [ ] Nur 1 Hauptobjekt erkennbar
- [ ] Hintergrund weiß oder sehr hell
- [ ] Kein Text / keine Zahlen im Bild
- [ ] Gesicht/Ausdruck (wenn vorhanden): freundlich, eindeutig
- [ ] Gleicher Stil wie andere Bilder der Lektion
- [ ] Kontrast ausreichend (Objekt gegen Hintergrund)
- [ ] Kein Erschreckendes / keine dunklen Farben
- [ ] Format: WebP, max. 200 KB
- [ ] Dateiname: `[NN]-[konzept].webp` (z.B. `02-raupe.webp`)

---

## Stil-Konsistenz via Referenzbild (FLUX img2img)

Bei Lektionen mit >3 Bildern: erstes Bild als Style-Referenz nutzen.

```bash
# Beispiel: Bild 2 mit Referenz aus Bild 1
flux generate \
  --prompt "cute green caterpillar..." \
  --style-image public/images/lektion/01-ei.webp \
  --style-strength 0.4 \
  --cfg 3.5
```

---

## Weiterentwicklung (Runde 2)

- [ ] Prompts für abstrakte Konzepte (Zahlen, Mengen)
- [ ] Animated WebP / Lottie für Übergänge (wenn reduced-motion = false)
- [ ] ARASAAC-Symbol-Integration als Fallback
- [ ] Batch-Generierungs-Script für neue Lektionen (Pipeline-Integration)
