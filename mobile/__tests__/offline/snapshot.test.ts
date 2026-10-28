import { ensureUser, getSnapshot, listKey, putSnapshot } from "@/offline/snapshot";

import { freshDb } from "../helpers/memory-db";

beforeEach(async () => {
  await freshDb();
});

test("put then get returns the body and its date", async () => {
  await putSnapshot(listKey("l1"), { title: "Noël" }, "2026-10-28T14:05:00.000Z");
  expect(await getSnapshot(listKey("l1"))).toEqual({ body: { title: "Noël" }, fetchedAt: "2026-10-28T14:05:00.000Z" });
  expect(await getSnapshot(listKey("other"))).toBeNull();
});

test("ensureUser with another account empties the snapshot and the outbox", async () => {
  const db = await freshDb();
  await ensureUser("alex");
  await putSnapshot("lists", { lists: [] });
  await db.run(
    "INSERT INTO outbox (kind, listId, targetId, payload, createdAt) VALUES ('createList', 'l1', 'l1', '{}', '2026-10-28')",
  );
  await ensureUser("camille");
  expect(await getSnapshot("lists")).toBeNull();
  expect(await db.all("SELECT * FROM outbox")).toEqual([]);
});

test("ensureUser with the same account keeps everything", async () => {
  await ensureUser("alex");
  await putSnapshot("lists", { lists: [] });
  await ensureUser("alex");
  expect(await getSnapshot("lists")).not.toBeNull();
});
