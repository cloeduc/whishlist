import { CHECK_INTERVAL_MS, SNOOZE_MS, shouldCheck, shouldPrompt } from "@/update/policy";

const NOW = new Date("2026-11-16T12:00:00.000Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms);

test("check: always at start-up", () => {
  expect(shouldCheck({ now: NOW, lastCheckAt: ago(60_000), coldStart: true })).toBe(true);
});

test("check: back in the foreground, at most once per 24 h", () => {
  expect(shouldCheck({ now: NOW, lastCheckAt: null, coldStart: false })).toBe(true);
  expect(shouldCheck({ now: NOW, lastCheckAt: ago(CHECK_INTERVAL_MS - 1), coldStart: false })).toBe(false);
  expect(shouldCheck({ now: NOW, lastCheckAt: ago(CHECK_INTERVAL_MS), coldStart: false })).toBe(true);
});

test("prompt: with no « Plus tard » yet", () => {
  expect(shouldPrompt({ storeVersion: "1.3.0", snooze: null, now: NOW })).toBe(true);
});

test("prompt: « Plus tard » silences the same version for 7 days", () => {
  expect(shouldPrompt({ storeVersion: "1.3.0", snooze: { storeVersion: "1.3.0", at: ago(SNOOZE_MS - 1) }, now: NOW })).toBe(false);
  expect(shouldPrompt({ storeVersion: "1.3.0", snooze: { storeVersion: "1.3.0", at: ago(SNOOZE_MS) }, now: NOW })).toBe(true);
});

test("prompt: a version published after « Plus tard » is offered at once", () => {
  expect(shouldPrompt({ storeVersion: "1.4.0", snooze: { storeVersion: "1.3.0", at: ago(60_000) }, now: NOW })).toBe(true);
});

test("prompt: without a store version, « Plus tard » holds 7 days whatever the version", () => {
  expect(shouldPrompt({ storeVersion: null, snooze: { storeVersion: null, at: ago(60_000) }, now: NOW })).toBe(false);
  expect(shouldPrompt({ storeVersion: "1.3.0", snooze: { storeVersion: null, at: ago(60_000) }, now: NOW })).toBe(false);
  expect(shouldPrompt({ storeVersion: null, snooze: { storeVersion: "1.3.0", at: ago(60_000) }, now: NOW })).toBe(false);
  expect(shouldPrompt({ storeVersion: null, snooze: { storeVersion: null, at: ago(SNOOZE_MS) }, now: NOW })).toBe(true);
});
