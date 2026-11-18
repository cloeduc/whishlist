import { clone } from "./access";
import { formatPrice, parsePrice } from "./price";
import { MAX_FROM_NAME, MAX_NOTE } from "./reserve";
import { newId, newToken } from "./tokens";
import type { Database, GroupGift, GroupGiftStatus, Item, Reservation } from "./types";

/**
 * « Cadeau commun » (feature 028): several people chip in for one idea. Each participation is a
 * reservation that points to the group gift, so every rule about « reserved » ideas (members' shelves,
 * surprise mode, refusals, the assistant, proofs without an account) applies to it as is.
 * A group gift exists while it has at least one participation (`pruneGroupGifts`).
 */

/** Largest amount a participant can announce: 100 000 €. */
export const MAX_AMOUNT_CENTS = 10_000_000;

/** Amount as typed (« 18,50 » or « 18.50 »): null when empty, "invalid" when not a positive amount within the limit. */
export function parseAmount(input: string | null | undefined): number | null | "invalid" {
  const cents = parsePrice(input ?? "");
  if (cents === null) return null;
  if (cents === "invalid") return "invalid";
  return validAmount(cents) ? cents : "invalid";
}

export function validAmount(cents: number | null): boolean {
  return cents === null || (Number.isInteger(cents) && cents >= 1 && cents <= MAX_AMOUNT_CENTS);
}

export function findGroupGiftByToken(doc: Database, token: string): GroupGift | null {
  if (!token) return null;
  return doc.groupGifts.find((gift) => gift.token === token) ?? null;
}

export function groupGiftOfItem(doc: Database, itemId: string): GroupGift | null {
  return doc.groupGifts.find((gift) => gift.itemId === itemId) ?? null;
}

export function participationsOf(doc: Database, groupGiftId: string): Reservation[] {
  return doc.reservations.filter((r) => r.groupGiftId === groupGiftId);
}

/** The visitor's own participation: linked to their account, or proven by a claim. */
export function ownParticipation(
  doc: Database,
  groupGiftId: string,
  userId: string | null,
  claimedIds: ReadonlySet<string>,
): Reservation | null {
  return (
    participationsOf(doc, groupGiftId).find(
      (r) => (userId !== null && r.userId === userId) || claimedIds.has(r.id),
    ) ?? null
  );
}

export interface GroupGiftTotals {
  participantCount: number;
  totalCents: number;
  /** What is left to gather; null when the idea has no price. Never negative. */
  remainingCents: number | null;
  goalReached: boolean;
}

/** Totals against the idea's current price (a price changed by a member recomputes what is left). */
export function groupGiftTotals(doc: Database, gift: GroupGift, item?: Item): GroupGiftTotals {
  const participations = participationsOf(doc, gift.id);
  const totalCents = participations.reduce((sum, r) => sum + (r.amountCents ?? 0), 0);
  const priceCents = (item ?? doc.items.find((i) => i.id === gift.itemId))?.priceCents ?? null;
  return {
    participantCount: participations.length,
    totalCents,
    remainingCents: priceCents === null ? null : Math.max(0, priceCents - totalCents),
    goalReached: priceCents !== null && totalCents >= priceCents,
  };
}

/** Removes, in place, every group gift left without a participation, with its messages. */
export function pruneGroupGifts(doc: Database): void {
  const alive = new Set(doc.reservations.map((r) => r.groupGiftId).filter((id): id is string => id !== null));
  const gone = new Set(doc.groupGifts.filter((gift) => !alive.has(gift.id)).map((gift) => gift.id));
  if (gone.size === 0) return;
  doc.groupGifts = doc.groupGifts.filter((gift) => !gone.has(gift.id));
  doc.groupGiftMessages = doc.groupGiftMessages.filter((message) => !gone.has(message.groupGiftId));
}

function blank(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
}

type Failure = { ok: false; error: string };

export interface ParticipationInput {
  fromName?: string | null;
  note?: string | null;
  amountCents?: number | null;
  userId?: string | null;
  now?: Date;
  /** Identifier of the new participation (tests). */
  id?: string;
}

