import assert from "node:assert/strict";
import { test } from "node:test";
import { listDefaults, memberListTitles, numberedTitle } from "../../src/domain/list-defaults";

test("numberedTitle keeps a free name, numbers it otherwise", () => {
  assert.equal(numberedTitle("Liste de Nathan", []), "Liste de Nathan");
  assert.equal(numberedTitle("Liste de Nathan", ["Autre"]), "Liste de Nathan");
  assert.equal(numberedTitle("Liste de Nathan", ["Liste de Nathan"]), "Liste de Nathan 2");
  assert.equal(
    numberedTitle("Liste de Nathan", ["Liste de Nathan", "Liste de Nathan 2"]),
    "Liste de Nathan 3",
  );
  // case-insensitive and ignoring leading/trailing spaces
  assert.equal(numberedTitle("Liste de Nathan", ["  liste de nathan  "]), "Liste de Nathan 2");
  // fills a gap: 2 taken, 3 free
  assert.equal(numberedTitle("L", ["L", "L 3"]), "L 2");
});

test("memberListTitles returns only the lists the account is a member of", () => {
  const memberships = [
    { userId: "u", wishlistId: "a" },
    { userId: "u", wishlistId: "b" },
    { userId: "other", wishlistId: "c" },
    { userId: "u", wishlistId: "missing" },
  ];
  const wishlists = [
    { id: "a", title: "A" },
    { id: "b", title: "B" },
    { id: "c", title: "C" },
  ];
  assert.deepEqual(memberListTitles(memberships, wishlists, "u"), ["A", "B"]);
});

test("listDefaults: display name, or fallback labels when it is empty", () => {
  const strings: Record<string, string> = {
    "newList.defaultNameNoName": "Ma liste",
    "newList.defaultCategory": "Cadeaux",
    "newList.defaultPerson": "Moi",
  };
  const t = (key: string, vars?: Record<string, string>) =>
    key === "newList.defaultName" ? `Liste de ${vars?.name}` : (strings[key] ?? key);
  assert.deepEqual(listDefaults("  Nathan ", t), { titleBase: "Liste de Nathan", category: "Cadeaux", person: "Nathan" });
  assert.deepEqual(listDefaults("   ", t), { titleBase: "Ma liste", category: "Cadeaux", person: "Moi" });
});
