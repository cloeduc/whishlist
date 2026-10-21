"use client";

import { StarIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PRIORITY_MAX } from "@/src/domain/priority";
import { cn } from "@/lib/utils";

export function PriorityStarPicker({
  id,
  name = "priority",
  value,
  onChange,
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation("list");
  const selected = value && /^[1-5]$/.test(value) ? Number(value) : 0;
  const [hover, setHover] = useState(0);
  const shown = hover || selected;

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={t("form.priority")}
      className="flex h-10 items-center gap-0.5"
      onMouseLeave={() => setHover(0)}
    >
      <input type="hidden" name={name} value={value} />
      {Array.from({ length: PRIORITY_MAX }, (_, i) => {
        const n = i + 1;
        const filled = n <= shown;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={selected === n}
            aria-label={t("form.priorityStar", { count: n, max: PRIORITY_MAX })}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-base border-2 border-transparent transition-colors hover:border-border",
              filled ? "text-highlight" : "text-muted-foreground",
            )}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(selected === n ? "" : String(n))}
          >
            <StarIcon
              className={cn("size-5", filled && "fill-current stroke-foreground")}
              strokeWidth={filled ? 1.75 : 1.5}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}
