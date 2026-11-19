import assert from "node:assert/strict";
import { before, test } from "node:test";
import type { Database } from "../../src/domain/types";
import { login, register, requestPasswordReset } from "../../src/server/commands/auth";
import {
  cancelOwnEmailChange,
  confirmEmailWithToken,
  previewEmailConfirmation,
  requestOwnEmailChange,
  resendEmailVerification,
} from "../../src/server/commands/email";
import { createList } from "../../src/server/commands/lists";
import { reserve } from "../../src/server/commands/public-list";
import { joinInvite, sendInvite } from "../../src/server/commands/sharing";
import { isRateLimitError } from "../../src/server/rate-limit";
import { readDocument } from "../../src/store/db";
import {
  apiDoc,
  ctx,
  ensurePasswordHash,
  lastConfirmationToken,
  mailLog,
  PASSWORD,
  withMailDryRun,
  withStore,
} from "./helpers/api-fixtures";
import { withEnv } from "./helpers/env";

before(ensurePasswordHash);

const NEW_LIST = { title: "Ma liste", category: "Livres", person: "Moi" };

/** Alex (owner of « w ») and Camille (no list), both with an unconfirmed address. */
function unverifiedDoc(): Database {
  const doc = apiDoc();
  for (const user of doc.users) user.emailVerifiedAt = null;
  return doc;
}

test("unconfirmed address: creating, joining and inviting are refused when validation is required", async () => {
  await withMailDryRun(() =>
    withStore(unverifiedDoc(), async () => {
      const [alex, camille] = (await readDocument()).users;
      assert.deepEqual(await createList(ctx(camille!), NEW_LIST), { ok: false, error: "emailNotVerified" });
      assert.deepEqual(await joinInvite(ctx(camille!), { token: "it" }), { ok: false, error: "emailNotVerified" });
      assert.deepEqual(await sendInvite(ctx(alex!), { wishlistId: "w", email: "lou@example.test" }), {
        ok: false,
        error: "emailNotVerified",
      });
      // A member's other writes stay possible (R5); only the entry point is guarded.
      assert.equal((await readDocument()).wishlists.length, 1);
    }),
  );
});

test("confirmed address: the guard lets it through", async () => {
  await withMailDryRun(() =>
    withStore(apiDoc(), async () => {
      const camille = (await readDocument()).users[1]!;
      const created = await createList(ctx(camille), NEW_LIST);
      assert.equal(created.ok, true);
      const joined = await joinInvite(ctx(camille), { token: "it" });
      assert.equal(joined.ok, true);
      // The simulated send does not go out: the command reaches the send step, past the guard.
      assert.deepEqual(await sendInvite(ctx(camille), { wishlistId: "w", email: "lou@example.test" }), {
        ok: false,
        error: "mailNotConfigured",
      });
      assert.match(await mailLog(), /invite \(dry run\) -> lou@example\.test/);
    }),
  );
});

test("without email sending, validation is off: nothing is refused (FR-008)", async () => {
  await withStore(unverifiedDoc(), async () => {
    const camille = (await readDocument()).users[1]!;
    assert.equal((await createList(ctx(camille), NEW_LIST)).ok, true);
    assert.equal((await joinInvite(ctx(camille), { token: "it" })).ok, true);
    assert.deepEqual(await sendInvite(ctx(camille), { wishlistId: "w", email: "lou@example.test" }), {
      ok: false,
      error: "mailNotConfigured",
    });
  });
});

test("unconfirmed address: reserving is still possible, with or without an account (US1-7, FR-005)", async () => {
  await withMailDryRun(() =>
    withStore(unverifiedDoc(), async () => {
      const camille = (await readDocument()).users[1]!;
      const noUnlock = () => false;
      const reserved = await reserve(ctx(camille), { readToken: "rt", itemId: "gift", fromName: "Camille", isUnlocked: noUnlock });
      assert.equal(reserved.ok, true);
      assert.equal((await reserve(ctx(), { readToken: "rt", itemId: "gift2", isUnlocked: noUnlock })).ok, true);
    }),
  );
});

test("confirmation: 20 attempts per IP in 15 minutes, the 21st is refused (R13)", async () => {
  await withStore(apiDoc(), async () => {
    for (let attempt = 0; attempt < 20; attempt++) {
      assert.deepEqual(await confirmEmailWithToken(ctx(), { token: `faux-${attempt}` }), {
        ok: false,
        error: "confirmationLinkInvalid",
      });
    }
    await assert.rejects(confirmEmailWithToken(ctx(), { token: "faux-21" }), isRateLimitError);
    // The limit is per IP: another address can still try.
    assert.equal((await confirmEmailWithToken(ctx(null, "203.0.113.9"), { token: "faux" })).ok, false);
  });
});

