import { getDb } from "@/offline/db";
import { DEVICE_META_PREFIX, getMeta, setMeta } from "@/offline/snapshot";

// The last version whose news were seen (022): a setting of the phone, kept when signing out.
const LAST_SEEN_KEY = `${DEVICE_META_PREFIX}whatsNew.lastSeenVersion`;

export async function getLastSeenVersion(): Promise<string | null> {
  return getMeta(LAST_SEEN_KEY);
}

export async function setLastSeenVersion(version: string): Promise<void> {
  await setMeta(LAST_SEEN_KEY, version);
}

/** Traces of an earlier version on this phone: a saved copy, a pending change or a signed-in account. */
export async function hasPastUsage(): Promise<boolean> {
  const db = await getDb();
  const row = await db.first<{ used: number }>(
    `SELECT EXISTS (SELECT 1 FROM snapshot) OR EXISTS (SELECT 1 FROM outbox)
       OR EXISTS (SELECT 1 FROM meta WHERE key = 'userId') AS used`,
  );
  return Boolean(row?.used);
}
