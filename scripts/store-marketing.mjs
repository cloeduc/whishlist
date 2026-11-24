// Marketing store screenshots: each raw Maestro screenshot inside a phone, on the brand's blue gradient,
// with a headline whose accent word is in serif italic. Rendered from HTML by Playwright, at the exact
// App Store size (6.9", 1320×2868), without transparency.
//   node scripts/store-marketing.mjs [--in tmp/store-screenshots] [--out tmp/store-marketing] [--only 01] [--langs fr,en]
// Reads <in>/ios/<fr-FR|en-US>/<shot>.png and writes <out>/ios/<fr-FR|en-US>/<id>.png (fastlane deliver).
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, index, all) => (arg.startsWith("--") ? [...pairs, [arg.slice(2), all[index + 1]]] : pairs), []),
);
const input = path.resolve(args.in ?? "tmp/store-screenshots");
const output = path.resolve(args.out ?? "tmp/store-marketing");
const langs = (args.langs ?? "fr,en").split(",");
const STORE = { fr: "fr-FR", en: "en-US" };
const { screens } = JSON.parse(await readFile(path.resolve("scripts/store-marketing.json"), "utf8"));
const icon = (await readFile(path.resolve("mobile/assets/images/icon.png"))).toString("base64");

const WIDTH = 1320;
const HEIGHT = 2868;

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
/** `*word*` → the accent in serif italic; a line break stays one. */
const headline = (text) => escape(text).replace(/\*(.+?)\*/g, "<em>$1</em>").replaceAll("\n", "<br>");

const css = `
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    position: relative; font-family: "Plus Jakarta Sans", sans-serif; color: #fff;
    background: linear-gradient(168deg, #1240b8 0%, #1a56e8 46%, #0b2a7a 100%);
  }
  .glow { position: absolute; border-radius: 50%; filter: blur(40px); }
  .glow.yellow { width: 1500px; height: 1100px; right: -620px; top: -520px; background: radial-gradient(closest-side, rgba(255,215,0,.62), rgba(255,215,0,0)); }
  .glow.red { width: 1500px; height: 1500px; left: -760px; bottom: -560px; background: radial-gradient(closest-side, rgba(255,45,45,.55), rgba(255,45,45,0)); }
  .glow.light { width: 760px; height: 760px; right: -240px; top: 1240px; background: radial-gradient(closest-side, rgba(127,166,255,.45), rgba(127,166,255,0)); }
  .copy { position: absolute; left: 110px; right: 110px; top: 200px; }
  .kicker { display: flex; align-items: center; gap: 22px; font: 700 36px/1 "Inter", sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #ffd700; }
  .kicker img { width: 72px; height: 72px; border-radius: 18px; box-shadow: 0 6px 18px rgba(0,0,0,.25); }
  h1 { --size: 146px; margin-top: 48px; font-weight: 800; font-size: var(--size); line-height: 1.02; letter-spacing: -.035em; white-space: nowrap; }
  h1 em { display: inline; font: italic 400 calc(var(--size) * 1.15)/0.95 "Instrument Serif", serif; letter-spacing: -.01em; color: #ffd700; }
  .subhead { margin-top: 44px; font: 500 46px/1.35 "Inter", sans-serif; color: rgba(255,255,255,.86); max-width: 1040px; }
  .device {
    position: absolute; left: 160px; top: 1010px; width: 1000px; height: 2088px; border-radius: 150px; padding: 34px;
    background: linear-gradient(150deg, #3a3650, #16141f 40%, #2b2838);
    box-shadow: 0 60px 120px rgba(4,10,40,.55), inset 0 0 0 4px rgba(255,255,255,.08);
  }
  .screen { position: relative; width: 100%; height: 100%; border-radius: 118px; overflow: hidden; background: #e8f0ff; }
  .screen img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: top; }
  .device.tilt { width: 920px; height: 1921px; border-radius: 138px; padding: 31px; top: 1090px; }
  .device.tilt .screen { border-radius: 108px; }
  .device.callouts { width: 840px; height: 1754px; border-radius: 126px; padding: 29px; left: 240px; top: 1080px; }
  .device.callouts .screen { border-radius: 98px; }
  .device.callouts .screen::after { content: ""; position: absolute; inset: 0; background: rgba(11,42,122,.28); }
  /* Cards in the app's own style: white, black border, offset hard shadow. */
  .card {
    position: absolute; width: 780px; padding: 40px 44px; border-radius: 28px; background: #fff; color: #000;
    border: 5px solid #000; box-shadow: 12px 12px 0 #000; display: flex; flex-direction: column; gap: 22px;
  }
  .card.right { right: 64px; transform: rotate(2deg); }
  .card.left { left: 64px; transform: rotate(-2deg); }
  .card .row { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
  .card .title { font: 800 46px/1.15 "Plus Jakarta Sans", sans-serif; letter-spacing: -.01em; }
  .card .body { font: 500 36px/1.35 "Inter", sans-serif; color: #3a3a46; overflow-wrap: anywhere; }
  .card .badge { flex: none; padding: 10px 22px; border: 4px solid #000; border-radius: 16px; background: #ffd700; font: 800 38px/1 "Plus Jakarta Sans", sans-serif; }
  .card .button {
    align-self: flex-start; padding: 24px 36px; border: 4px solid #000; border-radius: 16px; background: #1a56e8; color: #fff;
    box-shadow: 7px 7px 0 #000; font: 700 36px/1 "Inter", sans-serif;
  }
  .card .rows { display: flex; flex-direction: column; gap: 18px; }
  .card .member { display: flex; align-items: center; gap: 20px; font: 700 40px/1 "Inter", sans-serif; }
  .card .member .avatar { width: 76px; height: 76px; border: 4px solid #000; border-radius: 50%; display: grid; place-items: center; background: #ffd700; font: 800 36px/1 "Plus Jakarta Sans", sans-serif; }
  .card .member:nth-child(2) .avatar { background: #ff2d2d; color: #fff; }
  .card .member .role { margin-left: auto; padding: 8px 18px; border: 3px solid #000; border-radius: 14px; font: 700 30px/1 "Inter", sans-serif; background: #e8f0ff; }
  .card .bar { height: 34px; border: 4px solid #000; border-radius: 18px; background: #e8f0ff; overflow: hidden; }
  .card .bar span { display: block; height: 100%; background: #ffd700; border-right: 4px solid #000; }
  .island { position: absolute; top: 34px; left: 50%; width: 294px; height: 85px; transform: translateX(-50%); border-radius: 50px; background: #000; }
`;

