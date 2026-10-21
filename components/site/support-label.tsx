import type { ReactNode } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function SupportHeart({ className }: { className?: string }) {
  return (
    <Heart
      className={cn("size-4 shrink-0 fill-destructive text-foreground", className)}
      strokeWidth={3.5}
      aria-hidden
    />
  );
}

/** Libellé « Soutenir… » toujours précédé du petit cœur rouge. */
export function SupportLabel({
  children,
  className,
  heartClassName,
}: {
  children: ReactNode;
  className?: string;
  heartClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <SupportHeart className={heartClassName} />
      <span>{children}</span>
    </span>
  );
}
