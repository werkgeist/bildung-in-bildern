"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { QuizQuestion } from "@/types/lesson";
import { logAnswer } from "@/lib/logging";

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

export default function Quiz({ questions, onComplete }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

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

    logAnswer({
      timestamp: new Date().toISOString(),
      questionId: question.id,
      selectedOption: optionId,
      correct,
      responseTimeMs,
    });

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        onComplete(newScore);
      }
    }, 1200);
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

          let borderClass = "border-2 border-transparent";
          let shakeClass = "";

          if (isSelected) {
            if (isCorrect) {
              borderClass = "border-4 border-green-500";
            } else {
              borderClass = "border-4 border-red-500";
              shakeClass = "animate-shake";
            }
          }
          if (selected !== null && !isCorrect && isThisCorrect) {
            borderClass = "border-4 border-green-500";
          }

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={selected !== null}
              aria-label={option.label}
              aria-pressed={isSelected}
              className={`relative aspect-square rounded-xl overflow-hidden bg-amber-50 ${borderClass} ${shakeClass} transition-all active:scale-95 focus:outline-none`}
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
