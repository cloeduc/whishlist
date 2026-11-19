import "server-only";
import { canAccessPublicListWith } from "../../auth/public-list";
import { READ_UNLOCK_TTL_SEC, signReadUnlock } from "../../auth/read-unlock";
import { signReservationClaim } from "../../auth/reservation-claim";
import { sessionSecret } from "../../auth/session";
import { findMembership } from "../../domain/access";
import { amountFrom, groupGiftOfItem, startGroupGift } from "../../domain/group-gift";
import { cancelOwnReservation } from "../../domain/items";
import { findWishlistByReadToken, mineReservationIdsFor } from "../../domain/read";
import { hasReadPassword, verifyReadPassword } from "../../domain/read-password";
import { reserveItem } from "../../domain/reserve";
import { extractReadToken } from "../../domain/read-link";
import {
  findSubscription,
  renameSubscription,
  subscribeWishlist,
  syncSubscriptionUnlock,
  unsubscribeWishlist,
} from "../../domain/subscription";
import type { Database, Reservation, Wishlist } from "../../domain/types";
import { readDocument, updateDocument } from "../../store/db";
import {
  toPublicListView,
  toSubscribedListSummary,
  type PublicListView,
  type SubscribedListSummaryView,
} from "../api/views";
import { rateLimitForIp } from "../rate-limit";
import { activeUser, publicAccount, type CommandContext, type CommandResult } from "./context";

/** The unlock comes from the cookie (site) or from the `X-Read-Unlock` header (API). */
type IsUnlocked = (list: Wishlist) => boolean | Promise<boolean>;

export async function readPublicList(
  ctx: CommandContext,
  input: {
    readToken: string;
    isUnlocked: IsUnlocked;
    claimedIds: ReadonlySet<string>;
    /** The client knows group gifts (028, `groupGifts=true`). */
    groupGifts?: boolean;
  },
): Promise<CommandResult<{ list: PublicListView }> | { ok: false; error: "readPasswordRequired"; title: string }> {
  const doc = await readDocument();
  const wishlist = findWishlistByReadToken(doc, input.readToken);
  if (!wishlist) return { ok: false, error: "listMissing" };
  const account = publicAccount(ctx);
  if (!(await canAccessPublicListWith(doc, wishlist, account, input.isUnlocked))) {
    return { ok: false, error: "readPasswordRequired", title: wishlist.title };
  }
  const mineIds = mineReservationIdsFor(doc, wishlist.id, account?.id ?? null, input.claimedIds);
  return {
    ok: true,
    list: toPublicListView(doc, wishlist, ctx.locale, mineIds, account?.id ?? null, { groupGifts: input.groupGifts }),
  };
}

export async function unlockPublicList(
  ctx: CommandContext,
  input: { readToken: string; password: string },
): Promise<CommandResult<{ wishlist: Wishlist; unlockToken: string | null; expiresAt: string | null }>> {
  rateLimitForIp(`read-unlock:${input.readToken.slice(0, 12)}`, ctx.ip, 20, 15 * 60 * 1000);
  const doc = await readDocument();
  const wishlist = findWishlistByReadToken(doc, input.readToken);
  if (!wishlist) return { ok: false, error: "listMissing" };
  return unlockWishlist(ctx, doc, wishlist, input.password);
}

/**
 * Checks the list's read password and gives the unlock proof (cookie on the site, `unlockToken` for the API).
 * Shared by the list's link and a group gift's link (028); the caller applies the rate limit.
 */
