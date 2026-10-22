"use client";

import { useEffect, useState } from "react";
import { ANALYTICS_OPTOUT_KEY } from "@/src/site/analytics-public";

export function AnalyticsOptOut({ offLabel, onLabel }: { offLabel: string; onLabel: string }) {
  const [off, setOff] = useState(false);

  useEffect(() => {
    try {
      setOff(localStorage.getItem(ANALYTICS_OPTOUT_KEY) === "1");
    } catch {
      setOff(false);
    }
  }, []);

  function toggle() {
    const next = !off;
    try {
      if (next) localStorage.setItem(ANALYTICS_OPTOUT_KEY, "1");
      else localStorage.removeItem(ANALYTICS_OPTOUT_KEY);
    } catch {
      return;
    }
    setOff(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={off}
      className="inline-flex min-h-6 items-center rounded-sm font-medium text-foreground underline underline-offset-4 hover:no-underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
    >
      {off ? onLabel : offLabel}
    </button>
  );
}
