import assert from "node:assert/strict";
import { before, test } from "node:test";
import { formatPrice } from "../../src/domain/price";
import { listMine, readMemberList, revealReservations, setSurpriseMode } from "../../src/server/commands/lists";
import { apiDoc, ctx, ensurePasswordHash, withStore } from "./helpers/api-fixtures";

before(ensurePasswordHash);

function docWithCamilleList() {
  const doc = apiDoc();
  doc.wishlists.push({ ...doc.wishlists[0]!, id: "w2", title: "Liste de Camille", readToken: "rt2", inviteToken: "it2" });
  doc.memberships.push({ wishlistId: "w2", userId: "camille", role: "owner", joinedAt: "2026-01-01T00:00:00.000Z", surpriseMode: false });
  doc.memberships.push({ wishlistId: "w", userId: "camille", role: "member", joinedAt: "2026-01-03T00:00:00.000Z", surpriseMode: false });
  return doc;
}

test("my lists: only those I am a member of", async () => {
  const doc = docWithCamilleList();
  await withStore(doc, async () => {
    const alex = await listMine(ctx(doc.users[0]!));
    assert.equal(alex.ok, true);
    if (!alex.ok) return;
    assert.deepEqual(
      alex.lists.map((entry) => [entry.id, entry.role, entry.itemCount]),
      [["w", "owner", 2]],
    );
    assert.equal(alex.lists[0]!.readUrl, "https://ohyoushouldnt.example.test/l/rt");
    // Since 1.1.0: enough to draw the « Mes listes » card as on the site.
    assert.equal(alex.lists[0]!.subtitle, null);
    assert.equal(alex.lists[0]!.coverImageUrl, null);
    assert.deepEqual(alex.lists[0]!.theme, doc.wishlists[0]!.theme);
    const camille = await listMine(ctx(doc.users[1]!));
    assert.deepEqual(camille.ok && camille.lists.map((entry) => entry.id).sort(), ["w", "w2"]);
  });
});

test("without an account, or with a password to change, no lists", async () => {
  const doc = apiDoc();
  await withStore(doc, async () => {
    assert.deepEqual(await listMine(ctx()), { ok: false, error: "unauthorized" });
    const forced = { ...doc.users[0]!, mustChangePassword: true };
    assert.deepEqual(await listMine(ctx(forced)), { ok: false, error: "mustChangePassword" });
  });
});

test("the member view shows reservations and members, without email or hash", async () => {
  const doc = docWithCamilleList();
  doc.wishlists[0]!.readPasswordHash = "hash-secret";
  await withStore(doc, async () => {
    const result = await readMemberList({ ...ctx(doc.users[0]!), locale: "en" }, { wishlistId: "w" });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const list = result.list;
    assert.equal(list.role, "owner");
    assert.equal(list.hasReadPassword, true);
    assert.equal(list.readUrl, "https://ohyoushouldnt.example.test/en/l/rt");
    assert.equal(list.inviteUrl, "https://ohyoushouldnt.example.test/en/invite/it");
    assert.deepEqual(
      list.items.map((item) => [item.id, item.archived]),
      [
        ["gift", false],
        ["gift2", false],
        ["taken", true],
      ],
    );
    assert.equal(list.items[0]!.priceLabel, formatPrice(1990, "en-US"));
    assert.deepEqual(list.reservations, [
      {
        id: "r-taken",
        itemId: "taken",
        itemName: "Idée taken",
        fromName: "Sam",
        note: "Pour ton anniversaire",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    ]);
    assert.deepEqual(list.members, [
      { userId: "alex", displayName: "Alex", role: "owner" },
      { userId: "camille", displayName: "Camille", role: "member" },
    ]);
    const json = JSON.stringify(list);
    assert.equal(json.includes("example.test\""), false);
    assert.equal(json.includes("@"), false);
    assert.equal(json.includes("hash-secret"), false);
  });
});

test("a non-member gets notMember, like a missing list for the API", async () => {
  const doc = apiDoc();
  await withStore(doc, async () => {
    assert.deepEqual(await readMemberList(ctx(doc.users[1]!), { wishlistId: "w" }), { ok: false, error: "notMember" });
    assert.deepEqual(await readMemberList(ctx(doc.users[0]!), { wishlistId: "absente" }), {
      ok: false,
      error: "notMember",
    });
  });
});

test("surprise mode: only for the member who chose it, reservations left out and the reserved idea among the ideas (020)", async () => {
  const doc = docWithCamilleList();
  await withStore(doc, async () => {
    const alex = ctx(doc.users[0]!);
    assert.deepEqual(await setSurpriseMode(ctx(), { wishlistId: "w", enabled: true }), { ok: false, error: "unauthorized" });
    const stranger = { ...doc.users[0]!, id: "sam", email: "sam@example.test" };
    assert.deepEqual(await setSurpriseMode(ctx(stranger), { wishlistId: "w", enabled: true }), { ok: false, error: "notMember" });

    const on = await setSurpriseMode(alex, { wishlistId: "w", enabled: true });
    assert.ok(on.ok);
    assert.equal(on.list.surpriseMode, true);
    assert.deepEqual(on.list.reservations, []);
    assert.deepEqual(
      on.list.items.map((item) => [item.id, item.archived]),
      [
        ["gift", false],
        ["gift2", false],
        ["taken", false],
      ],
    );
    const mine = await listMine(alex);
    assert.equal(mine.ok && mine.lists.find((entry) => entry.id === "w")?.itemCount, 3);

    // Camille, member of the same list, still sees the reservation.
    const camille = await readMemberList(ctx(doc.users[1]!), { wishlistId: "w" });
    assert.ok(camille.ok);
    assert.equal(camille.list.surpriseMode, false);
    assert.deepEqual(camille.list.reservations.map((reservation) => reservation.id), ["r-taken"]);
    assert.equal(camille.list.items.find((item) => item.id === "taken")?.archived, true);

    const off = await setSurpriseMode(alex, { wishlistId: "w", enabled: false });
    assert.ok(off.ok);
    assert.equal(off.list.surpriseMode, false);
    assert.deepEqual(off.list.reservations.map((reservation) => reservation.id), ["r-taken"]);
  });
});

test("reservations on demand: for a member, whatever their surprise mode (020)", async () => {
  const doc = docWithCamilleList();
  doc.memberships.find((m) => m.wishlistId === "w" && m.userId === "alex")!.surpriseMode = true;
  await withStore(doc, async () => {
    assert.deepEqual(await revealReservations(ctx(), { wishlistId: "w" }), { ok: false, error: "unauthorized" });
    const shown = await revealReservations(ctx(doc.users[0]!), { wishlistId: "w" });
    assert.ok(shown.ok);
    assert.deepEqual(
      shown.reservations.map((reservation) => [reservation.itemId, reservation.itemName, reservation.fromName]),
      [["taken", "Idée taken", "Sam"]],
    );
    const empty = await revealReservations(ctx(doc.users[1]!), { wishlistId: "w2" });
    assert.deepEqual(empty, { ok: true, reservations: [], offers: [] });
    assert.deepEqual(shown.offers.map((offer) => [offer.reservationId, offer.typeLabel, offer.note]), [["r-taken", "Jeux", "Pour ton anniversaire"]]);
    const stranger = { ...doc.users[1]!, id: "sam", email: "sam@example.test" };
    assert.deepEqual(await revealReservations(ctx(stranger), { wishlistId: "w" }), { ok: false, error: "notMember" });
  });
});
