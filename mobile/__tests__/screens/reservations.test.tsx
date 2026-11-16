import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import Reservations from "../../app/(app)/lists/[listId]/reservations";
import type { Schemas } from "@/api/client";
import { resetStore } from "@/data/store";
import { ListProvider } from "@/features/lists/ListContext";
import { i18n } from "@/i18n";
import { getSnapshot, putSnapshot } from "@/offline/snapshot";

import { fakeFetch, json } from "../helpers/fetch";
import { freshDb } from "../helpers/memory-db";
import { setOnline } from "../helpers/network";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useFocusEffect: jest.fn(),
}));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);

const reservation: Schemas["MemberReservation"] = {
  id: "r",
  itemId: "taken",
  itemName: "Idée taken",
  fromName: "Morgan",
  note: "Je m'en occupe",
  createdAt: "2026-01-02T00:00:00.000Z",
};

/** A member in surprise mode: the server sends no reservation with the list. */
const surpriseList: Schemas["MemberList"] = {
  id: "w",
  title: "Nos envies",
  subtitle: null,
  coverImageUrl: null,
  theme: {},
  role: "owner",
  readUrl: "https://ohyoushouldnt.example.test/l/rt",
  inviteUrl: "https://ohyoushouldnt.example.test/i/it",
  hasReadPassword: false,
  surpriseMode: true,
  categories: [{ id: "t", label: "Jeux", sortOrder: 0 }],
  people: [{ id: "p", label: "Alex" }],
  items: [],
  reservations: [],
  members: [],
};

async function renderTab(body: Schemas["MemberList"], routes: Parameters<typeof fakeFetch>[0] = {}) {
  await putSnapshot("list:w", body);
  const server = fakeFetch({ "GET /lists/w": () => json(200, body), ...routes });
  await render(
    <ListProvider listId="w">
      <Reservations />
    </ListProvider>,
  );
  return server;
}

beforeEach(async () => {
  await freshDb();
  resetStore();
  await i18n.changeLanguage("fr");
});

afterEach(async () => {
  await setOnline(true);
});

test("surprise mode: nothing before the confirmation, the rows after it, nothing written on the phone (020)", async () => {
  const server = await renderTab(surpriseList, { "GET /lists/w/reservations": () => json(200, { reservations: [reservation] }) });
  expect(await screen.findByTestId("reservations.hidden")).toHaveTextContent(i18n.t("list:surprise.hiddenHint"));
  expect(screen.queryByText(/Morgan/)).toBeNull();
  // Not even the number of reservations on the tab.
  expect(screen.getByTestId("tab-reservations")).toHaveTextContent(i18n.t("list:tabs.reservations"), { exact: true });

  // « Garder la surprise »: nothing is asked of the server.
  await fireEvent.press(screen.getByTestId("reservations.reveal"));
  await fireEvent.press(screen.getByTestId("reservations.reveal-confirm-keep"));
  expect(server.calls).not.toContain("GET /lists/w/reservations");
  expect(screen.queryByText(/Morgan/)).toBeNull();

  await fireEvent.press(screen.getByTestId("reservations.reveal"));
  await fireEvent.press(screen.getByTestId("reservations.reveal-confirm"));
  expect(await screen.findByTestId("reservations.item-r")).toHaveTextContent(/Morgan/);
  expect(screen.getByTestId("reservations.note-r")).toHaveTextContent("Je m'en occupe");
  const stored = await getSnapshot<Schemas["MemberList"]>("list:w");
  expect(JSON.stringify(stored)).not.toContain("Morgan");
});

test("surprise mode, offline: the button is disabled and nothing kept on the phone shows (020)", async () => {
  // A copy saved before surprise mode was turned on elsewhere must not leak either.
  await renderTab({ ...surpriseList, reservations: [reservation] });
  await screen.findByTestId("reservations.hidden");
  await setOnline(false);
  await waitFor(() => expect(screen.getByTestId("reservations.reveal")).toBeDisabled());
  expect(screen.queryByText(/Morgan/)).toBeNull();
});

test("outside surprise mode: the reservations of the list, as before", async () => {
  await renderTab({ ...surpriseList, surpriseMode: false, reservations: [reservation] });
  expect(await screen.findByTestId("reservations.item-r")).toHaveTextContent(/Morgan/);
  expect(screen.queryByTestId("reservations.hidden")).toBeNull();
  expect(screen.getByTestId("tab-reservations")).toHaveTextContent(`${i18n.t("list:tabs.reservations")} (1)`);
});
