import { readFileSync } from "node:fs";
import { join } from "node:path";

import { compareVersions } from "@/whats-new/policy";
import { RELEASES, releaseKey } from "@/whats-new/releases";

function releasesOf(locale: string): Record<string, unknown> {
  const file = JSON.parse(readFileSync(join(__dirname, `../../../locales/${locale}/mobile.json`), "utf8")) as {
    whatsNew: { releases: Record<string, unknown> };
  };
  return file.whatsNew.releases;
}

test("versions are listed from the oldest to the newest", () => {
  expect([...RELEASES].sort(compareVersions)).toEqual(RELEASES);
});

/** The sentences of a version, or `null` when it is not a list. */
function sentences(releases: Record<string, unknown>, key: string): unknown[] | null {
  const value = releases[key];
  return Array.isArray(value) ? value : null;
}

test("each announced version has 1 to 5 sentences, in French and in English alike", () => {
  const fr = releasesOf("fr");
  const en = releasesOf("en");
  for (const version of RELEASES) {
    const key = releaseKey(version);
    const [inFrench, inEnglish] = [sentences(fr, key), sentences(en, key)];
    for (const list of [inFrench, inEnglish]) {
      expect({ version, isList: list !== null }).toEqual({ version, isList: true });
      expect(list?.length ?? 0).toBeGreaterThanOrEqual(1);
      expect(list?.length ?? 0).toBeLessThanOrEqual(5);
      expect((list ?? []).every((sentence) => typeof sentence === "string" && sentence.trim() !== "")).toBe(true);
    }
    expect(inFrench?.length).toBe(inEnglish?.length);
  }
});

test("a version key uses underscores (i18next splits keys on dots)", () => {
  expect(releaseKey("1.1.1")).toBe("1_1_1");
});
