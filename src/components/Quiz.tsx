"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { QuizQuestion } from "@/types/lesson";
import { logAnswer } from "@/lib/logging";
import { useHaptic } from "@/hooks/useHaptic";

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
  lessonId?: string;
}

export default function Quiz({ questions, onComplete, lessonId }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const haptic = useHaptic();

  const question = questions[currentIndex];

  useEffect(() => {
    startTimeRef.current = Date.now();
    setSelected(null);
    setIsCorrect(null);
  }, [currentIndex]);

  const handleSelect = (optionId: string) => {
    if (selected !== null) return;

    const correct = optionId === question.correctOptionId;
    const responseTimeMs = Date.now() - startTimeRef.current;
    const newScore = score + (correct ? 1 : 0);

    setSelected(optionId);
    setIsCorrect(correct);
    setScore(newScore);

    if (correct) {
      haptic.correct();
    } else {
      haptic.incorrect();
    }

    logAnswer({
      timestamp: new Date().toISOString(),
      questionId: question.id,
      selectedOption: optionId,
      correct,
      responseTimeMs,
      lessonId,
      stepIndex: currentIndex,
    });

    const delay = correct ? 1200 : 2000;
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        onComplete(newScore);
      }
    }, delay);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-4">
      <p className="text-sm text-gray-500 mb-2">
        Frage {currentIndex + 1} von {questions.length}
      </p>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {question.questionText}
      </h2>

      <div className="grid grid-cols-3 gap-3 w-full">
        {question.options.map((option) => {
          const isSelected = selected === option.id;
          const isThisCorrect = option.id === question.correctOptionId;
          const showFeedback = selected !== null;

          // Selected correct: green border
          // Selected incorrect: amber shadow
          // Correct answer when wrong was chosen: green border + pulse
          let borderClass = "border-2 border-transparent";
          let shadowClass = "";
          let pulseClass = "";

          if (showFeedback) {
            if (isSelected && isCorrect) {
              borderClass = "border-4 border-green-500";
            } else if (isSelected && !isCorrect) {
              shadowClass = "shadow-[0_0_0_4px_rgba(251,191,36,0.7)]";
            }

            if (!isCorrect && isThisCorrect) {
              borderClass = "border-4 border-green-500";
              pulseClass = "animate-correct-pulse";
            }
          }

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={selected !== null}
              aria-label={option.label}
              aria-pressed={isSelected}
              className={`relative aspect-square rounded-xl overflow-hidden bg-amber-50 ${borderClass} ${shadowClass} ${pulseClass} transition-all active:scale-95 focus:outline-none`}
            >
              <Image
                src={option.imageSrc}
                alt={option.label}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/30 px-1 py-0.5">
                <p className="text-white text-xs text-center font-medium">
                  {option.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
