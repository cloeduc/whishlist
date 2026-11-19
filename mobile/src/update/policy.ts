/**
 * When to look for a new store version and when to offer it (021). Pure rules, tested on their own.
 * The offer itself is « conseillée »: refusing it only postpones it.
 */

/** Back in the foreground, the store is asked at most once per day. */
export const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** « Plus tard » (iOS) or a refusal (Android) silences the same store version for 7 days. */
export const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

/** `storeVersion`: version string on iOS, `versionCode` on Android; `null` when the store does not give it. */
export type Snooze = { storeVersion: string | null; at: Date };

export function shouldCheck({ now, lastCheckAt, coldStart }: { now: Date; lastCheckAt: Date | null; coldStart: boolean }): boolean {
  if (coldStart || !lastCheckAt) return true;
  return now.getTime() - lastCheckAt.getTime() >= CHECK_INTERVAL_MS;
}

/**
 * A different store version means a newer one was published since « Plus tard »: offered at once.
 * Without a version on either side, the 7 days apply whatever the version.
 */
export function shouldPrompt({ storeVersion, snooze, now }: { storeVersion: string | null; snooze: Snooze | null; now: Date }): boolean {
  if (!snooze) return true;
  const sameVersion = storeVersion === null || snooze.storeVersion === null || storeVersion === snooze.storeVersion;
  if (!sameVersion) return true;
  return now.getTime() - snooze.at.getTime() >= SNOOZE_MS;
}
