import type { LessonSpec, AssetManifest } from "@/types/lesson-spec";
import { convertToV1 } from "@/lib/convert-lesson";
import specJson from "@/data/examples/wasserkreislauf-spec.json";

const manifest: AssetManifest = {
  lessonId: "wasserkreislauf-einfach",
  generatedAt: "2026-03-28T00:00:00Z",
  model: "FLUX.2-dev",
  assets: [
    {
      refId: "wasserkreislauf-einfach-step-1",
      src: "/images/wasserkreislauf-einfach/01-verdunstung.webp",
      prompt: "",
    },
    {
      refId: "wasserkreislauf-einfach-step-2",
      src: "/images/wasserkreislauf-einfach/02-wolkenbildung.webp",
      prompt: "",
    },
    {
      refId: "wasserkreislauf-einfach-step-3",
      src: "/images/wasserkreislauf-einfach/03-niederschlag.webp",
      prompt: "",
    },
    {
      refId: "wasserkreislauf-einfach-step-4",
      src: "/images/wasserkreislauf-einfach/04-sammlung.webp",
      prompt: "",
    },
    {
      refId: "wasserkreislauf-einfach-step-5",
      src: "/images/wasserkreislauf-einfach/05-kreislauf.webp",
      prompt: "",
    },
  ],
};

export const wasserkreislaufLesson = convertToV1(
  specJson as unknown as LessonSpec,
  manifest
);
