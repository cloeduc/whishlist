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

/**
 * `meta` keys that belong to the phone, not to the account: kept when signing out (021, update state).
 * Every such key starts with this prefix.
 */
export const DEVICE_META_PREFIX = "device.";

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.first<{ value: string }>("SELECT value FROM meta WHERE key = ?", [key]);
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.run("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [key, value]);
}

/** Clears the local copy, the pending changes and the account's `meta` (the phone's keys stay). */
export async function clearAll(): Promise<void> {
  const db = await getDb();
  await db.transaction(async () => {
    await db.run("DELETE FROM snapshot");
    await db.run("DELETE FROM outbox");
    await db.run("DELETE FROM meta WHERE key NOT LIKE ?", [`${DEVICE_META_PREFIX}%`]);
  });
}

/** We never show the lists of another account: everything is cleared if the account changes. */
export async function ensureUser(userId: string): Promise<void> {
  if ((await getMeta("userId")) === userId) return;
  const db = await getDb();
  await db.transaction(async () => {
    await db.run("DELETE FROM snapshot");
    await db.run("DELETE FROM outbox");
    await setMeta("userId", userId);
  });
}
