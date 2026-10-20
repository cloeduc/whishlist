/** Couleurs d'une wishlist — alignées sur le favicon cadeau. */
export interface WishlistTheme {
  /** Corps du cadeau / boutons principaux */
  primary: string;
  /** Couvercle / destructive */
  accent: string;
  /** Ruban / étoiles / badges */
  highlight: string;
  /** Fond de la page publique */
  background: string;
}

export const DEFAULT_WISHLIST_THEME: WishlistTheme = {
  primary: "#1e60ff",
  accent: "#ff2d2d",
  highlight: "#ffd700",
  background: "#e8f0ff",
};

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isHexColor(value: string): boolean {
  return HEX.test(value.trim());
}

function normalizeHex(value: string): string {
  const raw = value.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(raw)) {
    const [, r, g, b] = raw;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return raw;
}

/** Merge partiel + defaults ; ignore les valeurs invalides. */
export function resolveTheme(partial?: Partial<WishlistTheme> | null): WishlistTheme {
  const next: WishlistTheme = { ...DEFAULT_WISHLIST_THEME };
  if (!partial) return next;
  for (const key of Object.keys(DEFAULT_WISHLIST_THEME) as (keyof WishlistTheme)[]) {
    const value = partial[key];
    if (typeof value === "string" && isHexColor(value)) {
      next[key] = normalizeHex(value);
    }
  }
  return next;
}

/** Variables CSS à injecter sur le wrapper de la page publique / preview. */
export function themeToCssVars(theme: WishlistTheme): Record<string, string> {
  return {
    "--gift-blue": theme.primary,
    "--gift-red": theme.accent,
    "--gift-yellow": theme.highlight,
    "--background": theme.background,
    "--primary": theme.primary,
    "--ring": theme.primary,
    "--main": theme.primary,
    "--destructive": theme.accent,
    "--accent": theme.highlight,
    "--secondary": theme.highlight,
    "--highlight": theme.highlight,
    "--chart-1": theme.highlight,
    "--chart-2": theme.primary,
    "--chart-3": theme.accent,
    "--sidebar-primary": theme.primary,
    "--sidebar-accent": theme.highlight,
  };
}

export function parseThemeForm(input: {
  primary?: string | null;
  accent?: string | null;
  highlight?: string | null;
  background?: string | null;
}): { ok: true; theme: WishlistTheme } | { ok: false; error: string } {
  const keys = ["primary", "accent", "highlight", "background"] as const;
  const partial: Partial<WishlistTheme> = {};
  for (const key of keys) {
    const raw = (input[key] ?? "").trim();
    if (!raw) {
      partial[key] = DEFAULT_WISHLIST_THEME[key];
      continue;
    }
    if (!isHexColor(raw)) return { ok: false, error: "themeColorInvalid" };
    partial[key] = normalizeHex(raw);
  }
  return { ok: true, theme: resolveTheme(partial) };
}
