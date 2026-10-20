"use client";

import { StarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { parsePriority, PRIORITY_MAX } from "@/src/domain/priority";

export function PriorityStars({
  value,
  className = "",
}: {
  value: string | null | undefined;
  className?: string;
}) {
  const { t } = useTranslation("public");
  const n = parsePriority(value);
  if (!n) return null;
  const label = t("wishLevel", { rating: n, max: PRIORITY_MAX });
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-flex items-center gap-0.5 text-highlight ${className}`}
    >
      {Array.from({ length: n }, (_, i) => (
        <StarIcon key={i} className="size-3.5 fill-current" aria-hidden />
      ))}
    </span>
  );
}
