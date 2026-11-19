import "server-only";
import { canAccessPublicListWith } from "../../auth/public-list";
import { signReservationClaim } from "../../auth/reservation-claim";
import { sessionSecret } from "../../auth/session";
import {
  amountFrom,
  findGroupGiftByToken,
  groupGiftDetail,
  joinGroupGift as joinGift,
  leaveGroupGift as leaveGift,
  setGroupGiftStatus,
  setParticipationAmount,
  postGroupGiftMessage,
  deleteGroupGiftMessage,
  type GroupGiftDetail,
} from "../../domain/group-gift";
import type { Database, GroupGift, GroupGiftMessage, GroupGiftStatus, Reservation, Wishlist } from "../../domain/types";
import { intlLocale } from "../../i18n/config";
import { readDocument, updateDocument } from "../../store/db";
import { rateLimitForIp } from "../rate-limit";
import { unlockWishlist } from "./public-list";
import { publicAccount, type CommandContext, type CommandResult } from "./context";

/**
 * « Cadeau commun » (028), reached by the gift's own link: every command finds the list server side
 * and never hands its read link back.
 */

/** The unlock comes from the cookie (site) or from the `X-Read-Unlock` header (API). */
type IsUnlocked = (list: Wishlist) => boolean | Promise<boolean>;
/** Reservations proven by the visitor for this list: claim cookie (site) or `X-Reservation-Claims` (API). */
export type ClaimsFor = (list: Wishlist) => ReadonlySet<string> | Promise<ReadonlySet<string>>;

type Found = { ok: true; doc: Database; gift: GroupGift; wishlist: Wishlist } | { ok: false; error: string };
type Located = Found | { ok: false; error: "readPasswordRequired"; title: string };

/** The gift and its list, found by the gift's token. */
async function findGift(token: string): Promise<Found> {
  const doc = await readDocument();
  const gift = findGroupGiftByToken(doc, token);
  const wishlist = gift ? doc.wishlists.find((w) => w.id === gift.wishlistId) : undefined;
  if (!gift || !wishlist) return { ok: false, error: "groupGiftMissing" };
  return { ok: true, doc, gift, wishlist };
}

/** `findGift`, then the list's access (read password), checked before any read or write. */
async function locate(ctx: CommandContext, token: string, isUnlocked: IsUnlocked): Promise<Located> {
  const found = await findGift(token);
  if (!found.ok) return found;
  if (!(await canAccessPublicListWith(found.doc, found.wishlist, publicAccount(ctx), isUnlocked))) {
    // Only the list's title, as on the public list: never its read link.
    return { ok: false, error: "readPasswordRequired", title: found.wishlist.title };
  }
  return found;
}

export async function readGroupGift(
  ctx: CommandContext,
  input: { token: string; isUnlocked: IsUnlocked; claimsFor: ClaimsFor },
): Promise<CommandResult<{ gift: GroupGiftDetail; wishlist: Wishlist }> | { ok: false; error: "readPasswordRequired"; title: string }> {
  const located = await locate(ctx, input.token, input.isUnlocked);
  if (!located.ok) return located;
  const claimedIds = await input.claimsFor(located.wishlist);
  const gift = groupGiftDetail(
    located.doc,
    located.gift,
    { userId: publicAccount(ctx)?.id ?? null, claimedIds },
    intlLocale(ctx.locale),
  );
  return { ok: true, gift, wishlist: located.wishlist };
}

export async function joinGroupGift(
  ctx: CommandContext,
  input: {
    token: string;
    fromName?: string;
    note?: string;
    /** As typed (site) or already in cents (API). */
    amount?: string | number | null;
    isUnlocked: IsUnlocked;
    claimsFor: ClaimsFor;
  },
): Promise<CommandResult<{ wishlist: Wishlist; reservation: Reservation; claim: string | null }>> {
  const amountCents = amountFrom(input.amount);
  if (amountCents === "invalid") return { ok: false, error: "invalidAmount" };
  const located = await locate(ctx, input.token, input.isUnlocked);
  if (!located.ok) return located;
  const { gift, wishlist } = located;
  // Same bucket as a reservation on the list's link (research R11), keyed on the list, never shown.
  rateLimitForIp(`reserve:${wishlist.readToken.slice(0, 12)}`, ctx.ip, 15, 60 * 60 * 1000);
  const claimedIds = await input.claimsFor(wishlist);
  const result = await write((current) =>
    joinGift(current, {
      groupGiftId: gift.id,
      fromName: input.fromName,
      note: input.note,
      amountCents,
      userId: publicAccount(ctx)?.id ?? null,
      claimedIds,
    }),
  );
  if (!result.ok) return result;
  return { ok: true, wishlist, reservation: result.reservation, claim: reservationClaim(wishlist, result.reservation) };
}

/**
 * « Retirer ma participation »: like cancelling a reservation (`cancelOwn`), it needs the proof
 * (account or claim) but not the read password, so a participant can always withdraw.
 */
