"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProgress } from "@/hooks/useProgress";

interface QuizRepeatButtonProps {
  lessonId: string;
}

export default function QuizRepeatButton({ lessonId }: QuizRepeatButtonProps) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(getProgress(lessonId) !== null);
  }, [lessonId]);

  if (!completed) return null;

  return (
    <Link
      href={`/lesson/${lessonId}?mode=quiz`}
      aria-label="Quiz wiederholen"
      className="flex items-center justify-center gap-2 w-full min-h-[44px] px-3 py-2 mt-1 bg-amber-100 text-amber-800 text-sm font-semibold rounded-xl active:bg-amber-200 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
    >
      <span aria-hidden className="text-base">↺</span>
      Quiz wiederholen
    </Link>
  );
}
