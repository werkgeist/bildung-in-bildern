#!/usr/bin/env node
/**
 * build-prompts.mjs — Generates image prompts from a LessonSpec v2 JSON.
 *
 * Usage:
 *   node scripts/build-prompts.mjs src/data/examples/wasserkreislauf-spec.json
 *
 * Output:
 *   - Prints prompts to stdout
 *   - Optionally writes AssetManifest JSON (--out manifest.json)
 */

import { readFileSync, writeFileSync } from "fs";
import { basename } from "path";

// ─── Style Presets ──────────────────────────────────────────

const STYLE_PRESETS = {
  "kyrill-friendly": {
    prefix:
      "Clean, simple vector illustration, warm colorful style, soft rounded shapes, thick outlines, no texture, high contrast, bold shapes, consistent visual elements",
    suffix: "solid background, centered composition, no text, no letters, no watermark, clear distinct elements, strong visible arrows where indicated",
    negative:
      "text, letters, watermark, photorealistic, cinematic lighting, complex textures, busy background, clutter, humans, faces, faint elements, low contrast, tiny details",
  },
  "flat-vector": {
    prefix:
      "Flat vector style illustration, vibrant colors, clean lines, geometric shapes, minimalist design",
    suffix: "lots of negative space, centered subject, no text",
    negative:
      "text, letters, watermark, photorealistic, cinematic lighting, complex textures, busy background",
  },
};

// ─── Prompt Builder ─────────────────────────────────────────

/**
 * Deduplicate comma-separated terms (case-insensitive).
 */
function dedup(str) {
  const seen = new Set();
  return str
    .split(",")
    .map((s) => s.trim())
    .filter((s) => {
      const key = s.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(", ");
}

function buildStepPrompt(step, spec) {
  const style = spec.style;
  const preset = STYLE_PRESETS[style.presetName] || STYLE_PRESETS["flat-vector"];

  // Core subject from mustInclude
  // Note: mustInclude is in the spec locale. For FLUX/SD, English prompts work best.
  // If locale != "en", these should ideally be written in English in the spec,
  // or a translation step added here. For now, we pass through as-is.
  const subject = step.mustInclude.join(", ");

  // Compose prompt
  const parts = [
    preset.prefix,
    subject,
    step.composition ? `${step.composition} layout` : "",
    style.colorPalette
      ? `color palette: ${style.colorPalette.join(", ")}`
      : "",
    style.background !== "white"
      ? `${style.background} background`
      : "solid white background",
    preset.suffix,
  ].filter(Boolean);

  const prompt = dedup(parts.join(", "));

  // Negative prompt — deduplicated
  const negParts = [
    preset.negative,
    style.negativePrompt || "",
    ...(step.mustAvoid || []),
  ].filter(Boolean);

  const negative = dedup(negParts.join(", "));

  return { prompt, negative };
}

function buildAllPrompts(spec) {
  const results = [];

  for (const step of spec.steps) {
    const { prompt, negative } = buildStepPrompt(step, spec);
    results.push({
      refId: step.id,
      stepOrder: step.order,
      label: step.label,
      prompt,
      negativePrompt: negative,
    });
  }

  return results;
}

function buildAssetManifest(spec, prompts) {
  return {
    lessonId: spec.id,
    generatedAt: new Date().toISOString(),
    model: "FLUX.2-dev",
    assets: prompts.map((p) => ({
      refId: p.refId,
      prompt: p.prompt,
      negativePrompt: p.negativePrompt,
      src: "", // To be filled after generation
      size: "1024x1024",
    })),
  };
}

// ─── CLI ─────────────────────────────────────────────────────

const args = process.argv.slice(2);
const specPath = args.find((a) => !a.startsWith("--"));
const outFlag = args.indexOf("--out");
const outPath = outFlag >= 0 ? args[outFlag + 1] : null;

if (!specPath) {
  console.error("Usage: node scripts/build-prompts.mjs <lesson-spec.json> [--out manifest.json]");
  process.exit(1);
}

const spec = JSON.parse(readFileSync(specPath, "utf-8"));

if (spec.version !== 2) {
  console.error(`Error: Expected LessonSpec version 2, got ${spec.version}`);
  process.exit(1);
}

const prompts = buildAllPrompts(spec);

// Print prompts
console.log(`\n=== Prompts for "${spec.title}" (${spec.steps.length} steps) ===\n`);
for (const p of prompts) {
  console.log(`--- Step ${p.stepOrder}: ${p.label} ---`);
  console.log(`PROMPT: ${p.prompt}`);
  console.log(`NEGATIVE: ${p.negativePrompt}`);
  console.log();
}

// Optionally write manifest
if (outPath) {
  const manifest = buildAssetManifest(spec, prompts);
  writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(`Asset manifest written to: ${outPath}`);
}
