"use client";

import { useEffect, useState } from "react";
import { getProgress } from "@/hooks/useProgress";
import type { LessonStatus } from "@/hooks/useProgress";

interface ProgressBadgeProps {
  lessonId: string;
}

export default function ProgressBadge({ lessonId }: ProgressBadgeProps) {
  const [status, setStatus] = useState<LessonStatus | null>(null);

  useEffect(() => {
    const p = getProgress(lessonId);
    setStatus(p?.status ?? null);
  }, [lessonId]);

  if (status === "passed") {
    return (
      <div
        className="absolute top-2 right-2 w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shadow-md"
        role="img"
        aria-label="Quiz bestanden"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
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

  if (status === "viewed") {
    return (
      <div
        className="absolute top-2 right-2 w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center shadow-md"
        role="img"
        aria-label="Angesehen"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <ellipse cx="9" cy="9" rx="6" ry="4" stroke="white" strokeWidth="2" />
          <circle cx="9" cy="9" r="1.8" fill="white" />
        </svg>
      </div>
    );
  }

  return null;
}
