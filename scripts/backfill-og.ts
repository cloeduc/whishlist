import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchOgImage } from "../src/domain/og-image";

async function main() {
  const file = process.env.WISHLIST_DATA_PATH ?? path.join(process.cwd(), "data", "wishlist.json");
  const doc = JSON.parse(await readFile(file, "utf8")) as {
    items: { name: string; url: string | null; imageUrl?: string | null }[];
  };

  const targets = doc.items.filter((item) => item.url && !item.imageUrl);
  console.log(`targets ${targets.length} / ${doc.items.length}`);

  let ok = 0;
  let fail = 0;
  for (const item of targets) {
    const img = await fetchOgImage(item.url!);
    if (img) {
      item.imageUrl = img;
      ok++;
      console.log("OK", item.name.slice(0, 48), "→", img.slice(0, 90));
    } else {
      fail++;
      console.log("NO", item.name.slice(0, 48), item.url!.slice(0, 90));
    }
  }

  for (const item of doc.items) {
    if (item.imageUrl === undefined) item.imageUrl = null;
  }

  await writeFile(file, JSON.stringify(doc, null, 2), "utf8");
  console.log(`done ok=${ok} fail=${fail}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
