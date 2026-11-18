import assert from "node:assert/strict";
import { test } from "node:test";
import {
  groupGiftDetail,
  groupGiftTotals,
  joinGroupGift,
  leaveGroupGift,
  MAX_AMOUNT_CENTS,
  ownParticipation,
  parseAmount,
  pruneGroupGifts,
  setGroupGiftStatus,
  startGroupGift,
} from "../../src/domain/group-gift";
import { cancelReservation } from "../../src/domain/items";
import { wipeWishlist } from "../../src/domain/membership";
import { listMyOffers } from "../../src/domain/offrir";
import { listPublicVisibleItems, toPublicItem } from "../../src/domain/read";
import { reserveItem } from "../../src/domain/reserve";
import { toPublicListView } from "../../src/server/api/views";
import { apiDoc } from "./helpers/api-fixtures";
import { chipIn, docWithGroupGift, gift } from "./helpers/group-gift-fixtures";

test("amount: typed like a price, positive and within the limit", () => {
  assert.equal(parseAmount("18,50"), 1850);
  assert.equal(parseAmount("18.50"), 1850);
  assert.equal(parseAmount(" 20 "), 2000);
  assert.equal(parseAmount(""), null);
  assert.equal(parseAmount(null), null);
  assert.equal(parseAmount("0"), "invalid");
  assert.equal(parseAmount("-3"), "invalid");
  assert.equal(parseAmount("abc"), "invalid");
  assert.equal(parseAmount("12,345"), "invalid");
  assert.equal(parseAmount("100000"), MAX_AMOUNT_CENTS);
  assert.equal(parseAmount("100000,01"), "invalid");
});

test("totals: what is left against the idea's current price, never negative", () => {
  const doc = docWithGroupGift();
  const g = doc.groupGifts[0];
  assert.deepEqual(groupGiftTotals(doc, g), { participantCount: 2, totalCents: 1500, remainingCents: 490, goalReached: false });

  doc.items.find((i) => i.id === "gift")!.priceCents = 1200;
  assert.deepEqual(groupGiftTotals(doc, g), { participantCount: 2, totalCents: 1500, remainingCents: 0, goalReached: true });

  doc.items.find((i) => i.id === "gift")!.priceCents = 1500;
  assert.equal(groupGiftTotals(doc, g).goalReached, true);

  doc.items.find((i) => i.id === "gift")!.priceCents = null;
  assert.deepEqual(groupGiftTotals(doc, g), { participantCount: 2, totalCents: 1500, remainingCents: null, goalReached: false });
});

test("totals: a participation without an amount counts as a participant, not in the total", () => {
  const doc = docWithGroupGift();
  doc.reservations.push(chipIn("p-x", "g", "gift"));
  const totals = groupGiftTotals(doc, doc.groupGifts[0]);
  assert.equal(totals.participantCount, 3);
  assert.equal(totals.totalCents, 1500);
});

test("own participation: by account or by claim, never someone else's", () => {
  const doc = docWithGroupGift();
  assert.equal(ownParticipation(doc, "g", "alex", new Set())?.id, "p-alex");
  assert.equal(ownParticipation(doc, "g", null, new Set(["p-sam"]))?.id, "p-sam");
  assert.equal(ownParticipation(doc, "g", "camille", new Set(["r-taken"])), null);
  assert.equal(ownParticipation(doc, "g", null, new Set()), null);
});

test("prune: a group gift without participation disappears with its messages", () => {
  const doc = docWithGroupGift();
  doc.groupGifts.push(gift("empty", "gift2"));
  doc.groupGiftMessages.push(
    { id: "m1", groupGiftId: "g", userId: "alex", authorName: "Alex", body: "Salut", createdAt: "x" },
    { id: "m2", groupGiftId: "empty", userId: "alex", authorName: "Alex", body: "Vide", createdAt: "x" },
  );
  pruneGroupGifts(doc);
  assert.deepEqual(doc.groupGifts.map((g) => g.id), ["g"]);
  assert.deepEqual(doc.groupGiftMessages.map((m) => m.id), ["m1"]);
});

