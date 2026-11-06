import "server-only";
import type { Database } from "../domain/types";
import { COLLECTION_NAMES, COLLECTIONS, sameRow, type CollectionName, type RowOf, type StoreDb } from "./rows";

interface Plan<K extends CollectionName> {
  name: K;
  old: Map<string, RowOf<K>>;
  next: Map<string, RowOf<K>>;
}

/** Rows by key; two rows with the same key throw an error instead of silently disappearing. */
function byKey<K extends CollectionName>(name: K, rows: Database[K]): Map<string, RowOf<K>> {
  const collection = COLLECTIONS[name];
  const map = new Map<string, RowOf<K>>();
  for (const row of rows) {
    const key = collection.key(row);
    if (map.has(key)) throw new Error(`${name}: two records with the same key (${key})`);
    map.set(key, row);
  }
  return map;
}

function plan<K extends CollectionName>(name: K, before: Database, after: Database): Plan<K> {
  return { name, old: byKey(name, before[name]), next: byKey(name, after[name]) };
}

function deleteRemoved<K extends CollectionName>(db: StoreDb, { name, old, next }: Plan<K>): void {
  const collection = COLLECTIONS[name];
  for (const [key, row] of old) {
    if (!next.has(key)) db.delete(collection.table).where(collection.where(row)).run();
  }
}

function updateChanged<K extends CollectionName>(db: StoreDb, { name, old, next }: Plan<K>): void {
  const collection = COLLECTIONS[name];
  for (const [key, row] of next) {
    const previous = old.get(key);
    if (previous && !sameRow(collection, previous, row)) {
      db.update(collection.table).set(row).where(collection.where(row)).run();
    }
  }
}

function insertAdded<K extends CollectionName>(db: StoreDb, { name, old, next }: Plan<K>): void {
  const { table } = COLLECTIONS[name];
  for (const [key, row] of next) {
    if (!old.has(key)) db.insert(table).values(row).run();
  }
}

/**
 * Writes only what changed between `before` and `after`, by primary key.
 * Deletions first (a unique index, like one reservation per idea, is not deferred),
 * then updates, then inserts in array order. Never INSERT OR REPLACE: it changes the rowid.
 * Call inside a transaction, with `defer_foreign_keys` active.
 */
export function writeDiff(db: StoreDb, before: Database, after: Database): void {
  const plans = COLLECTION_NAMES.map((name) => plan(name, before, after));
  for (const p of plans) deleteRemoved(db, p);
  for (const p of plans) updateChanged(db, p);
  for (const p of plans) insertAdded(db, p);
}

function insertCollection<K extends CollectionName>(db: StoreDb, name: K, doc: Database): void {
  const { table } = COLLECTIONS[name];
  for (const row of doc[name]) db.insert(table).values(row).run();
}

/** Inserts the whole document, in array order (import, replacement). */
export function insertAll(db: StoreDb, doc: Database): void {
  for (const name of COLLECTION_NAMES) insertCollection(db, name, doc);
}

/** Empties all tables (replacement). */
export function deleteAll(db: StoreDb): void {
  for (const name of [...COLLECTION_NAMES].reverse()) db.delete(COLLECTIONS[name].table).run();
}
