"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllProgress } from "@/hooks/useProgress";
import type { LessonProgress } from "@/hooks/useProgress";
import { allLessons } from "@/data/lessons";
import type { Lesson } from "@/types/lesson";

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function LessonProgressCard({
  lesson,
  progress,
}: {
  lesson: Lesson;
  progress: LessonProgress | null;
}) {
  const cover = lesson.sequence[0];
  const done = progress !== null;

  return (
    <Link
      href={`/lesson/${lesson.id}`}
      className="flex flex-col rounded-2xl overflow-hidden border-2 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
      style={{
        borderColor: done ? "#22c55e" : "#e5e7eb",
        backgroundColor: done ? "#f0fdf4" : "#f9fafb",
      }}
      aria-label={`${lesson.title}${done ? ", abgeschlossen" : ", noch nicht gestartet"}`}
    >
      <div className="relative w-full aspect-[4/3] bg-gray-100">
        {cover ? (
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            className={`object-cover ${done ? "" : "opacity-40 grayscale"}`}
            sizes="(max-width: 640px) 45vw, 280px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
            ?
          </div>
        )}

        {done && (
          <div
            className="absolute top-2 right-2 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-md"
            role="img"
            aria-label="Abgeschlossen"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M4 10L8.5 14.5L16 6"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {!done && (
          <div
            className="absolute top-2 right-2 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center shadow-sm"
            role="img"
            aria-label="Noch nicht gestartet"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="2" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 p-3 min-h-[72px] justify-center">
        <p
          className={`text-sm font-bold leading-tight line-clamp-2 ${
            done ? "text-green-800" : "text-gray-400"
          }`}
        >
          {lesson.title}
        </p>
        {done && progress ? (
          <p className="text-xs text-green-600">
            {formatDate(progress.completedAt)}
          </p>
        ) : (
          <p className="text-xs text-gray-400">Noch nicht gestartet</p>
        )}
      </div>
    </Link>
  );
}

export default function FortschrittPage() {
  const [allProgress, setAllProgress] = useState<Record<string, LessonProgress>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAllProgress(getAllProgress());
    setLoaded(true);
  }, []);

  const completedCount = Object.keys(allProgress).length;
  const totalCount = allLessons.length;

  return (
    <main className="flex flex-col items-center min-h-screen bg-white px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Header row */}
        <div className="flex items-center mb-8">
          <Link
            href="/"
            className="flex items-center justify-center w-11 h-11 rounded-full bg-amber-50 active:bg-amber-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 transition-colors motion-reduce:transition-none"
            aria-label="Zurück zur Startseite"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M13 16L7 10L13 4"
                stroke="#92400e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <div className="flex-1 flex flex-col items-center">
            <h1 className="text-2xl font-bold text-amber-700">Mein Fortschritt</h1>
            {loaded && (
              <p className="text-gray-500 text-base mt-1" aria-live="polite">
                {completedCount} / {totalCount}
              </p>
            )}
          </div>
          {/* spacer to balance back button */}
          <div className="w-11" aria-hidden="true" />
        </div>

        {/* Lesson grid (shown after localStorage loaded) */}
        {loaded ? (
          <div
            className="grid grid-cols-2 gap-4 w-full"
            role="list"
            aria-label="Lektionsfortschritt"
          >
            {allLessons.map((lesson) => (
              <div key={lesson.id} role="listitem">
                <LessonProgressCard
                  lesson={lesson}
                  progress={allProgress[lesson.id] ?? null}
                />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid grid-cols-2 gap-4 w-full"
            aria-busy="true"
            aria-label="Wird geladen"
          >
            {allLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="rounded-2xl bg-gray-100 aspect-[4/3] animate-pulse motion-reduce:animate-none"
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
