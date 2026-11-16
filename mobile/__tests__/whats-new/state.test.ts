import { clearAll, ensureUser } from "@/offline/snapshot";
import { getLastSeenVersion, hasPastUsage, setLastSeenVersion } from "@/whats-new/state";

import { freshDb } from "../helpers/memory-db";

test("last seen version: none, then kept, and kept when signing out", async () => {
  await freshDb();
  expect(await getLastSeenVersion()).toBeNull();
  await setLastSeenVersion("1.1.1");
  expect(await getLastSeenVersion()).toBe("1.1.1");
  await clearAll();
  expect(await getLastSeenVersion()).toBe("1.1.1");
});

test("past usage: none on an empty phone; a copy, a pending change or an account count", async () => {
  const db = await freshDb();
  expect(await hasPastUsage()).toBe(false);
  await db.run("INSERT INTO snapshot (key, body, fetchedAt) VALUES ('lists', '[]', '2026-11-16')");
  expect(await hasPastUsage()).toBe(true);

  const pending = await freshDb();
  await pending.run(
    "INSERT INTO outbox (kind, listId, targetId, payload, createdAt) VALUES ('createList', 'l1', 'l1', '{}', '2026-11-16')",
  );
  expect(await hasPastUsage()).toBe(true);

  await freshDb();
  await ensureUser("alex");
  expect(await hasPastUsage()).toBe(true);
});
