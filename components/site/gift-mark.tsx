import type { WishlistTheme } from "@/src/domain/theme";
import { DEFAULT_WISHLIST_THEME } from "@/src/domain/theme";
import { cn } from "@/lib/utils";

/** Cadeau SVG recolorable — fond blanc + ombre néo-brutale intégrée (un seul calque). */
export function GiftMark({
  theme = DEFAULT_WISHLIST_THEME,
  className,
  title,
}: {
  theme?: WishlistTheme;
  className?: string;
  title?: string;
}) {
  const { primary, accent, highlight } = theme;
  return (
    <svg
      viewBox="0 0 136 136"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn("shrink-0", className)}
    >
      {title ? <title>{title}</title> : null}
      {/* Ombre brute décalée */}
      <rect x="12" y="12" width="116" height="116" rx="24" fill="#000" />
      {/* Fond blanc */}
      <rect x="6" y="6" width="116" height="116" rx="24" fill="#fff" stroke="#000" strokeWidth="4" />
      {/* Couvercle */}
      <rect x="30" y="44" width="72" height="18" rx="4" fill={accent} stroke="#000" strokeWidth="4" />
      {/* Corps */}
      <rect x="36" y="62" width="60" height="42" rx="4" fill={primary} stroke="#000" strokeWidth="4" />
      {/* Ruban vertical */}
      <rect x="60" y="44" width="12" height="60" fill={highlight} stroke="#000" strokeWidth="3.5" />
      {/* Nœud */}
      <ellipse cx="54" cy="38" rx="12" ry="9" fill={highlight} stroke="#000" strokeWidth="3.5" />
      <ellipse cx="78" cy="38" rx="12" ry="9" fill={highlight} stroke="#000" strokeWidth="3.5" />
      <circle cx="66" cy="40" r="5" fill={highlight} stroke="#000" strokeWidth="3" />
      {/* Cœur */}
      <path
        d="M80 80c0-3.5 2.8-6 5.5-6 1.8 0 3.2.9 4.5 2.4 1.3-1.5 2.7-2.4 4.5-2.4 2.7 0 5.5 2.5 5.5 6 0 5.5-10 11-10 11s-10-5.5-10-11z"
        fill={accent}
        stroke="#000"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