function fieldsError(input: ParticipationInput): string | null {
  if ((input.fromName ?? "").length > MAX_FROM_NAME || (input.note ?? "").length > MAX_NOTE) return "fieldTooLong";
  if (!validAmount(input.amountCents ?? null)) return "invalidAmount";
  return null;
}

function newParticipation(
  wishlistId: string,
  itemId: string,
  groupGiftId: string,
  input: ParticipationInput,
): Reservation {
  return {
    id: input.id ?? newId(),
    wishlistId,
    itemId,
    fromName: blank(input.fromName),
    note: blank(input.note),
    userId: input.userId?.trim() ? input.userId.trim() : null,
    createdAt: (input.now ?? new Date()).toISOString(),
    groupGiftId,
    amountCents: input.amountCents ?? null,
  };
}

/**
 * « Lancer un cadeau commun »: the idea becomes a group gift, with the first participation.
 * Same checks as a reservation on one's own; an idea already taken either way is refused.
 */
export function startGroupGift(
  doc: Database,
  input: ParticipationInput & { wishlistId: string; itemId: string; typeId?: string; groupGiftId?: string; token?: string },
): { ok: true; doc: Database; groupGift: GroupGift; reservation: Reservation } | Failure {
  if (!input.itemId) return { ok: false, error: "chooseItem" };
  const invalid = fieldsError(input);
  if (invalid) return { ok: false, error: invalid };
  const item = doc.items.find((i) => i.id === input.itemId && i.wishlistId === input.wishlistId);
  if (item && (doc.reservations.some((r) => r.itemId === item.id) || groupGiftOfItem(doc, item.id))) {
    return { ok: false, error: "itemAlreadyReserved" };
  }
  if (!item || item.archived) return { ok: false, error: "itemNotInList" };
  if (input.typeId && item.typeId !== input.typeId) return { ok: false, error: "itemWrongType" };
  const now = input.now ?? new Date();
  const groupGift: GroupGift = {
    id: input.groupGiftId ?? newId(),
    wishlistId: input.wishlistId,
    itemId: item.id,
    token: input.token ?? newToken(),
    status: "open",
    createdAt: now.toISOString(),
    completedAt: null,
  };
  const reservation = newParticipation(input.wishlistId, item.id, groupGift.id, { ...input, now });
  const next = clone(doc);
  next.groupGifts.push(groupGift);
  next.reservations.push(reservation);
  return { ok: true, doc: next, groupGift, reservation };
}

/** « Participer »: one more participation, while the gift is open and the person does not chip in yet. */
export function joinGroupGift(
  doc: Database,
  input: ParticipationInput & { groupGiftId: string; claimedIds: ReadonlySet<string> },
): { ok: true; doc: Database; reservation: Reservation } | Failure {
  const gift = doc.groupGifts.find((g) => g.id === input.groupGiftId);
  if (!gift) return { ok: false, error: "groupGiftMissing" };
  const invalid = fieldsError(input);
  if (invalid) return { ok: false, error: invalid };
  if (gift.status === "complete") return { ok: false, error: "groupGiftComplete" };
  if (ownParticipation(doc, gift.id, input.userId ?? null, input.claimedIds)) {
    return { ok: false, error: "groupGiftAlreadyJoined" };
  }
  const reservation = newParticipation(gift.wishlistId, gift.itemId, gift.id, input);
  const next = clone(doc);
  next.reservations.push(reservation);
  return { ok: true, doc: next, reservation };
}

/** « Retirer ma participation », with the same proofs as cancelling a reservation (account or claim). */
export function leaveGroupGift(
  doc: Database,
  input: { groupGiftId: string; reservationId: string; userId: string | null; claimedIds: ReadonlySet<string> },
): { ok: true; doc: Database } | Failure {
  const reservation = doc.reservations.find((r) => r.id === input.reservationId && r.groupGiftId === input.groupGiftId);
  if (!reservation) return { ok: false, error: "reservationMissing" };
  const byAccount = Boolean(input.userId && reservation.userId === input.userId);
  if (!byAccount && !input.claimedIds.has(reservation.id)) return { ok: false, error: "accessDenied" };
  const next = clone(doc);
  next.reservations = next.reservations.filter((r) => r.id !== reservation.id);
  pruneGroupGifts(next);
  return { ok: true, doc: next };
}

