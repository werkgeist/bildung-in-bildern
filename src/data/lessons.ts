import type { Lesson } from "@/types/lesson";
import { schmetterlingsLesson } from "./schmetterling";
import { wasserkreislaufLesson } from "./wasserkreislauf";
import { temperaturLesson } from "./temperatur";
import { lebensphasenLesson } from "./lebensphasen";

export const allLessons: Lesson[] = [
  schmetterlingsLesson,
  wasserkreislaufLesson,
  temperaturLesson,
  lebensphasenLesson,
];

export const lessonsById: Record<string, Lesson> = Object.fromEntries(
  allLessons.map((l) => [l.id, l])
);
