import assert from "node:assert/strict";
import { before, test } from "node:test";
import { formatPrice } from "../../src/domain/price";
import { listMine, readMemberList } from "../../src/server/commands/lists";
import { apiDoc, ctx, ensurePasswordHash, withStore } from "./helpers/api-fixtures";

before(ensurePasswordHash);

function docWithCamilleList() {
  const doc = apiDoc();
  doc.wishlists.push({ ...doc.wishlists[0]!, id: "w2", title: "Liste de Camille", readToken: "rt2", inviteToken: "it2" });
  doc.memberships.push({ wishlistId: "w2", userId: "camille", role: "owner", joinedAt: "2026-01-01T00:00:00.000Z" });
  doc.memberships.push({ wishlistId: "w", userId: "camille", role: "member", joinedAt: "2026-01-03T00:00:00.000Z" });
  return doc;
}

test("mes listes : seulement celles dont je suis membre", async () => {
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
    const camille = await listMine(ctx(doc.users[1]!));
    assert.deepEqual(camille.ok && camille.lists.map((entry) => entry.id).sort(), ["w", "w2"]);
  });
});

test("sans compte, ou avec un mot de passe à changer, pas de listes", async () => {
  const doc = apiDoc();
  await withStore(doc, async () => {
    assert.deepEqual(await listMine(ctx()), { ok: false, error: "unauthorized" });
    const forced = { ...doc.users[0]!, mustChangePassword: true };
    assert.deepEqual(await listMine(ctx(forced)), { ok: false, error: "mustChangePassword" });
  });
});

test("la vue membre montre réservations et membres, sans e-mail ni hash", async () => {
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
    assert.equal(list.inviteUrl, "https://ohyoushouldnt.example.test/en/inviter/it");
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

test("un non-membre reçoit notMember, comme une liste absente pour l'API", async () => {
  const doc = apiDoc();
  await withStore(doc, async () => {
    assert.deepEqual(await readMemberList(ctx(doc.users[1]!), { wishlistId: "w" }), { ok: false, error: "notMember" });
    assert.deepEqual(await readMemberList(ctx(doc.users[0]!), { wishlistId: "absente" }), {
      ok: false,
      error: "notMember",
    });
  });
});
