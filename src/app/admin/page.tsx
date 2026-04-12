"use client";

import { useState } from "react";
import Link from "next/link";
import { reset as resetProgress, getAllProgress } from "@/hooks/useProgress";
import { clearLogs, getLogs } from "@/lib/logging";

const ITEM_BANK_KEY = "bib-item-bank";

function getItemBankCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(ITEM_BANK_KEY);
    return raw ? Object.keys(JSON.parse(raw)).length : 0;
  } catch {
    return 0;
  }
}

function clearItemBank(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ITEM_BANK_KEY);
}

export default function AdminPage() {
  const [confirmed, setConfirmed] = useState(false);
  const [done, setDone] = useState(false);

  const progressCount = Object.keys(getAllProgress()).length;
  const logCount = getLogs().length;
  const itemBankCount = getItemBankCount();
  const hasData = progressCount > 0 || logCount > 0 || itemBankCount > 0;

  function handleReset() {
    resetProgress();
    clearLogs();
    clearItemBank();
    setDone(true);
    setConfirmed(false);
  }

  return (
    <main className="flex flex-col items-center min-h-screen bg-white px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            href="/"
            className="flex items-center justify-center w-11 h-11 rounded-full bg-amber-50 active:bg-amber-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 transition-colors motion-reduce:transition-none"
            aria-label="Zurück zur Startseite"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M13 16L7 10L13 4"
                stroke="#92400e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <div className="flex-1 flex flex-col items-center">
            <h1 className="text-2xl font-bold text-amber-700">Admin</h1>
          </div>
          <div className="w-11" aria-hidden="true" />
        </div>

        {/* Data summary */}
        <section className="border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="text-base font-bold text-gray-800 mb-3">
            Gespeicherte Daten
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Alle Daten liegen nur in diesem Browser.
          </p>
          <ul className="flex flex-col gap-2 text-sm">
            <li className="flex justify-between">
              <span className="text-gray-600">Lektionsfortschritt</span>
              <span className="font-medium text-gray-800">
                {progressCount} {progressCount === 1 ? "Lektion" : "Lektionen"}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">Wiederholungs-Karten</span>
              <span className="font-medium text-gray-800">
                {itemBankCount} {itemBankCount === 1 ? "Karte" : "Karten"}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">Antwort-Logs</span>
              <span className="font-medium text-gray-800">
                {logCount} {logCount === 1 ? "Eintrag" : "Einträge"}
              </span>
            </li>
          </ul>
        </section>

        {/* Reset section */}
        {done ? (
          <div
            className="rounded-2xl bg-green-50 border-2 border-green-200 p-5 text-center"
            role="status"
          >
            <p className="text-green-800 font-bold text-lg mb-1">
              Alles zurückgesetzt
            </p>
            <p className="text-green-600 text-sm">
              Der Browser ist bereit für eine neue Session.
            </p>
          </div>
        ) : !hasData ? (
          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 text-center">
            <p className="text-gray-500 text-sm">Keine Daten vorhanden.</p>
          </div>
        ) : !confirmed ? (
          <button
            onClick={() => setConfirmed(true)}
            className="w-full bg-red-50 hover:bg-red-100 active:bg-red-200 border-2 border-red-200 text-red-700 text-lg font-bold rounded-2xl px-8 py-5 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300 focus-visible:ring-offset-2"
          >
            Alle Daten löschen
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-center text-sm text-gray-600 font-medium">
              Wirklich alles löschen?
            </p>
            <button
              onClick={handleReset}
              className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-lg font-bold rounded-2xl px-8 py-5 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300 focus-visible:ring-offset-2"
            >
              Ja, alles löschen
            </button>
            <button
              onClick={() => setConfirmed(false)}
              className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 text-base font-medium rounded-2xl px-8 py-4 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-300 focus-visible:ring-offset-2"
            >
              Abbrechen
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
