import assert from "node:assert/strict";
import { before, test } from "node:test";
import { verifyReadUnlock } from "../../src/auth/read-unlock";
import { verifyReservationClaims } from "../../src/auth/reservation-claim";
import { setReadPassword } from "../../src/domain/read-password";
import { joinGroupGift, leaveGroupGift, readGroupGift, setStatus, unlockGroupGift } from "../../src/server/commands/group-gift";
import { readPublicList, reserve } from "../../src/server/commands/public-list";
import { readDocument } from "../../src/store/db";
import { apiDoc, ctx, ensurePasswordHash, TEST_SECRET, withStore } from "./helpers/api-fixtures";
import { docWithGroupGift } from "./helpers/group-gift-fixtures";

const noUnlock = () => false;
const noClaims = () => new Set<string>();

before(ensurePasswordHash);

test("reserve in group mode starts a group gift and gives its link and a claim", async () => {
  await withStore(apiDoc(), async () => {
    const result = await reserve(ctx(), {
      readToken: "rt",
      itemId: "gift",
      fromName: "Sam",
      mode: "group",
      amount: "12,50",
      isUnlocked: noUnlock,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.ok(result.groupGiftToken);
    assert.ok(result.claim);
    assert.deepEqual([...verifyReservationClaims("rt", [result.claim!], TEST_SECRET)], [result.reservation.id]);
    const doc = await readDocument();
    assert.equal(doc.groupGifts[0]?.token, result.groupGiftToken);
    assert.equal(doc.reservations.find((r) => r.id === result.reservation.id)?.amountCents, 1250);
  });
});

test("reserve: an invalid amount is refused before anything is written; single mode ignores the amount", async () => {
  await withStore(apiDoc(), async () => {
    const refused = await reserve(ctx(), { readToken: "rt", itemId: "gift", mode: "group", amount: "abc", isUnlocked: noUnlock });
    assert.deepEqual(refused, { ok: false, error: "invalidAmount" });
    assert.deepEqual(await readDocument(), apiDoc());
    const single = await reserve(ctx(), { readToken: "rt", itemId: "gift", amount: "abc", isUnlocked: noUnlock });
    assert.equal(single.ok, true);
    if (single.ok) assert.equal(single.groupGiftToken, null);
  });
});

test("an older client reserving on its own an idea that is a group gift is refused", async () => {
  await withStore(docWithGroupGift(), async () => {
    const result = await reserve(ctx(), { readToken: "rt", itemId: "gift", isUnlocked: noUnlock });
    assert.deepEqual(result, { ok: false, error: "itemAlreadyReserved" });
  });
});

test("the API's public list stays unchanged for older apps: a group gift is hidden from non-participants", async () => {
  await withStore(docWithGroupGift(), async () => {
    const result = await readPublicList(ctx(), { readToken: "rt", isUnlocked: noUnlock, claimedIds: new Set() });
    assert.equal(result.ok, true);
    if (result.ok) assert.deepEqual(result.list.items.map((i) => i.id), ["gift2"]);
    const participant = await readPublicList(ctx(), { readToken: "rt", isUnlocked: noUnlock, claimedIds: new Set(["p-sam"]) });
    assert.equal(participant.ok, true);
    if (participant.ok) {
      const gift = participant.list.items.find((i) => i.id === "gift");
      assert.equal(gift?.mine, true);
      assert.equal(gift?.reservationId, "p-sam");
    }
  });
});

test("gift page: found by its token, without the read link; an unknown token is missing", async () => {
  await withStore(docWithGroupGift(), async () => {
    const result = await readGroupGift(ctx(), { token: "tok-g", isUnlocked: noUnlock, claimsFor: noClaims });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.gift.listTitle, "Liste d'Alex");
      assert.equal(JSON.stringify(result.gift).includes('"rt"'), false);
    }
    assert.deepEqual(await readGroupGift(ctx(), { token: "nope", isUnlocked: noUnlock, claimsFor: noClaims }), {
      ok: false,
      error: "groupGiftMissing",
    });
  });
});

