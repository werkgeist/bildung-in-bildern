import type { Lesson } from "@/types/lesson";
import { schmetterlingsLesson } from "./schmetterling";
import { wasserkreislaufLesson } from "./wasserkreislauf";
import { temperaturLesson } from "./temperatur";
import { lebensphasenLesson } from "./lebensphasen";
import { kuehlschrankLesson } from "./kuehlschrank";

export const allLessons: Lesson[] = [
  schmetterlingsLesson,
  wasserkreislaufLesson,
  temperaturLesson,
  lebensphasenLesson,
  kuehlschrankLesson,
];

export const lessonsById: Record<string, Lesson> = Object.fromEntries(
  allLessons.map((l) => [l.id, l])
);
