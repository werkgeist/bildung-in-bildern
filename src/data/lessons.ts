import type { Lesson } from "@/types/lesson";
import { schmetterlingsLesson } from "./schmetterling";
import { wasserkreislaufLesson } from "./wasserkreislauf";

export const allLessons: Lesson[] = [
  schmetterlingsLesson,
  wasserkreislaufLesson,
];

export const lessonsById: Record<string, Lesson> = Object.fromEntries(
  allLessons.map((l) => [l.id, l])
);
