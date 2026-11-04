import { cache } from "react";
import type { Database } from "../domain/types";
import { openStore, readTransaction, writeTransaction } from "./connection";
import { deleteAll, insertAll, writeDiff } from "./diff";
import { readAll } from "./rows";

export { closeStore, dataFilePath, databaseFilePath, openStore } from "./connection";

/** Full read, consistent snapshot. Array order = insertion order. */
export async function readDocument(): Promise<Database> {
  const store = openStore();
  return readTransaction(store, readAll);
}

/** One read per RSC request (layout + page + auth share this). */
export const getDocument = cache(readDocument);

/**
 * One change at a time per database. `mutate` can change `doc` in place or return another one;
 * only the added, changed or removed rows are written. All or nothing: if `mutate` throws
 * or a constraint fails, nothing is written and the error propagates.
 */
export async function updateDocument<T>(
  mutate: (doc: Database) => { doc: Database; result: T } | Promise<{ doc: Database; result: T }>,
): Promise<T> {
  const store = openStore();
  return writeTransaction(store, async (db) => {
    const doc = readAll(db);
    const before = structuredClone(doc);
    const { doc: next, result } = await mutate(doc);
    writeDiff(db, before, next);
    return result;
  });
}

/** Replaces the whole content in one transaction (demo, e2e reset, tests). */
export async function replaceDocument(doc: Database): Promise<void> {
  const store = openStore();
  await writeTransaction(store, async (db) => {
    deleteAll(db);
    insertAll(db, doc);
  });
}
