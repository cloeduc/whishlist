import * as Sharing from "expo-sharing";

import { ApiError } from "@/api/client";
import { signIn, signOut } from "@/auth/session";
import { exportData } from "@/features/account/exportData";
import { i18n } from "@/i18n";

import { fakeFetch, json, me } from "../helpers/fetch";
import { freshDb } from "../helpers/memory-db";

// Faux cache de l'app, déclaré dans __tests__/setup.ts.
const cache: Map<string, string> = jest.requireMock("expo-file-system").__cache;

const document = {
  format: "ohyoushouldnt-export",
  version: 1,
  exportedAt: "2026-10-28T10:00:00.000Z",
  account: { email: "alex@example.test", displayName: "Alex", createdAt: "2026-01-01T00:00:00.000Z" },
  lists: [],
  myReservations: [],
};

beforeEach(async () => {
  cache.clear();
  jest.mocked(Sharing.shareAsync).mockClear();
  await i18n.changeLanguage("fr");
});

test("the export is written to the cache under its dated name, then shared as JSON", async () => {
  fakeFetch({ "GET /me/export": () => json(200, document) });
  await exportData("Télécharger mes données");
  expect(JSON.parse(cache.get("ohyoushouldnt-donnees-2026-10-28.json")!)).toEqual(document);
  expect(Sharing.shareAsync).toHaveBeenCalledWith("file:///cache/ohyoushouldnt-donnees-2026-10-28.json", {
    mimeType: "application/json",
    UTI: "public.json",
    dialogTitle: "Télécharger mes données",
  });
});

test("in English, the file is named ohyoushouldnt-data-…", async () => {
  await i18n.changeLanguage("en");
  fakeFetch({ "GET /me/export": () => json(200, document) });
  await exportData("Download my data");
  expect([...cache.keys()]).toEqual(["ohyoushouldnt-data-2026-10-28.json"]);
});

test("previous export files are removed first, in either language", async () => {
  cache.set("ohyoushouldnt-donnees-2026-10-01.json", "{}");
  cache.set("ohyoushouldnt-data-2026-10-02.json", "{}");
  cache.set("autre.json", "{}");
  fakeFetch({ "GET /me/export": () => json(200, document) });
  await exportData("x");
  expect([...cache.keys()].sort()).toEqual(["autre.json", "ohyoushouldnt-donnees-2026-10-28.json"]);
});

test("signing out removes the export files from the cache", async () => {
  await freshDb();
  fakeFetch({});
  await signIn({ token: "secret-token", expiresAt: "2099-01-01T00:00:00.000Z", user: me });
  cache.set("ohyoushouldnt-donnees-2026-10-28.json", "{}");
  cache.set("autre.json", "{}");
  fakeFetch({ "POST /auth/logout": () => json(204, null) });
  await signOut();
  expect([...cache.keys()]).toEqual(["autre.json"]);
});

test("429: the error comes back, nothing is shared", async () => {
  fakeFetch({ "GET /me/export": () => json(429, { error: { code: "rateLimited", message: "x" } }) });
  await expect(exportData("x")).rejects.toEqual(expect.any(ApiError));
  await expect(exportData("x")).rejects.toMatchObject({ code: "rateLimited" });
  expect(Sharing.shareAsync).not.toHaveBeenCalled();
  expect(cache.size).toBe(0);
});