test("member cancels the last participation: the group gift and its thread go with it", () => {
  const doc = docWithGroupGift();
  doc.groupGiftMessages.push({ id: "m1", groupGiftId: "g", userId: "alex", authorName: "Alex", body: "Salut", createdAt: "x" });
  const first = cancelReservation(doc, { wishlistId: "w", actorId: "alex", reservationId: "p-sam" });
  assert.ok(first.ok);
  assert.equal(first.doc.groupGifts.length, 1);
  const last = cancelReservation(first.doc, { wishlistId: "w", actorId: "alex", reservationId: "p-alex" });
  assert.ok(last.ok);
  assert.deepEqual(last.doc.groupGifts, []);
  assert.deepEqual(last.doc.groupGiftMessages, []);
});

test("deleting a list deletes its group gifts and their threads", () => {
  const doc = docWithGroupGift();
  doc.groupGiftMessages.push({ id: "m1", groupGiftId: "g", userId: "alex", authorName: "Alex", body: "Salut", createdAt: "x" });
  wipeWishlist(doc, "w");
  assert.deepEqual(doc.groupGifts, []);
  assert.deepEqual(doc.groupGiftMessages, []);
  assert.deepEqual(doc.reservations, []);
});

test("start: the idea becomes an open group gift with the first participation", () => {
  const started = startGroupGift(apiDoc(), {
    wishlistId: "w",
    itemId: "gift",
    fromName: "  Sam ",
    note: "",
    amountCents: 3000,
    userId: null,
    now: new Date("2026-02-01T00:00:00.000Z"),
  });
  assert.ok(started.ok);
  assert.equal(started.groupGift.status, "open");
  assert.equal(started.groupGift.itemId, "gift");
  assert.ok(started.groupGift.token.length >= 20);
  assert.deepEqual(
    { ...started.reservation, id: "x" },
    {
      id: "x",
      wishlistId: "w",
      itemId: "gift",
      fromName: "Sam",
      note: null,
      userId: null,
      createdAt: "2026-02-01T00:00:00.000Z",
      groupGiftId: started.groupGift.id,
      amountCents: 3000,
    },
  );
  assert.equal(started.doc.groupGifts.length, 1);
});

test("start: refused on an idea reserved on one's own, already a group gift, archived, or of another list", () => {
  assert.deepEqual(startGroupGift(apiDoc(), { wishlistId: "w", itemId: "taken" }), {
    ok: false,
    error: "itemAlreadyReserved",
  });
  assert.deepEqual(startGroupGift(docWithGroupGift(), { wishlistId: "w", itemId: "gift" }), {
    ok: false,
    error: "itemAlreadyReserved",
  });
  const archived = apiDoc();
  archived.items.find((i) => i.id === "gift2")!.archived = true;
  assert.deepEqual(startGroupGift(archived, { wishlistId: "w", itemId: "gift2" }), { ok: false, error: "itemNotInList" });
  assert.deepEqual(startGroupGift(apiDoc(), { wishlistId: "other", itemId: "gift" }), { ok: false, error: "itemNotInList" });
  assert.deepEqual(startGroupGift(apiDoc(), { wishlistId: "w", itemId: "" }), { ok: false, error: "chooseItem" });
});

test("start and join: name, message and amount are checked", () => {
  assert.deepEqual(startGroupGift(apiDoc(), { wishlistId: "w", itemId: "gift", fromName: "x".repeat(201) }), {
    ok: false,
    error: "fieldTooLong",
  });
  assert.deepEqual(startGroupGift(apiDoc(), { wishlistId: "w", itemId: "gift", note: "x".repeat(2001) }), {
    ok: false,
    error: "fieldTooLong",
  });
  for (const amountCents of [0, -100, 12.5, MAX_AMOUNT_CENTS + 1]) {
    assert.deepEqual(startGroupGift(apiDoc(), { wishlistId: "w", itemId: "gift", amountCents }), {
      ok: false,
      error: "invalidAmount",
    });
    assert.deepEqual(joinGroupGift(docWithGroupGift(), { groupGiftId: "g", amountCents, claimedIds: new Set() }), {
      ok: false,
      error: "invalidAmount",
    });
  }
});

test("reserving on one's own an idea that is a group gift is refused", () => {
  assert.deepEqual(reserveItem(docWithGroupGift(), { wishlistId: "w", itemId: "gift" }), {
    ok: false,
    error: "itemAlreadyReserved",
  });
});

