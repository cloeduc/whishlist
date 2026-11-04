import { mustConfirmEmail } from "../../domain/email-confirmation";
import type { User } from "../../domain/types";
import type { Locale } from "../../i18n/config";
import { emailVerificationRequired } from "../mail";

/**
 * What a command knows about the request, without depending on Next:
 * server actions build it from cookies, the API from headers.
 */
export type CommandContext = {
  user: User | null;
  ip: string | null;
  locale: Locale;
  /** Public origin for links (invitation, reset). */
  origin: string;
};

export type CommandResult<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Signed-in account with no pending password change. */
export function activeUser(ctx: CommandContext): { ok: true; user: User } | { ok: false; error: string } {
  if (!ctx.user) return { ok: false, error: "unauthorized" };
  if (ctx.user.mustChangePassword) return { ok: false, error: "mustChangePassword" };
  return { ok: true, user: ctx.user };
}

/**
 * Active account whose address is confirmed, when validation is required (email sending active):
 * only such an account creates a list, joins one or invites (010, FR-005).
 */
export function verifiedUser(ctx: CommandContext): { ok: true; user: User } | { ok: false; error: string } {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  if (emailConfirmationPending(active.user)) return { ok: false, error: "emailNotVerified" };
  return active;
}

/**
 * Active account that still has to confirm its address, with this server's configuration:
 * site banner, link resend. An account that must change its password does that first.
 */
export function emailConfirmationPending(user: User): boolean {
  return !user.mustChangePassword && mustConfirmEmail(user, emailVerificationRequired());
}

/**
 * Account to take into account on the public side (member access, linked reservation, cancellation by account).
 * An account that must change its password only acts as a guest (FR-023).
 */
export function publicAccount(ctx: CommandContext): User | null {
  return ctx.user && !ctx.user.mustChangePassword ? ctx.user : null;
}
