"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Quiz from "@/components/Quiz";
import {
  getDueItemsWithQuestions,
  recordAnswer,
  type ReviewItemWithQuestion,
} from "@/data/item-bank";
import type { QuizQuestion } from "@/types/lesson";

type Phase = "loading" | "quiz" | "result" | "empty";

export default function ReviewSession() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [items, setItems] = useState<ReviewItemWithQuestion[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const due = getDueItemsWithQuestions(5);
    if (due.length < 1) {
      setPhase("empty");
    } else {
      setItems(due);
      setPhase("quiz");
    }
  }, []);

  const questions: QuizQuestion[] = items.map((item) => item.question);

  const handleQuestionAnswered = (questionId: string, correct: boolean) => {
    const item = items.find((i) => i.questionId === questionId);
    if (item) {
      recordAnswer(item.lessonId, questionId, correct);
    }
  };

  const handleQuizComplete = (finalScore: number) => {
    setScore(finalScore);
    setPhase("result");
  };

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[40vh]" aria-busy="true">
        <div className="text-gray-400 text-lg">Lade Wiederholung…</div>
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <div className="flex flex-col items-center py-12 px-4 text-center gap-6">
        <div className="text-6xl" aria-hidden>✅</div>
        <h1 className="text-3xl font-bold text-amber-700">Alles wiederholt!</h1>
        <p className="text-xl text-gray-500 max-w-prose">
          Du hast heute alle fälligen Aufgaben erledigt. Morgen gibt es neue Wiederholungen.
        </p>
        <Link
          href="/"
          className="flex items-center justify-center gap-3 min-h-[80px] px-8 py-4 bg-amber-100 text-amber-800 text-xl font-semibold rounded-2xl active:bg-amber-200 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
        >
          <span aria-hidden className="text-2xl">🏠</span>
          Startseite
        </Link>
      </div>
    );
  }

  if (phase === "quiz") {
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
        <h1 className="text-3xl font-bold text-amber-700 mb-2">Wiederholung</h1>
        <p className="text-gray-500 mb-8">{items.length} Fragen aus alten Lektionen</p>
        <Quiz
          questions={questions}
          onComplete={handleQuizComplete}
          onQuestionAnswered={handleQuestionAnswered}
        />
      </div>
    );
  }

  // result phase
  const total = items.length;
  const allCorrect = score === total;

  return (
    <div className="flex flex-col items-center py-12 px-4 text-center gap-6">
      <div className="text-7xl" aria-hidden>{allCorrect ? "🌟" : "🔄"}</div>
      <div>
        <h1 className="text-3xl font-bold text-amber-700 mb-1">
          {allCorrect ? "Super! Alles richtig!" : "Gut gemacht!"}
        </h1>
        <p className="text-xl text-gray-600">
          {score} von {total} richtig
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          href="/"
          aria-label="Zurück zur Startseite"
          className="flex items-center justify-center gap-3 w-full min-h-[80px] px-6 py-4 bg-gray-100 text-gray-700 text-xl font-semibold rounded-2xl active:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-400"
        >
          <span aria-hidden className="text-2xl">🏠</span>
          Startseite
        </Link>
      </div>
    </div>
  );
}
