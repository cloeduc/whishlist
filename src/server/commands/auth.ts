import "server-only";
import { issueApiSession, pruneApiSessions, revokeApiSession } from "../../auth/api-session";
import { pendingEmailChange } from "../../domain/email-confirmation";
import { createPasswordReset, resetPasswordWithToken } from "../../domain/password-reset";
import type { User } from "../../domain/types";
import { authenticate, changePassword, normalizeEmail, registerUser, updateDisplayName } from "../../domain/users";
import { withLocale } from "../../i18n/locale-path";
import { emailVerificationRequired, sendAlreadyRegisteredMail, sendPasswordResetMail } from "../mail";
import { readDocument, updateDocument } from "../../store/db";
import { toMe, type MeView, type SessionView } from "../api/views";
import { rateLimitForIp } from "../rate-limit";
import { activeUser, type CommandContext, type CommandResult } from "./context";
import { sendVerificationLink } from "./email";

/** Checks email and password, with the same limit as the site sign-in. */
export async function checkCredentials(
  ctx: CommandContext,
  input: { email: string; password: string },
): Promise<CommandResult<{ user: User }>> {
  rateLimitForIp("login", ctx.ip, 20, 15 * 60 * 1000);
  const user = await authenticate(await readDocument(), input.email, input.password);
  if (!user) return { ok: false, error: "invalidCredentials" };
  return { ok: true, user };
}

/** Issues an API token for this account, purging dead sessions. */
export async function openApiSession(userId: string): Promise<CommandResult<{ session: SessionView }>> {
  return updateDocument<CommandResult<{ session: SessionView }>>((doc) => {
    const user = doc.users.find((entry) => entry.id === userId);
    if (!user) return { doc, result: { ok: false, error: "accountMissing" } };
    const issued = issueApiSession(pruneApiSessions(doc), user);
    return {
      doc: issued.doc,
      result: {
        ok: true,
        session: {
          token: issued.token,
          expiresAt: issued.session.expiresAt,
          user: toMe(user, pendingEmailChange(doc, user.id)),
        },
      },
    };
  });
}

export async function login(
  ctx: CommandContext,
  input: { email: string; password: string },
): Promise<CommandResult<{ session: SessionView }>> {
  const checked = await checkCredentials(ctx, input);
  if (!checked.ok) return checked;
  return openApiSession(checked.user.id);
}

export async function logout(_ctx: CommandContext, input: { token: string }): Promise<CommandResult> {
  await updateDocument((doc) => ({ doc: revokeApiSession(doc, input.token), result: null }));
  return { ok: true };
}

/**
 * Sign-up. An already registered email gives no error: an email is sent to that address
 * and `user` is null (no sign-in), so as not to reveal existing accounts.
 * With email sending active, a confirmation link is sent to the address (`next`: where to resume afterwards);
 * `verificationUrl` is returned only in dev when the email was not sent.
 */
export async function register(
  ctx: CommandContext,
  input: { email: string; password: string; displayName: string; next?: string | null },
): Promise<CommandResult<{ user: User | null; verificationUrl: string | null; mailFailed: boolean }>> {
  rateLimitForIp("register", ctx.ip, 5, 60 * 60 * 1000);
  const result = await updateDocument(async (doc) => {
    const created = await registerUser(doc, input);
    return { doc: created.ok ? created.doc : doc, result: created };
  });
  if (result.ok) {
    if (!emailVerificationRequired()) return { ok: true, user: result.value, verificationUrl: null, mailFailed: false };
    const link = await sendVerificationLink(ctx, { userId: result.value.id, suite: input.next });
    if (!link.ok) return { ok: true, user: result.value, verificationUrl: null, mailFailed: true };
    return { ok: true, user: result.value, verificationUrl: link.verificationUrl, mailFailed: link.failed };
  }
  if (result.error !== "emailTaken") return result;
  // `mailFailed` also applies to this email: the response does not single out an existing account.
  const mail = await sendAlreadyRegisteredMail({
    to: normalizeEmail(input.email),
    loginUrl: `${ctx.origin}${withLocale(ctx.locale, "/login")}`,
    locale: ctx.locale,
  });
  return { ok: true, user: null, verificationUrl: null, mailFailed: mail.failed };
}

/**
 * Changes the signed-in account's password and invalidates all its sessions.
 * The old password is not asked for if a change is required.
 * With `openApiSession`, a new API token is issued in the same write.
 */
