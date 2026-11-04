import { clone } from "./access";
import { verifyPassword } from "./passwords";
import { hashSecretToken, newId, newSecretToken } from "./tokens";
import type { Database, EmailConfirmation, User } from "./types";
import { normalizeEmail, setUserEmail, validateNewEmail } from "./users";

/** Validity of a confirmation link: 24 h (versus 1 h for the password reset, more sensitive). */
const TTL_MS = 24 * 60 * 60 * 1000;

type Err = { ok: false; error: string };

export function isEmailVerified(user: User): boolean {
  return user.emailVerifiedAt !== null;
}

/** The account still has to confirm its address: confirmation is required (email sending on) and the address is not confirmed. */
export function mustConfirmEmail(user: User, verificationRequired: boolean): boolean {
  return verificationRequired && !isEmailVerified(user);
}

/** `camille@example.test` → `ca•••@example.test`: enough to recognize one's address, not to read it. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return "•••";
  const local = email.slice(0, at);
  const shown = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
  return `${shown}•••${email.slice(at)}`;
}

/** Replaces the account's request for this purpose: only the last link sent stays valid. */
function issue(
  doc: Database,
  input: { userId: string; purpose: EmailConfirmation["purpose"]; email: string; now: Date },
): { doc: Database; token: string } {
  const token = newSecretToken();
  const next = clone(doc);
  next.emailConfirmations = next.emailConfirmations.filter(
    (entry) => !(entry.userId === input.userId && entry.purpose === input.purpose),
  );
  next.emailConfirmations.push({
    id: newId(),
    userId: input.userId,
    purpose: input.purpose,
    email: input.email,
    tokenHash: hashSecretToken(token),
    expiresAt: new Date(input.now.getTime() + TTL_MS).toISOString(),
    createdAt: input.now.toISOString(),
  });
  return { doc: next, token };
}

/** Confirmation link for the account's current address. */
export function createEmailVerification(
  doc: Database,
  input: { userId: string; now?: Date },
): { ok: true; doc: Database; token: string; email: string } | Err {
  const user = doc.users.find((entry) => entry.id === input.userId);
  if (!user) return { ok: false, error: "accountMissing" };
  const issued = issue(doc, { userId: user.id, purpose: "verify", email: user.email, now: input.now ?? new Date() });
  return { ok: true, doc: issued.doc, token: issued.token, email: user.email };
}

/**
 * Address change request (current password required). With `immediate` (no email sending),
 * the address changes right away; otherwise a link is sent to the new one and nothing changes until it is opened.
 * A pending address is not reserved: the first account that confirms it gets it.
 * Another account's address gets the same answer as a free address (`taken`: no email must
 * be sent), so as not to reveal accounts, like sign-up; the confirmation would refuse it.
 */
export async function requestEmailChange(
  doc: Database,
  input: { userId: string; email: string; currentPassword: string; immediate: boolean; now?: Date },
): Promise<
  { ok: true; doc: Database; token: string | null; email: string; previousEmail: string; taken: boolean } | Err
> {
  const user = doc.users.find((entry) => entry.id === input.userId);
  if (!user) return { ok: false, error: "accountMissing" };
  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    return { ok: false, error: "wrongCurrentPassword" };
  }
  const checked = validateNewEmail(doc, user.id, input.email);
  const taken = !checked.ok && checked.error === "emailTaken";
  // Without email sending, the address would apply right away: another account's address is refused.
  if (!checked.ok && (!taken || input.immediate)) return checked;
  const email = checked.ok ? checked.email : normalizeEmail(input.email);
  if (email === user.email) return { ok: false, error: "emailUnchanged" };
  const now = input.now ?? new Date();
  if (input.immediate) {
    const saved = setUserEmail(doc, { userId: user.id, email, now });
    if (!saved.ok) return saved;
    saved.doc.emailConfirmations = saved.doc.emailConfirmations.filter((entry) => entry.userId !== user.id);
    return { ok: true, doc: saved.doc, token: null, email, previousEmail: user.email, taken: false };
  }
  const issued = issue(doc, { userId: user.id, purpose: "change", email, now });
  return { ok: true, doc: issued.doc, token: issued.token, email, previousEmail: user.email, taken };
}

