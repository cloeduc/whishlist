import { isClientId, newClientId } from "@/offline/ids";

test("newClientId returns 16 base64url characters, all different", () => {
  const ids = new Set(Array.from({ length: 200 }, () => newClientId()));
  expect(ids.size).toBe(200);
  for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]{16}$/);
});

test("isClientId follows the contract: 16 to 32 base64url characters", () => {
  expect(isClientId("a".repeat(16))).toBe(true);
  expect(isClientId("A-_z09".padEnd(32, "x"))).toBe(true);
  expect(isClientId("a".repeat(15))).toBe(false);
  expect(isClientId("a".repeat(33))).toBe(false);
  expect(isClientId("abc/def+ghijklmno")).toBe(false);
});
