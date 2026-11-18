import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Share } from "react-native";

import GroupGiftScreen from "../../app/gift/[token]";
import { signIn, signOut } from "@/auth/session";
import { claimsForScope, clearGuestAccess, saveClaim, unlockTokenFor } from "@/features/guest/storage";
import { i18n } from "@/i18n";

import { fakeFetch, json, me } from "../helpers/fetch";
import { freshDb } from "../helpers/memory-db";
import { setOnline } from "../helpers/network";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({ token: "gift-tok" }),
  useFocusEffect: jest.fn(),
}));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);

const participation = (extra: object = {}) => ({
  reservationId: null,
  name: "Sam",
  amountCents: 500,
  note: null,
  mine: false,
  editable: false,
  ...extra,
});

/** A group gift as the server sends it (028): `me` and `participations` only for a participant. */
const gift = (extra: object = {}) => ({
  token: "gift-tok",
  status: "open",
  listTitle: "Liste d'Alex",
  item: {
    name: "Vélo",
    typeLabel: "Sport",
    url: null,
    imageUrl: null,
    priceCents: 2000,
    priceLabel: "20,00 €",
    description: null,
    secondHandOk: false,
  },
  participantCount: 1,
  totalCents: 500,
  remainingCents: 1500,
  goalReached: false,
  participantNames: ["Sam"],
  me: null,
  participations: null,
  claimKey: "ck-rt",
  ...extra,
});

beforeEach(async () => {
  await freshDb();
  await signOut();
  await clearGuestAccess();
  await i18n.changeLanguage("fr");
  await setOnline(true);
});

test("someone who does not chip in: names and what is left, never amounts; joining files the claim", async () => {
  let body: Record<string, unknown> = {};
  let joined = false;
  fakeFetch({
    "GET /public/group-gifts/gift-tok": () =>
      json(
        200,
        joined
          ? gift({
              participantCount: 2,
              participantNames: ["Sam", null],
              me: participation({ reservationId: "p2", name: null, amountCents: 700, mine: true }),
              participations: [participation(), participation({ reservationId: "p2", name: null, amountCents: 700, mine: true })],
            })
          : gift(),
      ),
    "POST /public/group-gifts/gift-tok/participations": async (request) => {
      body = await request.json();
      joined = true;
      return json(201, { reservationId: "p2", claim: "claim-p2", claimKey: "ck-rt" });
    },
  });
  await render(<GroupGiftScreen />);
  expect(await screen.findByTestId("gift.summary")).toHaveTextContent("1 participant · il reste 15,00 €");
  expect(screen.getByTestId("gift.participant-0")).toHaveTextContent("Sam");
  expect(screen.queryByText("Sam · 5,00 €")).toBeNull();
  expect(screen.queryByTestId("gift.share")).toBeNull();
  await fireEvent.changeText(screen.getByTestId("gift.amount"), "7");
  await fireEvent.press(screen.getByTestId("gift.join"));
  await waitFor(() => expect(screen.getByTestId("gift.participant-1")).toHaveTextContent("Anonyme · 7,00 €"));
  expect(body).toEqual({ fromName: "", note: "", amountCents: 700 });
  expect(await claimsForScope({ giftToken: "gift-tok" })).toEqual(["claim-p2"]);
  // Without an account the amount cannot change; the gift's link can be shared.
  expect(screen.queryByTestId("gift.my-amount")).toBeNull();
  expect(screen.getByText("Avec un compte, vous pourriez changer votre montant et échanger avec les autres participants.")).toBeOnTheScreen();
  const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction", activityType: undefined });
  await fireEvent.press(screen.getByTestId("gift.share"));
  expect(share.mock.calls[0][0].message).toContain("/g/gift-tok");
});

