/**
 * LessonSpec v2 — Core Content + Didaktik
 *
 * Single Source of Truth für eine Lektion.
 * Getrennt von Pipeline-Artefakten (Bilder, Prompts).
 *
 * Design-Prinzipien:
 * - LLM-generierbar aus einem Thema/Prompt
 * - Validierbar per JSON Schema
 * - Erweiterbar ohne Breaking Changes (optionale Felder)
 */

// ─── Core Spec ───────────────────────────────────────────────

export interface LessonSpec {
  /** Unique slug, z.B. "schmetterling-lebenszyklus" */
  id: string;
  /** Schema-Version für Migrations */
  version: 2;
  /** Sprache (BCP 47) */
  locale: string;

  // Meta
  title: string;
  description: string;
  subject: string; // "nature" | "math" | "geography" | "history" | "daily-life"
  difficulty: 1 | 2 | 3;

  // Didaktik
  learningGoals: string[]; // 1-3 konkrete, prüfbare Lernziele
  prerequisites?: string[]; // Was muss bekannt sein?

  // Bildsequenz (Storyboard)
  steps: LessonStep[];

  // Quiz
  questions: QuizQuestion[];

  // Stil-Vorgaben (für Bildgenerierung, einmal pro Lektion)
  style: StylePreset;

  // Adaptivität (Phase 2+, optional)
  adaptation?: AdaptationPolicy;
}

export interface LessonStep {
  /** Deterministisch: `${lessonId}-step-${order}` */
  id: string;
  order: number;
  /** Kurz-Label für UI */
  label: string;
  /** Barrierefreiheit */
  alt: string;
  /** Was wird in diesem Schritt gelernt? (1 Satz) */
  concept: string;
  /** Tags für Quiz-Referenz und Adaptivität */
  conceptTags: string[];
  /** Was MUSS im Bild eindeutig erkennbar sein? */
  mustInclude: string[];
  /** Was darf NICHT im Bild sein? (Verwechslungsgefahr) */
  mustAvoid?: string[];
  /** Bild-Layout/Komposition Hinweis, z.B. "links-nach-rechts", "oben-unten", "zentriert" */
  composition?: string;

  // ─── Visual Director (McCloud/Film-Theorie) ──────────────────
  /** McCloud Transition-Typ zwischen diesem und dem vorherigen Panel */
  transitionType?: "action-to-action" | "subject-to-subject" | "scene-to-scene" | "aspect-to-aspect";
  /** Film-Einstellungsgröße: Wide=Kontext/Wo, Medium=Wer, Close-up=Was/Emotion */
  shotType?: "wide" | "medium" | "close-up";
  /** Kamerawinkel */
  cameraAngle?: "eye-level" | "high" | "low";
  /** Mayer-Coherence: Bild-Text-Relation */
  wordPictureRelation?: "interdependent" | "additive";
  /** Relative Panel-Größe proportional zur didaktischen Wichtigkeit */
  panelSize?: "small" | "medium" | "large";
}

export interface QuizQuestion {
  /** Deterministisch: `${lessonId}-q-${index}` */
  id: string;
  type: "sequence" | "matching" | "mc-image" | "mc-text";
  /** Was wird geprüft? Referenziert conceptTags */
  testsConcepts: string[];
  questionText: string;
  options: QuizOption[];
  /** Für type="sequence": die korrekte Step-Reihenfolge */
  correctOrderStepRefs?: string[];
  /** Optionaler Hinweis bei falscher Antwort */
  hint?: string;
  difficulty: 1 | 2 | 3;
}

export interface QuizOption {
  /** Deterministisch: `${questionId}-opt-${index}` */
  id: string;
  label: string;
  /** Referenz auf Step-ID (für Bild-Lookup im AssetManifest) */
  stepRef?: string;
  /** Ist das die richtige Antwort? */
  isCorrect: boolean;
  /** Warum falsch? (für Feedback + Debugging, nicht UI) */
  distractorReason?: string;
}

export interface StylePreset {
  artStyle: string; // "flat-vector" | "watercolor" | "photo-realistic" | etc.
  background: string; // "white" | "scene-appropriate" | etc.
  colorPalette?: string[]; // Hex-Farben für Konsistenz
  negativePrompt?: string; // Global: was NICHT generiert werden soll
  /** Wiederverwendbarer Preset-Name, z.B. "kyrill-friendly" */
  presetName?: string;

  // ─── Visual Director (Character & Style Consistency) ─────────
  /** Fixe Character-Beschreibung für visuelle Konsistenz über alle Panels */
  characterDNA?: string;
  /** 1-2 Zeilen Art-Style Beschreibung als globale Referenz */
  styleBible?: string;
  /** Spatial / Kompositions-Regeln */
  spatialRules?: {
    /** 180-Grad-Regel: Links-Rechts-Orientierung über Panels beibehalten */
    maintainLR: boolean;
  };
}

// ─── Asset Manifest (Pipeline-Output, separate Datei) ────────

export interface AssetManifest {
  lessonId: string;
  generatedAt: string; // ISO timestamp
  model: string; // z.B. "FLUX.2-dev"
  assets: AssetEntry[];
}

export interface AssetEntry {
  /** Referenz auf LessonStep.id oder QuizOption.id */
  refId: string;
  /** Generierter Prompt */
  prompt: string;
  /** Pfad zum generierten Bild */
  src: string;
  /** Bildgröße */
  size?: string; // "1024x1024"
  /** Generierungs-Seed für Reproduzierbarkeit */
  seed?: number;

  // ─── Provenance-Felder (Issue #33) ───────────────────────────
  /** Kurzreferenz auf den LessonStep, z.B. 'schmetterling-lebenszyklus-step-1' */
  stepRef?: string;
  /** Rolle des Bildes im Lerninhalt */
  role?: "story" | "quiz-correct" | "quiz-distractor";
  /** Relativer Pfad zum gespeicherten Bild (befüllt nach Generierung) */
  filePath?: string;
  /** Negativer Prompt der verwendet wurde */
  negativePrompt?: string;
  /** Model das das Bild generiert hat, z.B. 'black-forest-labs/FLUX.2-dev' */
  model?: string;
  /** Anzahl Inference Steps */
  steps?: number;
  /** ISO timestamp der Einzelbild-Generierung */
  generatedAt?: string;
  /** SHA256-Checksum des Bildes (befüllt nach Generierung) */
  checksum?: string;
}

// ─── Adaptivität (Phase 2+) ──────────────────────────────────

export interface AdaptationPolicy {
  rules: AdaptationRule[];
}

export interface AdaptationRule {
  /** Wann greift die Regel? */
  condition: {
    metric: "errorRate" | "responseTime" | "attempts";
    threshold: number;
    conceptTags?: string[]; // Optional: nur für bestimmte Konzepte
  };
  /** Was passiert? */
  action: {
    type: "reduceOptions" | "addHint" | "simplifyQuestion" | "repeatStep" | "skipToNext";
    params?: Record<string, unknown>;
  };
}

// ─── Rückwärtskompatibel: Legacy Lesson → LessonSpec ─────────

/** Das alte Format (v1), weiterhin für Runtime genutzt */
export interface LessonV1 {
  id: string;
  title: string;
  description: string;
  difficulty?: 1 | 2 | 3;
  sequence: { id: string; src: string; label: string; alt: string }[];
  questions: {
    id: string;
    questionText: string;
    options: { id: string; imageSrc: string; label: string }[];
    correctOptionId: string;
  }[];
}
