"use client";

import { useState, useEffect } from "react";
import { isDryrun } from "@/lib/analytics";

export default function DryrunBanner() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isDryrun());
  }, []);

  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 border-b border-yellow-300 text-yellow-800 text-sm text-center py-1 px-4">
      🧪 Testmodus
    </div>
  );
}
