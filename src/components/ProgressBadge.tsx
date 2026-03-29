"use client";

import { useEffect, useState } from "react";
import { getProgress } from "@/hooks/useProgress";

interface ProgressBadgeProps {
  lessonId: string;
}

export default function ProgressBadge({ lessonId }: ProgressBadgeProps) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(getProgress(lessonId) !== null);
  }, [lessonId]);

  if (!completed) return null;

  return (
    <div
      className="absolute top-2 right-2 w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shadow-md"
      role="img"
      aria-label="Abgeschlossen"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3.5 9L7.5 13L14.5 5"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
