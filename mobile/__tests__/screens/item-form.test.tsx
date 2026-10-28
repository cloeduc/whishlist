import NetInfo, { NetInfoStateType } from "@react-native-community/netinfo";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import NewItem from "../../app/(app)/lists/[listId]/items/new";
import type { Schemas } from "@/api/client";
import { apiTransport, resetStore } from "@/data/store";
import { ListProvider } from "@/features/lists/ListContext";
import { i18n } from "@/i18n";
import { watchNetwork } from "@/network";
import { putSnapshot } from "@/offline/snapshot";
import { setTransport, stopSync } from "@/offline/sync";

import { fakeFetch, json } from "../helpers/fetch";
import { freshDb } from "../helpers/memory-db";

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
  inviteUrl: "https://ohyoushouldnt.example.test/i/it",
  hasReadPassword: false,
  categories: [{ id: "t", label: "Jeux", sortOrder: 0 }],
  people: [{ id: "p", label: "Alex" }],
  items: [],
  reservations: [],
  members: [],
};

function routes(extra: Parameters<typeof fakeFetch>[0] = {}) {
  return fakeFetch({
    "GET /lists/w": () => json(200, list),
    "GET /lists": () => json(200, { lists: [] }),
    ...extra,
  });
}

async function renderForm() {
  await render(
    <ListProvider listId="w">
      <NewItem />
    </ListProvider>,
  );
  await screen.findByLabelText("Nom du cadeau");
}

beforeEach(async () => {
  await freshDb();
  resetStore();
  setTransport(apiTransport);
  await i18n.changeLanguage("fr");
  await putSnapshot("list:w", list);
});

afterEach(() => stopSync());

test("a server error shows under the form and every field keeps its value (FR-014)", async () => {
  routes({
    "GET /capabilities": () => json(200, { apiVersion: "1.1.0", enrich: false, mail: false }),
    "POST /lists/w/items": () => json(400, { error: { code: "typeNotInList", message: "x" } }),
  });
  await renderForm();
  await fireEvent.changeText(screen.getByLabelText("Lien du cadeau"), "https://shop.example.test/puzzle");
  await fireEvent.changeText(screen.getByLabelText("Nom du cadeau"), "Puzzle 1000 pièces");
  await fireEvent.changeText(screen.getByLabelText("Prix (€)"), "24,90");
  await fireEvent.press(screen.getByRole("button", { name: "Ajouter l'idée" }));
  expect(await screen.findByTestId("form-error")).toHaveTextContent(i18n.t("errors:typeNotInList"));
  expect(screen.getByLabelText("Lien du cadeau").props.value).toBe("https://shop.example.test/puzzle");
  expect(screen.getByLabelText("Nom du cadeau").props.value).toBe("Puzzle 1000 pièces");
  expect(screen.getByLabelText("Prix (€)").props.value).toBe("24,90");
});

test("the pre-fill button follows the site: AI label only when the server has one", async () => {
  routes({ "GET /capabilities": () => json(200, { apiVersion: "1.1.0", enrich: true, mail: false }) });
  await renderForm();
  await waitFor(() => expect(screen.getByTestId("enrich")).toHaveTextContent(i18n.t("list:form.fetchInfosAi")));
});

test("the pre-fill button is disabled offline, with the explanation", async () => {
  routes({ "GET /capabilities": () => json(200, { apiVersion: "1.1.0", enrich: false, mail: false }) });
  watchNetwork();
  const listener = jest.mocked(NetInfo.addEventListener).mock.calls[0][0];
  await renderForm();
  await fireEvent.changeText(screen.getByLabelText("Lien du cadeau"), "https://shop.example.test/puzzle");
  expect(screen.getByTestId("enrich")).toBeEnabled();
  listener({ isConnected: false, isInternetReachable: false, type: NetInfoStateType.none, details: null, isWifiEnabled: false });
  await waitFor(() => expect(screen.getByTestId("enrich")).toBeDisabled());
  expect(screen.getByText(i18n.t("mobile:offline.needsNetwork"))).toBeOnTheScreen();
});
