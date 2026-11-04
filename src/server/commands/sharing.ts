import { findMembership } from "../../domain/access";
import {
  acceptInvite,
  deleteWishlist,
  findWishlistByInvite,
  leaveWishlist,
  regenerateInvite as regenerateInviteRule,
  removeMember as removeMemberRule,
} from "../../domain/membership";
import {
  clearReadPassword as clearReadPasswordRule,
  setReadPassword as setReadPasswordRule,
} from "../../domain/read-password";
import type { Database } from "../../domain/types";
import { normalizeEmail } from "../../domain/users";
import { withLocale } from "../../i18n/locale-path";
import { readDocument, updateDocument } from "../../store/db";
import type { MemberListView } from "../api/views";
import { mailConfigured, sendInviteMail } from "../mail";
import { rateLimitForIp } from "../rate-limit";
import { activeUser, verifiedUser, type CommandContext, type CommandResult } from "./context";
import { memberListView } from "./lists";

type DomainResult = { ok: true; doc: Database } | { ok: false; error: string };
type Written<T extends object> = { ok: true; doc: Database; result: T } | { ok: false; error: string };

/** Result of a domain rule, with no information other than ok / error. */
function done(saved: DomainResult): Written<object> {
  return saved.ok ? { ok: true, doc: saved.doc, result: {} } : saved;
}

/**
 * Applies a member rule on the list and returns its result.
 * A non-member gets `notMember` before the owner-only refusals,
 * so as not to reveal that the list exists.
 */
async function memberWrite<T extends object>(
  ctx: CommandContext,
  wishlistId: string,
  rule: (doc: Database, actorId: string) => Written<T> | Promise<Written<T>>,
): Promise<CommandResult<T>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  return updateDocument<CommandResult<T>>(async (doc) => {
    if (!findMembership(doc, wishlistId, active.user.id)) return { doc, result: { ok: false, error: "notMember" } };
    const saved = await rule(doc, active.user.id);
    if (!saved.ok) return { doc, result: saved };
    return { doc: saved.doc, result: { ok: true, ...saved.result } };
  });
}

function inviteUrl(ctx: CommandContext, inviteToken: string): string {
  return `${ctx.origin}${withLocale(ctx.locale, `/inviter/${inviteToken}`)}`;
}

export async function regenerateInvite(
  ctx: CommandContext,
  input: { wishlistId: string },
): Promise<CommandResult<{ inviteToken: string; inviteUrl: string }>> {
  const result = await memberWrite(ctx, input.wishlistId, (doc, actorId) => {
    const saved = regenerateInviteRule(doc, { ...input, actorId });
    return saved.ok ? { ok: true, doc: saved.doc, result: { inviteToken: saved.inviteToken } } : saved;
  });
  if (!result.ok) return result;
  return { ok: true, inviteToken: result.inviteToken, inviteUrl: inviteUrl(ctx, result.inviteToken) };
}

export async function sendInvite(ctx: CommandContext, input: { wishlistId: string; email: string }): Promise<CommandResult> {
  const active = verifiedUser(ctx);
  if (!active.ok) return active;
  rateLimitForIp(`invite:${active.user.id}`, ctx.ip, 8, 60 * 60 * 1000);
  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) return { ok: false, error: "emailRequired" };
  const doc = await readDocument();
  if (!findMembership(doc, input.wishlistId, active.user.id)) return { ok: false, error: "notMember" };
  const list = doc.wishlists.find((entry) => entry.id === input.wishlistId);
  if (!list) return { ok: false, error: "listMissing" };
  const mail = await sendInviteMail({
    to: email,
    inviteUrl: inviteUrl(ctx, list.inviteToken),
    listTitle: list.title,
    fromName: active.user.displayName,
    locale: ctx.locale,
  });
  if (!mail.sent) return { ok: false, error: mailConfigured() ? "inviteSendFailed" : "mailNotConfigured" };
  return { ok: true };
}

export function setReadPassword(ctx: CommandContext, input: { wishlistId: string; password: string }) {
  return memberWrite(ctx, input.wishlistId, async (doc, actorId) =>
    done(await setReadPasswordRule(doc, { ...input, actorId })),
  );
}

export function clearReadPassword(ctx: CommandContext, input: { wishlistId: string }) {
  return memberWrite(ctx, input.wishlistId, (doc, actorId) => done(clearReadPasswordRule(doc, { ...input, actorId })));
}

export function removeMember(ctx: CommandContext, input: { wishlistId: string; userId: string }) {
  return memberWrite(ctx, input.wishlistId, (doc, actorId) => done(removeMemberRule(doc, { ...input, actorId })));
}

export function leave(ctx: CommandContext, input: { wishlistId: string }) {
  return memberWrite(ctx, input.wishlistId, (doc, actorId) => done(leaveWishlist(doc, { ...input, actorId })));
}

export function deleteList(ctx: CommandContext, input: { wishlistId: string }) {
  return memberWrite(ctx, input.wishlistId, (doc, actorId) => done(deleteWishlist(doc, { ...input, actorId })));
}

/**
 * Preview of an invitation before joining it, in the app (011, R8): the list title, and its
 * identifier if the account is already a member. Writes nothing. Does not require a verified address: only
 * `joinInvite` requires it, and the app then shows the confirmation reminder.
 */
export async function previewInvite(
  ctx: CommandContext,
  input: { token: string },
): Promise<CommandResult<{ title: string; listId: string | null }>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  const doc = await readDocument();
  const wishlist = findWishlistByInvite(doc, input.token);
  if (!wishlist) return { ok: false, error: "inviteLinkBroken" };
  const member = findMembership(doc, wishlist.id, active.user.id);
  return { ok: true, title: wishlist.title, listId: member ? wishlist.id : null };
}

export async function joinInvite(
  ctx: CommandContext,
  input: { token: string },
): Promise<CommandResult<{ list: MemberListView }>> {
  const active = verifiedUser(ctx);
  if (!active.ok) return active;
  const joined = await updateDocument<CommandResult<{ wishlistId: string }>>((doc) => {
    const saved = acceptInvite(doc, { token: input.token, userId: active.user.id });
    return saved.ok ? { doc: saved.doc, result: { ok: true, wishlistId: saved.wishlistId } } : { doc, result: saved };
  });
  if (!joined.ok) return joined;
  return memberListView(ctx, joined.wishlistId, active.user.id);
}
