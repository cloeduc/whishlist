import NetInfo, { NetInfoStateType } from "@react-native-community/netinfo";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import GuestReserve from "../../app/guest/[readToken]/reserve";
import { signIn, signOut } from "@/auth/session";
import { claimsFor, clearGuestAccess } from "@/features/guest/storage";
import { i18n } from "@/i18n";
import { watchNetwork } from "@/network";
import { listChanges } from "@/offline/outbox";

import { fakeFetch, json, me } from "../helpers/fetch";
import { freshDb } from "../helpers/memory-db";
import { publicList } from "../helpers/public-list";

const params: { readToken: string; itemId?: string; typeId?: string } = { readToken: "rt", itemId: "i1" };
jest.mock("expo-router", () => ({
  useFocusEffect: jest.fn(),
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) },
  useLocalSearchParams: () => params,
}));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);

beforeEach(async () => {
  await freshDb();
  await signOut();
  await clearGuestAccess();
  await i18n.changeLanguage("fr");
  params.itemId = "i1";
  jest.mocked(router.replace).mockClear();
  jest.mocked(router.back).mockClear();
  jest.mocked(router.canGoBack).mockReturnValue(true);
});

async function fillAndSubmit() {
  await fireEvent.changeText(await screen.findByTestId("guest-reserve.from-name"), "Sam");
  await fireEvent.changeText(screen.getByTestId("guest-reserve.note"), "Joyeux anniversaire");
  await fireEvent.press(screen.getByTestId("guest-reserve.submit"));
}

test("reservation without an account: name and message sent, claim kept, back to the list", async () => {
  let body: Record<string, unknown> = {};
  fakeFetch({
    "GET /public/lists/rt": () => json(200, publicList()),
    "POST /public/lists/rt/reservations": async (request) => {
      body = await request.json();
      return json(201, { reservationId: "r1", claim: "claim-1" });
    },
  });
  await render(<GuestReserve />);
  expect(await screen.findByText("Cadeau choisi : Idée i1")).toBeOnTheScreen();
  await fillAndSubmit();
  await screen.findByTestId("guest-reserve.screen");
  expect(body).toEqual({ itemId: "i1", fromName: "Sam", note: "Joyeux anniversaire" });
  expect(await claimsFor("rt")).toEqual(["claim-1"]);
  // Back to the view of the list already open, without pushing it a second time.
  expect(router.back).toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
});

test("form opened directly (/l/<t>/reserve link): the list view replaces it", async () => {
  jest.mocked(router.canGoBack).mockReturnValue(false);
  fakeFetch({
    "GET /public/lists/rt": () => json(200, publicList()),
    "POST /public/lists/rt/reservations": () => json(201, { reservationId: "r1", claim: "claim-1" }),
  });
  await render(<GuestReserve />);
  await fillAndSubmit();
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/guest/rt"));
});

test("signed in, not a member (US4-2): the reservation is sent with the session, linked to the account", async () => {
  await signIn({ token: "secret-token", expiresAt: "2099-01-01T00:00:00.000Z", user: me });
  let authorization: string | null = null;
  fakeFetch({
    "GET /public/lists/rt": () => json(200, publicList()),
    "POST /public/lists/rt/reservations": (request) => {
      authorization = request.headers.get("Authorization");
      return json(201, { reservationId: "r1", claim: null });
    },
  });
  await render(<GuestReserve />);
  await fillAndSubmit();
  await screen.findByTestId("guest-reserve.screen");
  expect(authorization).toBe("Bearer secret-token");
  expect(router.back).toHaveBeenCalled();
});

test("idea taken in the meantime: the server's refusal, and the reloaded list no longer offers it", async () => {
  let taken = false;
  const { calls } = fakeFetch({
    "GET /public/lists/rt": () => json(200, taken ? publicList([]) : publicList()),
    "POST /public/lists/rt/reservations": () => {
      taken = true;
      return json(409, { error: { code: "itemAlreadyReserved", message: "x" } });
    },
  });
  await render(<GuestReserve />);
  await fillAndSubmit();
  expect(await screen.findByTestId("guest-reserve.unavailable")).toBeOnTheScreen();
  expect(calls.filter((call) => call === "GET /public/lists/rt")).toHaveLength(2);
  expect(router.replace).not.toHaveBeenCalled();
});

test("server unreachable: the usual error, and nothing is queued", async () => {
  fakeFetch({
    "GET /public/lists/rt": () => json(200, publicList()),
    "POST /public/lists/rt/reservations": () => {
      throw new TypeError("Network request failed");
    },
  });
  await render(<GuestReserve />);
  await fillAndSubmit();
  expect(await screen.findByTestId("guest-reserve.error")).toHaveTextContent(i18n.t("mobile:offline.unreachable"));
  expect(await listChanges()).toEqual([]);
  expect(router.replace).not.toHaveBeenCalled();
});

test("offline: « Confirmer la réservation » is disabled, with the reason", async () => {
  fakeFetch({ "GET /public/lists/rt": () => json(200, publicList()) });
  watchNetwork();
  const listener = jest.mocked(NetInfo.addEventListener).mock.calls[0][0];
  await render(<GuestReserve />);
  await screen.findByTestId("guest-reserve.from-name");
  listener({ isConnected: false, isInternetReachable: false, type: NetInfoStateType.none, details: null, isWifiEnabled: false });
  expect(await screen.findByText(i18n.t("mobile:offline.needsNetwork"))).toBeOnTheScreen();
  expect(screen.getByTestId("guest-reserve.submit")).toBeDisabled();
});
