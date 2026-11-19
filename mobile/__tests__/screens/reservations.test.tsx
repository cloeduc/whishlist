import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import { Linking } from "react-native";

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
  jest.restoreAllMocks();
  // React Native's own mock of `Linking.openURL` keeps its calls across tests: cleared by hand.
  jest.mocked(router.push).mockClear();
  jest.mocked(Linking.openURL).mockClear();
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

/** Times the guest view was opened: in the app (`router.push`) or through the link. */
function guestViewOpenings(): number {
  return jest.mocked(router.push).mock.calls.length + jest.mocked(Linking.openURL).mock.calls.length;
}

test("surprise mode: « Voir la liste partagée » warns before opening the guest view (020)", async () => {
  jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  await renderTab(surpriseList);
  await screen.findByTestId("reservations.hidden");
  await fireEvent.press(screen.getByTestId("list.view-as-guest"));
  await fireEvent.press(screen.getByTestId("list.guest-view-confirm-keep"));
  expect(guestViewOpenings()).toBe(0);
  await fireEvent.press(screen.getByTestId("list.view-as-guest"));
  await fireEvent.press(screen.getByTestId("list.guest-view-confirm"));
  expect(guestViewOpenings()).toBe(1);
});

test("outside surprise mode: « Voir la liste partagée » opens the guest view at once", async () => {
  jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  await renderTab({ ...surpriseList, surpriseMode: false });
  await screen.findByTestId("list.view-as-guest");
  await fireEvent.press(screen.getByTestId("list.view-as-guest"));
  expect(guestViewOpenings()).toBe(1);
  expect(screen.queryByTestId("list.guest-view-confirm")).toBeNull();
});

test("group gift (028): one card with each participant, never an amount; a member cancels it all", async () => {
  const chipIn = (id: string, fromName: string | null) => ({
    ...reservation,
    id,
    itemId: "bike",
    itemName: "Vélo",
    fromName,
    note: null,
    groupGiftId: "g",
    groupGiftStatus: "complete" as const,
  });
  const list = { ...surpriseList, surpriseMode: false, reservations: [reservation, chipIn("p1", "Sam"), chipIn("p2", null)] };
  let cancelled = false;
  await renderTab(list, {
    "DELETE /lists/w/group-gifts/g": () => {
      cancelled = true;
      return new Response(null, { status: 204 });
    },
  });
  const card = await screen.findByTestId("reservations.group-gift-g");
  expect(card).toHaveTextContent(/Cadeau commun · 2 participants/);
  expect(card).toHaveTextContent(/Complet/);
  expect(card).toHaveTextContent(/De la part de Sam/);
  expect(card).toHaveTextContent(/De la part de Anonyme/);
  expect(screen.getByTestId("tab-reservations")).toHaveTextContent(`${i18n.t("list:tabs.reservations")} (2)`);
  await fireEvent.press(screen.getByTestId("reservations.cancel-group-gift-g"));
  await fireEvent.press(screen.getByTestId("reservations.cancel-group-gift-confirm"));
  await waitFor(() => expect(cancelled).toBe(true));
});
