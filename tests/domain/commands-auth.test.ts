import assert from "node:assert/strict";
import { before, test } from "node:test";
import { findApiSessionUser } from "../../src/auth/api-session";
import { createPasswordReset } from "../../src/domain/password-reset";
import { authenticate, changePassword } from "../../src/domain/users";
import {
  changeOwnPassword,
  login,
  logout,
  register,
  requestPasswordReset,
  resetPasswordWithLink,
  updateOwnDisplayName,
} from "../../src/server/commands/auth";
import { isRateLimitError } from "../../src/server/rate-limit";
import { readDocument, updateDocument } from "../../src/store/db";
import { apiDoc, ctx, ensurePasswordHash, PASSWORD, withStore } from "./helpers/api-fixtures";

before(ensurePasswordHash);

test("signing in returns a token and the account, without the hash", async () => {
  await withStore(apiDoc(), async () => {
    const result = await login(ctx(), { email: "ALEX@example.test ", password: PASSWORD });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.session.user, {
      id: "alex",
      email: "alex@example.test",
      displayName: "Alex",
      mustChangePassword: false,
      emailVerified: true,
      pendingEmail: null,
    });
    assert.ok(Date.parse(result.session.expiresAt) > Date.now());
    assert.equal(findApiSessionUser(await readDocument(), result.session.token)?.id, "alex");
  });
});

test("a wrong password and an unknown email give the same error", async () => {
  await withStore(apiDoc(), async () => {
    assert.deepEqual(await login(ctx(), { email: "alex@example.test", password: "mauvais-mdp" }), {
      ok: false,
      error: "invalidCredentials",
    });
    assert.deepEqual(await login(ctx(), { email: "personne@example.test", password: PASSWORD }), {
      ok: false,
      error: "invalidCredentials",
    });
  });
});

test("20 sign-ins in 15 minutes from one IP: the 21st is refused", async () => {
  await withStore(apiDoc(), async () => {
    for (let i = 0; i < 20; i += 1) await login(ctx(), { email: "personne@example.test", password: "x" });
    await assert.rejects(login(ctx(), { email: "alex@example.test", password: PASSWORD }), isRateLimitError);
  });
});

test("signing out kills the token of this device only", async () => {
  await withStore(apiDoc(), async () => {
    const phone = await login(ctx(), { email: "alex@example.test", password: PASSWORD });
    const tablet = await login(ctx(), { email: "alex@example.test", password: PASSWORD });
    assert.ok(phone.ok && tablet.ok);
    if (!phone.ok || !tablet.ok) return;
    await logout(ctx(), { token: phone.session.token });
    const doc = await readDocument();
    assert.equal(findApiSessionUser(doc, phone.session.token), null);
    assert.equal(findApiSessionUser(doc, tablet.session.token)?.id, "alex");
  });
});

test("a password change invalidates all tokens issued before", async () => {
  await withStore(apiDoc(), async () => {
    const tokens = [];
    for (let i = 0; i < 3; i += 1) {
      const result = await login(ctx(), { email: "alex@example.test", password: PASSWORD });
      if (result.ok) tokens.push(result.session.token);
    }
    await updateDocument(async (doc) => {
      const saved = await changePassword(doc, { userId: "alex", password: "nouveau-mdp-solide" });
      return { doc: saved.ok ? saved.doc : doc, result: saved };
    });
    const doc = await readDocument();
    assert.equal(tokens.filter((token) => findApiSessionUser(doc, token)).length, 0);
  });
});

test("signing up: new account signed in; email already taken without error or token", async () => {
  await withStore(apiDoc(), async () => {
    const created = await register(ctx(), { email: "sam@example.test", password: "mot-de-passe-long", displayName: "Sam" });
    assert.equal(created.ok && created.user?.email, "sam@example.test");
    const taken = await register(ctx(), { email: "alex@example.test", password: "mot-de-passe-long", displayName: "Alex" });
    assert.deepEqual(taken, { ok: true, user: null, verificationUrl: null, mailFailed: false });
    assert.deepEqual(await register(ctx(), { email: "lou@example.test", password: "court", displayName: "Lou" }), {
      ok: false,
      error: "passwordTooShort",
    });
  });
});

test("5 sign-ups per hour from one IP", async () => {
  await withStore(apiDoc(), async () => {
    for (let i = 0; i < 5; i += 1) await register(ctx(), { email: "", password: "", displayName: "" });
    await assert.rejects(register(ctx(), { email: "", password: "", displayName: "" }), isRateLimitError);
  });
});

test("changing one's password: the old one is checked, other sessions are dropped", async () => {
  await withStore(apiDoc(), async () => {
    const other = await login(ctx(), { email: "alex@example.test", password: PASSWORD });
    assert.ok(other.ok);
    const alex = (await readDocument()).users[0]!;
    assert.deepEqual(
      await changeOwnPassword(ctx(alex), { currentPassword: "faux-mot-de-passe", password: "nouveau-mdp-solide" }),
      { ok: false, error: "wrongCurrentPassword" },
    );
    const changed = await changeOwnPassword(ctx(alex), {
      currentPassword: PASSWORD,
      password: "nouveau-mdp-solide",
      openApiSession: true,
    });
    assert.equal(changed.ok, true);
    if (!changed.ok || !other.ok || !changed.session) return;
    const doc = await readDocument();
    assert.equal(findApiSessionUser(doc, other.session.token), null);
    assert.equal(findApiSessionUser(doc, changed.session.token)?.id, "alex", "le nouveau jeton vient de la même écriture");
  });
});

