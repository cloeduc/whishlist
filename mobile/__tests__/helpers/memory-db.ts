import { DatabaseSync, type SQLInputValue } from "node:sqlite";

import { replaceDb, type Db, type SqlValue } from "@/offline/db";

/** Base SQLite en mémoire (node:sqlite) qui remplace expo-sqlite dans les tests. */
export function memoryDb(): Db {
  const database = new DatabaseSync(":memory:");
  const values = (params: SqlValue[] = []): SQLInputValue[] => params;
  let queue: Promise<unknown> = Promise.resolve();
  return {
    exec: async (sql) => {
      database.exec(sql);
    },
    run: async (sql, params) => {
      const result = database.prepare(sql).run(...values(params));
      return { lastInsertRowId: Number(result.lastInsertRowid), changes: Number(result.changes) };
    },
    all: async <T,>(sql: string, params?: SqlValue[]) => database.prepare(sql).all(...values(params)) as T[],
    first: async <T,>(sql: string, params?: SqlValue[]) =>
      (database.prepare(sql).get(...values(params)) as T | undefined) ?? null,
    transaction: (work) => {
      const next = queue.then(async () => {
        database.exec("BEGIN");
        try {
          await work();
          database.exec("COMMIT");
        } catch (error) {
          database.exec("ROLLBACK");
          throw error;
        }
      });
      queue = next.catch(() => {});
      return next;
    },
  };
}

export async function freshDb(): Promise<Db> {
  const db = memoryDb();
  await replaceDb(db);
  return db;
}
