import { readFileSync } from "node:fs";
import { join } from "node:path";

import { tokens } from "@/theme/tokens";

// Les valeurs de l'app doivent rester celles du site (FR-030a, R7).
const css = readFileSync(join(__dirname, "../../../app/globals.css"), "utf8");
// Seul le thème clair (`:root`) compte : l'app n'a pas de mode sombre.
const root = css.slice(css.indexOf(":root"), css.indexOf(".dark {"));

function cssVar(name: string, source = root): string {
  const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(source);
  if (!match) throw new Error(`--${name} absent de globals.css`);
  return match[1].trim();
}

test("colours are those of app/globals.css", () => {
  expect(tokens.colors.giftBlue).toBe(cssVar("gift-blue"));
  expect(tokens.colors.giftRed).toBe(cssVar("gift-red"));
  expect(tokens.colors.giftYellow).toBe(cssVar("gift-yellow"));
  expect(tokens.colors.background).toBe(cssVar("background"));
  expect(tokens.colors.muted).toBe(cssVar("muted"));
  expect(tokens.colors.destructive).toBe(cssVar("destructive"));
  expect(cssVar("muted-foreground")).toBe("oklch(0.4 0 0)");
});

test("border, shadow, radius and weights are those of app/globals.css", () => {
  expect(cssVar("shadow")).toBe(`${tokens.shadowOffset}px ${tokens.shadowOffset}px 0px 0px var(--border)`);
  expect(cssVar("radius-base", css)).toBe(`${tokens.radius}px`);
  expect(cssVar("font-weight-base", css)).toBe(String(tokens.fontWeight.base));
  expect(cssVar("font-weight-heading", css)).toBe(String(tokens.fontWeight.heading));
  expect(tokens.borderWidth).toBe(2);
});