test("sign-up: a confirmation link is sent, with the next path if it is internal", async () => {
  await withMailDryRun(() =>
    withStore(apiDoc(), async () => {
      const created = await register(ctx(), {
        email: "sam@example.test",
        password: "mot-de-passe-long",
        displayName: "Sam",
        next: "/invite/it",
      });
      assert.ok(created.ok && created.user);
      assert.equal(created.user.emailVerifiedAt, null);
      // In dev, the simulated email was not sent: the link is returned so it can be shown.
      assert.match(created.verificationUrl ?? "", /^https:\/\/ohyoushouldnt\.example\.test\/confirm-email\/[\w-]+\?next=%2Finvite%2Fit$/);
      const log = await mailLog();
      assert.match(log, /email-verification \(dry run\) -> sam@example\.test/);
      const doc = await readDocument();
      assert.deepEqual(
        doc.emailConfirmations.map((c) => [c.userId, c.purpose, c.email]),
        [[created.user.id, "verify", "sam@example.test"]],
      );

      const external = await register(ctx(null, "203.0.113.2"), {
        email: "lou@example.test",
        password: "mot-de-passe-long",
        displayName: "Lou",
        next: "//ailleurs.example",
      });
      assert.ok(external.ok);
      assert.doesNotMatch(external.verificationUrl ?? "", /suite=/);
    }),
  );
});

test("sign-up without email sending: no link, no request", async () => {
  await withStore(apiDoc(), async () => {
    const created = await register(ctx(), { email: "sam@example.test", password: "mot-de-passe-long", displayName: "Sam" });
    assert.ok(created.ok);
    assert.equal(created.verificationUrl, null);
    assert.deepEqual((await readDocument()).emailConfirmations, []);
    assert.equal(await mailLog(), "");
  });
});

test("confirmation: the full address is readable only by its account, and the next path stays internal", async () => {
  await withMailDryRun(() =>
    withStore(apiDoc(), async () => {
      const created = await register(ctx(), { email: "sam@example.test", password: "mot-de-passe-long", displayName: "Sam" });
      assert.ok(created.ok && created.user);
      const token = await lastConfirmationToken();

      const stranger = await previewEmailConfirmation(ctx(), { token });
      assert.deepEqual(stranger, { ok: true, purpose: "verify", email: "sa•••@example.test", ownAccount: false });
      const own = await previewEmailConfirmation(ctx(created.user), { token });
      assert.deepEqual(own, { ok: true, purpose: "verify", email: "sam@example.test", ownAccount: true });

      const confirmed = await confirmEmailWithToken(ctx(), { token, suite: "https://ailleurs.example" });
      assert.deepEqual(confirmed, { ok: true, purpose: "verify", suite: null, ownAccount: false });
      const sam = (await readDocument()).users.find((u) => u.id === created.user!.id)!;
      assert.notEqual(sam.emailVerifiedAt, null);
      assert.deepEqual(await confirmEmailWithToken(ctx(), { token }), { ok: false, error: "confirmationLinkInvalid" });
    }),
  );
});

test("confirmation in the app with the session of the link's account (011): ownAccount true, internal next path kept", async () => {
  await withMailDryRun(() =>
    withStore(apiDoc(), async () => {
      const created = await register(ctx(), { email: "sam@example.test", password: "mot-de-passe-long", displayName: "Sam" });
      assert.ok(created.ok && created.user);
      const token = await lastConfirmationToken();
      const confirmed = await confirmEmailWithToken(ctx(created.user), { token, suite: "/invite/it" });
      assert.deepEqual(confirmed, { ok: true, purpose: "verify", suite: "/invite/it", ownAccount: true });
    }),
  );
});

test("link resend: the new one confirms, the old one is worthless (US2)", async () => {
  await withMailDryRun(() =>
    withStore(unverifiedDoc(), async () => {
      const camille = (await readDocument()).users[1]!;
      const first = await resendEmailVerification(ctx(camille));
      assert.ok(first.ok);
      assert.equal(first.sent, false); // simulated send
      const oldToken = await lastConfirmationToken();
      const second = await resendEmailVerification(ctx(camille));
      assert.ok(second.ok);
      const newToken = await lastConfirmationToken();
      assert.notEqual(newToken, oldToken);
      assert.equal((await readDocument()).emailConfirmations.length, 1);
      assert.deepEqual(await confirmEmailWithToken(ctx(), { token: oldToken }), {
        ok: false,
        error: "confirmationLinkInvalid",
      });
      assert.equal((await confirmEmailWithToken(ctx(), { token: newToken })).ok, true);
    }),
  );
});

