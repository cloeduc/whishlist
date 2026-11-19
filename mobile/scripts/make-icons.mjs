// App icon and splash, from the gift drawing shared with the website (scripts/gift-icon.mjs).
// Usage: node mobile/scripts/make-icons.mjs (sharp comes from the site's dependencies).
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { svg, theme } from "../../scripts/gift-icon.mjs";

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "../assets/images");
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
