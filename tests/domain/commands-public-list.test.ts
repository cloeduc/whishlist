import assert from "node:assert/strict";
import { before, test } from "node:test";
import { verifyReadUnlock } from "../../src/auth/read-unlock";
import { verifyReservationClaims } from "../../src/auth/reservation-claim";
import { setReadPassword } from "../../src/domain/read-password";
import { cancelOwn, readPublicList, reserve, unlockPublicList } from "../../src/server/commands/public-list";
import { isRateLimitError } from "../../src/server/rate-limit";
import { readDocument, replaceDocument } from "../../src/store/db";
import { apiDoc, ctx, ensurePasswordHash, TEST_SECRET, withStore } from "./helpers/api-fixtures";

const noUnlock = () => false;
const none = new Set<string>();

before(ensurePasswordHash);

async function protectedDoc() {
  const saved = await setReadPassword(apiDoc(), { wishlistId: "w", actorId: "alex", password: "lecture-demo" });
  assert.equal(saved.ok, true);
  return saved.ok ? saved.doc : apiDoc();
}

test("the public view shows available ideas, without private data", async () => {
  await withStore(apiDoc(), async () => {
    const result = await readPublicList(ctx(), { readToken: "rt", isUnlocked: noUnlock, claimedIds: none });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(
      result.list.items.map((item) => item.id),
      ["gift", "gift2"],
    );
    assert.equal(result.list.items[0]!.mine, false);
    assert.equal(result.list.items[0]!.reservationId, null);
    assert.equal(result.list.items[0]!.priceCents, 1990);
    const json = JSON.stringify(result.list);
    for (const secret of ["email", "userId", "inviteToken", "readPasswordHash", "fromName", "note", "Sam", "\"it\""]) {
      assert.equal(json.includes(secret), false, `${secret} ne doit pas apparaître`);
    }
  });
});

test("an unknown link gives listMissing", async () => {
  await withStore(apiDoc(), async () => {
    const result = await readPublicList(ctx(), { readToken: "inconnu", isUnlocked: noUnlock, claimedIds: none });
    assert.deepEqual(result, { ok: false, error: "listMissing" });
  });
});

test("a protected list asks for the password, except to members", async () => {
  const doc = await protectedDoc();
  await withStore(doc, async () => {
    const locked = await readPublicList(ctx(), { readToken: "rt", isUnlocked: noUnlock, claimedIds: none });
    assert.equal(locked.ok, false);
    if (!locked.ok) {
      assert.equal(locked.error, "readPasswordRequired");
      assert.equal("title" in locked && locked.title, "Liste d'Alex");
    }
    const member = await readPublicList(ctx(doc.users[0]!), { readToken: "rt", isUnlocked: noUnlock, claimedIds: none });
    assert.equal(member.ok, true);
    const outsider = await readPublicList(ctx(doc.users[1]!), { readToken: "rt", isUnlocked: noUnlock, claimedIds: none });
    assert.equal(outsider.ok, false);
  });
});

test("the right password returns a valid unlock", async () => {
  await withStore(await protectedDoc(), async () => {
    const bad = await unlockPublicList(ctx(), { readToken: "rt", password: "faux-mot-de-passe" });
    assert.deepEqual(bad, { ok: false, error: "badPassword" });
    const good = await unlockPublicList(ctx(), { readToken: "rt", password: "lecture-demo" });
    assert.equal(good.ok, true);
    if (!good.ok) return;
    assert.ok(good.unlockToken && good.expiresAt);
    const list = (await readDocument()).wishlists[0]!;
    assert.equal(verifyReadUnlock(list, good.unlockToken, TEST_SECRET), true);
    const read = await readPublicList(ctx(), {
      readToken: "rt",
      isUnlocked: (entry) => verifyReadUnlock(entry, good.unlockToken, TEST_SECRET),
      claimedIds: none,
    });
    assert.equal(read.ok, true);
  });
});

test("21 unlock attempts in 15 minutes: the 21st is refused", async () => {
  await withStore(await protectedDoc(), async () => {
    for (let i = 0; i < 20; i += 1) await unlockPublicList(ctx(), { readToken: "rt", password: "faux" });
    await assert.rejects(unlockPublicList(ctx(), { readToken: "rt", password: "faux" }), isRateLimitError);
  });
});

test("reserving returns a claim, and the idea becomes « mienne »", async () => {
  await withStore(apiDoc(), async () => {
    const result = await reserve(ctx(), { readToken: "rt", itemId: "gift", fromName: "Sam", note: "Bravo", isUnlocked: noUnlock });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.ok(result.claim);
    const mine = verifyReservationClaims("rt", [result.claim!], TEST_SECRET);
    assert.deepEqual([...mine], [result.reservation.id]);
    const read = await readPublicList(ctx(), { readToken: "rt", isUnlocked: noUnlock, claimedIds: mine });
    assert.equal(read.ok, true);
    if (!read.ok) return;
    const item = read.list.items.find((entry) => entry.id === "gift");
    assert.equal(item?.mine, true);
    assert.equal(item?.reservationId, result.reservation.id);
    const stranger = await readPublicList(ctx(), { readToken: "rt", isUnlocked: noUnlock, claimedIds: none });
    assert.equal(stranger.ok && stranger.list.items.some((entry) => entry.id === "gift"), false);
  });
});

