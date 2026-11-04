// App icon and splash, drawn with the geometry of components/site/gift-mark.tsx
// and the default colors of a list (src/domain/theme.ts).
// Usage: node mobile/scripts/make-icons.mjs (sharp comes from the site's dependencies).
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "../assets/images");
const theme = { primary: "#1e60ff", accent: "#ff2d2d", highlight: "#ffd700", background: "#e8f0ff" };

function gift({ primary, accent, highlight }, stroke = "#000") {
  return `
    <rect x="30" y="44" width="72" height="18" rx="4" fill="${accent}" stroke="${stroke}" stroke-width="4"/>
    <rect x="36" y="62" width="60" height="42" rx="4" fill="${primary}" stroke="${stroke}" stroke-width="4"/>
    <rect x="60" y="44" width="12" height="60" fill="${highlight}" stroke="${stroke}" stroke-width="3.5"/>
    <ellipse cx="54" cy="38" rx="12" ry="9" fill="${highlight}" stroke="${stroke}" stroke-width="3.5"/>
    <ellipse cx="78" cy="38" rx="12" ry="9" fill="${highlight}" stroke="${stroke}" stroke-width="3.5"/>
    <circle cx="66" cy="40" r="5" fill="${highlight}" stroke="${stroke}" stroke-width="3"/>
    <path d="M80 80c0-3.5 2.8-6 5.5-6 1.8 0 3.2.9 4.5 2.4 1.3-1.5 2.7-2.4 4.5-2.4 2.7 0 5.5 2.5 5.5 6 0 5.5-10 11-10 11s-10-5.5-10-11z"
      fill="${accent}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>`;
}

const frame = `
  <rect x="12" y="12" width="116" height="116" rx="24" fill="#000"/>
  <rect x="6" y="6" width="116" height="116" rx="24" fill="#fff" stroke="#000" stroke-width="4"/>`;

/** The framed gift (viewBox 136) placed in the center of a `size` square, at scale `scale`. */
function svg(size, { background, scale, framed = true, colors = theme, stroke }) {
  const s = (size * scale) / 136;
  const offset = (size - 136 * s) / 2;
  const bg = background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : "";
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bg}
    <g transform="translate(${offset} ${offset}) scale(${s})">${framed ? frame : ""}${gift(colors, stroke)}</g></svg>`);
}

await mkdir(out, { recursive: true });
const files = {
  // iOS: no transparency; the site's frame on the app's background.
  "icon.png": svg(1024, { background: theme.background, scale: 0.78 }),
  // Android: foreground in the safe zone (66 %), background in app.config.ts.
  "android-icon-foreground.png": svg(1024, { scale: 0.6 }),
  "android-icon-monochrome.png": svg(1024, {
    scale: 0.6,
    framed: false,
    colors: { primary: "#000", accent: "#000", highlight: "#000" },
    stroke: "#000",
  }),
  "splash-icon.png": svg(512, { scale: 0.9 }),
};
for (const [name, input] of Object.entries(files)) {
  await sharp(input).png().toFile(path.join(out, name));
  console.log(name);
}
