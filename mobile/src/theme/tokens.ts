// Design values of the site (app/globals.css, design-reference.md).
// __tests__/theme/tokens.test.ts checks that they stay identical to globals.css.
export const tokens = {
  colors: {
    giftBlue: "#1a56e8",
    giftRed: "#ff2d2d",
    giftYellow: "#ffd700",
    background: "#e8f0ff",
    muted: "#d6e4ff",
    destructive: "#c41212",
    white: "#ffffff",
    black: "#000000",
    /** `--muted-foreground: oklch(0.4 0 0)`. */
    mutedForeground: "#4d4d4d",
  },
  /** `border-2`. */
  borderWidth: 2,
  /** `--shadow: 4px 4px 0px 0px`. */
  shadowOffset: 4,
  /** `--radius-base: 5px`. */
  radius: 5,
  /** Frame of the gift illustration: rx 24 on a 116 square ≈ 18 %. */
  giftFrameRatio: 24 / 116,
  fontSize: { xs: 12, sm: 14, base: 16, lg: 20, "2xl": 24, title: 30 },
  fontWeight: { base: 500, heading: 700 },
  /** Line height of content paragraphs (`leading-7`). */
  lineHeight: { relaxed: 28 },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24 },
  /** Heights of the site's buttons: xs 32, sm 36, default 40, lg 44. */
  controlHeight: { xs: 32, sm: 36, default: 40, lg: 44 },
  /** Minimum touch target (accessibility). */
  touchTarget: 44,
} as const;

/** Families loaded by `useAppFonts` (Geist 500 and 700). */
export const fonts = {
  base: "Geist_500Medium",
  heading: "Geist_700Bold",
} as const;
