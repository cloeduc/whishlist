import "server-only";
import { canAccessPublicListWith } from "../../auth/public-list";
import {
  findGroupGiftByToken,
  groupGiftDetail,
  joinGroupGift as joinGift,
  leaveGroupGift as leaveGift,
  parseAmount,
  type GroupGiftDetail,
} from "../../domain/group-gift";
import type { Database, GroupGift, Reservation, Wishlist } from "../../domain/types";
import { intlLocale } from "../../i18n/config";
import { readDocument, updateDocument } from "../../store/db";
import { rateLimitForIp } from "../rate-limit";
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