test("gift page of a protected list asks for the list's password, with its title only", async () => {
  const saved = await setReadPassword(docWithGroupGift(), { wishlistId: "w", actorId: "alex", password: "lecture-demo" });
  assert.ok(saved.ok);
  await withStore(saved.doc, async () => {
    const locked = await readGroupGift(ctx(), { token: "tok-g", isUnlocked: noUnlock, claimsFor: noClaims });
    assert.deepEqual(locked, { ok: false, error: "readPasswordRequired", title: "Liste d'Alex" });
    const unlocked = await readGroupGift(ctx(), { token: "tok-g", isUnlocked: () => true, claimsFor: noClaims });
    assert.equal(unlocked.ok, true);
    const join = await joinGroupGift(ctx(), { token: "tok-g", isUnlocked: noUnlock, claimsFor: noClaims });
    assert.deepEqual(join, { ok: false, error: "readPasswordRequired" });
  });
});

test("join through the gift's link, then leave with the claim of the gift's list", async () => {
  await withStore(docWithGroupGift(), async () => {
    const joined = await joinGroupGift(ctx(), {
      token: "tok-g",
      fromName: "Camille",
      amount: "4",
      isUnlocked: noUnlock,
      claimsFor: noClaims,
    });
    assert.equal(joined.ok, true);
    if (!joined.ok) return;
    assert.equal(joined.wishlist.id, "w");
    const twice = await joinGroupGift(ctx(), {
      token: "tok-g",
      isUnlocked: noUnlock,
      claimsFor: () => new Set([joined.reservation.id]),
    });
    assert.deepEqual(twice, { ok: false, error: "groupGiftAlreadyJoined" });
    const denied = await leaveGroupGift(ctx(), { token: "tok-g", reservationId: joined.reservation.id, claimsFor: noClaims });
    assert.deepEqual(denied, { ok: false, error: "accessDenied" });
    const left = await leaveGroupGift(ctx(), {
      token: "tok-g",
      reservationId: joined.reservation.id,
      claimsFor: (list) => (list.readToken === "rt" ? new Set([joined.reservation.id]) : new Set()),
    });
    assert.equal(left.ok, true);
    assert.equal((await readDocument()).reservations.filter((r) => r.groupGiftId === "g").length, 2);
  });
});

test("status command: a participant by claim marks it complete; a stranger is refused", async () => {
  await withStore(docWithGroupGift(), async () => {
    const denied = await setStatus(ctx(), { token: "tok-g", status: "complete", claimsFor: noClaims });
    assert.deepEqual(denied, { ok: false, error: "accessDenied" });
    const done = await setStatus(ctx(), { token: "tok-g", status: "complete", claimsFor: () => new Set(["p-sam"]) });
    assert.equal(done.ok, true);
    assert.equal((await readDocument()).groupGifts[0]?.status, "complete");
    const join = await joinGroupGift(ctx(), { token: "tok-g", isUnlocked: noUnlock, claimsFor: noClaims });
    assert.deepEqual(join, { ok: false, error: "groupGiftComplete" });
  });
});

test("unlock from the gift's page: the list's password, the same proof as the list; never its read link", async () => {
  const saved = await setReadPassword(docWithGroupGift(), { wishlistId: "w", actorId: "alex", password: "lecture-demo" });
  assert.ok(saved.ok);
  await withStore(saved.doc, async () => {
    assert.deepEqual(await unlockGroupGift(ctx(), { token: "tok-g", password: "mauvais-mot" }), {
      ok: false,
      error: "badPassword",
    });
    assert.deepEqual(await unlockGroupGift(ctx(), { token: "nope", password: "lecture-demo" }), {
      ok: false,
      error: "groupGiftMissing",
    });
    const unlocked = await unlockGroupGift(ctx(), { token: "tok-g", password: "lecture-demo" });
    assert.equal(unlocked.ok, true);
    if (!unlocked.ok) return;
    assert.ok(unlocked.unlockToken);
    assert.equal(verifyReadUnlock(unlocked.wishlist, unlocked.unlockToken!, TEST_SECRET), true);
  });
});
