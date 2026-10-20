import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { resolveTheme } from "../domain/theme";
import { emptyDatabase, type Database } from "../domain/types";
import { withFileLock } from "./file";

export function dataFilePath(): string {
  return process.env.WISHLIST_DATA_PATH ?? path.join(process.cwd(), "data", "wishlist.json");
}

async function ensureFile(file: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  try {
    await access(file);
  } catch {
    await writeFile(file, JSON.stringify(emptyDatabase(), null, 2), "utf8");
  }
}

function normalizeDocument(doc: Database): Database {
  if (!doc.passwordResets) doc.passwordResets = [];
  for (const user of doc.users) {
    if (user.mustChangePassword === undefined) user.mustChangePassword = false;
  }
  for (const list of doc.wishlists) {
    if (list.subtitle === undefined) list.subtitle = null;
    if (list.coverImageUrl === undefined) list.coverImageUrl = null;
    list.theme = resolveTheme(list.theme);
  }
  for (const item of doc.items) {
    if (item.imageUrl === undefined) item.imageUrl = null;
    if (item.archived === undefined) item.archived = false;
  }
  for (const reservation of doc.reservations) {
    if (reservation.userId === undefined) reservation.userId = null;
  }
  return doc;
}

/** Fresh disk read — use inside locks / tests / after writes. */
export async function readDocument(): Promise<Database> {
  const file = dataFilePath();
  await ensureFile(file);
  const raw = await readFile(file, "utf8");
  return normalizeDocument(JSON.parse(raw) as Database);
}

/** One read per RSC request (layout + page + auth share this). */
export const getDocument = cache(readDocument);

export async function updateDocument<T>(
  mutate: (doc: Database) => { doc: Database; result: T },
): Promise<T> {
  const file = dataFilePath();
  await ensureFile(file);
  return withFileLock(file, async () => {
    const raw = await readFile(file, "utf8");
    const doc = normalizeDocument(JSON.parse(raw) as Database);
    const { doc: next, result } = mutate(doc);
    const tmp = `${file}.tmp`;
    await writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
    const { rename } = await import("node:fs/promises");
    await rename(tmp, file);
    return result;
  });
}
