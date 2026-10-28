import { canAccessPublicListWith } from "../../auth/public-list";
import { READ_UNLOCK_TTL_SEC, signReadUnlock } from "../../auth/read-unlock";
import { signReservationClaim } from "../../auth/reservation-claim";
import { sessionSecret } from "../../auth/session";
import { cancelOwnReservation } from "../../domain/items";
import { findWishlistByReadToken, mineReservationIdsFor } from "../../domain/read";
import { verifyReadPassword } from "../../domain/read-password";
import { reserveItem } from "../../domain/reserve";
import type { Reservation, Wishlist } from "../../domain/types";
import { readDocument, updateDocument } from "../../store/db";
import { toPublicListView, type PublicListView } from "../api/views";
import { rateLimitForIp } from "../rate-limit";
import { publicAccount, type CommandContext, type CommandResult } from "./context";

/** Le déverrouillage vient du cookie (site) ou de l'en-tête `X-Read-Unlock` (API). */
type IsUnlocked = (list: Wishlist) => boolean | Promise<boolean>;

export async function readPublicList(
  ctx: CommandContext,
  input: { readToken: string; isUnlocked: IsUnlocked; claimedIds: ReadonlySet<string> },
): Promise<CommandResult<{ list: PublicListView }> | { ok: false; error: "readPasswordRequired"; title: string }> {
  const doc = await readDocument();
  const wishlist = findWishlistByReadToken(doc, input.readToken);
  if (!wishlist) return { ok: false, error: "listMissing" };
  const account = publicAccount(ctx);
  if (!(await canAccessPublicListWith(doc, wishlist, account, input.isUnlocked))) {
    return { ok: false, error: "readPasswordRequired", title: wishlist.title };
  }
  const mineIds = mineReservationIdsFor(doc, wishlist.id, account?.id ?? null, input.claimedIds);
  return { ok: true, list: toPublicListView(doc, wishlist, ctx.locale, mineIds) };
}

export async function unlockPublicList(
  ctx: CommandContext,
  input: { readToken: string; password: string },
): Promise<CommandResult<{ wishlist: Wishlist; unlockToken: string | null; expiresAt: string | null }>> {
  rateLimitForIp(`read-unlock:${input.readToken.slice(0, 12)}`, ctx.ip, 20, 15 * 60 * 1000);
  const doc = await readDocument();
  const wishlist = findWishlistByReadToken(doc, input.readToken);
  if (!wishlist) return { ok: false, error: "listMissing" };
  if (!(await verifyReadPassword(wishlist, input.password))) return { ok: false, error: "badPassword" };
  const secret = sessionSecret();
  if (!secret || !wishlist.readPasswordHash) return { ok: true, wishlist, unlockToken: null, expiresAt: null };
  const now = Date.now();
  return {
    ok: true,
    wishlist,
    unlockToken: signReadUnlock(wishlist, secret, now),
    expiresAt: new Date(now + READ_UNLOCK_TTL_SEC * 1000).toISOString(),
  };
}

export async function reserve(
  ctx: CommandContext,
  input: {
    readToken: string;
    itemId: string;
    typeId?: string;
    fromName?: string;
    note?: string;
    isUnlocked: IsUnlocked;
  },
): Promise<CommandResult<{ wishlist: Wishlist; reservation: Reservation; claim: string | null }>> {
  rateLimitForIp(`reserve:${input.readToken.slice(0, 12)}`, ctx.ip, 15, 60 * 60 * 1000);
  const account = publicAccount(ctx);
  const doc = await readDocument();
  const wishlist = findWishlistByReadToken(doc, input.readToken);
  if (!wishlist) return { ok: false, error: "listMissing" };
  if (!(await canAccessPublicListWith(doc, wishlist, account, input.isUnlocked))) {
    return { ok: false, error: "readPasswordRequired" };
  }
  type Reserved = { ok: true; reservation: Reservation } | { ok: false; error: string };
  const result = await updateDocument<Reserved>((current) => {
    const saved = reserveItem(current, {
      wishlistId: wishlist.id,
      itemId: input.itemId,
      typeId: input.typeId,
      fromName: input.fromName,
      note: input.note,
      userId: account?.id ?? null,
    });
    return { doc: saved.ok ? saved.doc : current, result: saved };
  });
  if (!result.ok) return result;
  const secret = sessionSecret();
  const claim = secret ? signReservationClaim(input.readToken, result.reservation.id, secret) : null;
  return { ok: true, wishlist, reservation: result.reservation, claim };
}

export async function cancelOwn(
  ctx: CommandContext,
  input: { readToken: string; reservationId: string; claimedIds: ReadonlySet<string> },
): Promise<CommandResult<{ wishlist: Wishlist }>> {
  const doc = await readDocument();
  const wishlist = findWishlistByReadToken(doc, input.readToken);
  if (!wishlist) return { ok: false, error: "listMissing" };
  const result = await updateDocument((current) => {
    const saved = cancelOwnReservation(current, {
      wishlistId: wishlist.id,
      reservationId: input.reservationId,
      userId: publicAccount(ctx)?.id ?? null,
      claimedIds: input.claimedIds,
    });
    return { doc: saved.ok ? saved.doc : current, result: saved };
  });
  if (!result.ok) return result;
  return { ok: true, wishlist };
}
