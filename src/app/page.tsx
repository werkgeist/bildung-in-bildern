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

function computeDifficulty(questionCount: number): 1 | 2 | 3 {
  if (questionCount <= 2) return 1;
  if (questionCount <= 4) return 2;
  return 3;
}

function DifficultyStars({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-1" aria-label={`Schwierigkeit: ${level} von 3`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={i <= level ? "text-amber-400" : "text-gray-300"}
          aria-hidden
        >
          {i <= level ? "★" : "☆"}
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
        <DifficultyStars level={computeDifficulty(lesson.questions.length)} />
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

      <section aria-labelledby="experiments-title" className="w-full max-w-2xl mt-12">
        <h2 id="experiments-title" className="text-2xl font-semibold text-teal-900 mb-4">Ausprobieren</h2>
        <Link
          href="/ausprobieren/waschbecken/"
          aria-label="Waschbecken ausprobieren"
          className="flex flex-col sm:flex-row items-center gap-5 rounded-2xl border-2 border-teal-200 bg-[#f3f5ec] p-5 text-teal-950 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-teal-800 hover:border-teal-700"
        >
          <svg width="160" height="120" viewBox="0 0 160 120" fill="none" aria-hidden="true" className="shrink-0">
            <path d="M43 43V24Q43 14 55 14H66Q78 14 78 28V35" stroke="#8caaa0" strokeWidth="9" />
            <path d="M43 26H30" stroke="#587f70" strokeWidth="6" strokeLinecap="round" />
            <path d="M78 36V73" stroke="#65bbb8" strokeWidth="6" />
            <path d="M18 51H142L132 90Q129 105 113 105H47Q31 105 28 90Z" fill="#fcfcf4" stroke="#8aa394" strokeWidth="3" />
            <path d="M29 73H131L126 90Q122 98 113 98H47Q37 98 34 90Z" fill="#57aba9" />
            <path d="M27 72H133" stroke="#248183" strokeWidth="2" />
            <path d="M73 101H87" stroke="#476b5a" strokeWidth="5" strokeLinecap="round" />
            <path d="M80 106V118" stroke="#8aa394" strokeWidth="9" />
          </svg>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-1">Das Waschbecken</h3>
            <p className="text-base text-teal-900">Hahn und Stöpsel selbst bedienen.</p>
          </div>
          <span aria-hidden="true" className="text-2xl">→</span>
        </Link>
      </section>
    </main>
  );
}
