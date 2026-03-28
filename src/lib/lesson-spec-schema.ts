import { z } from "zod";

export const LessonStepSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  label: z.string().min(1),
  alt: z.string().min(1),
  concept: z.string().min(1),
  conceptTags: z.array(z.string()),
  mustInclude: z.array(z.string()),
  mustAvoid: z.array(z.string()).optional(),
  composition: z.string().optional(),
});

export const QuizOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  stepRef: z.string().optional(),
  isCorrect: z.boolean(),
  distractorReason: z.string().optional(),
});

export const QuizQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["sequence", "matching", "mc-image", "mc-text"]),
  testsConcepts: z.array(z.string()),
  questionText: z.string().min(1),
  options: z.array(QuizOptionSchema).nonempty(),
  correctOrderStepRefs: z.array(z.string()).optional(),
  hint: z.string().optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export const StylePresetSchema = z.object({
  artStyle: z.string().min(1),
  background: z.string().min(1),
  colorPalette: z.array(z.string()).optional(),
  negativePrompt: z.string().optional(),
  presetName: z.string().optional(),
});

export const LessonSpecSchema = z.object({
  id: z.string().min(1),
  version: z.literal(2),
  locale: z.string().min(2),
  title: z.string().min(1),
  description: z.string().min(1),
  subject: z.string().min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  learningGoals: z.array(z.string()).nonempty(),
  prerequisites: z.array(z.string()).optional(),
  steps: z.array(LessonStepSchema).nonempty(),
  questions: z.array(QuizQuestionSchema).nonempty(),
  style: StylePresetSchema,
  adaptation: z.unknown().optional(),
});

export type ValidatedLessonSpec = z.infer<typeof LessonSpecSchema>;
