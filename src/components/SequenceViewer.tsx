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
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="flex gap-2" role="tablist" aria-label="Fortschritt">
          {sequence.map((_, i) => (
            <div
              key={i}
              role="tab"
              aria-selected={i === currentIndex}
              className={`w-3 h-3 rounded-full transition-colors motion-reduce:transition-none ${
                i === currentIndex ? "bg-amber-500" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
        <p
          className="text-sm font-medium text-gray-500"
          aria-live="polite"
          aria-atomic="true"
        >
          Bild {currentIndex + 1} von {sequence.length}
        </p>
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

      <div className="flex items-center gap-4 mt-6 w-full">
        <button
          onClick={goPrev}
          disabled={isFirst}
          aria-label="Zurück"
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-100 text-gray-700 text-lg font-semibold disabled:opacity-30 active:bg-gray-200 transition-colors motion-reduce:transition-none"
        >
          <span aria-hidden="true">←</span>
          <span>Zurück</span>
        </button>
        <button
          onClick={goNext}
          aria-label={isLast ? "Quiz starten" : "Weiter"}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-amber-500 text-white text-lg font-semibold active:bg-amber-600 transition-colors motion-reduce:transition-none"
        >
          <span>{isLast ? "Quiz starten" : "Weiter"}</span>
          <span aria-hidden="true">{isLast ? "✓" : "→"}</span>
        </button>
      </div>
    </div>
  );
}