test("join: one more participation, without an account or with one", () => {
  const joined = joinGroupGift(docWithGroupGift(), {
    groupGiftId: "g",
    fromName: "Camille",
    amountCents: 400,
    userId: "camille",
    claimedIds: new Set(),
  });
  assert.ok(joined.ok);
  assert.equal(joined.reservation.groupGiftId, "g");
  assert.equal(joined.reservation.itemId, "gift");
  assert.equal(joined.reservation.userId, "camille");
  assert.equal(groupGiftTotals(joined.doc, joined.doc.groupGifts[0]).totalCents, 1900);

  const anonymous = joinGroupGift(docWithGroupGift(), { groupGiftId: "g", claimedIds: new Set() });
  assert.ok(anonymous.ok);
  assert.equal(anonymous.reservation.fromName, null);
  assert.equal(anonymous.reservation.amountCents, null);
});

test("join: refused twice for the same account or the same claim, and on a missing gift", () => {
  assert.deepEqual(joinGroupGift(docWithGroupGift(), { groupGiftId: "g", userId: "alex", claimedIds: new Set() }), {
    ok: false,
    error: "groupGiftAlreadyJoined",
  });
  assert.deepEqual(joinGroupGift(docWithGroupGift(), { groupGiftId: "g", claimedIds: new Set(["p-sam"]) }), {
    ok: false,
    error: "groupGiftAlreadyJoined",
  });
  assert.deepEqual(joinGroupGift(docWithGroupGift(), { groupGiftId: "nope", claimedIds: new Set() }), {
    ok: false,
    error: "groupGiftMissing",
  });
});

test("leave: by account or by claim, never someone else's; the last one frees the idea", () => {
  const doc = docWithGroupGift();
  assert.deepEqual(leaveGroupGift(doc, { groupGiftId: "g", reservationId: "p-sam", userId: "camille", claimedIds: new Set() }), {
    ok: false,
    error: "accessDenied",
  });
  assert.deepEqual(leaveGroupGift(doc, { groupGiftId: "g", reservationId: "r-taken", userId: null, claimedIds: new Set(["r-taken"]) }), {
    ok: false,
    error: "reservationMissing",
  });
  const first = leaveGroupGift(doc, { groupGiftId: "g", reservationId: "p-sam", userId: null, claimedIds: new Set(["p-sam"]) });
  assert.ok(first.ok);
  assert.equal(first.doc.groupGifts.length, 1);
  const last = leaveGroupGift(first.doc, { groupGiftId: "g", reservationId: "p-alex", userId: "alex", claimedIds: new Set() });
  assert.ok(last.ok);
  assert.deepEqual(last.doc.groupGifts, []);
  // The idea can be reserved on one's own again.
  assert.ok(reserveItem(last.doc, { wishlistId: "w", itemId: "gift" }).ok);
});

test("gift page: a visitor who does not chip in sees names, never amounts nor messages nor the read link", () => {
  const detail = groupGiftDetail(docWithGroupGift(), docWithGroupGift().groupGifts[0], {
    userId: "camille",
    claimedIds: new Set(),
  });
  assert.equal(detail.listTitle, "Liste d'Alex");
  assert.deepEqual(detail.participantNames, ["Sam", "Alex"]);
  assert.equal(detail.me, null);
  assert.equal(detail.participations, null);
  assert.equal(detail.participantCount, 2);
  assert.equal(detail.remainingCents, 490);
  assert.equal(JSON.stringify(detail).includes('"rt"'), false);
  assert.equal(JSON.stringify(detail).includes("Je l'achète"), false);
});

test("gift page: a participant sees each participation, and only their own carries its id", () => {
  const doc = docWithGroupGift();
  const detail = groupGiftDetail(doc, doc.groupGifts[0], { userId: null, claimedIds: new Set(["p-sam"]) });
  assert.equal(detail.me?.reservationId, "p-sam");
  assert.deepEqual(
    detail.participations?.map((p) => [p.reservationId, p.name, p.amountCents, p.note, p.mine]),
    [
      ["p-sam", "Sam", 500, null, true],
      [null, "Alex", 1000, "Je l'achète", false],
    ],
  );
});

test("public list: an open group gift stays visible to everyone, with what is left", () => {
  const doc = docWithGroupGift();
  const visible = listPublicVisibleItems(doc, "w", new Set(), { groupGifts: true }).map((i) => i.id);
  assert.deepEqual(visible, ["gift", "gift2"]);
  const item = toPublicItem(doc, doc.items.find((i) => i.id === "gift")!, "fr-FR", new Set());
  assert.equal(item.reserved, true);
  assert.equal(item.mine, false);
  assert.equal(item.reservationId, null);
  assert.deepEqual(item.groupGift, {
    token: "tok-g",
    status: "open",
    participantCount: 2,
    totalCents: 1500,
    remainingCents: 490,
    goalReached: false,
    mine: false,
  });
  const mine = toPublicItem(doc, doc.items.find((i) => i.id === "gift")!, "fr-FR", new Set(["p-sam"]));
  assert.equal(mine.mine, true);
  assert.equal(mine.reservationId, "p-sam");
  assert.equal(mine.groupGift?.mine, true);
});