function card(c) {
  const head = c.badge
    ? `<div class="row"><div class="title">${escape(c.title)}</div><div class="badge">${escape(c.badge)}</div></div>`
    : `<div class="title">${escape(c.title)}</div>`;
  return `<div class="card ${c.at}" style="top:${c.top}px">${head}${
    c.progress ? `<div class="bar"><span style="width:${Math.round(c.progress * 100)}%"></span></div>` : ""
  }${c.body ? `<div class="body">${escape(c.body)}</div>` : ""}${
    c.rows
      ? `<div class="rows">${c.rows
          .map(([name, role]) => `<div class="member"><span class="avatar">${escape(name[0])}</span>${escape(name)}<span class="role">${escape(role)}</span></div>`)
          .join("")}</div>`
      : ""
  }${c.button ? `<div class="button">${escape(c.button)}</div>` : ""}</div>`;
}

/** hero: the phone upright; tilt: turned by `tilt` degrees, on the other side of its card; callouts: dimmed, under cards. */
function render(screen, lang, shot) {
  const text = screen[lang];
  let device = "device";
  let style = "";
  if (screen.layout === "tilt") {
    device += " tilt";
    style = `left:${screen.tilt < 0 ? 70 : 330}px; transform: rotate(${screen.tilt}deg);`;
  }
  if (screen.layout === "callouts") device += " callouts";
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=Inter:wght@500;700&family=Plus+Jakarta+Sans:wght@800&display=block" rel="stylesheet">
<style>${css}</style></head><body>
<div class="glow yellow"></div><div class="glow red"></div><div class="glow light"></div>
<div class="copy">
  <div class="kicker"><img src="data:image/png;base64,${icon}" alt="">${escape(text.kicker)}</div>
  <h1>${headline(text.headline)}</h1>
  <p class="subhead">${escape(text.subhead)}</p>
</div>
<div class="${device}" style="${style}"><div class="screen"><img src="data:image/png;base64,${shot}" alt=""><div class="island"></div></div></div>
${(text.cards ?? []).map(card).join("\n")}
</body></html>`;
}

// The installed Google Chrome when there is one, otherwise Playwright's own browser.
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
for (const lang of langs) {
  const folder = path.join(output, "ios", STORE[lang]);
  await mkdir(folder, { recursive: true });
  for (const screen of screens.filter((s) => !args.only || s.id === args.only)) {
    const shot = (await readFile(path.join(input, "ios", STORE[lang], `${screen.shot}.png`))).toString("base64");
    await page.setContent(render(screen, lang, shot), { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    // Each headline line on one line: the size shrinks until the widest line fits the copy's width.
    await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      const max = document.querySelector(".copy").clientWidth;
      let size = 146;
      while (h1.scrollWidth > max && size > 90) {
        size -= 2;
        h1.style.setProperty("--size", `${size}px`);
      }
    });
    const file = path.join(folder, `${screen.id}.png`);
    // Opaque PNG: the App Store refuses transparency.
    await page.screenshot({ path: file, omitBackground: false });
    console.log(file);
  }
}
await browser.close();
