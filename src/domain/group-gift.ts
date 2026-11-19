import { clone, findMembership } from "./access";
import { validAmount } from "./amount";
import { groupGiftTotals, ownParticipation, participationsOf, type GroupGiftTotals } from "./group-gift-view";
import { cancelOwnReservation } from "./items";
import { formatPrice } from "./price";
import { MAX_FROM_NAME, MAX_NOTE, reservableItem } from "./reserve";
import { blankToNull } from "./text";
import { newId, newToken } from "./tokens";
import type { Database, GroupGift, GroupGiftMessage, GroupGiftStatus, Reservation } from "./types";

/**
 * « Cadeau commun » (feature 028): several people chip in for one idea. Each participation is a
 * reservation that points to the group gift, so every rule about « reserved » ideas (members' shelves,
 * surprise mode, refusals, the assistant, proofs without an account) applies to it as is.
 * A group gift exists while it has at least one participation (`pruneGroupGifts`).
 */

export { amountFrom, MAX_AMOUNT_CENTS, parseAmount, validAmount } from "./amount";
export {
  findGroupGiftByToken,
  groupGiftOfItem,
  groupGiftSummary,
  groupGiftTotals,
  ownParticipation,
  participationsOf,
  type GroupGiftSummary,
  type GroupGiftTotals,
} from "./group-gift-view";

/** Removes, in place, every group gift left without a participation, with its messages. */
export function pruneGroupGifts(doc: Database): void {
  const alive = new Set(doc.reservations.map((r) => r.groupGiftId).filter((id): id is string => id !== null));
  const gone = new Set(doc.groupGifts.filter((gift) => !alive.has(gift.id)).map((gift) => gift.id));
  if (gone.size === 0) return;
  doc.groupGifts = doc.groupGifts.filter((gift) => !gone.has(gift.id));
  doc.groupGiftMessages = doc.groupGiftMessages.filter((message) => !gone.has(message.groupGiftId));
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
    fromName: blankToNull(input.fromName),
    note: blankToNull(input.note),
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
  const checked = reservableItem(doc, input);
  if (!checked.ok) return checked;
  if (!validAmount(input.amountCents ?? null)) return { ok: false, error: "invalidAmount" };
  const item = checked.item;
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
  // An idea archived since the gift started is out of the list: its link takes no new participation.
  const item = doc.items.find((i) => i.id === gift.itemId);
  if (!item || item.archived) return { ok: false, error: "itemNotInList" };
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
  // Same proofs and same removal (the gift goes with its last participation).
  return cancelOwnReservation(doc, { ...input, wishlistId: reservation.wishlistId });
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

/**
 * A participant with an account changes or clears the amount they put in (US4), open or complete.
 * A participation made without an account cannot change: the claim only proves it, it does not edit it.
 */
export function setParticipationAmount(
  doc: Database,
  input: { groupGiftId: string; reservationId: string; userId: string | null; amountCents: number | null },
): { ok: true; doc: Database } | Failure {
  const reservation = doc.reservations.find((r) => r.id === input.reservationId && r.groupGiftId === input.groupGiftId);
  if (!reservation) return { ok: false, error: "reservationMissing" };
  if (!input.userId || reservation.userId !== input.userId) return { ok: false, error: "accessDenied" };
  if (!validAmount(input.amountCents)) return { ok: false, error: "invalidAmount" };
  const next = clone(doc);
  next.reservations.find((r) => r.id === reservation.id)!.amountCents = input.amountCents;
  return { ok: true, doc: next };
}

/** Longest message of the thread: the same as a reservation's message. */
export const MAX_MESSAGE = MAX_NOTE;

/** The thread is for participants with an account (US5): their participation linked to that account. */
function threadParticipation(doc: Database, groupGiftId: string, userId: string | null): Reservation | null {
  if (!userId) return null;
  return participationsOf(doc, groupGiftId).find((r) => r.userId === userId) ?? null;
}

/**
 * A message in the gift's thread. The author's name is frozen now (the participation's name, otherwise
 * the account's), so their messages stay signed if they withdraw later.
 */
export function postGroupGiftMessage(
  doc: Database,
  input: { groupGiftId: string; userId: string | null; body: string; now?: Date; id?: string },
): { ok: true; doc: Database; message: GroupGiftMessage } | Failure {
  if (!doc.groupGifts.some((g) => g.id === input.groupGiftId)) return { ok: false, error: "groupGiftMissing" };
  const participation = threadParticipation(doc, input.groupGiftId, input.userId);
  if (!participation || !input.userId) return { ok: false, error: "accessDenied" };
  const body = input.body.trim();
  if (!body) return { ok: false, error: "messageEmpty" };
  if (body.length > MAX_MESSAGE) return { ok: false, error: "fieldTooLong" };
  const user = doc.users.find((u) => u.id === input.userId);
  const message: GroupGiftMessage = {
    id: input.id ?? newId(),
    groupGiftId: input.groupGiftId,
    userId: input.userId,
    authorName: participation.fromName ?? user?.displayName ?? null,
    body,
    createdAt: (input.now ?? new Date()).toISOString(),
  };
  const next = clone(doc);
  next.groupGiftMessages.push(message);
  return { ok: true, doc: next, message };
}

/** Its author removes a message (no editing). */
export function deleteGroupGiftMessage(
  doc: Database,
  input: { groupGiftId: string; messageId: string; userId: string | null },
): { ok: true; doc: Database } | Failure {
  const message = doc.groupGiftMessages.find((m) => m.id === input.messageId && m.groupGiftId === input.groupGiftId);
  if (!message) return { ok: false, error: "messageMissing" };
  if (!input.userId || message.userId !== input.userId) return { ok: false, error: "accessDenied" };
  const next = clone(doc);
  next.groupGiftMessages = next.groupGiftMessages.filter((m) => m.id !== message.id);
  return { ok: true, doc: next };
}

/** Messages shown in the thread: the last ones, oldest first. */
export const THREAD_LENGTH = 200;

/** « Annuler le cadeau commun »: a member of the list removes every participation, the thread and the link. */
export function cancelGroupGiftAsMember(
  doc: Database,
  input: { wishlistId: string; actorId: string; groupGiftId: string },
): { ok: true; doc: Database } | Failure {
  if (!findMembership(doc, input.wishlistId, input.actorId)) return { ok: false, error: "notMember" };
  const gift = doc.groupGifts.find((g) => g.id === input.groupGiftId && g.wishlistId === input.wishlistId);
  if (!gift) return { ok: false, error: "groupGiftMissing" };
  const next = clone(doc);
  next.reservations = next.reservations.filter((r) => r.groupGiftId !== gift.id);
  pruneGroupGifts(next);
  return { ok: true, doc: next };
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
  /** The participants' thread (US5): only for a participant with an account; null otherwise. */
  thread: { messages: GroupGiftMessageView[] } | null;
}

export interface GroupGiftMessageView {
  id: string;
  /** null → « Ancien participant » (account deleted). */
  authorName: string | null;
  body: string;
  createdAt: string;
  mine: boolean;
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
      editable: mine && viewer.userId !== null && r.userId === viewer.userId,
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
    thread: threadParticipation(doc, gift.id, viewer.userId)
      ? {
          messages: doc.groupGiftMessages
            .filter((m) => m.groupGiftId === gift.id)
            .slice(-THREAD_LENGTH)
            .map((m) => ({
              id: m.id,
              authorName: m.authorName,
              body: m.body,
              createdAt: m.createdAt,
              mine: viewer.userId !== null && m.userId === viewer.userId,
            })),
        }
      : null,
  };
}
