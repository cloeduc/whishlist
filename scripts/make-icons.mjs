// Website icons, from the gift drawing shared with the app (scripts/gift-icon.mjs).
// Next announces the app/ files on every page (favicon, icon, apple-icon file conventions).
// Usage: node scripts/make-icons.mjs
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { svg } from "./gift-icon.mjs";

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "../app");

// Tab icons: the frame alone, filling the square, on a transparent background.
const TAB_SCALE = 0.95;
const tabIcon = (size) => svg(size, { scale: TAB_SCALE });
const tabPng = (size) => sharp(tabIcon(size)).png().toBuffer();

/** An .ico file holding PNG images (one ICONDIRENTRY per size). */
async function ico(sizes) {
  const images = await Promise.all(sizes.map(tabPng));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(images[i].length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += images[i].length;
  });
  return Buffer.concat([header, ...images]);
}

const files = {
  "favicon.ico": () => ico([16, 32, 48]),
  "icon1.svg": async () => tabIcon(136),
  "icon2.png": () => tabPng(192),
};
for (const [name, make] of Object.entries(files)) {
  await writeFile(path.join(out, name), await make());
  console.log(name);
}