export async function changeOwnPassword(
  ctx: CommandContext,
  input: { password: string; currentPassword?: string; openApiSession?: boolean },
): Promise<CommandResult<{ user: User; session: SessionView | null }>> {
  const user = ctx.user;
  if (!user) return { ok: false, error: "unauthorized" };
  rateLimitForIp(`change-password:${user.id}`, ctx.ip, 20, 15 * 60 * 1000);
  return updateDocument<CommandResult<{ user: User; session: SessionView | null }>>(async (doc) => {
    const saved = await changePassword(doc, {
      userId: user.id,
      password: input.password,
      currentPassword: user.mustChangePassword ? undefined : (input.currentPassword ?? ""),
    });
    if (!saved.ok) return { doc, result: saved };
    if (!input.openApiSession) return { doc: saved.doc, result: { ok: true, user: saved.value, session: null } };
    const issued = issueApiSession(pruneApiSessions(saved.doc), saved.value);
    return {
      doc: issued.doc,
      result: {
        ok: true,
        user: saved.value,
        session: {
          token: issued.token,
          expiresAt: issued.session.expiresAt,
          user: toMe(saved.value, pendingEmailChange(saved.doc, saved.value.id)),
        },
      },
    };
  });
}

/** The signed-in account as the API shows it, even if it must change its password (the client learns it here). */
export async function readMe(ctx: CommandContext): Promise<CommandResult<{ me: MeView }>> {
  if (!ctx.user) return { ok: false, error: "unauthorized" };
  return { ok: true, me: toMe(ctx.user, pendingEmailChange(await readDocument(), ctx.user.id)) };
}

export async function updateOwnDisplayName(
  ctx: CommandContext,
  input: { displayName: string },
): Promise<CommandResult<{ user: User; me: MeView }>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  const result = await updateDocument((doc) => {
    const saved = updateDisplayName(doc, { userId: active.user.id, displayName: input.displayName });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!result.ok) return result;
  return { ok: true, user: result.value, me: toMe(result.value, pendingEmailChange(result.doc, result.value.id)) };
}

/**
 * Sends a reset link that opens the site. Same response whether the email exists or not.
 * `resetUrl` is returned only in dev when the email was not sent (shown by the site), never in production.
 */
export async function requestPasswordReset(
  ctx: CommandContext,
  input: { email: string },
): Promise<CommandResult<{ resetUrl: string | null }>> {
  rateLimitForIp("password-reset", ctx.ip, 5, 60 * 60 * 1000);
  const created = await updateDocument((doc) => {
    const reset = createPasswordReset(doc, { email: input.email });
    return { doc: reset.doc, result: reset };
  });
  if (!created.token || !created.email) return { ok: true, resetUrl: null };
  const resetUrl = `${ctx.origin}${withLocale(ctx.locale, `/reset-password/${created.token}`)}`;
  const mail = await sendPasswordResetMail({ to: created.email, resetUrl, locale: ctx.locale });
  const reveal = !mail.sent && process.env.NODE_ENV !== "production";
  return { ok: true, resetUrl: reveal ? resetUrl : null };
}

/**
 * New password chosen from the link received by email: site page and app (011, R7).
 * The password changes, the address is verified and the other sessions are dropped (`sessionVersion`).
 * With `signIn`, an API session is opened for this account; the site opens its own (cookie) itself.
 */
export async function resetPasswordWithLink(
  ctx: CommandContext,
  input: { token: string; password: string; signIn: boolean },
): Promise<CommandResult<{ userId: string; sessionVersion: number; session: SessionView | null }>> {
  rateLimitForIp("password-reset-confirm", ctx.ip, 20, 15 * 60 * 1000);
  const reset = await updateDocument(async (doc) => {
    const saved = await resetPasswordWithToken(doc, { token: input.token, password: input.password });
    return { doc: saved.ok ? saved.doc : doc, result: saved };
  });
  if (!reset.ok) return { ok: false, error: reset.error };
  if (!input.signIn) return { ok: true, userId: reset.userId, sessionVersion: reset.sessionVersion, session: null };
  const opened = await openApiSession(reset.userId);
  if (!opened.ok) return opened;
  return { ok: true, userId: reset.userId, sessionVersion: reset.sessionVersion, session: opened.session };
}
