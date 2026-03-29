"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProgress } from "@/hooks/useProgress";

export default function QuizRepeatLink({ lessonId }: { lessonId: string }) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(getProgress(lessonId) !== null);
  }, [lessonId]);

  if (!completed) return null;

  return (
    <Link
      href={`/lesson/${lessonId}?mode=quiz`}
      aria-label="Quiz wiederholen"
      className="flex items-center justify-center gap-2 w-full min-h-[44px] px-3 py-2 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl active:bg-amber-100 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
    >
      <span aria-hidden="true">↺</span>
      Quiz wiederholen
    </Link>
  );
}
