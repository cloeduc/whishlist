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

test("un nouveau hash coûte 2^17 et se vérifie", async () => {
  const stored = await hashPassword("secret-ok!!");
  assert.match(stored, /^scrypt\$131072\$8\$1\$/);
  assert.equal(await verifyPassword("secret-ok!!", stored), true);
  assert.equal(await verifyPassword("autre-mot!!", stored), false);
});

test("un hash ancien en 2^14 reste valable", async () => {
  const salt = Buffer.from("ancien-sel-16b!!");
  const derived = await scrypt("secret-ok!!", salt, 32, {
    N: 16384,
    r: 8,
    p: 1,
  });
  const stored = `scrypt$16384$8$1$${salt.toString("base64")}$${derived.toString("base64")}`;
  assert.equal(await verifyPassword("secret-ok!!", stored), true);
});

test("un coût absurde est refusé sans calcul", async () => {
  assert.equal(await verifyPassword("secret-ok!!", "scrypt$1048576$8$1$YQ==$YQ=="), false);
  assert.equal(await verifyPassword("secret-ok!!", "scrypt$131072$32$1$YQ==$YQ=="), false);
});
