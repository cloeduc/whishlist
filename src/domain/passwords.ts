import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

/** 2^17, r=8, p=1. Les hash déjà stockés gardent leur coût d'origine. */
const N = 131072;
const r = 8;
const p = 1;
const MAXMEM = 256 * 1024 * 1024;

function storedParams(n: number, rr: number, pp: number): { N: number; r: number; p: number; maxmem: number } | null {
  if (!Number.isInteger(n) || !Number.isInteger(rr) || !Number.isInteger(pp)) return null;
  if (rr !== r || pp !== p) return null;
  if (n < 16384 || n > N || (n & (n - 1)) !== 0) return null;
  return { N: n, r: rr, p: pp, maxmem: MAXMEM };
}

export const MIN_PASSWORD_LENGTH = 10;

/** `null` si OK, sinon code d'erreur i18n. */
export function passwordPolicyError(password: string): string | null {
  if (!password) return "passwordRequired";
  if (password.length < MIN_PASSWORD_LENGTH) return "passwordTooShort";
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 32, { N, r, p, maxmem: MAXMEM });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, rr, pp, saltB64, hashB64] = parts;
  const params = storedParams(Number(n), Number(rr), Number(pp));
  if (!params) return false;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  if (expected.length !== 32) return false;
  const actual = await scryptAsync(password, salt, expected.length, params);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