/**
 * « Le cadeau est complet » / « Rouvrir le cadeau »: any participant (account or claim).
 * A complete gift is no longer offered to people who do not chip in; nothing closes it automatically.
 */
export function setGroupGiftStatus(
  doc: Database,
  input: {
    groupGiftId: string;
    status: GroupGiftStatus;
    userId: string | null;
    claimedIds: ReadonlySet<string>;
    now?: Date;
  },
): { ok: true; doc: Database } | Failure {
  const gift = doc.groupGifts.find((g) => g.id === input.groupGiftId);
  if (!gift) return { ok: false, error: "groupGiftMissing" };
  if (!ownParticipation(doc, gift.id, input.userId, input.claimedIds)) return { ok: false, error: "accessDenied" };
  const next = clone(doc);
  const target = next.groupGifts.find((g) => g.id === gift.id)!;
  target.status = input.status;
  if (input.status === "complete") target.completedAt = (input.now ?? new Date()).toISOString();
  return { ok: true, doc: next };
}

export interface GroupGiftSummary extends GroupGiftTotals {
  token: string;
  status: GroupGiftStatus;
  /** The visitor chips in. */
  mine: boolean;
}

export function groupGiftSummary(doc: Database, gift: GroupGift, mineReservationIds: ReadonlySet<string>): GroupGiftSummary {
  return {
    token: gift.token,
    status: gift.status,
    ...groupGiftTotals(doc, gift),
    mine: participationsOf(doc, gift.id).some((r) => mineReservationIds.has(r.id)),
  };
}

export interface GroupGiftParticipationView {
  /** Only for the visitor's own participation. */
  reservationId: string | null;
  name: string | null;
  amountCents: number | null;
  note: string | null;
  mine: boolean;
  /** Own participation linked to the account: its amount can change (US4). */
  editable: boolean;
}

export interface GroupGiftDetail extends GroupGiftTotals {
  token: string;
  status: GroupGiftStatus;
  listTitle: string;
  item: {
    name: string;
    typeLabel: string;
    url: string | null;
    imageUrl: string | null;
    priceCents: number | null;
    priceLabel: string | null;
    description: string | null;
    secondHandOk: boolean;
  };
  /** Names everyone with access sees (null → « Anonyme »), in order of arrival. */
  participantNames: (string | null)[];
  me: GroupGiftParticipationView | null;
  /** Amounts and messages: for participants only. */
  participations: GroupGiftParticipationView[] | null;
}

/**
 * The gift's page: the idea and the list's title, never the list's read link nor its other ideas.
 * `viewer` is identified by account and/or claims, like on the public list.
 */
export function groupGiftDetail(
  doc: Database,
  gift: GroupGift,
  viewer: { userId: string | null; claimedIds: ReadonlySet<string> },
  locale = "fr-FR",
): GroupGiftDetail {
  const list = doc.wishlists.find((w) => w.id === gift.wishlistId);
  const item = doc.items.find((i) => i.id === gift.itemId);
  const type = item ? doc.types.find((t) => t.id === item.typeId) : undefined;
  const participations = participationsOf(doc, gift.id);
  const own = ownParticipation(doc, gift.id, viewer.userId, viewer.claimedIds);
  const view = (r: Reservation): GroupGiftParticipationView => {
    const mine = r.id === own?.id;
    return {
      reservationId: mine ? r.id : null,
      name: r.fromName,
      amountCents: r.amountCents,
      note: r.note,
      mine,
      editable: false,
    };
  };
  return {
    token: gift.token,
    status: gift.status,
    listTitle: list?.title ?? "",
    item: {
      name: item?.name ?? "—",
      typeLabel: type?.label ?? "",
      url: item?.url ?? null,
      imageUrl: item?.imageUrl ?? null,
      priceCents: item?.priceCents ?? null,
      priceLabel: formatPrice(item?.priceCents ?? null, locale),
      description: item?.description ?? null,
      secondHandOk: item?.secondHandOk ?? false,
    },
    ...groupGiftTotals(doc, gift, item),
    participantNames: participations.map((r) => r.fromName),
    me: own ? view(own) : null,
    participations: own ? participations.map(view) : null,
  };
}
