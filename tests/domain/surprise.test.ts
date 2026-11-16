import assert from "node:assert/strict";
import { test } from "node:test";
import { reservedItemIds } from "../../src/domain/reserve";
import { memberShelf, setSurpriseMode, surpriseModeOf, visibleReservations } from "../../src/domain/surprise";
import { emptyDatabase, type Database, type Item } from "../../src/domain/types";

function item(id: string, archived = false): Item {
  return {
    id,
    wishlistId: "w",
    name: id,
    typeId: "t",
    url: null,
    imageUrl: null,
    priceCents: null,
    priority: null,
    secondHandOk: false,
    description: null,
    personId: "p",
    sortOrder: 0,
    archived,
  };
}

function doc(): Database {
  const data = emptyDatabase();
  data.memberships.push(
    { wishlistId: "w", userId: "alex", role: "owner", joinedAt: "2026-01-01T00:00:00.000Z", surpriseMode: false },
    { wishlistId: "w", userId: "camille", role: "member", joinedAt: "2026-01-02T00:00:00.000Z", surpriseMode: false },
  );
  data.items.push(item("free"), item("taken"));
  data.reservations.push({
    id: "r",
    wishlistId: "w",
    itemId: "taken",
    fromName: "Morgan",
    note: null,
    userId: null,
    createdAt: "2026-01-03T00:00:00.000Z",
  });
  return data;
}

test("surprise mode is off by default and belongs to one member", () => {
  const data = doc();
  assert.equal(surpriseModeOf(data, "w", "alex"), false);
  const on = setSurpriseMode(data, { wishlistId: "w", actorId: "alex", enabled: true });
  assert.ok(on.ok);
  assert.equal(surpriseModeOf(on.doc, "w", "alex"), true);
  assert.equal(surpriseModeOf(on.doc, "w", "camille"), false);
  assert.equal(surpriseModeOf(data, "w", "alex"), false, "the input database is not changed");
  const off = setSurpriseMode(on.doc, { wishlistId: "w", actorId: "alex", enabled: false });
  assert.ok(off.ok);
  assert.equal(surpriseModeOf(off.doc, "w", "alex"), false);
});

test("only a member of the list sets surprise mode", () => {
  assert.deepEqual(setSurpriseMode(doc(), { wishlistId: "w", actorId: "sam", enabled: true }), {
    ok: false,
    error: "notMember",
  });
  assert.equal(surpriseModeOf(doc(), "w", "sam"), false);
});

test("reservations shown with the list: none for a member in surprise mode, all for the others", () => {
  const on = setSurpriseMode(doc(), { wishlistId: "w", actorId: "alex", enabled: true });
  assert.ok(on.ok);
  assert.deepEqual(visibleReservations(on.doc, "w", "alex"), []);
  assert.deepEqual(visibleReservations(on.doc, "w", "camille").map((r) => r.id), ["r"]);
  assert.deepEqual(visibleReservations(doc(), "w", "alex").map((r) => r.id), ["r"]);
  assert.deepEqual(visibleReservations(doc(), "other", "alex"), []);
});

test("reserved ideas of a list", () => {
  assert.deepEqual([...reservedItemIds(doc(), "w")], ["taken"]);
  assert.deepEqual([...reservedItemIds(doc(), "other")], []);
});

test("shelf of an idea: free or reserved, archived or not, with or without surprise mode", () => {
  // Outside surprise mode: a reserved idea is in the archives, as before 020.
  assert.equal(memberShelf(item("a"), false, false), "ideas");
  assert.equal(memberShelf(item("a", true), false, false), "archives");
  assert.equal(memberShelf(item("a"), true, false), "archives");
  assert.equal(memberShelf(item("a", true), true, false), "archives");
  // Surprise mode: only what a member archived goes to the archives.
  assert.equal(memberShelf(item("a"), false, true), "ideas");
  assert.equal(memberShelf(item("a", true), false, true), "archives");
  assert.equal(memberShelf(item("a"), true, true), "ideas");
  assert.equal(memberShelf(item("a", true), true, true), "archives");
});