export async function unlockWishlist(
  ctx: CommandContext,
  doc: Database,
  wishlist: Wishlist,
  password: string,
): Promise<CommandResult<{ wishlist: Wishlist; unlockToken: string | null; expiresAt: string | null }>> {
  if (!(await verifyReadPassword(wishlist, password))) return { ok: false, error: "badPassword" };
  const account = publicAccount(ctx);
  const subscription = account ? findSubscription(doc, wishlist.id, account.id) : null;
  if (account && subscription && subscription.readPasswordHash !== wishlist.readPasswordHash) {
    // The checked hash is the one from `wishlist`: if the password changes during the check,
    // the subscription does not store the new hash.
    await updateDocument((current) => ({
      doc: syncSubscriptionUnlock(current, {
        wishlistId: wishlist.id,
        userId: account.id,
        verifiedHash: wishlist.readPasswordHash,
      }),
      result: undefined,
    }));
  }
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

export async function subscribeToList(
  ctx: CommandContext,
  input: {
    urlOrToken: string;
    password?: string;
    isUnlocked?: IsUnlocked;
  },
): Promise<
  | CommandResult<{ subscription: SubscribedListSummaryView; replayed: boolean }>
  | { ok: false; error: "readPasswordRequired"; title: string; readToken: string }
> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  rateLimitForIp(`subscribe:${active.user.id}`, ctx.ip, 30, 15 * 60 * 1000);

  const readToken = extractReadToken(input.urlOrToken);
  if (!readToken) return { ok: false, error: "subscriptionLinkInvalid" };

  const doc = await readDocument();
  const wishlist = findWishlistByReadToken(doc, readToken);
  if (!wishlist) return { ok: false, error: "listMissing" };
  if (findMembership(doc, wishlist.id, active.user.id)) {
    return { ok: false, error: "alreadyMember" };
  }

  if (hasReadPassword(wishlist)) {
    const alreadyUnlocked = input.isUnlocked
      ? await canAccessPublicListWith(doc, wishlist, active.user, input.isUnlocked)
      : false;
    if (!alreadyUnlocked) {
      if (!input.password) {
        return { ok: false, error: "readPasswordRequired", title: wishlist.title, readToken: wishlist.readToken };
      }
      rateLimitForIp(`read-unlock:${wishlist.readToken.slice(0, 12)}`, ctx.ip, 20, 15 * 60 * 1000);
      if (!(await verifyReadPassword(wishlist, input.password))) {
        return { ok: false, error: "badPassword" };
      }
    }
  }

  type Saved =
    | { ok: true; subscription: SubscribedListSummaryView; replayed: boolean }
    | { ok: false; error: string };
  const saved = await updateDocument<Saved>((current) => {
    // Access was checked against `wishlist.readPasswordHash`: the domain refuses if it has changed since.
    const result = subscribeWishlist(current, {
      wishlistId: wishlist.id,
      userId: active.user.id,
      verifiedHash: wishlist.readPasswordHash,
    });
    if (!result.ok) return { doc: current, result };
    const freshList = result.doc.wishlists.find((entry) => entry.id === wishlist.id)!;
    return {
      doc: result.doc,
      result: {
        ok: true,
        replayed: result.replayed,
        subscription: toSubscribedListSummary(result.doc, freshList, result.subscription, ctx.locale, ctx.origin),
      },
    };
  });
  if (!saved.ok) {
    if (saved.error === "readPasswordChanged") {
      return { ok: false, error: "readPasswordRequired", title: wishlist.title, readToken: wishlist.readToken };
    }
    return saved;
  }
  return saved;
}

export async function unsubscribeFromList(
  ctx: CommandContext,
  input: { readToken: string },
): Promise<CommandResult<{ wishlist: Wishlist }>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  const doc = await readDocument();
  const wishlist = findWishlistByReadToken(doc, input.readToken);
  if (!wishlist) return { ok: false, error: "listMissing" };
  const result = await updateDocument<CommandResult>((current) => {
    const saved = unsubscribeWishlist(current, { wishlistId: wishlist.id, userId: active.user.id });
    return saved.ok ? { doc: saved.doc, result: { ok: true } } : { doc: current, result: saved };
  });
  if (!result.ok) return result;
  return { ok: true, wishlist };
}

/**
 * Names a followed list and the person whose list it is, for the connected account only (024).
 * `null` or an empty name goes back to the list's title, or to its owner's display name.
 */