test("link resend: refused to a verified account, when validation is not required, or when the password must be changed", async () => {
  await withMailDryRun(() =>
    withStore(apiDoc(), async () => {
      const alex = (await readDocument()).users[0]!;
      assert.deepEqual(await resendEmailVerification(ctx(alex)), { ok: false, error: "emailAlreadyVerified" });
      assert.deepEqual(await resendEmailVerification(ctx({ ...alex, emailVerifiedAt: null, mustChangePassword: true })), {
        ok: false,
        error: "mustChangePassword",
      });
      assert.deepEqual(await resendEmailVerification(ctx()), { ok: false, error: "unauthorized" });
      assert.equal(await mailLog(), "");
    }),
  );
  await withStore(unverifiedDoc(), async () => {
    const camille = (await readDocument()).users[1]!;
    assert.deepEqual(await resendEmailVerification(ctx(camille)), { ok: false, error: "emailAlreadyVerified" });
  });
});

test("link resend: 5 per hour per account, the 6th request is refused", async () => {
  await withMailDryRun(() =>
    withStore(unverifiedDoc(), async () => {
      const camille = (await readDocument()).users[1]!;
      for (let i = 0; i < 5; i += 1) assert.equal((await resendEmailVerification(ctx(camille))).ok, true);
      await assert.rejects(resendEmailVerification(ctx(camille)), isRateLimitError);
    }),
  );
});

test("address change: link to the new one, sign-in unchanged until confirmation, notice to the old one (US3)", async () => {
  await withMailDryRun(() =>
    withStore(apiDoc(), async () => {
      const camille = (await readDocument()).users[1]!;
      const requested = await requestOwnEmailChange(ctx(camille), { email: "Camille.B@example.test", currentPassword: PASSWORD });
      assert.ok(requested.ok);
      assert.equal(requested.me.email, "camille@example.test");
      assert.equal(requested.me.pendingEmail, "camille.b@example.test");
      assert.match(await mailLog(), /email-change \(dry run\) -> camille\.b@example\.test/);
      assert.equal((await login(ctx(), { email: "camille@example.test", password: PASSWORD })).ok, true);

      const token = await lastConfirmationToken();
      const preview = await previewEmailConfirmation(ctx(camille), { token });
      assert.deepEqual(preview, { ok: true, purpose: "change", email: "camille.b@example.test", ownAccount: true });
      const confirmed = await confirmEmailWithToken(ctx(), { token });
      assert.deepEqual(confirmed, { ok: true, purpose: "change", suite: null, ownAccount: false });

      const log = await mailLog();
      const notice = log.slice(log.lastIndexOf("email-changed"));
      assert.match(notice, /^email-changed \(dry run\) -> camille@example\.test/);
      assert.match(notice, /ca•••@example\.test/);
      assert.doesNotMatch(notice, /camille\.b@example\.test|confirm-email|forgot-password|confirmer-email|mot-de-passe-oublie/);
      assert.match(notice, /contact@ohyoushouldnt\.app/);

      assert.deepEqual(await login(ctx(), { email: "camille@example.test", password: PASSWORD }), {
        ok: false,
        error: "invalidCredentials",
      });
      assert.equal((await login(ctx(), { email: "camille.b@example.test", password: PASSWORD })).ok, true);
      // The reset goes to the new address only (FR-016).
      await requestPasswordReset(ctx(), { email: "camille@example.test" });
      await requestPasswordReset(ctx(), { email: "camille.b@example.test" });
      const resets = [...(await mailLog()).matchAll(/password-reset \([^)]*\) -> (\S+)/g)].map((m) => m[1]);
      assert.deepEqual(resets, ["camille.b@example.test"]);
    }),
  );
});

test("address change: wrong password, another account's address, nothing is sent", async () => {
  await withMailDryRun(() =>
    withStore(apiDoc(), async () => {
      const camille = (await readDocument()).users[1]!;
      assert.deepEqual(await requestOwnEmailChange(ctx(camille), { email: "camille.b@example.test", currentPassword: "faux" }), {
        ok: false,
        error: "wrongCurrentPassword",
      });
      // Address of another account: same response as a free address, and nothing is sent to it.
      const taken = await requestOwnEmailChange(ctx(camille), { email: "alex@example.test", currentPassword: PASSWORD });
      assert.ok(taken.ok);
      assert.equal(taken.sent, true);
      assert.equal(taken.me.pendingEmail, "alex@example.test");
      assert.deepEqual(await requestOwnEmailChange(ctx(), { email: "x@example.test", currentPassword: PASSWORD }), {
        ok: false,
        error: "unauthorized",
      });
      assert.equal(await mailLog(), "");
    }),
  );
});

