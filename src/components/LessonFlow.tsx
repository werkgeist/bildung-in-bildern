"use client";

import { useState } from "react";
import type { Lesson } from "@/types/lesson";
import SequenceViewer from "./SequenceViewer";
import Quiz from "./Quiz";

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
    setPhase("result");
  };

  const handleRestart = () => {
    setPhase("sequence");
    setFinalScore(0);
  };

  if (phase === "sequence") {
    return (
      <div className="flex flex-col items-center py-8">
        <h1 className="text-3xl font-bold text-amber-700 mb-2">{lesson.title}</h1>
        <p className="text-gray-500 mb-8">{lesson.description}</p>
        <SequenceViewer sequence={lesson.sequence} onComplete={handleSequenceComplete} />
      </div>
    );
  }

  if (phase === "quiz") {
    return (
      <div className="flex flex-col items-center py-8">
        <h1 className="text-3xl font-bold text-amber-700 mb-8">Quiz</h1>
        <Quiz questions={lesson.questions} onComplete={handleQuizComplete} />
      </div>
    );
  }

  const total = lesson.questions.length;
  const allCorrect = finalScore === total;

  return (
    <div className="flex flex-col items-center py-16 px-4 text-center">
      <div className="text-7xl mb-6" aria-hidden>
        {allCorrect ? "🦋" : "⭐"}
      </div>
      <h1 className="text-3xl font-bold text-amber-700 mb-2">
        {allCorrect ? "Super gemacht!" : "Gut gemacht!"}
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        {finalScore} von {total} richtig
      </p>
      <button
        onClick={handleRestart}
        className="px-8 py-4 bg-amber-500 text-white text-xl font-semibold rounded-2xl active:bg-amber-600 transition-colors min-h-[80px]"
      >
        Nochmal lernen
      </button>
    </div>
  );
}
