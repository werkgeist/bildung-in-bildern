import type { LessonSpec, AssetManifest } from "@/types/lesson-spec";
import { convertToV1 } from "@/lib/convert-lesson";
import specJson from "@/data/examples/kuehlschrank-spec.json";

const manifest: AssetManifest = {
  lessonId: "kuehlschrank-einfach",
  generatedAt: "2026-04-12T00:00:00Z",
  model: "FLUX.2-dev",
  assets: [
    {
      refId: "kuehlschrank-einfach-step-1",
      src: "/images/kuehlschrank-einfach/01-essen-rein.webp",
      prompt: "",
    },
    {
      refId: "kuehlschrank-einfach-step-2",
      src: "/images/kuehlschrank-einfach/02-tuer-zu.webp",
      prompt: "",
    },
    {
      refId: "kuehlschrank-einfach-step-3",
      src: "/images/kuehlschrank-einfach/03-motor.webp",
      prompt: "",
    },
    {
      refId: "kuehlschrank-einfach-step-4",
      src: "/images/kuehlschrank-einfach/04-kaelte-innen.webp",
      prompt: "",
    },
    {
      refId: "kuehlschrank-einfach-step-5",
      src: "/images/kuehlschrank-einfach/05-essen-kalt.webp",
      prompt: "",
    },
  ],
};

export const kuehlschrankLesson = convertToV1(
  specJson as unknown as LessonSpec,
  manifest
);