/** Cancels the pending change: its link is no longer valid. Without a request, does nothing. */
export function cancelEmailChange(doc: Database, input: { userId: string }): Database {
  const next = clone(doc);
  next.emailConfirmations = next.emailConfirmations.filter(
    (entry) => !(entry.userId === input.userId && entry.purpose === "change"),
  );
  return next;
}

/** New address awaiting confirmation (link still valid), or null. */
export function pendingEmailChange(doc: Database, userId: string, now = new Date()): string | null {
  const pending = doc.emailConfirmations.find(
    (entry) => entry.userId === userId && entry.purpose === "change" && Date.parse(entry.expiresAt) > now.getTime(),
  );
  return pending?.email ?? null;
}

/**
 * Valid request for this token, without writing anything (confirmation page before the click).
 * A `verify` request whose address is no longer the account's is no longer valid.
 */
export function findEmailConfirmation(
  doc: Database,
  input: { token: string; now?: Date },
): { ok: true; confirmation: EmailConfirmation; user: User } | Err {
  const token = input.token.trim();
  if (!token) return { ok: false, error: "confirmationLinkInvalid" };
  const tokenHash = hashSecretToken(token);
  const confirmation = doc.emailConfirmations.find((entry) => entry.tokenHash === tokenHash);
  if (!confirmation) return { ok: false, error: "confirmationLinkInvalid" };
  const user = doc.users.find((entry) => entry.id === confirmation.userId);
  if (!user) return { ok: false, error: "confirmationLinkInvalid" };
  if (confirmation.purpose === "verify" && confirmation.email !== user.email) {
    return { ok: false, error: "confirmationLinkInvalid" };
  }
  if (Date.parse(confirmation.expiresAt) <= (input.now ?? new Date()).getTime()) {
    return { ok: false, error: "confirmationLinkExpired" };
  }
  return { ok: true, confirmation, user };
}

/**
 * Confirms the link (single use). `verify`: the current address is verified. `change`: the new address
 * becomes the sign-in address, verified, if no other account took it in the meantime; otherwise `emailTaken`,
 * and the request, now impossible, is removed (`doc` returned with the refusal).
 */
export function confirmEmail(
  doc: Database,
  input: { token: string; now?: Date },
):
  | { ok: true; doc: Database; purpose: EmailConfirmation["purpose"]; userId: string; email: string; previousEmail: string }
  | (Err & { doc?: Database }) {
  const now = input.now ?? new Date();
  const found = findEmailConfirmation(doc, { token: input.token, now });
  if (!found.ok) return found;
  const { confirmation } = found;
  const previousEmail = found.user.email;
  if (confirmation.purpose === "change") {
    const saved = setUserEmail(doc, { userId: confirmation.userId, email: confirmation.email, now });
    if (!saved.ok) {
      return { ...saved, doc: cancelEmailChange(doc, { userId: confirmation.userId }) };
    }
    saved.doc.emailConfirmations = saved.doc.emailConfirmations.filter((entry) => entry.userId !== confirmation.userId);
    return { ok: true, doc: saved.doc, purpose: "change", userId: confirmation.userId, email: confirmation.email, previousEmail };
  }
  const next = clone(doc);
  const user = next.users.find((entry) => entry.id === confirmation.userId);
  if (!user) return { ok: false, error: "confirmationLinkInvalid" };
  if (user.emailVerifiedAt === null) user.emailVerifiedAt = now.toISOString();
  next.emailConfirmations = next.emailConfirmations.filter(
    (entry) => !(entry.userId === user.id && entry.purpose === "verify"),
  );
  return { ok: true, doc: next, purpose: confirmation.purpose, userId: user.id, email: user.email, previousEmail };
}
