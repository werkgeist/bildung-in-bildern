import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white px-4 text-center">
      <h1 className="text-4xl font-bold text-amber-700 mb-2">Bildung in Bildern</h1>
      <p className="text-xl text-gray-500 mb-12">Lernen mit Bildern</p>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          href="/lesson/schmetterling-lebenszyklus"
          className="inline-flex items-center justify-center px-10 py-5 bg-amber-500 text-white text-2xl font-bold rounded-2xl active:bg-amber-600 transition-colors min-h-[80px]"
        >
          🦋 Der Schmetterling
        </Link>
        <Link
          href="/lesson/wasserkreislauf-einfach"
          className="inline-flex items-center justify-center px-10 py-5 bg-sky-500 text-white text-2xl font-bold rounded-2xl active:bg-sky-600 transition-colors min-h-[80px]"
        >
          💧 Der Wasserkreislauf
        </Link>
      </div>
    </main>
  );
}