test("public list for older clients: a group gift is a reservation, shown only to its participants", () => {
  const doc = docWithGroupGift();
  assert.deepEqual(listPublicVisibleItems(doc, "w", new Set()).map((i) => i.id), ["gift2"]);
  assert.deepEqual(listPublicVisibleItems(doc, "w", new Set(["p-sam"])).map((i) => i.id), ["gift", "gift2"]);
  const view = toPublicListView(doc, doc.wishlists[0], "fr", new Set(["p-sam"]));
  const gift = view.items.find((i) => i.id === "gift");
  assert.equal(gift?.mine, true);
  assert.equal(gift?.reservationId, "p-sam");
  assert.equal(JSON.stringify(view).includes("groupGift"), false);
  // A reservation on one's own by someone else stays hidden, as before.
  assert.equal(view.items.some((i) => i.id === "taken"), false);
});

test("my offers: a participation shows its gift, the share and what is left", () => {
  const rows = listMyOffers(docWithGroupGift(), "alex");
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].groupGift, { token: "tok-g", status: "open", amountCents: 1000, remainingCents: 490 });
  assert.equal(listMyOffers(apiDoc(), "alex").length, 0);
});

test("complete: a participant marks it complete or reopens it; someone else cannot", () => {
  const doc = docWithGroupGift();
  assert.deepEqual(
    setGroupGiftStatus(doc, { groupGiftId: "g", status: "complete", userId: "camille", claimedIds: new Set() }),
    { ok: false, error: "accessDenied" },
  );
  assert.deepEqual(setGroupGiftStatus(doc, { groupGiftId: "nope", status: "complete", userId: "alex", claimedIds: new Set() }), {
    ok: false,
    error: "groupGiftMissing",
  });
  const done = setGroupGiftStatus(doc, {
    groupGiftId: "g",
    status: "complete",
    userId: null,
    claimedIds: new Set(["p-sam"]),
    now: new Date("2026-02-02T00:00:00.000Z"),
  });
  assert.ok(done.ok);
  assert.equal(done.doc.groupGifts[0].status, "complete");
  assert.equal(done.doc.groupGifts[0].completedAt, "2026-02-02T00:00:00.000Z");
  const reopened = setGroupGiftStatus(done.doc, { groupGiftId: "g", status: "open", userId: "alex", claimedIds: new Set() });
  assert.ok(reopened.ok);
  assert.equal(reopened.doc.groupGifts[0].status, "open");
});

test("complete: nobody can chip in any more; it is hidden from those who do not chip in", () => {
  const doc = docWithGroupGift();
  doc.groupGifts[0].status = "complete";
  assert.deepEqual(joinGroupGift(doc, { groupGiftId: "g", claimedIds: new Set() }), { ok: false, error: "groupGiftComplete" });
  assert.deepEqual(listPublicVisibleItems(doc, "w", new Set(), { groupGifts: true }).map((i) => i.id), ["gift2"]);
  assert.deepEqual(
    listPublicVisibleItems(doc, "w", new Set(["p-sam"]), { groupGifts: true }).map((i) => i.id),
    ["gift", "gift2"],
  );
  assert.equal(toPublicItem(doc, doc.items[0], "fr-FR", new Set(["p-sam"])).groupGift?.status, "complete");
});

test("complete: a participant leaving keeps it complete; the last one frees the idea", () => {
  const doc = docWithGroupGift();
  doc.groupGifts[0].status = "complete";
  const first = leaveGroupGift(doc, { groupGiftId: "g", reservationId: "p-sam", userId: null, claimedIds: new Set(["p-sam"]) });
  assert.ok(first.ok);
  assert.equal(first.doc.groupGifts[0].status, "complete");
  const last = leaveGroupGift(first.doc, { groupGiftId: "g", reservationId: "p-alex", userId: "alex", claimedIds: new Set() });
  assert.ok(last.ok);
  assert.deepEqual(last.doc.groupGifts, []);
  assert.deepEqual(listPublicVisibleItems(last.doc, "w", new Set(), { groupGifts: true }).map((i) => i.id), ["gift", "gift2"]);
});
