import assert from "node:assert/strict";
import { scrypt as scryptCb } from "node:crypto";
import test from "node:test";
import { hashPassword, verifyPassword } from "../../src/domain/passwords";

function scrypt(password: string, salt: Buffer, keylen: number, options: { N: number; r: number; p: number }) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

test("a new hash costs 2^17 and verifies", async () => {
  const stored = await hashPassword("secret-ok!!");
  assert.match(stored, /^scrypt\$131072\$8\$1\$/);
  assert.equal(await verifyPassword("secret-ok!!", stored), true);
  assert.equal(await verifyPassword("autre-mot!!", stored), false);
});

test("an old 2^14 hash stays valid", async () => {
  const salt = Buffer.from("ancien-sel-16b!!");
  const derived = await scrypt("secret-ok!!", salt, 32, {
    N: 16384,
    r: 8,
    p: 1,
  });
  const stored = `scrypt$16384$8$1$${salt.toString("base64")}$${derived.toString("base64")}`;
  assert.equal(await verifyPassword("secret-ok!!", stored), true);
});

test("an absurd cost is refused without computing", async () => {
  assert.equal(await verifyPassword("secret-ok!!", "scrypt$1048576$8$1$YQ==$YQ=="), false);
  assert.equal(await verifyPassword("secret-ok!!", "scrypt$131072$32$1$YQ==$YQ=="), false);
});
