import assert from "node:assert/strict";
import { before, test } from "node:test";
import { findApiSessionUser } from "../../src/auth/api-session";
import { readSession, signSession } from "../../src/auth/session";
import { login, register } from "../../src/server/commands/auth";
import { deleteOwnAccount, exportOwnAccount, previewOwnDeletion } from "../../src/server/commands/account";
import { isRateLimitError } from "../../src/server/rate-limit";
import { readDocument } from "../../src/store/db";
import { apiDoc, ctx, ensurePasswordHash, PASSWORD, TEST_SECRET, withStore } from "./helpers/api-fixtures";

before(ensurePasswordHash);

async function alex() {
  return (await readDocument()).users.find((u) => u.id === "alex")!;
}

test("deleting one's account: requires being signed in with an active account", async () => {
  await withStore(apiDoc(), async () => {
    assert.deepEqual(await deleteOwnAccount(ctx(), { password: PASSWORD }), { ok: false, error: "unauthorized" });
    const forced = { ...(await alex()), mustChangePassword: true };
    assert.deepEqual(await deleteOwnAccount(ctx(forced), { password: PASSWORD }), {
      ok: false,
      error: "mustChangePassword",
    });
    assert.deepEqual(await previewOwnDeletion(ctx()), { ok: false, error: "unauthorized" });
    assert.deepEqual(await previewOwnDeletion(ctx(forced)), { ok: false, error: "mustChangePassword" });
    assert.deepEqual(await exportOwnAccount(ctx(forced)), { ok: false, error: "mustChangePassword" });
  });
});

test("a wrong password changes nothing in the file", async () => {
  await withStore(apiDoc(), async () => {
    const snapshot = await readDocument();
    assert.deepEqual(await deleteOwnAccount(ctx(await alex()), { password: "pas-le-bon" }), {
      ok: false,
      error: "wrongCurrentPassword",
    });
    assert.deepEqual(await readDocument(), snapshot);
  });
});

test("with the right password, the account and its tokens disappear", async () => {
  await withStore(apiDoc(), async () => {
    const session = await login(ctx(), { email: "alex@example.test", password: PASSWORD });
    assert.ok(session.ok);
    if (!session.ok) return;
    const preview = await previewOwnDeletion(ctx(await alex()));
    assert.deepEqual(preview.ok && preview.preview.deletedLists, [{ id: "w", title: "Liste d'Alex" }]);
    assert.deepEqual(await deleteOwnAccount(ctx(await alex()), { password: PASSWORD }), { ok: true });
    const doc = await readDocument();
    assert.equal(doc.users.some((u) => u.id === "alex"), false);
    assert.equal(doc.wishlists.length, 0);
    assert.equal(findApiSessionUser(doc, session.session.token), null);
  });
});

test("after deletion, neither the old password nor the site cookie opens anything (SC-002)", async () => {
  await withStore(apiDoc(), async () => {
    const current = await alex();
    const cookie = signSession(current.id, TEST_SECRET, Date.now(), current.sessionVersion);
    assert.deepEqual(await deleteOwnAccount(ctx(current), { password: PASSWORD }), { ok: true });
    assert.deepEqual(await login(ctx(), { email: "alex@example.test", password: PASSWORD }), {
      ok: false,
      error: "invalidCredentials",
    });
    // The cookie stays signed, but `currentUser` no longer finds its account.
    const claims = readSession(cookie, TEST_SECRET);
    assert.ok(claims);
    assert.equal((await readDocument()).users.some((u) => u.id === claims.userId), false);
  });
});

test("a new sign-up with the same email creates a fresh account, without the old lists (FR-017)", async () => {
  await withStore(apiDoc(), async () => {
    assert.deepEqual(await deleteOwnAccount(ctx(await alex()), { password: PASSWORD }), { ok: true });
    const created = await register(ctx(), { email: "alex@example.test", password: PASSWORD, displayName: "Alex" });
    assert.ok(created.ok && created.user);
    assert.notEqual(created.user.id, "alex");
    const doc = await readDocument();
    assert.deepEqual(
      doc.memberships.filter((m) => m.userId === created.user!.id),
      [],
    );
  });
});

test("10 deletion attempts in 15 minutes: the 11th is refused", async () => {
  await withStore(apiDoc(), async () => {
    const current = await alex();
    for (let i = 0; i < 10; i += 1) await deleteOwnAccount(ctx(current), { password: "pas-le-bon" });
    await assert.rejects(deleteOwnAccount(ctx(current), { password: PASSWORD }), isRateLimitError);
    assert.ok((await readDocument()).users.some((u) => u.id === "alex"));
  });
});

test("downloading one's data: the account document, 5 times per hour", async () => {
  await withStore(apiDoc(), async () => {
    assert.deepEqual(await exportOwnAccount(ctx()), { ok: false, error: "unauthorized" });
    const current = await alex();
    const first = await exportOwnAccount(ctx(current));
    assert.equal(first.ok && first.data.account.email, "alex@example.test");
    assert.equal(first.ok && first.data.lists[0]?.publicUrl, "https://ohyoushouldnt.example.test/l/rt");
    for (let i = 0; i < 4; i += 1) await exportOwnAccount(ctx(current));
    await assert.rejects(exportOwnAccount(ctx(current)), isRateLimitError);
  });
});