test("address change: cancelled, the received link is worthless", async () => {
  await withMailDryRun(() =>
    withStore(apiDoc(), async () => {
      const camille = (await readDocument()).users[1]!;
      assert.ok((await requestOwnEmailChange(ctx(camille), { email: "camille.b@example.test", currentPassword: PASSWORD })).ok);
      const token = await lastConfirmationToken();
      const cancelled = await cancelOwnEmailChange(ctx(camille));
      assert.ok(cancelled.ok);
      assert.equal(cancelled.me.pendingEmail, null);
      assert.deepEqual(await confirmEmailWithToken(ctx(), { token }), { ok: false, error: "confirmationLinkInvalid" });
    }),
  );
});

test("address change: the same address requested by two accounts goes to the first to confirm", async () => {
  await withMailDryRun(() =>
    withStore(apiDoc(), async () => {
      const [alex, camille] = (await readDocument()).users;
      assert.ok((await requestOwnEmailChange(ctx(alex!), { email: "nous@example.test", currentPassword: PASSWORD })).ok);
      const alexToken = await lastConfirmationToken();
      assert.ok((await requestOwnEmailChange(ctx(camille!), { email: "nous@example.test", currentPassword: PASSWORD })).ok);
      const camilleToken = await lastConfirmationToken();
      assert.equal((await confirmEmailWithToken(ctx(), { token: camilleToken })).ok, true);
      assert.deepEqual(await confirmEmailWithToken(ctx(), { token: alexToken }), { ok: false, error: "emailTaken" });
      const doc = await readDocument();
      assert.equal(doc.users.find((u) => u.id === "alex")!.email, "alex@example.test");
      assert.equal(doc.users.find((u) => u.id === "camille")!.email, "nous@example.test");
      // Alex's request, now impossible, is gone.
      assert.deepEqual(doc.emailConfirmations, []);
    }),
  );
});

test("address change without email sending: applied immediately (FR-015)", async () => {
  await withStore(apiDoc(), async () => {
    const camille = (await readDocument()).users[1]!;
    assert.deepEqual(await requestOwnEmailChange(ctx(camille), { email: "alex@example.test", currentPassword: PASSWORD }), {
      ok: false,
      error: "emailTaken",
    });
    const applied = await requestOwnEmailChange(ctx(camille), { email: "camille.b@example.test", currentPassword: PASSWORD });
    assert.ok(applied.ok);
    assert.equal(applied.me.email, "camille.b@example.test");
    assert.equal(applied.me.pendingEmail, null);
    assert.equal(await mailLog(), "");
    assert.equal((await login(ctx(), { email: "camille.b@example.test", password: PASSWORD })).ok, true);
  });
});

test("address change: 5 requests per hour per account", async () => {
  await withMailDryRun(() =>
    withStore(apiDoc(), async () => {
      const camille = (await readDocument()).users[1]!;
      for (let i = 0; i < 5; i += 1) {
        await requestOwnEmailChange(ctx(camille), { email: `camille${i}@example.test`, currentPassword: PASSWORD });
      }
      await assert.rejects(
        requestOwnEmailChange(ctx(camille), { email: "camille9@example.test", currentPassword: PASSWORD }),
        isRateLimitError,
      );
    }),
  );
});

test("sign-up: a Resend refusal is reported, for a new account as for an already registered address", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("down", { status: 503 });
  try {
    await withEnv({ RESEND_API_KEY: "re_test", MAIL_FROM: "noreply@example.test", MAIL_DRY_RUN: undefined }, () =>
      withStore(apiDoc(), async () => {
        const created = await register(ctx(), { email: "sam@example.test", password: "mot-de-passe-long", displayName: "Sam" });
        assert.ok(created.ok && created.user);
        assert.equal(created.mailFailed, true);
        const taken = await register(ctx(), { email: "alex@example.test", password: "mot-de-passe-long", displayName: "Alex" });
        assert.deepEqual(taken, { ok: true, user: null, verificationUrl: null, mailFailed: true });
      }),
    );
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("a former French return path is translated in the link and after confirmation (018, FR-005)", async () => {
  await withMailDryRun(() =>
    withStore(apiDoc(), async () => {
      const created = await register(ctx(), {
        email: "sam@example.test",
        password: "mot-de-passe-long",
        displayName: "Sam",
        next: "/inviter/it",
      });
      assert.ok(created.ok);
      assert.match(created.verificationUrl ?? "", /\/confirm-email\/[\w-]+\?next=%2Finvite%2Fit$/);
      const token = await lastConfirmationToken();
      const confirmed = await confirmEmailWithToken(ctx(), { token, suite: "/en/inviter/it" });
      assert.deepEqual(confirmed, { ok: true, purpose: "verify", suite: "/en/invite/it", ownAccount: false });
    }),
  );
});
