import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const N = 16384;
const r = 8;
const p = 1;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, rr, pp, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const actual = scryptSync(password, salt, expected.length, {
    N: Number(n),
    r: Number(rr),
    p: Number(pp),
  });
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
