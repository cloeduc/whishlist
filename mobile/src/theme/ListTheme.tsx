import { createContext, useContext, useMemo, type ReactNode } from "react";

// Mêmes règles que le site : couleurs par défaut, valeurs invalides ignorées, rouge assombri pour le texte blanc.
import { darkenForWhiteText, resolveTheme, type WishlistTheme } from "../../../src/domain/theme";
import { tokens } from "./tokens";

/** Couleurs utilisées par les composants ; l'équivalent des variables CSS du site. */
export type Palette = {
  /** `--main` : bouton principal, onglet actif, badge par défaut. */
  main: string;
  /** `--highlight` : étoiles, badge jaune, ruban. */
  highlight: string;
  /** `--destructive`. */
  destructive: string;
  /** `--background`. */
  background: string;
  /** Couleurs du cadeau. */
  gift: { primary: string; accent: string; highlight: string };
};

const sitePalette: Palette = {
  main: tokens.colors.giftBlue,
  highlight: tokens.colors.giftYellow,
  destructive: tokens.colors.destructive,
  background: tokens.colors.background,
  gift: { primary: tokens.colors.giftBlue, accent: tokens.colors.giftRed, highlight: tokens.colors.giftYellow },
};

/** Comme `themeToCssVars` du site : le thème d'une liste remplace bleu, rouge, jaune et fond. */
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

/** Équivalent de `WishlistThemeScope` : les écrans d'une liste prennent ses couleurs (FR-031). */
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
