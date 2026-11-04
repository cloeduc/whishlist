import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { test } from "node:test";
import type { Database, Item } from "../../src/domain/types";
import { databaseFilePath, openStore, readDocument, updateDocument } from "../../src/store/db";
import { apiDoc, withStore } from "./helpers/api-fixtures";

function totalChanges(): number {
  return (openStore().writer.prepare("select total_changes() as n").get() as { n: number }).n;
}

function item(id: string, sortOrder: number): Item {
  return {
    id,
    wishlistId: "w",
    name: `Idée ${id}`,
    typeId: "t",
    url: null,
    imageUrl: null,
    priceCents: null,
    priority: null,
    secondHandOk: false,
    description: null,
    personId: "p",
    sortOrder,
    archived: false,
  };
}

test("an in-place change and a new object are both saved", async () => {
  await withStore(apiDoc(), async () => {
    await updateDocument((doc) => {
      doc.wishlists[0].title = "Titre en place";
      return { doc, result: null };
    });
    await updateDocument((doc) => ({
      doc: { ...doc, items: doc.items.map((i) => (i.id === "gift" ? { ...i, name: "Nouvel objet" } : i)) },
      result: null,
    }));
    const saved = await readDocument();
    assert.equal(saved.wishlists[0].title, "Titre en place");
    assert.equal(saved.items.find((i) => i.id === "gift")?.name, "Nouvel objet");
  });
});

test("an added reservation writes only one row", async () => {
  await withStore(apiDoc(), async () => {
    const before = totalChanges();
    await updateDocument((doc) => {
      doc.reservations.push({
        id: "r-gift",
        wishlistId: "w",
        itemId: "gift",
        fromName: "Sam",
        note: null,
        userId: null,
        createdAt: "2026-01-03T00:00:00.000Z",
      });
      return { doc, result: null };
    });
    assert.equal(totalChanges() - before, 1);
  });
});

test("a mutate that throws: nothing is written and the error propagates", async () => {
  await withStore(apiDoc(), async () => {
    await assert.rejects(
      updateDocument((doc) => {
        doc.wishlists[0].title = "Jamais";
        doc.items.push(item("jamais", 9));
        throw new Error("boom");
      }),
      /boom/,
    );
    assert.deepStrictEqual(await readDocument(), apiDoc());
    // The database stays usable after the failure.
    await updateDocument((doc) => {
      doc.wishlists[0].title = "Après";
      return { doc, result: null };
    });
    assert.equal((await readDocument()).wishlists[0].title, "Après");
  });
});

test("a broken foreign key is refused at COMMIT, nothing is written", async () => {
  await withStore(apiDoc(), async () => {
    await assert.rejects(
      updateDocument((doc) => {
        doc.wishlists[0].title = "Jamais";
        doc.items.push({ ...item("orphan", 9), wishlistId: "absente" });
        return { doc, result: null };
      }),
      /FOREIGN KEY/,
    );
    assert.deepStrictEqual(await readDocument(), apiDoc());
  });
});

test("two rows with the same key: an error, instead of silently losing one", async () => {
  await withStore(apiDoc(), async () => {
    await assert.rejects(
      updateDocument((doc) => {
        doc.items.push({ ...item("gift", 9), name: "Doublon" });
        return { doc, result: null };
      }),
      /items: two records with the same key \(gift\)/,
    );
    assert.deepStrictEqual(await readDocument(), apiDoc());
  });
});

test("the unique index refuses a second reservation of the same idea, even without the domain rule", async () => {
  await withStore(apiDoc(), async () => {
    await assert.rejects(
      updateDocument((doc) => {
        doc.wishlists[0].title = "Jamais";
        doc.reservations.push({ ...doc.reservations[0], id: "r-taken-2", fromName: "Autre" });
        return { doc, result: null };
      }),
      /UNIQUE/,
    );
    assert.deepStrictEqual(await readDocument(), apiDoc());
  });
});

test("order: additions come out in insertion order, an update keeps its place", async () => {
  await withStore(apiDoc(), async () => {
    for (const [id, order] of [
      ["a3", 3],
      ["a4", 4],
      ["a5", 5],
    ] as const) {
      await updateDocument((doc) => {
        doc.items.push(item(id, order));
        return { doc, result: null };
      });
    }
    await updateDocument((doc) => {
      doc.items.find((i) => i.id === "gift")!.name = "Modifiée";
      return { doc, result: null };
    });
    assert.deepEqual(
      (await readDocument()).items.map((i) => i.id),
      ["gift", "gift2", "taken", "a3", "a4", "a5"],
    );
  });
});

test("a read during a pending write sees the previous state, without waiting", async () => {
  await withStore(apiDoc(), async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    let entered!: () => void;
    const inside = new Promise<void>((resolve) => (entered = resolve));
    const writing = updateDocument(async (doc: Database) => {
      doc.wishlists[0].title = "Pendant";
      entered();
      await gate;
      return { doc, result: null };
    });
    await inside;
    assert.equal((await readDocument()).wishlists[0].title, "Liste d'Alex");
    release();
    await writing;
    assert.equal((await readDocument()).wishlists[0].title, "Pendant");
  });
});

test("the database and its side files have mode 600", { skip: process.platform === "win32" }, async () => {
  await withStore(apiDoc(), async () => {
    const file = databaseFilePath();
    for (const suffix of ["", "-wal", "-shm"]) {
      assert.equal((await stat(`${file}${suffix}`)).mode & 0o777, 0o600, `${file}${suffix}`);
    }
  });
});
