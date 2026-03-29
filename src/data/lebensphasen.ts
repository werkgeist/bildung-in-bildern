import type { LessonSpec, AssetManifest } from "@/types/lesson-spec";
import { convertToV1 } from "@/lib/convert-lesson";
import specJson from "@/data/examples/lebensphasen-spec.json";

const manifest: AssetManifest = {
  lessonId: "lebensphasen-einfach",
  generatedAt: "2026-03-29T07:00:00Z",
  model: "FLUX.2-dev",
  assets: [
    {
      refId: "lebensphasen-einfach-step-1",
      src: "/images/lebensphasen-einfach/01-baby.webp",
      prompt: "",
    },
    {
      refId: "lebensphasen-einfach-step-2",
      src: "/images/lebensphasen-einfach/02-kleinkind.webp",
      prompt: "",
    },
    {
      refId: "lebensphasen-einfach-step-3",
      src: "/images/lebensphasen-einfach/03-kind.webp",
      prompt: "",
    },
    {
      refId: "lebensphasen-einfach-step-4",
      src: "/images/lebensphasen-einfach/04-ausbildung.webp",
      prompt: "",
    },
    {
      refId: "lebensphasen-einfach-step-5",
      src: "/images/lebensphasen-einfach/05-arbeit.webp",
      prompt: "",
    },
  ],
};

export const lebensphasenLesson = convertToV1(
  specJson as unknown as LessonSpec,
  manifest
);
