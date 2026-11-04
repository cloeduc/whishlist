import { createContext, useContext, useMemo, type ReactNode } from "react";

// Same rules as the site: default colors, invalid values ignored, red darkened for white text.
import { darkenForWhiteText, resolveTheme, type WishlistTheme } from "../../../src/domain/theme";
import { tokens } from "./tokens";

/** Colors used by the components; the equivalent of the site's CSS variables. */
export type Palette = {
  /** `--main`: primary button, active tab, default badge. */
  main: string;
  /** `--highlight`: stars, yellow badge, ribbon. */
  highlight: string;
  /** `--destructive`. */
  destructive: string;
  /** `--background`. */
  background: string;
  /** Gift colors. */
  gift: { primary: string; accent: string; highlight: string };
};

const sitePalette: Palette = {
  main: tokens.colors.giftBlue,
  highlight: tokens.colors.giftYellow,
  destructive: tokens.colors.destructive,
  background: tokens.colors.background,
  gift: { primary: tokens.colors.giftBlue, accent: tokens.colors.giftRed, highlight: tokens.colors.giftYellow },
};

/** Like the site's `themeToCssVars`: a list's theme replaces blue, red, yellow and background. */
export function paletteFor(theme: Partial<WishlistTheme> | null | undefined): Palette {
  const resolved = resolveTheme(theme);
  return {
    main: resolved.primary,
    highlight: resolved.highlight,
    destructive: darkenForWhiteText(resolved.accent),
    background: resolved.background,
    gift: { primary: resolved.primary, accent: resolved.accent, highlight: resolved.highlight },
  };
}

const PaletteContext = createContext<Palette>(sitePalette);

/** Equivalent of `WishlistThemeScope`: the screens of a list take its colors (FR-031). */
export function ListThemeProvider({
  theme,
  children,
}: {
  theme: Partial<WishlistTheme> | null | undefined;
  children: ReactNode;
}) {
  const palette = useMemo(() => paletteFor(theme), [theme]);
  return <PaletteContext.Provider value={palette}>{children}</PaletteContext.Provider>;
}

export function useTheme(): Palette {
  return useContext(PaletteContext);
}
