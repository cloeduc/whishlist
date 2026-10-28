import { renderHook, waitFor } from "@testing-library/react-native";

import { deleteItem, saveItem, useCapabilities } from "@/data/items";
import { apiTransport, resetStore } from "@/data/store";
import { i18n, translateError } from "@/i18n";
import { listChanges } from "@/offline/outbox";
import { setTransport, stopSync } from "@/offline/sync";

import { fakeFetch, json } from "../helpers/fetch";
import { freshDb } from "../helpers/memory-db";

const input = { name: "Puzzle 1000 pièces", typeId: "t", personId: "p", price: "24,90" };

beforeEach(async () => {
  await freshDb();
  resetStore();
  setTransport(apiTransport);
  await i18n.changeLanguage("fr");
});

afterEach(() => stopSync());

test("createItem sends a generated id and the price as typed", async () => {
  const bodies: unknown[] = [];
  fakeFetch({
    "POST /lists/w/items": async (request) => {
      bodies.push(await request.json());
      return json(201, {});
    },
    "GET /lists": () => json(200, { lists: [] }),
    "GET /lists/w": () => json(404, { error: { code: "listMissing", message: "x" } }),
  });
  const result = await saveItem("w", input);
  expect(result).toMatchObject({ ok: true, status: "sent" });
  expect(bodies).toEqual([{ ...input, id: result.itemId }]);
  expect(result.itemId).toMatch(/^[A-Za-z0-9_-]{16}$/);
});

test("a priceInvalid refusal comes back with its translated message", async () => {
  // Le prix « 24,90 » passe le contrôle local ; on simule un refus du serveur.
  fakeFetch({ "POST /lists/w/items": () => json(400, { error: { code: "priceInvalid", message: "x" } }), "GET /lists": () => json(200, { lists: [] }) });
  const result = await saveItem("w", input);
  expect(result).toMatchObject({ ok: false, error: "priceInvalid" });
  expect(translateError("priceInvalid")).toBe("Saisissez un prix valide, par exemple 18,50.");
});

test("a price the site would refuse is stopped on the phone, with the same code", async () => {
  const { calls } = fakeFetch({});
  expect(await saveItem("w", { ...input, price: "abc" })).toMatchObject({ ok: false, error: "priceInvalid" });
  expect(calls).toEqual([]);
});

test("deleteItem treats a 404 itemMissing as a success", async () => {
  fakeFetch({
    "DELETE /lists/w/items/gone": () => json(404, { error: { code: "itemMissing", message: "x" } }),
    "GET /lists": () => json(200, { lists: [] }),
    "GET /lists/w": () => json(404, { error: { code: "listMissing", message: "x" } }),
  });
  expect(await deleteItem("w", "gone")).toEqual({ ok: true, status: "sent" });
  expect(await listChanges()).toEqual([]);
});

test("useCapabilities is the answer of GET /capabilities", async () => {
  fakeFetch({ "GET /capabilities": () => json(200, { apiVersion: "1.1.0", enrich: true, mail: false }) });
  const { result } = await renderHook(() => useCapabilities());
  await waitFor(() => expect(result.current).toEqual({ apiVersion: "1.1.0", enrich: true, mail: false }));
});
