import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { chmodSync, closeSync, existsSync, mkdirSync, openSync, rmSync } from "node:fs";
import path from "node:path";
import { insertAll } from "./diff";
import { loadLegacyDocument } from "./legacy-json";
import type { Database as Doc } from "../domain/types";
import { readAll, type StoreDb } from "./rows";
import * as schema from "./schema";

export interface Store {
  file: string;
  /** Write connection: one transaction at a time, through the `queue`. */
  writer: Database.Database;
  db: StoreDb;
  /** Read connection: never the uncommitted state of a write in progress. */
  reader: Database.Database;
  readDb: StoreDb;
  queue: Promise<unknown>;
}

/** Path of the old JSON file (`WISHLIST_DATA_PATH`, default `data/wishlist.json`). */
export function dataFilePath(): string {
  return process.env.WISHLIST_DATA_PATH ?? path.join(process.cwd(), "data", "wishlist.json");
}

/** The database sits next to the old file, as `.db`; a `.db` path is taken as is. */
export function databaseFilePath(dataPath = dataFilePath()): string {
  if (dataPath.endsWith(".db")) return dataPath;
  return dataPath.endsWith(".json") ? `${dataPath.slice(0, -".json".length)}.db` : `${dataPath}.db`;
}

function legacyFilePath(dataPath: string): string | null {
  return dataPath.endsWith(".db") ? null : dataPath;
}

// Resolved when the module loads: some tests change the current directory afterwards (`withStore`).
const MIGRATIONS_FOLDER = path.join(/*turbopackIgnore: true*/ process.cwd(), "drizzle");

function migrationsFolder(): string {
  return MIGRATIONS_FOLDER;
}

const globalStores = globalThis as unknown as { __wishlistStores?: Map<string, Store> };
const stores = (globalStores.__wishlistStores ??= new Map<string, Store>());

function restrictModes(file: string): void {
  for (const suffix of ["", "-wal", "-shm"]) {
    try {
      chmodSync(`${file}${suffix}`, 0o600);
    } catch {
      // file missing, Windows / FS without chmod — ignore
    }
  }
}

function removeDatabaseFiles(file: string): void {
  for (const suffix of ["", "-wal", "-shm"]) rmSync(`${file}${suffix}`, { force: true });
}

const BUSY_TIMEOUT_MS = 5000;

/**
 * Switch to WAL. On a new database that another process is opening, SQLite answers
 * SQLITE_BUSY without going through `busy_timeout`: so we retry ourselves, up to the same delay.
 */
function enableWal(connection: Database.Database): void {
  const deadline = Date.now() + BUSY_TIMEOUT_MS;
  for (;;) {
    try {
      connection.pragma("journal_mode = WAL");
      return;
    } catch (error) {
      const busy = error instanceof Database.SqliteError && error.code === "SQLITE_BUSY";
      if (!busy || Date.now() >= deadline) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
    }
  }
}

function connect(file: string): Database.Database {
  const connection = new Database(file);
  // First: another process may be holding the database (WAL switch, migration, import).
  connection.pragma(`busy_timeout = ${BUSY_TIMEOUT_MS}`);
  enableWal(connection);
  connection.pragma("synchronous = NORMAL");
  connection.pragma("foreign_keys = ON");
  return connection;
}

/**
 * Migrations then import of the old file, in a single BEGIN IMMEDIATE transaction:
 * only one process applies a migration or imports; the import is all or nothing.
 * (Same tracking table as Drizzle's migrator, which reads its state outside a transaction.)
 */
