import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

// Website icons written by scripts/make-icons.mjs (feature 019): Next announces the
// app/ files on every page, the old JPEG images are gone.
const root = path.resolve(import.meta.dirname, "../..");
const read = (file: string) => readFileSync(path.join(root, file));

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Width, height and color type from the IHDR chunk of a PNG. */
function pngHeader(png: Buffer) {
  assert.ok(png.subarray(0, 8).equals(PNG_SIGNATURE), "not a PNG");
  assert.equal(png.toString("ascii", 12, 16), "IHDR");
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20), colorType: png.readUInt8(25) };
}

describe("website tab icons", () => {
  it("serves a vector icon without an opaque background", () => {
    const svg = read("app/icon1.svg").toString("utf8");
    assert.ok(svg.startsWith("<svg"));
    assert.ok(!svg.includes('<rect width="'), "a full-size background rect would make the tab icon opaque");
  });

  it("serves a 192 px transparent PNG for browsers without SVG icons", () => {
    assert.deepEqual(pngHeader(read("app/icon2.png")), { width: 192, height: 192, colorType: 6 });
  });

  it("serves /favicon.ico with 16, 32 and 48 px PNG images", () => {
    const ico = read("app/favicon.ico");
    assert.equal(ico.readUInt16LE(0), 0);
    assert.equal(ico.readUInt16LE(2), 1);
    const count = ico.readUInt16LE(4);
    const sizes = [];
    for (let i = 0; i < count; i++) {
      const entry = 6 + i * 16;
      const size = ico.readUInt8(entry);
      const length = ico.readUInt32LE(entry + 8);
      const offset = ico.readUInt32LE(entry + 12);
      const header = pngHeader(ico.subarray(offset, offset + length));
      assert.equal(header.width, size);
      assert.equal(header.height, size);
      sizes.push(size);
    }
    assert.deepEqual(sizes, [16, 32, 48]);
  });

  it("no longer ships the old JPEG icons", () => {
    assert.equal(existsSync(path.join(root, "public/favicon.png")), false);
    assert.equal(existsSync(path.join(root, "app/icon.png")), false);
  });

  it("lets Next announce the icon files instead of layout metadata", () => {
    const layout = read("app/layout.tsx").toString("utf8");
    assert.ok(!layout.includes("icons:"));
    assert.ok(!layout.includes("favicon.png"));
  });
});
