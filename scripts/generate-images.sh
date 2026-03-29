#!/usr/bin/env bash
# generate-images.sh — End-to-End Bildgenerierung für eine Lektion
# Usage: bash scripts/generate-images.sh <lesson-id>
#
# Liest manuell übersetzte Prompts und generiert Bilder via Together.ai

set -euo pipefail

LESSON_ID="${1:-wasserkreislauf-einfach}"
IMG_DIR="public/images/${LESSON_ID}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GENERATE="${HOME}/.openclaw/workspace/scripts/generate-image.sh"

mkdir -p "$IMG_DIR"

# ─── Wasserkreislauf Prompts (manuell EN) ──────────────────

declare -A PROMPTS
declare -A FILENAMES

PROMPTS[1]="flat vector style illustration, clean lines, minimalist, simple geometric shapes, smooth areas of solid color, no texture. light gradient sky background, soft blue to white. large bright yellow sun at the top, blue water surface at the bottom (ocean or lake), light steam lines rising from the water surface, 2-3 clear upward arrows showing evaporation, centered composition, educational illustration, clear and simple, no text or labels"
FILENAMES[1]="01-verdunstung.webp"

PROMPTS[2]="flat vector style illustration, clean lines, minimalist, simple geometric shapes, smooth areas of solid color, no texture. light gradient sky background, soft blue to white. large white-grey cloud forming at top of sky, rising water vapor/steam below transforming into cloud, arrows pointing from steam up to cloud showing condensation, simple sky background, centered composition, educational illustration, clear and simple, no text or labels"
FILENAMES[2]="02-wolkenbildung.webp"

PROMPTS[3]="flat vector style illustration, clean lines, minimalist, simple geometric shapes, smooth areas of solid color, no texture. light gradient sky background, soft blue to white. large dark cloud at top, many visible raindrops falling downward, 2-3 downward arrows showing precipitation, water surface or ground at bottom receiving rain, centered composition, educational illustration, clear and simple, no text or labels"
FILENAMES[3]="03-niederschlag.webp"

PROMPTS[4]="flat vector style illustration, clean lines, minimalist, simple geometric shapes, smooth areas of solid color, no texture. light gradient sky background, soft blue to white. small stream or river flowing into a larger lake or sea, arrows showing water flowing together into one body of water, calm peaceful scene with clear simple shapes, centered composition, educational illustration, clear and simple, no text or labels"
FILENAMES[4]="04-sammlung.webp"

PROMPTS[5]="flat vector style illustration, clean lines, minimalist, simple geometric shapes, smooth areas of solid color, no texture. light gradient sky background, soft blue to white. large body of water (ocean), bright sun visible, upward arrows from water showing evaporation starting again, one large circular arrow showing the cycle repeats, centered composition, educational illustration, clear and simple, no text or labels"
FILENAMES[5]="05-kreislauf.webp"

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
