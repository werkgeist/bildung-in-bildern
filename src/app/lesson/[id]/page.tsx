import { notFound } from "next/navigation";
import LessonFlow from "@/components/LessonFlow";
import { schmetterlingsLesson } from "@/data/schmetterling";
import type { Lesson } from "@/types/lesson";

const lessons: Record<string, Lesson> = {
  [schmetterlingsLesson.id]: schmetterlingsLesson,
};

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lesson = lessons[id];

  if (!lesson) notFound();

  return (
    <main className="min-h-screen bg-white">
      <LessonFlow lesson={lesson} />
    </main>
  );
}