test("a participant by claim marks it complete; the claim goes with each request", async () => {
  await saveClaim({ giftToken: "gift-tok", claimKey: "ck-rt" }, "p1", "claim-p1");
  const mine = { me: participation({ reservationId: "p1", mine: true }), participations: [participation({ reservationId: "p1", mine: true })] };
  const claims: (string | null)[] = [];
  fakeFetch({
    "GET /public/group-gifts/gift-tok": (request) => {
      claims.push(request.headers.get("X-Reservation-Claims"));
      return json(200, gift(mine));
    },
    "PUT /public/group-gifts/gift-tok/status": (request) => {
      claims.push(request.headers.get("X-Reservation-Claims"));
      return json(200, gift({ ...mine, status: "complete" }));
    },
  });
  await render(<GroupGiftScreen />);
  await fireEvent.press(await screen.findByTestId("gift.complete"));
  await fireEvent.press(screen.getByTestId("gift.complete-confirm"));
  expect(await screen.findByTestId("gift.complete-badge")).toBeOnTheScreen();
  expect(screen.getByTestId("gift.reopen")).toBeOnTheScreen();
  expect(claims).toEqual(["claim-p1", "claim-p1"]);
});

test("signed in: the participant changes their amount", async () => {
  await signIn({ token: "secret-token", expiresAt: "2099-01-01T00:00:00.000Z", user: me });
  const mine = (amountCents: number) => ({
    totalCents: amountCents,
    me: participation({ reservationId: "p1", name: "Alex", amountCents, mine: true, editable: true }),
    participations: [participation({ reservationId: "p1", name: "Alex", amountCents, mine: true, editable: true })],
  });
  let body: Record<string, unknown> = {};
  fakeFetch({
    "GET /public/group-gifts/gift-tok": () => json(200, gift(mine(500))),
    "PATCH /public/group-gifts/gift-tok/participations/p1": async (request) => {
      body = await request.json();
      return json(200, gift(mine(1200)));
    },
  });
  await render(<GroupGiftScreen />);
  expect(await screen.findByTestId("gift.my-amount")).toHaveDisplayValue("5,00");
  await fireEvent.changeText(screen.getByTestId("gift.my-amount"), "12");
  await fireEvent.press(screen.getByTestId("gift.save-amount"));
  await waitFor(() => expect(screen.getByText("Votre part : 12,00 €")).toBeOnTheScreen());
  expect(body).toEqual({ amountCents: 1200 });
});

test("a complete gift: no form for someone who does not chip in", async () => {
  fakeFetch({ "GET /public/group-gifts/gift-tok": () => json(200, gift({ status: "complete" })) });
  await render(<GroupGiftScreen />);
  expect(await screen.findByTestId("gift.closed")).toBeOnTheScreen();
  expect(screen.queryByTestId("gift.join")).toBeNull();
});

test("protected list: the list's password, filed under the gift; a missing gift says so", async () => {
  let unlocked = false;
  fakeFetch({
    "GET /public/group-gifts/gift-tok": () =>
      unlocked
        ? json(200, gift())
        : json(423, { error: { code: "readPasswordRequired", message: "Mot de passe" }, title: "Liste d'Alex" }),
    "POST /public/group-gifts/gift-tok/unlock": () => {
      unlocked = true;
      return json(200, { unlockToken: "unlock-1", expiresAt: "2099-01-01T00:00:00.000Z" });
    },
  });
  await render(<GroupGiftScreen />);
  await fireEvent.changeText(await screen.findByTestId("gift.password"), "lecture-demo");
  await fireEvent.press(screen.getByTestId("gift.unlock"));
  expect(await screen.findByTestId("gift.summary")).toBeOnTheScreen();
  expect(await unlockTokenFor("gift:gift-tok")).toBe("unlock-1");
});

test("a gift that no longer exists", async () => {
  fakeFetch({ "GET /public/group-gifts/gift-tok": () => json(404, { error: { code: "groupGiftMissing", message: "x" } }) });
  await render(<GroupGiftScreen />);
  expect(await screen.findByTestId("gift.missing")).toBeOnTheScreen();
});
