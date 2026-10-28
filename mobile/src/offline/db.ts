import * as SQLite from "expo-sqlite";

export type SqlValue = string | number | null;

/** Accès minimal à la base locale ; les tests le remplacent par une base en mémoire. */
export interface Db {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: SqlValue[]): Promise<{ lastInsertRowId: number; changes: number }>;
  all<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  first<T>(sql: string, params?: SqlValue[]): Promise<T | null>;
  /** Exécute `work` dans une transaction exclusive. */
  transaction(work: () => Promise<void>): Promise<void>;
}

// Une entrée par version ; on n'en modifie jamais une déjà publiée (data-model.md).
const MIGRATIONS = [
  `CREATE TABLE meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
   CREATE TABLE snapshot (key TEXT PRIMARY KEY NOT NULL, body TEXT NOT NULL, fetchedAt TEXT NOT NULL);
   CREATE TABLE outbox (
     seq INTEGER PRIMARY KEY AUTOINCREMENT,
     kind TEXT NOT NULL,
     listId TEXT NOT NULL,
     targetId TEXT NOT NULL,
     payload TEXT NOT NULL,
     state TEXT NOT NULL DEFAULT 'pending',
     errorCode TEXT,
     attempts INTEGER NOT NULL DEFAULT 0,
     createdAt TEXT NOT NULL
   );`,
];

export async function migrate(db: Db): Promise<void> {
  const row = await db.first<{ user_version: number }>("PRAGMA user_version");
  const version = row?.user_version ?? 0;
  for (let next = version; next < MIGRATIONS.length; next++) {
    await db.transaction(async () => {
      await db.exec(MIGRATIONS[next]);
      await db.exec(`PRAGMA user_version = ${next + 1}`);
    });
  }
}

function expoDb(database: SQLite.SQLiteDatabase): Db {
  return {
    exec: (sql) => database.execAsync(sql),
    run: (sql, params = []) => database.runAsync(sql, params),
    all: (sql, params = []) => database.getAllAsync(sql, params),
    first: (sql, params = []) => database.getFirstAsync(sql, params),
    transaction: (work) => database.withExclusiveTransactionAsync(() => work()),
  };
}

let current: Promise<Db> | null = null;

export function getDb(): Promise<Db> {
  current ??= (async () => {
    const db = expoDb(await SQLite.openDatabaseAsync("ohyoushouldnt.db"));
    await migrate(db);
    return db;
  })();
  return current;
}

/** Tests : remplace la base (déjà migrée par l'appelant ou non). */
export async function replaceDb(db: Db): Promise<void> {
  await migrate(db);
  current = Promise.resolve(db);
}
