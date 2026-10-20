import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createPasswordReset,
  findValidPasswordReset,
  resetPasswordWithToken,
} from "../../src/domain/password-reset";
import { authenticate, registerUser } from "../../src/domain/users";
import { emptyDatabase } from "../../src/domain/types";

test("reset : token, expiration, usage unique, e-mail inconnu silencieux", () => {
  const registered = registerUser(emptyDatabase(), {
    email: "ada@example.com",
    password: "ancien",
    displayName: "Ada",
  });
  assert.equal(registered.ok, true);
  if (!registered.ok) return;

  const unknown = createPasswordReset(registered.doc, { email: "personne@example.com" });
  assert.equal(unknown.token, null);
  assert.equal(unknown.doc.passwordResets.length, 0);

  const now = new Date("2026-10-19T12:00:00.000Z");
  const created = createPasswordReset(registered.doc, { email: " Ada@Example.com ", now });
  assert.ok(created.token);
  assert.equal(created.email, "ada@example.com");
  assert.equal(created.doc.passwordResets.length, 1);
  assert.equal(findValidPasswordReset(created.doc, created.token!, now), true);

  const expired = resetPasswordWithToken(created.doc, {
    token: created.token!,
    password: "nouveau",
    now: new Date("2026-10-19T14:00:01.000Z"),
  });
  assert.equal(expired.ok, false);

  const reset = resetPasswordWithToken(created.doc, {
    token: created.token!,
    password: "nouveau",
    now,
  });
  assert.equal(reset.ok, true);
  if (!reset.ok) return;
  assert.equal(authenticate(reset.doc, "ada@example.com", "nouveau")?.id, reset.userId);
  assert.equal(authenticate(reset.doc, "ada@example.com", "ancien"), null);
  assert.equal(reset.doc.passwordResets.length, 0);

  const reuse = resetPasswordWithToken(reset.doc, {
    token: created.token!,
    password: "autre",
    now,
  });
  assert.equal(reuse.ok, false);
});
