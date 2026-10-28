import { renderHook, waitFor } from "@testing-library/react-native";

import { createList } from "@/data/lists";
import { apiTransport, resetStore, useMyLists } from "@/data/store";
import { putSnapshot } from "@/offline/snapshot";
import { setTransport, stopSync } from "@/offline/sync";

import { fakeFetch, json } from "../helpers/fetch";
import { freshDb } from "../helpers/memory-db";

const summary = (id: string, title: string) => ({
  id,
  title,
  subtitle: null,
  coverImageUrl: null,
  theme: {},
  role: "owner",
  itemCount: 0,
  readUrl: `https://ohyoushouldnt.example.test/l/${id}`,
});

beforeEach(async () => {
  await freshDb();
  resetStore();
  setTransport(apiTransport);
});

afterEach(() => stopSync());

test("useMyLists shows the local copy, then the server's answer, which it stores", async () => {
  await putSnapshot("lists", [summary("w", "Copie locale")], "2026-10-28T14:05:00.000Z");
  let answer: (response: Response) => void = () => {};
  fakeFetch({ "GET /lists": () => new Promise((resolve) => (answer = resolve)) });
  const { result } = await renderHook(() => useMyLists());
  await waitFor(() => expect(result.current.lists.map((list) => list.title)).toEqual(["Copie locale"]));
  answer(json(200, { lists: [summary("w", "Nos envies")] }));
  await waitFor(() => expect(result.current.lists.map((list) => list.title)).toEqual(["Nos envies"]));
  expect(result.current.fetchedAt).not.toBe("2026-10-28T14:05:00.000Z");
});

test("on a network error, the copy stays with its date", async () => {
  await putSnapshot("lists", [summary("w", "Copie locale")], "2026-10-28T14:05:00.000Z");
  globalThis.fetch = jest.fn(async () => {
    throw new TypeError("Network request failed");
  });
  const { result } = await renderHook(() => useMyLists());
  await waitFor(() => expect(result.current.lists).toHaveLength(1));
  await waitFor(() => expect(result.current.refreshing).toBe(false));
  expect(result.current.fetchedAt).toBe("2026-10-28T14:05:00.000Z");
});

test("createList sends id, categoryId and personId chosen by the app", async () => {
  const bodies: unknown[] = [];
  fakeFetch({
    "POST /lists": async (request) => {
      bodies.push(await request.json());
      return json(201, {});
    },
    "GET /lists": () => json(200, { lists: [] }),
  });
  const result = await createList({ title: "Noël", category: "Livres", person: "Alex" });
  expect(result).toMatchObject({ ok: true, status: "sent" });
  expect(bodies).toHaveLength(1);
  expect(bodies[0]).toMatchObject({ title: "Noël", category: "Livres", person: "Alex", id: result.listId });
  expect(bodies[0]).toEqual(
    expect.objectContaining({ categoryId: expect.stringMatching(/^[A-Za-z0-9_-]{16}$/), personId: expect.stringMatching(/^[A-Za-z0-9_-]{16}$/) }),
  );
});

test("createList with an empty title: the site's message, nothing is sent", async () => {
  const { calls } = fakeFetch({});
  expect(await createList({ title: " ", category: "Livres", person: "Alex" })).toMatchObject({ ok: false, error: "listNeedsTitle" });
  expect(calls).toEqual([]);
});
