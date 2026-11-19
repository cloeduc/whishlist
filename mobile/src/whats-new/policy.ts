/** What « Quoi de neuf » shows at start-up (022). Pure rules, tested on their own. */

/** Number by number: `1.1.10` > `1.1.9`; a missing number counts as 0 (`1.1` = `1.1.0`). */
export function compareVersions(a: string, b: string): number {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

/**
 * `show`: versions whose news to show, newest first. `markSeen`: record `installed` as seen right away
 * (nothing to show); when `show` is not empty, it is recorded once the dialog is closed.
 * `lastSeen` null and no past usage on the phone: a fresh install. Null with past usage: an update from a
 * version that did not record itself (1.1.0 and before), only the installed version's news.
 */
export function whatsNewFor({
  installed,
  lastSeen,
  hasPastUsage,
  releases,
}: {
  installed: string;
  lastSeen: string | null;
  hasPastUsage: boolean;
  releases: readonly string[];
}): { show: string[]; markSeen: boolean } {
  let show: string[];
  if (lastSeen === null) {
    if (!hasPastUsage) return { show: [], markSeen: true };
    show = releases.filter((version) => compareVersions(version, installed) === 0);
  } else {
    if (compareVersions(installed, lastSeen) <= 0) return { show: [], markSeen: false };
    show = releases.filter((version) => compareVersions(version, lastSeen) > 0 && compareVersions(version, installed) <= 0);
  }
  show = [...show].sort((a, b) => compareVersions(b, a));
  return { show, markSeen: show.length === 0 };
}
