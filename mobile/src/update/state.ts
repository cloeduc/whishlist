import { getDb } from "@/offline/db";

import type { Snooze } from "./policy";

// The phone's update state (021), in the local `meta` table: kept when signing out (it is not the account's).
const LAST_CHECK_KEY = "update.lastCheckAt";
const SNOOZE_KEY = "update.snooze";

async function read(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.first<{ value: string }>("SELECT value FROM meta WHERE key = ?", [key]);
  return row?.value ?? null;
}

async function write(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.run("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [key, value]);
}

function date(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function getLastCheckAt(): Promise<Date | null> {
  return date(await read(LAST_CHECK_KEY));
}

export async function setLastCheckAt(at: Date): Promise<void> {
  await write(LAST_CHECK_KEY, at.toISOString());
}

export async function getSnooze(): Promise<Snooze | null> {
  const raw = await read(SNOOZE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || !("at" in parsed) || !("storeVersion" in parsed)) return null;
    const when = date(parsed.at);
    const { storeVersion } = parsed;
    if (!when || (storeVersion !== null && typeof storeVersion !== "string")) return null;
    return { storeVersion, at: when };
  } catch {
    return null;
  }
}

export async function setSnooze(snooze: Snooze): Promise<void> {
  await write(SNOOZE_KEY, JSON.stringify({ storeVersion: snooze.storeVersion, at: snooze.at.toISOString() }));
}
