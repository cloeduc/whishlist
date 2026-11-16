import { compareVersions, whatsNewFor } from "@/whats-new/policy";

const releases = ["1.1.1", "1.1.2", "1.2.0"];

test("compare versions number by number", () => {
  expect(compareVersions("1.1.10", "1.1.9")).toBeGreaterThan(0);
  expect(compareVersions("1.2.0", "1.1.9")).toBeGreaterThan(0);
  expect(compareVersions("1.1.1", "1.1.1")).toBe(0);
  expect(compareVersions("1.1", "1.1.0")).toBe(0);
  expect(compareVersions("1.0.9", "1.1")).toBeLessThan(0);
});

test("fresh install: nothing shown, the installed version is recorded", () => {
  expect(whatsNewFor({ installed: "1.1.1", lastSeen: null, hasPastUsage: false, releases })).toEqual({ show: [], markSeen: true });
});

test("update from a version that did not record itself: the installed version's news only", () => {
  expect(whatsNewFor({ installed: "1.1.2", lastSeen: null, hasPastUsage: true, releases })).toEqual({ show: ["1.1.2"], markSeen: false });
  expect(whatsNewFor({ installed: "1.1.3", lastSeen: null, hasPastUsage: true, releases })).toEqual({ show: [], markSeen: true });
});

test("same version already seen: nothing", () => {
  expect(whatsNewFor({ installed: "1.1.1", lastSeen: "1.1.1", hasPastUsage: true, releases })).toEqual({ show: [], markSeen: false });
});

test("older version installed than the one seen: nothing, the seen version stays", () => {
  expect(whatsNewFor({ installed: "1.1.1", lastSeen: "1.2.0", hasPastUsage: true, releases })).toEqual({ show: [], markSeen: false });
});

test("newer version: every missed version with news, newest first", () => {
  expect(whatsNewFor({ installed: "1.2.0", lastSeen: "1.1.1", hasPastUsage: true, releases })).toEqual({ show: ["1.2.0", "1.1.2"], markSeen: false });
  expect(whatsNewFor({ installed: "1.1.3", lastSeen: "1.1.2", hasPastUsage: true, releases })).toEqual({ show: [], markSeen: true });
});
