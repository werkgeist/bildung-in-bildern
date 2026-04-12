#!/usr/bin/env bash
# generate-images-kuehlschrank.sh — Bildgenerierung für Kühlschrank-Lektion
# Usage: bash scripts/generate-images-kuehlschrank.sh

set -euo pipefail

LESSON_ID="kuehlschrank-einfach"
IMG_DIR="public/images/${LESSON_ID}"
GENERATE="${HOME}/.openclaw/workspace/scripts/generate-image.sh"

mkdir -p "$IMG_DIR"

# ─── Kühlschrank Prompts (manuell EN) ──────────────────

declare -A PROMPTS
declare -A FILENAMES

PROMPTS[1]="flat vector style illustration, clean lines, minimalist, simple geometric shapes, smooth areas of solid color, no texture. white background. friendly white refrigerator with rounded corners and silver handle, door open to the right, hand placing a plate of colorful food inside, small orange heat wave lines rising from the food showing it is still warm, shelves visible inside fridge, centered composition, educational illustration, clear and simple, no text or labels"
FILENAMES[1]="01-essen-rein.webp"

PROMPTS[2]="flat vector style illustration, clean lines, minimalist, simple geometric shapes, smooth areas of solid color, no texture. white background. friendly white refrigerator with rounded corners and silver handle, door fully closed, front view, small blue snowflake icons floating around the fridge showing cold is kept inside, calm peaceful scene, centered composition, educational illustration, clear and simple, no text or labels"
FILENAMES[2]="02-tuer-zu.webp"

PROMPTS[3]="flat vector style illustration, clean lines, minimalist, simple geometric shapes, smooth areas of solid color, no texture. white background. back view of a white refrigerator, visible round gray compressor motor at the bottom, gray pipes and tubes running up the back, small vibration wave lines around the motor showing it is humming and working, centered composition, educational illustration, clear and simple, no text or labels"
FILENAMES[3]="03-motor.webp"

PROMPTS[4]="flat vector style illustration, clean lines, minimalist, simple geometric shapes, smooth areas of solid color, no texture. white background. front view of an open white refrigerator, shelves with colorful food items (apple, bottle, plate), blue cold air waves flowing inside the fridge, small snowflakes and ice crystals floating in the air inside, cool blue glow, centered composition, educational illustration, clear and simple, no text or labels"
FILENAMES[4]="04-kaelte-innen.webp"

PROMPTS[5]="flat vector style illustration, clean lines, minimalist, simple geometric shapes, smooth areas of solid color, no texture. white background. friendly white refrigerator with door open, a hand taking out a plate of food, small blue snowflake and star freshness symbols around the food showing it is now cold and fresh, happy cheerful mood with soft warm colors, centered composition, educational illustration, clear and simple, no text or labels"
FILENAMES[5]="05-essen-kalt.webp"

# ─── Generate ──────────────────────────────────────────────

echo "🎨 Generating ${#PROMPTS[@]} images for lesson: ${LESSON_ID}"
echo "   Output: ${IMG_DIR}/"
echo ""

for i in $(seq 1 ${#PROMPTS[@]}); do
  OUTPUT="${IMG_DIR}/${FILENAMES[$i]}"
  echo "--- Step ${i}: ${FILENAMES[$i]} ---"

  if [ -f "$OUTPUT" ]; then
    echo "   ⏭️  Already exists, skipping"
    continue
  fi

  bash "$GENERATE" "${PROMPTS[$i]}" "$OUTPUT" "1024x1024"

  if [ -f "$OUTPUT" ]; then
    echo "   ✅ Generated: $(du -h "$OUTPUT" | cut -f1)"
  else
    echo "   ❌ Failed!"
  fi

  # Rate limit: 1 sec between requests
  sleep 1
done

echo ""
echo "🏁 Done! Images in ${IMG_DIR}/"
ls -la "${IMG_DIR}/"
