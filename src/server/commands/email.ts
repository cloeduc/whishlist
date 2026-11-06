import "server-only";
import {
  cancelEmailChange,
  confirmEmail,
  createEmailVerification,
  findEmailConfirmation,
  maskEmail,
  pendingEmailChange,
  requestEmailChange,
} from "../../domain/email-confirmation";
import type { EmailConfirmation } from "../../domain/types";
import { internalPath, withLocale } from "../../i18n/locale-path";
import { readDocument, updateDocument } from "../../store/db";
import { toMe, type MeView } from "../api/views";
import {
  emailVerificationRequired,
  sendEmailChangedNoticeMail,
  sendEmailChangeMail,
  sendEmailVerificationMail,
} from "../mail";
import { rateLimitForIp } from "../rate-limit";
import { activeUser, emailConfirmationPending, type CommandContext, type CommandResult } from "./context";

function confirmUrl(ctx: CommandContext, token: string, suite: string | null): string {
  const page = `${ctx.origin}${withLocale(ctx.locale, `/confirmer-email/${token}`)}`;
  return suite ? `${page}?suite=${encodeURIComponent(suite)}` : page;
}

/** The link is returned only in dev when the email was not sent (shown by the site), never in production. */
function revealed(url: string, sent: boolean): string | null {
  return !sent && process.env.NODE_ENV !== "production" ? url : null;
}

/**
 * Creates (or replaces) the confirmation link of the current address and sends it, outside the transaction.
 * `suite`: where to resume after the confirmation (an invitation, for example).
 */
export async function sendVerificationLink(
  ctx: CommandContext,
  input: { userId: string; suite?: string | null },
): Promise<CommandResult<{ sent: boolean; failed: boolean; verificationUrl: string | null }>> {
  const created = await updateDocument((doc) => {
    const issued = createEmailVerification(doc, { userId: input.userId });
    return { doc: issued.ok ? issued.doc : doc, result: issued };
  });
  if (!created.ok) return created;
  const url = confirmUrl(ctx, created.token, internalPath(input.suite));
  const mail = await sendEmailVerificationMail({ to: created.email, confirmUrl: url, locale: ctx.locale });
  return { ok: true, sent: mail.sent, failed: mail.failed, verificationUrl: revealed(url, mail.sent) };
}

/** Resends the confirmation link (banner, « Mon compte »); the previous link stops being valid (US2). */
export async function resendEmailVerification(
  ctx: CommandContext,
): Promise<CommandResult<{ sent: boolean; failed: boolean; verificationUrl: string | null }>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  rateLimitForIp(`email-verification:${active.user.id}`, ctx.ip, 5, 60 * 60 * 1000);
  if (!emailConfirmationPending(active.user)) return { ok: false, error: "emailAlreadyVerified" };
  return sendVerificationLink(ctx, { userId: active.user.id });
}

/**
 * What the confirmation page shows before the click, without writing anything.
 * The full address is readable only by the account concerned, signed in.
 */
export async function previewEmailConfirmation(
  ctx: CommandContext,
  input: { token: string },
): Promise<CommandResult<{ purpose: EmailConfirmation["purpose"]; email: string; ownAccount: boolean }>> {
  const found = findEmailConfirmation(await readDocument(), { token: input.token });
  if (!found.ok) return found;
  const ownAccount = ctx.user?.id === found.user.id;
  const email = found.confirmation.email;
  return { ok: true, purpose: found.confirmation.purpose, email: ownAccount ? email : maskEmail(email), ownAccount };
}

/** Confirms the link (page button, never on opening: mail antivirus software opens links). */
export async function confirmEmailWithToken(
  ctx: CommandContext,
  input: { token: string; suite?: string | null },
): Promise<CommandResult<{ purpose: EmailConfirmation["purpose"]; suite: string | null; ownAccount: boolean }>> {
  rateLimitForIp("confirm-email", ctx.ip, 20, 15 * 60 * 1000);
  const confirmed = await updateDocument((doc) => {
    const saved = confirmEmail(doc, { token: input.token });
    return { doc: saved.ok ? saved.doc : (saved.doc ?? doc), result: saved };
  });
  if (!confirmed.ok) return { ok: false, error: confirmed.error };
  if (confirmed.purpose === "change") {
    // The old address is notified, without an action link: if it was not them, the contact.
    await sendEmailChangedNoticeMail({
      to: confirmed.previousEmail,
      maskedNewEmail: maskEmail(confirmed.email),
      locale: ctx.locale,
    });
  }
  return {
    ok: true,
    purpose: confirmed.purpose,
    suite: internalPath(input.suite),
    ownAccount: ctx.user?.id === confirmed.userId,
  };
}

/**
 * Address change request (US3), current password required. With email sending active, a link is sent
 * to the new address and the sign-in address changes only on its confirmation; otherwise it changes right away.
 */
export async function requestOwnEmailChange(
  ctx: CommandContext,
  input: { email: string; currentPassword: string },
): Promise<CommandResult<{ me: MeView; sent: boolean; confirmUrl: string | null }>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  rateLimitForIp(`email-change:${active.user.id}`, ctx.ip, 5, 60 * 60 * 1000);
  const immediate = !emailVerificationRequired();
  type Requested = CommandResult<{ me: MeView; token: string | null; email: string; taken: boolean }>;
  const requested = await updateDocument<Requested>(async (doc) => {
    const saved = await requestEmailChange(doc, { userId: active.user.id, ...input, immediate });
    if (!saved.ok) return { doc, result: saved };
    const user = saved.doc.users.find((entry) => entry.id === active.user.id);
    if (!user) return { doc, result: { ok: false, error: "accountMissing" } };
    const me = toMe(user, pendingEmailChange(saved.doc, user.id));
    return { doc: saved.doc, result: { ok: true, me, token: saved.token, email: saved.email, taken: saved.taken } };
  });
  if (!requested.ok) return requested;
  if (!requested.token) return { ok: true, me: requested.me, sent: false, confirmUrl: null };
  // Address of another account: nothing is sent to it, and the response must not let that show.
  if (requested.taken) return { ok: true, me: requested.me, sent: true, confirmUrl: null };
  const url = confirmUrl(ctx, requested.token, null);
  const mail = await sendEmailChangeMail({ to: requested.email, confirmUrl: url, locale: ctx.locale });
  return { ok: true, me: requested.me, sent: mail.sent, confirmUrl: revealed(url, mail.sent) };
}

/** Cancels the pending address change; without a request, does nothing. */
export async function cancelOwnEmailChange(ctx: CommandContext): Promise<CommandResult<{ me: MeView }>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  const me = await updateDocument((doc) => {
    const next = cancelEmailChange(doc, { userId: active.user.id });
    const user = next.users.find((entry) => entry.id === active.user.id);
    return { doc: next, result: user ? toMe(user, null) : null };
  });
  if (!me) return { ok: false, error: "accountMissing" };
  return { ok: true, me };
}
