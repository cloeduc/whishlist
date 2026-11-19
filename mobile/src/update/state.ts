import { DEVICE_META_PREFIX, getMeta, setMeta } from "@/offline/snapshot";

import type { Snooze } from "./policy";

// The phone's update state (021), in the local `meta` table: kept when signing out (it is not the account's).
const LAST_CHECK_KEY = `${DEVICE_META_PREFIX}update.lastCheckAt`;
const SNOOZE_KEY = `${DEVICE_META_PREFIX}update.snooze`;

function date(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function getLastCheckAt(): Promise<Date | null> {
  return date(await getMeta(LAST_CHECK_KEY));
}

export async function setLastCheckAt(at: Date): Promise<void> {
  await setMeta(LAST_CHECK_KEY, at.toISOString());
}

export async function getSnooze(): Promise<Snooze | null> {
  const raw = await getMeta(SNOOZE_KEY);
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
  await setMeta(SNOOZE_KEY, JSON.stringify({ storeVersion: snooze.storeVersion, at: snooze.at.toISOString() }));
}
