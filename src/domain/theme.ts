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

function channels(hex: string): [number, number, number] {
  const n = Number.parseInt(normalizeHex(hex).slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relLuminance(hex: string): number {
  const lin = (channel: number) => {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = channels(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relLuminance(foreground), relLuminance(background));
  const darker = Math.min(relLuminance(foreground), relLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

/** Assombrit jusqu'à un texte blanc ≥ 4,5:1. La couleur d'origine reste stockée. */
export function darkenForWhiteText(hex: string, min = 4.5): string {
  let [r, g, b] = channels(hex);
  let current = normalizeHex(hex);
  for (let i = 0; i < 24; i++) {
    if (contrastRatio("#ffffff", current) >= min) return current;
    r = Math.round(r * 0.82);
    g = Math.round(g * 0.82);
    b = Math.round(b * 0.82);
    current = `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  }
  return current;
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
    "--destructive": darkenForWhiteText(theme.accent),
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
  const theme = resolveTheme(partial);
  if (contrastRatio("#ffffff", theme.primary) < 4.5) return { ok: false, error: "themeContrast" };
  if (contrastRatio("#000000", theme.background) < 4.5) return { ok: false, error: "themeContrast" };
  return { ok: true, theme };
}