test("reserving an idea that is already reserved, archived or missing is refused", async () => {
  await withStore(apiDoc(), async () => {
    assert.equal((await reserve(ctx(), { readToken: "rt", itemId: "gift", isUnlocked: noUnlock })).ok, true);
    // The domain archives the reserved idea; the command says why it can no longer be offered.
    assert.deepEqual(await reserve(ctx(), { readToken: "rt", itemId: "gift", isUnlocked: noUnlock }), {
      ok: false,
      error: "itemAlreadyReserved",
    });
    const doc = await readDocument();
    doc.items.find((item) => item.id === "gift2")!.archived = true;
    await replaceDocument(doc);
    assert.deepEqual(await reserve(ctx(), { readToken: "rt", itemId: "gift2", isUnlocked: noUnlock }), {
      ok: false,
      error: "itemNotInList",
    });
    assert.deepEqual(await reserve(ctx(), { readToken: "rt", itemId: "absente", isUnlocked: noUnlock }), {
      ok: false,
      error: "itemNotInList",
    });
  });
});

test("the name and the note have a maximum length", async () => {
  await withStore(apiDoc(), async () => {
    const longName = await reserve(ctx(), { readToken: "rt", itemId: "gift", fromName: "x".repeat(201), isUnlocked: noUnlock });
    assert.deepEqual(longName, { ok: false, error: "fieldTooLong" });
    const longNote = await reserve(ctx(), { readToken: "rt", itemId: "gift", note: "x".repeat(2001), isUnlocked: noUnlock });
    assert.deepEqual(longNote, { ok: false, error: "fieldTooLong" });
  });
});

test("a protected list cannot be reserved without unlocking", async () => {
  await withStore(await protectedDoc(), async () => {
    const result = await reserve(ctx(), { readToken: "rt", itemId: "gift", isUnlocked: noUnlock });
    assert.deepEqual(result, { ok: false, error: "readPasswordRequired" });
  });
});

test("20 simultaneous reservations of the same idea: only one succeeds", async () => {
  await withStore(apiDoc(), async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        reserve(ctx(null, `198.51.100.${i + 1}`), { readToken: "rt", itemId: "gift", isUnlocked: noUnlock }),
      ),
    );
    assert.equal(results.filter((result) => result.ok).length, 1);
    const doc = await readDocument();
    assert.equal(doc.reservations.filter((entry) => entry.itemId === "gift").length, 1);
  });
});

test("only the reserver cancels: by their claim or by their account", async () => {
  await withStore(apiDoc(), async () => {
    const guest = await reserve(ctx(), { readToken: "rt", itemId: "gift", isUnlocked: noUnlock });
    assert.equal(guest.ok, true);
    if (!guest.ok) return;
    const id = guest.reservation.id;
    assert.deepEqual(await cancelOwn(ctx(), { readToken: "rt", reservationId: id, claimedIds: none }), {
      ok: false,
      error: "accessDenied",
    });
    assert.equal((await cancelOwn(ctx(), { readToken: "rt", reservationId: id, claimedIds: new Set([id]) })).ok, true);

    const doc = await readDocument();
    const camille = doc.users.find((entry) => entry.id === "camille")!;
    const byAccount = await reserve(ctx(camille), { readToken: "rt", itemId: "gift2", isUnlocked: noUnlock });
    assert.equal(byAccount.ok, true);
    if (!byAccount.ok) return;
    const cancelled = await cancelOwn(ctx(camille), {
      readToken: "rt",
      reservationId: byAccount.reservation.id,
      claimedIds: none,
    });
    assert.equal(cancelled.ok, true);
  });
});

test("an account that must change its password acts as a guest", async () => {
  const doc = await protectedDoc();
  const forced = { ...doc.users[0]!, mustChangePassword: true };
  await withStore(doc, async () => {
    const read = await readPublicList(ctx(forced), { readToken: "rt", isUnlocked: noUnlock, claimedIds: none });
    assert.equal(read.ok, false, "pas d'accès membre à la liste protégée");
    const reserved = await reserve(ctx(forced), { readToken: "rt", itemId: "gift", isUnlocked: () => true });
    assert.equal(reserved.ok, true);
    if (!reserved.ok) return;
    assert.equal(reserved.reservation.userId, null, "la réservation n'est pas liée au compte");
    assert.deepEqual(
      await cancelOwn(ctx(forced), { readToken: "rt", reservationId: reserved.reservation.id, claimedIds: none }),
      { ok: false, error: "accessDenied" },
    );
  });
});
