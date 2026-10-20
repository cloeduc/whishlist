"use client";

import { GiftMark } from "@/components/site/gift-mark";
import { useWishlistTheme } from "@/components/site/wishlist-theme-scope";
import { cn } from "@/lib/utils";

/** Cadeau header qui suit le thème live du scope. */
export function LiveGiftMark({ className }: { className?: string }) {
  const { theme } = useWishlistTheme();
  return <GiftMark theme={theme} className={cn(className)} />;
}
