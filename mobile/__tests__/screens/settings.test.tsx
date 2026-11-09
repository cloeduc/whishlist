import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import Settings from "../../app/(app)/lists/[listId]/settings";
import type { Schemas } from "@/api/client";
import { resetStore } from "@/data/store";
import { ListProvider } from "@/features/lists/ListContext";
import { i18n } from "@/i18n";
import { enqueue, listChanges } from "@/offline/outbox";
import { getSnapshot, putSnapshot } from "@/offline/snapshot";

import { fakeFetch, json } from "../helpers/fetch";
import { freshDb } from "../helpers/memory-db";
import { setOnline } from "../helpers/network";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true } }));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);

const list: Schemas["MemberList"] = {
  id: "w",
  title: "Nos envies",
  subtitle: null,
  coverImageUrl: null,
  theme: {},
  role: "owner",
  readUrl: "https://ohyoushouldnt.example.test/l/rt",
  inviteUrl: "https://ohyoushouldnt.example.test/invite/it",
  hasReadPassword: false,
  categories: [{ id: "t", label: "Jeux", sortOrder: 0 }],
  people: [{ id: "p", label: "Alex" }],
  items: [],
  reservations: [],
  members: [{ userId: "alex", displayName: "Alex", role: "owner" }],
};

async function renderSettings(body: Schemas["MemberList"] = list, routes: Parameters<typeof fakeFetch>[0] = {}) {
  await putSnapshot("list:w", body);
  const server = fakeFetch({ "GET /lists/w": () => json(200, body), ...routes });
  await render(
    <ListProvider listId="w">
      <Settings />
    </ListProvider>,
  );
  return server;
}

beforeEach(async () => {
  await freshDb();
  resetStore();
  jest.mocked(router.replace).mockClear();
  await i18n.changeLanguage("fr");
});

afterEach(() => setOnline(true));

test("the owner sees « Supprimer la liste » after the categories and the « qui »", async () => {
  await renderSettings();
  // Card title and button carry the same words, as on the site.
  expect(await screen.findAllByText(i18n.t("list:settings.danger"))).toHaveLength(2);
  expect(screen.getByText(i18n.t("list:settings.dangerHint"))).toBeOnTheScreen();
  expect(screen.getByTestId("settings.delete-list")).toBeEnabled();
});

test("a member who is not the owner does not see it", async () => {
  await renderSettings({ ...list, role: "member" });
  await screen.findByText(i18n.t("list:categories.types"));
  expect(screen.queryByTestId("settings.delete-list")).toBeNull();
});

test("confirmed, the list is deleted, forgotten on the phone, and the app goes back to « Mes listes »", async () => {
  await enqueue({ kind: "createItem", listId: "w", targetId: "a", payload: { id: "a", name: "Puzzle", typeId: "t", personId: "p" } });
  const server = await renderSettings(list, {
    "DELETE /lists/w": () => new Response(null, { status: 204 }),
    "GET /lists": () => json(200, { lists: [], subscriptions: [] }),
  });
  await fireEvent.press(await screen.findByTestId("settings.delete-list"));
  expect(screen.getByText("Supprimer « Nos envies » ?")).toBeOnTheScreen();
  // One idea not sent yet: the confirmation says it will be lost.
  expect(screen.getByText(/1 changement pas encore envoyé sur cette liste sera perdu\./)).toBeOnTheScreen();
  await fireEvent.press(screen.getByTestId("settings.delete-confirm"));
  await act(async () => {});
  expect(server.calls).toContain("DELETE /lists/w");
  expect(router.replace).toHaveBeenCalledWith("/");
  expect(await getSnapshot("list:w")).toBeNull();
  expect(await listChanges()).toEqual([]);
});

test("« Conserver la liste » deletes nothing", async () => {
  const server = await renderSettings();
  await fireEvent.press(await screen.findByTestId("settings.delete-list"));
  expect(screen.queryByText(/pas encore envoyé/)).toBeNull();
  await fireEvent.press(screen.getByTestId("settings.delete-confirm-keep"));
  expect(server.calls).not.toContain("DELETE /lists/w");
  expect(router.replace).not.toHaveBeenCalled();
});

test("a refusal is shown in the card and the app stays on the list", async () => {
  await renderSettings(list, { "DELETE /lists/w": () => json(400, { error: { code: "serverError", message: "x" } }) });
  await fireEvent.press(await screen.findByTestId("settings.delete-list"));
  await fireEvent.press(screen.getByTestId("settings.delete-confirm"));
  expect(await screen.findByTestId("settings.delete-error")).toHaveTextContent(i18n.t("errors:serverError"));
  expect(screen.getByTestId("settings.delete-list")).toBeEnabled();
  expect(router.replace).not.toHaveBeenCalled();
});

test("refused because the account is no longer the owner: the card goes, the message stays", async () => {
  await renderSettings(list);
  const server = fakeFetch({
    "GET /lists/w": () => json(200, { ...list, role: "member" }),
    "DELETE /lists/w": () => json(403, { error: { code: "ownerDeleteList", message: "x" } }),
  });
  await fireEvent.press(await screen.findByTestId("settings.delete-list"));
  await fireEvent.press(screen.getByTestId("settings.delete-confirm"));
  await waitFor(() => expect(server.calls).toContain("GET /lists/w"));
  await waitFor(() => expect(screen.queryByTestId("settings.delete-list")).toBeNull());
  expect(screen.getByTestId("settings.delete-error")).toHaveTextContent(i18n.t("errors:ownerDeleteList"));
  expect(router.replace).not.toHaveBeenCalled();
});

test("a list not sent yet cannot be deleted", async () => {
  const id = "new-list-id-00003";
  await enqueue({
    kind: "createList",
    listId: id,
    targetId: id,
    payload: { id, title: "Anniversaire", category: "Jeux", person: "Lou", categoryId: "c-new-list-00003", personId: "p-new-list-00003" },
  });
  fakeFetch({});
  await render(
    <ListProvider listId={id}>
      <Settings />
    </ListProvider>,
  );
  expect(await screen.findByTestId("settings.delete-list")).toBeDisabled();
});

test("offline, deleting is disabled", async () => {
  await renderSettings();
  await screen.findByTestId("settings.delete-list");
  await setOnline(false);
  expect(screen.getByTestId("settings.delete-list")).toBeDisabled();
});