test("a password that must be changed is changed without the old one", async () => {
  const doc = apiDoc();
  doc.users[0]!.mustChangePassword = true;
  await withStore(doc, async () => {
    const changed = await changeOwnPassword(ctx(doc.users[0]!), { password: "nouveau-mdp-solide" });
    assert.equal(changed.ok && changed.user.mustChangePassword, false);
  });
});

test("display name: required", async () => {
  const doc = apiDoc();
  await withStore(doc, async () => {
    assert.deepEqual(await updateOwnDisplayName(ctx(doc.users[0]!), { displayName: " " }), {
      ok: false,
      error: "displayNameRequired",
    });
    const saved = await updateOwnDisplayName(ctx(doc.users[0]!), { displayName: "Alexandra" });
    assert.equal(saved.ok && saved.user.displayName, "Alexandra");
  });
});

test("requesting a reset: same response whether the email exists or not, no link in production", async () => {
  const previous = process.env.NODE_ENV;
  (process.env as Record<string, string>).NODE_ENV = "production";
  try {
    await withStore(apiDoc(), async () => {
      const known = await requestPasswordReset(ctx(), { email: "alex@example.test" });
      const unknown = await requestPasswordReset(ctx(), { email: "personne@example.test" });
      assert.deepEqual(known, { ok: true, resetUrl: null });
      assert.deepEqual(unknown, known);
      assert.equal((await readDocument()).passwordResets.length, 1);
    });
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = previous;
  }
});

test("20 password change attempts in 15 minutes: the 21st is refused", async () => {
  await withStore(apiDoc(), async () => {
    const alex = (await readDocument()).users[0]!;
    for (let i = 0; i < 20; i += 1) {
      await changeOwnPassword(ctx(alex), { currentPassword: "faux-mot-de-passe", password: "nouveau-mdp-solide" });
    }
    await assert.rejects(
      changeOwnPassword(ctx(alex), { currentPassword: PASSWORD, password: "nouveau-mdp-solide" }),
      isRateLimitError,
    );
  });
});

/** Demo database with a reset link for Alex, and that link. */
function docWithReset(now?: Date) {
  const created = createPasswordReset(apiDoc(), { email: "alex@example.test", now });
  if (!created.token) throw new Error("lien de réinitialisation non créé");
  created.doc.users[0]!.emailVerifiedAt = null;
  return { doc: created.doc, token: created.token };
}

test("new password through the link (011): changed, address verified, other sessions dropped", async () => {
  const { doc, token } = docWithReset();
  await withStore(doc, async () => {
    const before = (await readDocument()).users[0]!.sessionVersion ?? 0;
    const result = await resetPasswordWithLink(ctx(), { token, password: "nouveau-mdp-solide", signIn: false });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.session, null);
    const after = await readDocument();
    const alex = after.users[0]!;
    assert.equal(alex.sessionVersion, before + 1);
    assert.notEqual(alex.emailVerifiedAt, null);
    assert.equal(after.passwordResets.length, 0);
    assert.equal((await authenticate(after, "alex@example.test", "nouveau-mdp-solide"))?.id, "alex");
  });
});

test("new password through the link with signIn: an API session for this account", async () => {
  const { doc, token } = docWithReset();
  await withStore(doc, async () => {
    const result = await resetPasswordWithLink(ctx(), { token, password: "nouveau-mdp-solide", signIn: true });
    assert.equal(result.ok && result.session?.user.id, "alex");
    if (!result.ok || !result.session) return;
    assert.equal(findApiSessionUser(await readDocument(), result.session.token)?.id, "alex");
  });
});

test("new password through the link: too short, unknown link, already used or expired", async () => {
  const { doc, token } = docWithReset();
  await withStore(doc, async () => {
    assert.deepEqual(await resetPasswordWithLink(ctx(), { token, password: "court", signIn: false }), {
      ok: false,
      error: "passwordTooShort",
    });
    assert.deepEqual(await resetPasswordWithLink(ctx(), { token: "inconnu", password: "nouveau-mdp-solide", signIn: true }), {
      ok: false,
      error: "resetLinkInvalid",
    });
    assert.equal((await resetPasswordWithLink(ctx(), { token, password: "nouveau-mdp-solide", signIn: false })).ok, true);
    assert.deepEqual(await resetPasswordWithLink(ctx(), { token, password: "autre-mdp-solide", signIn: false }), {
      ok: false,
      error: "resetLinkInvalid",
    });
  });
  const old = docWithReset(new Date(Date.now() - 2 * 60 * 60 * 1000));
  await withStore(old.doc, async () => {
    assert.deepEqual(await resetPasswordWithLink(ctx(), { token: old.token, password: "nouveau-mdp-solide", signIn: false }), {
      ok: false,
      error: "resetLinkExpired",
    });
  });
});

test("20 new password attempts by link in 15 minutes from one IP: the 21st is refused", async () => {
  await withStore(apiDoc(), async () => {
    for (let i = 0; i < 20; i += 1) {
      await resetPasswordWithLink(ctx(), { token: `faux-${i}`, password: "nouveau-mdp-solide", signIn: false });
    }
    await assert.rejects(
      resetPasswordWithLink(ctx(), { token: "faux", password: "nouveau-mdp-solide", signIn: false }),
      isRateLimitError,
    );
  });
});
