import { getDb } from "./db";

/** Last server response for `GET /lists` (`lists`) or `GET /lists/{id}` (`list:<id>`). */
export type Snapshot<T> = { body: T; fetchedAt: string };

export const listsKey = "lists";
export const subscriptionsKey = "subscriptions";
export const listKey = (listId: string) => `list:${listId}`;
export const publicListKey = (readToken: string) => `publicList:${readToken}`;

export async function getSnapshot<T>(key: string): Promise<Snapshot<T> | null> {
  const db = await getDb();
  const row = await db.first<{ body: string; fetchedAt: string }>(
    "SELECT body, fetchedAt FROM snapshot WHERE key = ?",
    [key],
  );
  return row ? { body: JSON.parse(row.body), fetchedAt: row.fetchedAt } : null;
}

export async function putSnapshot(key: string, body: unknown, fetchedAt = new Date().toISOString()): Promise<void> {
  const db = await getDb();
  await db.run(
    "INSERT INTO snapshot (key, body, fetchedAt) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET body = excluded.body, fetchedAt = excluded.fetchedAt",
    [key, JSON.stringify(body), fetchedAt],
  );
}

export async function removeSnapshot(key: string): Promise<void> {
  const db = await getDb();
  await db.run("DELETE FROM snapshot WHERE key = ?", [key]);
}

/** Clears the local copy and the pending changes. */
export async function clearAll(): Promise<void> {
  const db = await getDb();
  await db.transaction(async () => {
    await db.run("DELETE FROM snapshot");
    await db.run("DELETE FROM outbox");
    await db.run("DELETE FROM meta");
  });
}

/** We never show the lists of another account: everything is cleared if the account changes. */
export async function ensureUser(userId: string): Promise<void> {
  const db = await getDb();
  const row = await db.first<{ value: string }>("SELECT value FROM meta WHERE key = 'userId'");
  if (row?.value === userId) return;
  await db.transaction(async () => {
    await db.run("DELETE FROM snapshot");
    await db.run("DELETE FROM outbox");
    await db.run(
      "INSERT INTO meta (key, value) VALUES ('userId', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [userId],
    );
  });
}
