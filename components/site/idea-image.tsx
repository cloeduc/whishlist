"use client";

import { GiftIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Idea image; when it does not load, a neutral box of the same size instead of the browser's alt text. */
export function IdeaImage({
  src,
  alt,
  className,
  lazy = false,
}: {
  src: string;
  alt: string;
  className?: string;
  lazy?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const ref = useRef<HTMLImageElement>(null);

  // An image that failed before hydration fired its error event without React listening.
  useEffect(() => {
    const image = ref.current;
    if (image?.complete && image.naturalWidth === 0) setFailedSrc(src);
  }, [src]);

  const box = cn("shrink-0 rounded-base border-2 border-border shadow-shadow", className);
  if (failedSrc === src) {
    return (
      <div role="img" aria-label={alt} className={cn(box, "flex items-center justify-center bg-secondary-background")}>
        <GiftIcon aria-hidden className="size-1/3 text-muted-foreground" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={cn(box, "object-cover")}
      loading={lazy ? "lazy" : undefined}
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
    />
  );
}
