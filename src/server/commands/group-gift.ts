import "server-only";
import { canAccessPublicListWith } from "../../auth/public-list";
import {
  findGroupGiftByToken,
  groupGiftDetail,
  joinGroupGift as joinGift,
  leaveGroupGift as leaveGift,
  parseAmount,
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

type Located = { ok: true; doc: Database; gift: GroupGift; wishlist: Wishlist } | { ok: false; error: string; title?: string };

async function locate(ctx: CommandContext, token: string, isUnlocked: IsUnlocked): Promise<Located> {
  const doc = await readDocument();
  const gift = findGroupGiftByToken(doc, token);
  const wishlist = gift ? doc.wishlists.find((w) => w.id === gift.wishlistId) : undefined;
  if (!gift || !wishlist) return { ok: false, error: "groupGiftMissing" };
  if (!(await canAccessPublicListWith(doc, wishlist, publicAccount(ctx), isUnlocked))) {
    // Only the list's title, as on the public list: never its read link.
    return { ok: false, error: "readPasswordRequired", title: wishlist.title };
  }
  return { ok: true, doc, gift, wishlist };
}

export async function readGroupGift(
  ctx: CommandContext,
  input: { token: string; isUnlocked: IsUnlocked; claimsFor: ClaimsFor },
): Promise<CommandResult<{ gift: GroupGiftDetail; wishlist: Wishlist }> | { ok: false; error: "readPasswordRequired"; title: string }> {
  const located = await locate(ctx, input.token, input.isUnlocked);
  if (!located.ok) {
    if (located.error === "readPasswordRequired") return { ok: false, error: "readPasswordRequired", title: located.title ?? "" };
    return { ok: false, error: located.error };
  }
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
): Promise<CommandResult<{ wishlist: Wishlist; reservation: Reservation }>> {
  rateLimitForIp(`reserve:gift:${input.token.slice(0, 12)}`, ctx.ip, 15, 60 * 60 * 1000);
  const amountCents = typeof input.amount === "string" ? parseAmount(input.amount) : (input.amount ?? null);
  if (amountCents === "invalid") return { ok: false, error: "invalidAmount" };
  const located = await locate(ctx, input.token, input.isUnlocked);
  if (!located.ok) return { ok: false, error: located.error };
  const claimedIds = await input.claimsFor(located.wishlist);
  type Joined = { ok: true; reservation: Reservation } | { ok: false; error: string };
  const result = await updateDocument<Joined>((current) => {
    const gift = findGroupGiftByToken(current, input.token);
    if (!gift) return { doc: current, result: { ok: false, error: "groupGiftMissing" } };
    const saved = joinGift(current, {
      groupGiftId: gift.id,
      fromName: input.fromName,
      note: input.note,
      amountCents,
      userId: publicAccount(ctx)?.id ?? null,
      claimedIds,
    });
    return { doc: saved.ok ? saved.doc : current, result: saved };
  });
  if (!result.ok) return result;
  return { ok: true, wishlist: located.wishlist, reservation: result.reservation };
}

export async function leaveGroupGift(
  ctx: CommandContext,
  input: { token: string; reservationId: string; claimsFor: ClaimsFor },
): Promise<CommandResult<{ wishlist: Wishlist }>> {
  rateLimitForIp("group-gift:leave", ctx.ip, 30, 60 * 60 * 1000);
  const doc = await readDocument();
  const gift = findGroupGiftByToken(doc, input.token);
  const wishlist = gift ? doc.wishlists.find((w) => w.id === gift.wishlistId) : undefined;
  if (!gift || !wishlist) return { ok: false, error: "groupGiftMissing" };
  const claimedIds = await input.claimsFor(wishlist);
  const result = await updateDocument((current) => {
    const saved = leaveGift(current, {
      groupGiftId: gift.id,
      reservationId: input.reservationId,
      userId: publicAccount(ctx)?.id ?? null,
      claimedIds,
    });
    return { doc: saved.ok ? saved.doc : current, result: saved };
  });
  if (!result.ok) return result;
  return { ok: true, wishlist };
}

/** « Le cadeau est complet » / « Rouvrir le cadeau » (participant). */
export async function setStatus(
  ctx: CommandContext,
  input: { token: string; status: GroupGiftStatus; claimsFor: ClaimsFor },
): Promise<CommandResult<{ wishlist: Wishlist }>> {
  rateLimitForIp("group-gift:status", ctx.ip, 30, 60 * 60 * 1000);
  const doc = await readDocument();
  const gift = findGroupGiftByToken(doc, input.token);
  const wishlist = gift ? doc.wishlists.find((w) => w.id === gift.wishlistId) : undefined;
  if (!gift || !wishlist) return { ok: false, error: "groupGiftMissing" };
  const claimedIds = await input.claimsFor(wishlist);
  const result = await updateDocument((current) => {
    const saved = setGroupGiftStatus(current, {
      groupGiftId: gift.id,
      status: input.status,
      userId: publicAccount(ctx)?.id ?? null,
      claimedIds,
    });
    return { doc: saved.ok ? saved.doc : current, result: saved };
  });
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
  const doc = await readDocument();
  const gift = findGroupGiftByToken(doc, input.token);
  const wishlist = gift ? doc.wishlists.find((w) => w.id === gift.wishlistId) : undefined;
  if (!gift || !wishlist) return { ok: false, error: "groupGiftMissing" };
  rateLimitForIp(`read-unlock:${wishlist.readToken.slice(0, 12)}`, ctx.ip, 20, 15 * 60 * 1000);
  return unlockWishlist(ctx, doc, wishlist, input.password);
}

/** A participant with an account changes or clears their amount (US4). */
export async function setAmount(
  ctx: CommandContext,
  input: { token: string; reservationId: string; amount: string | number | null },
): Promise<CommandResult<{ wishlist: Wishlist }>> {
  rateLimitForIp("group-gift:amount", ctx.ip, 30, 60 * 60 * 1000);
  const account = publicAccount(ctx);
  if (!account) return { ok: false, error: "unauthorized" };
  const amountCents = typeof input.amount === "string" ? parseAmount(input.amount) : input.amount;
  if (amountCents === "invalid") return { ok: false, error: "invalidAmount" };
  const doc = await readDocument();
  const gift = findGroupGiftByToken(doc, input.token);
  const wishlist = gift ? doc.wishlists.find((w) => w.id === gift.wishlistId) : undefined;
  if (!gift || !wishlist) return { ok: false, error: "groupGiftMissing" };
  const result = await updateDocument((current) => {
    const saved = setParticipationAmount(current, {
      groupGiftId: gift.id,
      reservationId: input.reservationId,
      userId: account.id,
      amountCents,
    });
    return { doc: saved.ok ? saved.doc : current, result: saved };
  });
  if (!result.ok) return result;
  return { ok: true, wishlist };
}

/** A message in the participants' thread (US5): a participant with an account. */
export async function postMessage(
  ctx: CommandContext,
  input: { token: string; body: string },
): Promise<CommandResult<{ message: GroupGiftMessage }>> {
  rateLimitForIp("group-gift:message", ctx.ip, 30, 60 * 60 * 1000);
  const account = publicAccount(ctx);
  if (!account) return { ok: false, error: "unauthorized" };
  type Posted = { ok: true; message: GroupGiftMessage } | { ok: false; error: string };
  return updateDocument<Posted>((current) => {
    const gift = findGroupGiftByToken(current, input.token);
    if (!gift) return { doc: current, result: { ok: false, error: "groupGiftMissing" } };
    const saved = postGroupGiftMessage(current, { groupGiftId: gift.id, userId: account.id, body: input.body });
    return { doc: saved.ok ? saved.doc : current, result: saved };
  });
}

/** Its author removes a message. */
export async function deleteMessage(
  ctx: CommandContext,
  input: { token: string; messageId: string },
): Promise<CommandResult> {
  const account = publicAccount(ctx);
  if (!account) return { ok: false, error: "unauthorized" };
  return updateDocument<CommandResult>((current) => {
    const gift = findGroupGiftByToken(current, input.token);
    if (!gift) return { doc: current, result: { ok: false, error: "groupGiftMissing" } };
    const saved = deleteGroupGiftMessage(current, { groupGiftId: gift.id, messageId: input.messageId, userId: account.id });
    return saved.ok ? { doc: saved.doc, result: { ok: true } } : { doc: current, result: saved };
  });
}
