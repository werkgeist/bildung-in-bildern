import type { LessonSpec, AssetManifest } from "@/types/lesson-spec";
import { convertToV1 } from "@/lib/convert-lesson";
import specJson from "@/data/examples/temperatur-spec.json";

const manifest: AssetManifest = {
  lessonId: "temperatur-einfach",
  generatedAt: "2026-03-29T04:00:00Z",
  model: "FLUX.2-dev",
  assets: [
    {
      refId: "temperatur-einfach-step-1",
      src: "/images/temperatur-einfach/01-kalt.webp",
      prompt: "",
    },
    {
      refId: "temperatur-einfach-step-2",
      src: "/images/temperatur-einfach/02-kuehl.webp",
      prompt: "",
    },
    {
      refId: "temperatur-einfach-step-3",
      src: "/images/temperatur-einfach/03-warm.webp",
      prompt: "",
    },
    {
      refId: "temperatur-einfach-step-4",
      src: "/images/temperatur-einfach/04-heiss.webp",
      prompt: "",
    },
    {
      refId: "temperatur-einfach-step-5",
      src: "/images/temperatur-einfach/05-thermometer.webp",
      prompt: "",
    },
  ],
};

export const temperaturLesson = convertToV1(
  specJson as unknown as LessonSpec,
  manifest
);
