"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDueCount } from "@/data/item-bank";

const MIN_ITEMS_TO_SHOW = 3;

export default function ReviewCard() {
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    setDueCount(getDueCount());
  }, []);

  if (dueCount < MIN_ITEMS_TO_SHOW) return null;

  return (
    <div role="listitem" className="flex flex-col">
      <Link
        href="/wiederholung"
        className="group flex flex-col rounded-2xl overflow-hidden bg-violet-50 border-2 border-violet-200 active:border-violet-400 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
        aria-label={`Wiederholung: ${dueCount} Fragen fällig`}
      >
        <div className="relative w-full aspect-[4/3] bg-violet-100 flex items-center justify-center">
          <span className="text-6xl" aria-hidden>🔄</span>
        </div>
        <div className="flex flex-col gap-1 p-3 min-h-[80px] justify-center">
          <p className="text-base font-bold text-violet-800 leading-tight">
            Wiederholung
          </p>
          <p className="text-sm text-violet-600">
            {dueCount} Frage{dueCount !== 1 ? "n" : ""} fällig
          </p>
        </div>
      </Link>
    </div>
  );
}
