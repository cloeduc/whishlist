import assert from "node:assert/strict";
import { test } from "node:test";
import { toMe } from "../../src/server/api/views";
import { emailConfirmationPending } from "../../src/server/commands/context";
import {
  emailConfirmationEnforced,
  emailVerificationRequired,
  mailConfigured,
  mailDryRun,
  mailSmtpUrl,
  sendEmailChangeMail,
  sendEmailVerificationMail,
} from "../../src/server/mail";
import { apiDoc, mailLog, user, withStore } from "./helpers/api-fixtures";
import { withEnv } from "./helpers/env";

test("address verification: off without email sending, on with Resend or simulated sending", async () => {
  await withEnv({ RESEND_API_KEY: undefined, MAIL_FROM: undefined, MAIL_DRY_RUN: undefined, NODE_ENV: "test" }, () => {
    assert.equal(emailVerificationRequired(), false);
  });
  await withEnv({ RESEND_API_KEY: "re_test", MAIL_FROM: "x@example.test", MAIL_DRY_RUN: undefined, NODE_ENV: "test" }, () => {
    assert.equal(emailVerificationRequired(), true);
  });
  await withEnv({ RESEND_API_KEY: undefined, MAIL_FROM: undefined, MAIL_DRY_RUN: "1", NODE_ENV: "test" }, () => {
    assert.equal(mailDryRun(), true);
    assert.equal(emailVerificationRequired(), true);
  });
});

test("MAIL_DRY_RUN is ignored in production", async () => {
  await withEnv({ RESEND_API_KEY: undefined, MAIL_FROM: undefined, MAIL_DRY_RUN: "1", NODE_ENV: "production" }, () => {
    assert.equal(mailDryRun(), false);
    assert.equal(emailVerificationRequired(), false);
  });
});

test("emailConfirmationPending: an account that must change its password does that first", async () => {
  const sam = { ...user("sam", "sam@example.test", "Sam"), emailVerifiedAt: null };
  await withEnv({ RESEND_API_KEY: undefined, MAIL_FROM: undefined, MAIL_DRY_RUN: "1", NODE_ENV: "test" }, () => {
    assert.equal(emailConfirmationPending(sam), true);
    assert.equal(emailConfirmationPending({ ...sam, mustChangePassword: true }), false);
  });
  await withEnv({ RESEND_API_KEY: undefined, MAIL_FROM: undefined, MAIL_DRY_RUN: undefined, NODE_ENV: "test" }, () => {
    assert.equal(emailConfirmationPending(sam), false);
  });
});

test("EMAIL_VERIFICATION_OPTIONAL=1: an unconfirmed address no longer blocks, sending stays on", async () => {
  const sam = { ...user("sam", "sam@example.test", "Sam"), emailVerifiedAt: null };
  const resend = { RESEND_API_KEY: "re_test", MAIL_FROM: "x@example.test", MAIL_DRY_RUN: undefined, NODE_ENV: "production" };
  await withEnv({ ...resend, EMAIL_VERIFICATION_OPTIONAL: "1" }, () => {
    assert.equal(emailVerificationRequired(), true);
    assert.equal(emailConfirmationEnforced(), false);
    assert.equal(emailConfirmationPending(sam), false);
    assert.equal(toMe(sam, null).emailVerified, true);
  });
  await withEnv({ ...resend, EMAIL_VERIFICATION_OPTIONAL: undefined }, () => {
    assert.equal(emailConfirmationEnforced(), true);
    assert.equal(emailConfirmationPending(sam), true);
    assert.equal(toMe(sam, null).emailVerified, false);
  });
});

test("MAIL_SMTP_URL: real sending to a local SMTP server, never in production", async () => {
  const base = { RESEND_API_KEY: undefined, MAIL_FROM: undefined, MAIL_DRY_RUN: undefined };
  await withEnv({ ...base, MAIL_SMTP_URL: "smtp://localhost:1025", NODE_ENV: "test" }, () => {
    assert.equal(mailSmtpUrl(), "smtp://localhost:1025");
    assert.equal(mailConfigured(), true);
    assert.equal(emailVerificationRequired(), true);
  });
  await withEnv({ ...base, MAIL_SMTP_URL: "smtp://localhost:1025", NODE_ENV: "production" }, () => {
    assert.equal(mailSmtpUrl(), null);
    assert.equal(mailConfigured(), false);
  });
  await withEnv({ ...base, MAIL_SMTP_URL: "https://localhost:1080", NODE_ENV: "test" }, () => {
    assert.equal(mailSmtpUrl(), null);
  });
});

test("mail.log in production: confirmation and address change links are redacted (FR-017)", async () => {
  const noMail = { RESEND_API_KEY: undefined, MAIL_FROM: undefined, MAIL_DRY_RUN: undefined, MAIL_SMTP_URL: undefined };
  await withStore(apiDoc(), () =>
    withEnv({ ...noMail, NODE_ENV: "production" }, async () => {
      const verify = "https://ohyoushouldnt.example.test/confirm-email/jeton-verify";
      const change = "https://ohyoushouldnt.example.test/confirm-email/jeton-change";
      await sendEmailVerificationMail({ to: "sam@example.test", confirmUrl: verify, locale: "fr" });
      await sendEmailChangeMail({ to: "sam.b@example.test", confirmUrl: change, locale: "fr" });
      const log = await mailLog();
      assert.match(log, /email-verification .*-> sam@example\.test/);
      assert.match(log, /email-change .*-> sam\.b@example\.test/);
      assert.match(log, /\[redacted-url\]/);
      assert.doesNotMatch(log, /jeton-/);
    }),
  );
});
