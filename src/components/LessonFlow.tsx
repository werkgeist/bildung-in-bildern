"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Lesson } from "@/types/lesson";
import SequenceViewer from "./SequenceViewer";
import Quiz from "./Quiz";
import { markComplete } from "@/hooks/useProgress";
import { allLessons } from "@/data/lessons";

interface LessonFlowProps {
  lesson: Lesson;
}

type Phase = "sequence" | "quiz" | "result";

export default function LessonFlow({ lesson }: LessonFlowProps) {
  const [phase, setPhase] = useState<Phase>("sequence");
  const [finalScore, setFinalScore] = useState(0);

  const handleSequenceComplete = () => setPhase("quiz");

  const handleQuizComplete = (score: number) => {
    setFinalScore(score);
    const normalizedScore = lesson.questions.length > 0 ? score / lesson.questions.length : 0;
    markComplete(lesson.id, normalizedScore);
    setPhase("result");
  };

  const handleRestart = () => {
    setPhase("sequence");
    setFinalScore(0);
  };

  if (phase === "sequence") {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="w-full max-w-lg px-4 mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-amber-600 font-semibold text-base active:text-amber-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 rounded-lg px-2 py-1 min-h-[44px]"
            aria-label="Zurück zur Lektionsauswahl"
          >
            ← Zurück
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-amber-700 mb-2">{lesson.title}</h1>
        <p className="text-gray-500 mb-8">{lesson.description}</p>
        <SequenceViewer sequence={lesson.sequence} onComplete={handleSequenceComplete} lessonId={lesson.id} />
      </div>
    );
  }

  if (phase === "quiz") {
    return (
      <div className="flex flex-col items-center py-8">
        <h1 className="text-3xl font-bold text-amber-700 mb-8">Quiz</h1>
        <Quiz questions={lesson.questions} onComplete={handleQuizComplete} lessonId={lesson.id} />
      </div>
    );
  }

  const total = lesson.questions.length;
  const allCorrect = finalScore === total;

  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1
    ? allLessons[currentIndex + 1]
    : null;

  return (
    <div className="flex flex-col items-center py-12 px-4 text-center gap-6">
      <div className="text-7xl" aria-hidden>
        {allCorrect ? "🦋" : "⭐"}
      </div>
      <div>
        <h1 className="text-3xl font-bold text-amber-700 mb-1">
          {allCorrect ? "Super gemacht!" : "Gut gemacht!"}
        </h1>
        <p className="text-xl text-gray-600">
          {finalScore} von {total} richtig
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {/* Nochmal */}
        <button
          onClick={handleRestart}
          aria-label="Lektion nochmal lernen"
          className="flex items-center justify-center gap-3 w-full min-h-[80px] px-6 py-4 bg-amber-100 text-amber-800 text-xl font-semibold rounded-2xl active:bg-amber-200 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
        >
          <span aria-hidden className="text-2xl">↺</span>
          Nochmal
        </button>

        {/* Startseite */}
        <Link
          href="/"
          aria-label="Zurück zur Startseite"
          className="flex items-center justify-center gap-3 w-full min-h-[80px] px-6 py-4 bg-gray-100 text-gray-700 text-xl font-semibold rounded-2xl active:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-400"
        >
          <span aria-hidden className="text-2xl">🏠</span>
          Startseite
        </Link>

        {/* Nächste Lektion */}
        {nextLesson && (
          <Link
            href={`/lesson/${nextLesson.id}`}
            aria-label={`Nächste Lektion: ${nextLesson.title}`}
            className="flex items-center gap-4 w-full min-h-[80px] px-6 py-4 bg-green-100 text-green-800 text-xl font-semibold rounded-2xl active:bg-green-200 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-400"
          >
            <Image
              src={nextLesson.sequence[0].src}
              alt={nextLesson.sequence[0].alt}
              width={64}
              height={64}
              className="rounded-xl object-cover shrink-0"
            />
            <span className="flex-1 text-left leading-tight">
              <span className="block text-sm font-normal text-green-600 mb-0.5">Nächste Lektion</span>
              {nextLesson.title}
            </span>
            <span aria-hidden className="text-2xl">→</span>
          </Link>
        )}
      </div>
    </div>
  );
}
