import { GiftMark } from "@/components/site/gift-mark";
import type { WishlistTheme } from "@/src/domain/theme";
import { cn } from "@/lib/utils";

/** Illustration wishlist : image custom ou cadeau SVG aux couleurs du thème. */
export function WishlistCover({
  coverImageUrl,
  theme,
  className,
  size = "md",
}: {
  coverImageUrl: string | null | undefined;
  theme: WishlistTheme;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "lg" ? "size-36 sm:size-40" : size === "sm" ? "size-20" : "size-28 sm:size-32";

  if (coverImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverImageUrl}
        alt=""
        className={cn(
          box,
          "shrink-0 rounded-base border-2 border-border object-cover shadow-shadow",
          className,
        )}
        referrerPolicy="no-referrer"
      />
    );
  }

  return <GiftMark theme={theme} className={cn(box, className)} />;
}
