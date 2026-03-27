"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { LessonImage } from "@/types/lesson";
import { trackEvent } from "@/lib/analytics";

interface SequenceViewerProps {
  sequence: LessonImage[];
  onComplete: () => void;
  lessonId?: string;
}

export default function SequenceViewer({ sequence, onComplete, lessonId }: SequenceViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    void trackEvent({
      lesson_id: lessonId,
      step_type: "sequence_view",
      step_index: currentIndex,
    });
  }, [currentIndex, lessonId]);

  const current = sequence[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === sequence.length - 1;

  const goNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (!isFirst) setCurrentIndex((i) => i - 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    setTouchStartX(null);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-4">
      <div className="flex gap-2 mb-6" role="tablist" aria-label="Fortschritt">
        {sequence.map((_, i) => (
          <div
            key={i}
            role="tab"
            aria-selected={i === currentIndex}
            className={`w-3 h-3 rounded-full transition-colors ${
              i === currentIndex ? "bg-amber-500" : "bg-gray-300"
            }`}
          />
        ))}
      </div>

      <div
        className="relative w-full aspect-square rounded-2xl overflow-hidden bg-amber-50"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={current.src}
          alt={current.alt}
          fill
          className="object-cover"
          priority
        />
      </div>

      <p className="mt-4 text-2xl font-semibold text-gray-800">{current.label}</p>

      <div className="flex items-center gap-6 mt-6">
        <button
          onClick={goPrev}
          disabled={isFirst}
          aria-label="Zurück"
          className="w-20 h-20 rounded-full bg-gray-100 text-gray-700 text-3xl flex items-center justify-center disabled:opacity-30 active:bg-gray-200 transition-colors"
        >
          ←
        </button>
        <button
          onClick={goNext}
          aria-label={isLast ? "Quiz starten" : "Weiter"}
          className="w-20 h-20 rounded-full bg-amber-500 text-white text-3xl flex items-center justify-center active:bg-amber-600 transition-colors"
        >
          {isLast ? "✓" : "→"}
        </button>
      </div>
    </div>
  );
}