function migrateAndImport(connection: Database.Database, db: StoreDb, legacyFile: string | null): void {
  const migrations = readMigrationFiles({ migrationsFolder: migrationsFolder() });
  connection.exec("BEGIN IMMEDIATE");
  try {
    connection.exec(
      "CREATE TABLE IF NOT EXISTS __drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at numeric)",
    );
    const last = connection.prepare("SELECT created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1").get() as
      | { created_at: number }
      | undefined;
    for (const migration of migrations) {
      if (last && Number(last.created_at) >= migration.folderMillis) continue;
      for (const statement of migration.sql) if (statement.trim()) connection.exec(statement);
      connection
        .prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)")
        .run(migration.hash, migration.folderMillis);
    }

    let imported: Doc | null = null;
    const marker = connection.prepare("SELECT value FROM meta WHERE key = 'legacy_import'").get();
    if (!marker) {
      connection.exec("PRAGMA defer_foreign_keys = ON");
      if (legacyFile && existsSync(/*turbopackIgnore: true*/ legacyFile)) {
        imported = loadLegacyDocument(legacyFile);
        insertAll(db, imported);
        db.insert(schema.meta).values({ key: "legacy_import", value: `imported:${new Date().toISOString()}` }).run();
      } else {
        db.insert(schema.meta).values({ key: "legacy_import", value: "none" }).run();
      }
    }
    connection.exec("COMMIT");
    if (imported) {
      console.info(
        `[store] old file imported: ${imported.users.length} accounts, ${imported.wishlists.length} lists, ` +
          `${imported.items.length} ideas, ${imported.reservations.length} reservations`,
      );
    }
  } catch (error) {
    if (connection.inTransaction) connection.exec("ROLLBACK");
    throw error;
  }
}

/**
 * Opens the database once per path and per process (cached on globalThis for `next dev`):
 * pragmas, `drizzle/` migrations, import of the old file if not done yet.
 * Throws `LegacyImportError` if the old file is unreadable or inconsistent; a database created by
 * this call is then deleted.
 */
export function openStore(dataPath = dataFilePath()): Store {
  const file = databaseFilePath(dataPath);
  const cached = stores.get(file);
  if (cached) return cached;

  mkdirSync(path.dirname(file), { recursive: true });
  const created = !existsSync(/*turbopackIgnore: true*/ file);
  if (created) closeSync(openSync(/*turbopackIgnore: true*/ file, "a", 0o600));

  let writer: Database.Database | null = null;
  let reader: Database.Database | null = null;
  try {
    writer = connect(file);
    const db = drizzle(writer, { schema });
    migrateAndImport(writer, db, legacyFilePath(dataPath));
    reader = connect(file);
    restrictModes(file);
    const store: Store = { file, writer, db, reader, readDb: drizzle(reader, { schema }), queue: Promise.resolve() };
    stores.set(file, store);
    return store;
  } catch (error) {
    reader?.close();
    writer?.close();
    if (created) removeDatabaseFiles(file);
    throw error;
  }
}

/** Closes the connections (tests, end of script). Without argument: all open databases. */
export function closeStore(dataPath?: string): void {
  const files = dataPath === undefined ? [...stores.keys()] : [databaseFilePath(dataPath)];
  for (const file of files) {
    const store = stores.get(file);
    if (!store) continue;
    store.reader.close();
    store.writer.close();
    stores.delete(file);
  }
}

/** One write transaction at a time per database, in call order. */
export function enqueue<T>(store: Store, run: () => Promise<T>): Promise<T> {
  const next = store.queue.then(run, run);
  store.queue = next.catch(() => undefined);
  return next;
}

/**
 * BEGIN IMMEDIATE (waits for another process up to `busy_timeout`), foreign keys checked at COMMIT,
 * ROLLBACK if `run` throws. `run` can be async: the queue ensures nobody else uses
 * the write connection meanwhile.
 */
export function writeTransaction<T>(store: Store, run: (db: StoreDb) => Promise<T>): Promise<T> {
  return enqueue(store, async () => {
    store.writer.exec("BEGIN IMMEDIATE");
    try {
      store.writer.exec("PRAGMA defer_foreign_keys = ON");
      const result = await run(store.db);
      store.writer.exec("COMMIT");
      return result;
    } catch (error) {
      if (store.writer.inTransaction) store.writer.exec("ROLLBACK");
      throw error;
    }
  });
}

/** Consistent snapshot on the read connection, in a single synchronous pass. */
export function readTransaction<T>(store: Store, run: (db: StoreDb) => T): T {
  store.reader.exec("BEGIN");
  try {
    return run(store.readDb);
  } finally {
    store.reader.exec("COMMIT");
  }
}

/** Read-only access to a database file, without migration or import (check, backup, tools). */
export function readDatabaseFile(file: string): Doc {
  const connection = new Database(file, { readonly: true, fileMustExist: true });
  try {
    connection.pragma("busy_timeout = 5000");
    return readAll(drizzle(connection, { schema }));
  } finally {
    connection.close();
  }
}
