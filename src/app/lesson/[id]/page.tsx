import { notFound } from "next/navigation";
import LessonFlow from "@/components/LessonFlow";
import { lessonsById, allLessons } from "@/data/lessons";

// Required for `output: "export"` (static export)
export const dynamicParams = false;

export function generateStaticParams() {
  return allLessons.map((l) => ({ id: l.id }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lesson = lessonsById[id];

  if (!lesson) notFound();

  return (
    <main className="min-h-screen bg-white">
      <LessonFlow lesson={lesson} />
    </main>
  );
}