export async function leaveGroupGift(
  ctx: CommandContext,
  input: { token: string; reservationId: string; claimsFor: ClaimsFor },
): Promise<CommandResult<{ wishlist: Wishlist }>> {
  rateLimitForIp("group-gift:leave", ctx.ip, 30, 60 * 60 * 1000);
  const found = await findGift(input.token);
  if (!found.ok) return found;
  const { gift, wishlist } = found;
  const claimedIds = await input.claimsFor(wishlist);
  const result = await write((current) =>
    leaveGift(current, {
      groupGiftId: gift.id,
      reservationId: input.reservationId,
      userId: publicAccount(ctx)?.id ?? null,
      claimedIds,
    }),
  );
  if (!result.ok) return result;
  return { ok: true, wishlist };
}

/** « Le cadeau est complet » / « Rouvrir le cadeau » (participant). */
export async function setStatus(
  ctx: CommandContext,
  input: { token: string; status: GroupGiftStatus; isUnlocked: IsUnlocked; claimsFor: ClaimsFor },
): Promise<CommandResult<{ wishlist: Wishlist }>> {
  rateLimitForIp("group-gift:status", ctx.ip, 30, 60 * 60 * 1000);
  const located = await locate(ctx, input.token, input.isUnlocked);
  if (!located.ok) return located;
  const { gift, wishlist } = located;
  const claimedIds = await input.claimsFor(wishlist);
  const result = await write((current) =>
    setGroupGiftStatus(current, {
      groupGiftId: gift.id,
      status: input.status,
      userId: publicAccount(ctx)?.id ?? null,
      claimedIds,
    }),
  );
  if (!result.ok) return result;
  return { ok: true, wishlist };
}

/**
 * The list's read password, typed on the gift's page: the same proof as unlocking the list.
 * Same rate limit bucket as the list's link (keyed on the list, never shown).
 */
export async function unlockGroupGift(
  ctx: CommandContext,
  input: { token: string; password: string },
): Promise<CommandResult<{ wishlist: Wishlist; unlockToken: string | null; expiresAt: string | null }>> {
  const found = await findGift(input.token);
  if (!found.ok) return found;
  rateLimitForIp(`read-unlock:${found.wishlist.readToken.slice(0, 12)}`, ctx.ip, 20, 15 * 60 * 1000);
  return unlockWishlist(ctx, found.doc, found.wishlist, input.password);
}

/** A participant with an account changes or clears their amount (US4). */
export async function setAmount(
  ctx: CommandContext,
  input: { token: string; reservationId: string; amount: string | number | null; isUnlocked: IsUnlocked },
): Promise<CommandResult<{ wishlist: Wishlist }>> {
  rateLimitForIp("group-gift:amount", ctx.ip, 30, 60 * 60 * 1000);
  const account = publicAccount(ctx);
  if (!account) return { ok: false, error: "unauthorized" };
  const amountCents = amountFrom(input.amount);
  if (amountCents === "invalid") return { ok: false, error: "invalidAmount" };
  const located = await locate(ctx, input.token, input.isUnlocked);
  if (!located.ok) return located;
  const { gift, wishlist } = located;
  const result = await write((current) =>
    setParticipationAmount(current, {
      groupGiftId: gift.id,
      reservationId: input.reservationId,
      userId: account.id,
      amountCents,
    }),
  );
  if (!result.ok) return result;
  return { ok: true, wishlist };
}

/** A message in the participants' thread (US5): a participant with an account. */
export async function postMessage(
  ctx: CommandContext,
  input: { token: string; body: string; isUnlocked: IsUnlocked },
): Promise<CommandResult<{ message: GroupGiftMessage }>> {
  rateLimitForIp("group-gift:message", ctx.ip, 30, 60 * 60 * 1000);
  const account = publicAccount(ctx);
  if (!account) return { ok: false, error: "unauthorized" };
  const located = await locate(ctx, input.token, input.isUnlocked);
  if (!located.ok) return located;
  const { gift } = located;
  return write((current) => postGroupGiftMessage(current, { groupGiftId: gift.id, userId: account.id, body: input.body }));
}

/** Its author removes a message. */
export async function deleteMessage(
  ctx: CommandContext,
  input: { token: string; messageId: string; isUnlocked: IsUnlocked },
): Promise<CommandResult> {
  rateLimitForIp("group-gift:message", ctx.ip, 30, 60 * 60 * 1000);
  const account = publicAccount(ctx);
  if (!account) return { ok: false, error: "unauthorized" };
  const located = await locate(ctx, input.token, input.isUnlocked);
  if (!located.ok) return located;
  const { gift } = located;
  const result = await write((current) =>
    deleteGroupGiftMessage(current, { groupGiftId: gift.id, messageId: input.messageId, userId: account.id }),
  );
  return result.ok ? { ok: true } : result;
}

/** Runs a domain change in one transaction: the document changes only when it succeeds. */
function write<T extends { ok: true; doc: Database } | { ok: false; error: string }>(
  change: (current: Database) => T,
): Promise<T> {
  return updateDocument<T>((current) => {
    const result = change(current);
    return { doc: result.ok ? result.doc : current, result };
  });
}

/** Proof of a participation made without an account, as for a reservation (null without a session secret). */
function reservationClaim(wishlist: Wishlist, reservation: Reservation): string | null {
  const secret = sessionSecret();
  return secret ? signReservationClaim(wishlist.readToken, reservation.id, secret) : null;
}
