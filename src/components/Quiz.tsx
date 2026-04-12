"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import type { QuizQuestion } from "@/types/lesson";
import { logAnswer } from "@/lib/logging";
import { trackEvent } from "@/lib/analytics";
import { useHaptic } from "@/hooks/useHaptic";

/** Deterministic shuffle seeded by question id — stable across re-renders. */
function shuffleOptions<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  // xmur3-inspired hash: feed each char, then squeeze values per swap step
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  for (let i = arr.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h = (h ^ (h >>> 16)) >>> 0;
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
  lessonId?: string;
  onQuestionAnswered?: (questionId: string, correct: boolean) => void;
}

export default function Quiz({ questions, onComplete, lessonId, onQuestionAnswered }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const haptic = useHaptic();
  // Session seed changes each mount → different shuffle order per visit
  const sessionSeed = useRef(String(Date.now()));

  const question = questions[currentIndex];
  const shuffledOptions = useMemo(
    () => shuffleOptions(question.options, question.id + sessionSeed.current),
    [question.id, question.options]
  );

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

    onQuestionAnswered?.(question.id, correct);

    if (lessonId) {
      void trackEvent({
        lesson_id: lessonId,
        step_type: "quiz_answer",
        step_index: currentIndex,
        answer: optionId,
        correct: correct ? 1 : 0,
        response_time_ms: responseTimeMs,
      });
    }

  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onComplete(score);
    }
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
        {shuffledOptions.map((option) => {
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
              pulseClass = "animate-correct-pulse motion-reduce:animate-none";
            }
          }

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={selected !== null}
              aria-label={option.label}
              aria-pressed={isSelected}
              className={`relative aspect-square rounded-xl overflow-hidden bg-amber-50 ${borderClass} ${shadowClass} ${pulseClass} transition-all active:scale-95 focus-visible:ring-[3px] focus-visible:ring-amber-500 focus-visible:ring-offset-2`}
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

      {selected !== null && (
        <button
          onClick={handleNext}
          className="mt-8 w-full py-5 rounded-2xl bg-amber-400 hover:bg-amber-500 active:scale-95 text-white text-xl font-bold transition-all focus-visible:ring-[3px] focus-visible:ring-amber-500 focus-visible:ring-offset-2"
        >
          Weiter →
        </button>
      )}
    </div>
  );
}
