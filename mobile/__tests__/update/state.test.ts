import { getDb } from "@/offline/db";
import { getLastCheckAt, getSnooze, setLastCheckAt, setSnooze } from "@/update/state";

import { freshDb } from "../helpers/memory-db";

beforeEach(async () => {
  await freshDb();
});

test("nothing stored yet", async () => {
  expect(await getLastCheckAt()).toBeNull();
  expect(await getSnooze()).toBeNull();
});

test("last check and « Plus tard » are kept and replaced", async () => {
  await setLastCheckAt(new Date("2026-11-16T10:00:00.000Z"));
  await setLastCheckAt(new Date("2026-11-16T11:00:00.000Z"));
  expect((await getLastCheckAt())?.toISOString()).toBe("2026-11-16T11:00:00.000Z");
  await setSnooze({ storeVersion: "1.3.0", at: new Date("2026-11-16T11:30:00.000Z") });
  expect(await getSnooze()).toEqual({ storeVersion: "1.3.0", at: new Date("2026-11-16T11:30:00.000Z") });
});

test("an unreadable value counts as none", async () => {
  const db = await getDb();
  await db.run("INSERT INTO meta (key, value) VALUES ('update.snooze', 'pas du json'), ('update.lastCheckAt', 'hier')");
  expect(await getSnooze()).toBeNull();
  expect(await getLastCheckAt()).toBeNull();
});