export async function renameFollowedList(
  ctx: CommandContext,
  input: { readToken: string; customTitle: string | null; customOwnerName: string | null },
): Promise<CommandResult<{ subscription: SubscribedListSummaryView }>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  rateLimitForIp(`subscribe:${active.user.id}`, ctx.ip, 30, 15 * 60 * 1000);
  const doc = await readDocument();
  const wishlist = findWishlistByReadToken(doc, input.readToken);
  if (!wishlist) return { ok: false, error: "listMissing" };
  type Saved = { ok: true; subscription: SubscribedListSummaryView } | { ok: false; error: string };
  return updateDocument<Saved>((current) => {
    const result = renameSubscription(current, {
      wishlistId: wishlist.id,
      userId: active.user.id,
      customTitle: input.customTitle,
      customOwnerName: input.customOwnerName,
    });
    if (!result.ok) return { doc: current, result };
    const freshList = result.doc.wishlists.find((entry) => entry.id === wishlist.id)!;
    return {
      doc: result.doc,
      result: {
        ok: true,
        subscription: toSubscribedListSummary(result.doc, freshList, result.subscription, ctx.locale, ctx.origin),
      },
    };
  });
}

export async function reserve(
  ctx: CommandContext,
  input: {
    readToken: string;
    itemId: string;
    typeId?: string;
    fromName?: string;
    note?: string;
    /** « Réserver seul » (default) or « Lancer un cadeau commun » (028). */
    mode?: "single" | "group";
    /** Group gift only: as typed (site) or already in cents (API). */
    amount?: string | number | null;
    isUnlocked: IsUnlocked;
  },
): Promise<
  | CommandResult<{ wishlist: Wishlist; reservation: Reservation; claim: string | null; groupGiftToken: string | null }>
  /** « Lancer un cadeau commun » on an idea where someone has just started one: its link, to join it. */
  | { ok: false; error: "itemAlreadyReserved"; groupGiftToken: string }
> {
  rateLimitForIp(`reserve:${input.readToken.slice(0, 12)}`, ctx.ip, 15, 60 * 60 * 1000);
  const group = input.mode === "group";
  const amountCents = group ? amountFrom(input.amount) : null;
  if (amountCents === "invalid") return { ok: false, error: "invalidAmount" };
  const account = publicAccount(ctx);
  const doc = await readDocument();
  const wishlist = findWishlistByReadToken(doc, input.readToken);
  if (!wishlist) return { ok: false, error: "listMissing" };
  if (!(await canAccessPublicListWith(doc, wishlist, account, input.isUnlocked))) {
    return { ok: false, error: "readPasswordRequired" };
  }
  type Reserved =
    | { ok: true; reservation: Reservation; groupGiftToken: string | null }
    | { ok: false; error: string; groupGiftToken?: string };
  const result = await updateDocument<Reserved>((current) => {
    const fields = {
      wishlistId: wishlist.id,
      itemId: input.itemId,
      typeId: input.typeId,
      fromName: input.fromName,
      note: input.note,
      userId: account?.id ?? null,
    };
    if (group) {
      const started = startGroupGift(current, { ...fields, amountCents });
      if (!started.ok) {
        const open = started.error === "itemAlreadyReserved" ? groupGiftOfItem(current, input.itemId) : null;
        const result = open?.status === "open" ? { ...started, groupGiftToken: open.token } : started;
        return { doc: current, result };
      }
      return {
        doc: started.doc,
        result: { ok: true, reservation: started.reservation, groupGiftToken: started.groupGift.token },
      };
    }
    const saved = reserveItem(current, fields);
    if (!saved.ok) return { doc: current, result: saved };
    return { doc: saved.doc, result: { ok: true, reservation: saved.reservation, groupGiftToken: null } };
  });
  if (!result.ok) {
    if (result.error === "itemAlreadyReserved" && result.groupGiftToken) {
      return { ok: false, error: "itemAlreadyReserved", groupGiftToken: result.groupGiftToken };
    }
    return { ok: false, error: result.error };
  }
  const secret = sessionSecret();
  const claim = secret ? signReservationClaim(input.readToken, result.reservation.id, secret) : null;
  return { ok: true, wishlist, reservation: result.reservation, claim, groupGiftToken: result.groupGiftToken };
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
