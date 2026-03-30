import Image from "next/image";
import Link from "next/link";
import { allLessons } from "@/data/lessons";
import type { Lesson } from "@/types/lesson";
import ProgressBadge from "@/components/ProgressBadge";
import QuizRepeatLink from "@/components/QuizRepeatLink";
import ReviewCard from "@/components/ReviewCard";

function ProgressLink() {
  return (
    <Link
      href="/fortschritt"
      className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 active:bg-amber-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 transition-colors"
      aria-label="Mein Fortschritt"
    >
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="2" y="14" width="4" height="6" rx="1" fill="#d97706" />
        <rect x="9" y="9" width="4" height="11" rx="1" fill="#f59e0b" />
        <rect x="16" y="4" width="4" height="16" rx="1" fill="#fbbf24" />
      </svg>
    </Link>
  );
}

function DifficultyStars({ level }: { level?: 1 | 2 | 3 }) {
  const filled = level ?? 1;
  return (
    <div className="flex gap-1" aria-label={`Schwierigkeit: ${filled} von 3`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={i <= filled ? "text-amber-400" : "text-gray-200"}
          aria-hidden
        >
          ★
        </span>
      ))}
    </div>
  );
}

function LessonCard({ lesson }: { lesson: Lesson }) {
  const cover = lesson.sequence[0];
  return (
    <Link
      href={`/lesson/${lesson.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden bg-amber-50 border-2 border-amber-100 active:border-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
      aria-label={`Lektion: ${lesson.title}`}
    >
      <div className="relative w-full aspect-[4/3] bg-amber-100">
        {cover ? (
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 280px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-amber-300">
            ?
          </div>
        )}
        <ProgressBadge lessonId={lesson.id} />
      </div>
      <div className="flex flex-col gap-1 p-3 min-h-[80px] justify-center">
        <p className="text-base font-bold text-amber-800 leading-tight line-clamp-2">
          {lesson.title}
        </p>
        <DifficultyStars level={lesson.difficulty} />
      </div>
    </Link>
  );
}

export default function Home() {
  const lessons = allLessons.slice(0, 6);

  return (
    <main className="flex flex-col items-center min-h-screen bg-white px-4 py-10">
      <div className="w-full max-w-2xl flex justify-end mb-2">
        <ProgressLink />
      </div>
      <h1 className="text-4xl font-bold text-amber-700 mb-2 text-center">
        Bildung in Bildern
      </h1>
      <p className="text-xl text-gray-500 mb-10 text-center">Lernen mit Bildern</p>

      <div
        className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl"
        role="list"
        aria-label="Lektionen"
      >
        <ReviewCard />
        {lessons.map((lesson) => (
          <div key={lesson.id} role="listitem" className="flex flex-col">
            <LessonCard lesson={lesson} />
            <QuizRepeatLink lessonId={lesson.id} />
          </div>
        ))}
      </div>
    </main>
  );
}
