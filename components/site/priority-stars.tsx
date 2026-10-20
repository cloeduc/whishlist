import { StarIcon } from "lucide-react";
import { parsePriority, PRIORITY_MAX } from "@/src/domain/priority";

export function PriorityStars({
  value,
  className = "",
}: {
  value: string | null | undefined;
  className?: string;
}) {
  const n = parsePriority(value);
  if (!n) return null;
  return (
    <span
      role="img"
      aria-label={`${n} sur ${PRIORITY_MAX}`}
      title={`${n} / ${PRIORITY_MAX}`}
      className={`inline-flex items-center gap-0.5 text-main ${className}`}
    >
      {Array.from({ length: n }, (_, i) => (
        <StarIcon key={i} className="size-3.5 fill-current" aria-hidden />
      ))}
    </span>
  );
}
