// `npm start`: the production server of the Docker image (`.next/standalone/server.js`), run from the
// repository. It reads PORT and HOSTNAME like the image does.
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const server = path.resolve(".next/standalone/server.js");
if (!existsSync(server)) {
  console.error("No production build: run npm run build first.");
  process.exit(1);
}

// server.js moves into .next/standalone: a relative data path would open an empty database there,
// erased by the next build. Default to the repository's data/wishlist.json, as an absolute path.
process.env.WISHLIST_DATA_PATH = path.resolve(process.env.WISHLIST_DATA_PATH ?? "data/wishlist.json");

await import(pathToFileURL(server).href);
