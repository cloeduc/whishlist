"use client";

import { GiftMark } from "@/components/site/gift-mark";
import { useWishlistTheme } from "@/components/site/wishlist-theme-scope";
import { cn } from "@/lib/utils";

/** Header gift that follows the scope's live theme. */
export function LiveGiftMark({ className }: { className?: string }) {
  const { theme } = useWishlistTheme();
  return <GiftMark theme={theme} className={cn(className)} />;
}
