import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";

import MyLists from "../../app/(app)/index";
import SharedListScreen from "../../app/(app)/shared/[readToken]";
import FollowSharedList from "../../app/(app)/shared/follow";
import { signIn } from "@/auth/session";
import { resetStore } from "@/data/store";
import { i18n } from "@/i18n";
import { putSnapshot } from "@/offline/snapshot";

import { fakeFetch, json, me } from "../helpers/fetch";
import { freshDb } from "../helpers/memory-db";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: jest.fn(() => ({ readToken: "demo-list-lecture" })),
}));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.0", extra: { apiUrl: "https://api.example.test" } } },
}));

const sharedSummary = {
  id: "demo-list",
  readToken: "demo-list-lecture",
  title: "Liste de Camille",
  subtitle: "Pour les fêtes",
  coverImageUrl: null,
  theme: {},
  itemCount: 2,
  readUrl: "https://ohyoushouldnt.example.test/l/demo-list-lecture",
  subscribedAt: "2026-11-02T10:00:00.000Z",
  locked: false,
};

const publicListBody = {
  title: "Liste de Camille",
  subtitle: "Pour les fêtes",
  coverImageUrl: null,
  theme: {},
  subscribed: true,
  isMember: false,
  categories: [{ id: "cat-1", label: "Livres", sortOrder: 0 }],
  people: [{ id: "p-1", label: "Camille" }],
  items: [
    {
      id: "item-1",
      name: "Roman graphique",
      typeId: "cat-1",
      personId: "p-1",
      url: "https://shop.example.test/livre",
      imageUrl: null,
      priceCents: 2400,
      priceLabel: "24,00 €",
      priority: "4",
      mine: false,
      reservationId: null,
    },
  ],
};

beforeEach(async () => {
  await freshDb();
  resetStore();
  await i18n.changeLanguage("fr");
  jest.clearAllMocks();
  jest.mocked(useLocalSearchParams).mockReturnValue({ readToken: "demo-list-lecture" });
  await signIn({ token: "secret-token", expiresAt: "2099-01-01T00:00:00.000Z", user: me });
});

test("MyLists renders the followed lists section and opens the follow screen or a shared list", async () => {
  fakeFetch({
    "GET /lists": () => json(200, { lists: [], subscriptions: [sharedSummary] }),
  });
  await render(<MyLists />);
  expect(await screen.findByText("Listes suivies")).toBeOnTheScreen();
  expect(await screen.findByText("Liste de Camille")).toBeOnTheScreen();

  await fireEvent.press(screen.getByTestId("lists.follow-open"));
  expect(router.push).toHaveBeenCalledWith("/shared/follow");

  await fireEvent.press(screen.getByTestId("lists.shared-card-demo-list-lecture"));
  expect(router.push).toHaveBeenCalledWith("/shared/demo-list-lecture");
});

test("FollowSharedList handles link submission and 423 password prompt", async () => {
  let step = 0;
  fakeFetch({
    "POST /subscriptions": async (req) => {
      const body = (await req.json()) as { urlOrToken: string; password?: string };
      if (++step === 1) {
        return json(423, {
          error: { code: "readPasswordRequired", message: "Mot de passe requis" },
          title: "Liste de Camille",
          readToken: "demo-list-lecture",
        });
      }
      expect(body.password).toBe("secret-1234");
      return json(201, sharedSummary);
    },
    "GET /lists": () => json(200, { lists: [], subscriptions: [sharedSummary] }),
  });

  await render(<FollowSharedList />);
  await fireEvent.changeText(
    screen.getByTestId("follow.link"),
    "https://ohyoushouldnt.app/l/demo-list-lecture",
  );
  await fireEvent.press(screen.getByTestId("follow.submit"));

  // Le champ mot de passe et le titre de la liste apparaissent après 423
  expect(await screen.findByText("Liste de Camille")).toBeOnTheScreen();
  const pwdInput = await screen.findByTestId("follow.password");
  await fireEvent.changeText(pwdInput, "secret-1234");
  await fireEvent.press(screen.getByTestId("follow.submit"));

  await waitFor(() => {
    expect(router.replace).toHaveBeenCalledWith("/shared/demo-list-lecture");
  });
});

test("FollowSharedList shows an error when the link is invalid or user is already a member", async () => {
  fakeFetch({
    "POST /subscriptions": () =>
      json(400, { error: { code: "alreadyMember", message: "Vous faites déjà partie des membres de cette liste." } }),
  });

  await render(<FollowSharedList />);
  // Lien vide refusé localement
  await fireEvent.press(screen.getByTestId("follow.submit"));
  expect(await screen.findByText("Saisissez le lien valide d'une liste partagée.")).toBeOnTheScreen();

  // Lien d'une liste dont on est déjà membre
  await fireEvent.changeText(screen.getByTestId("follow.link"), "demo-list-lecture");
  await fireEvent.press(screen.getByTestId("follow.submit"));
  expect(await screen.findByText("Vous faites déjà partie des membres de cette liste.")).toBeOnTheScreen();
});

test("SharedListScreen displays items, reserves an idea and cancels own reservation", async () => {
  let reserved = false;
  fakeFetch({
    "GET /public/lists/demo-list-lecture": () =>
      json(200, {
        ...publicListBody,
        items: [
          {
            ...publicListBody.items[0]!,
            mine: reserved,
            reservationId: reserved ? "res-1" : null,
          },
        ],
      }),
    "POST /public/lists/demo-list-lecture/reservations": async () => {
      reserved = true;
      return json(201, { reservationId: "res-1", claim: "claim-1" });
    },
    "DELETE /public/lists/demo-list-lecture/reservations/res-1": async () => {
      reserved = false;
      return new Response(null, { status: 204 });
    },
  });

  await render(<SharedListScreen />);
  expect(await screen.findByText("Roman graphique")).toBeOnTheScreen();

  // Ouvrir la modale de réservation
  await fireEvent.press(screen.getByTestId("shared.offer-item-1"));
  await fireEvent.changeText(await screen.findByTestId("shared.reserve-name"), "Alex");
  await fireEvent.changeText(screen.getByTestId("shared.reserve-note"), "Joyeux Noël");
  await fireEvent.press(screen.getByTestId("shared.reserve-submit"));

  // L'idée est maintenant marquée "Réservé par vous"
  expect(await screen.findByText("Réservé par vous")).toBeOnTheScreen();

  // Annuler sa propre réservation
  await fireEvent.press(screen.getByTestId("shared.cancel-item-1"));
  await fireEvent.press(await screen.findByTestId("shared.cancel-confirm"));

  await waitFor(() => {
    expect(screen.queryByText("Réservé par vous")).toBeNull();
  });
});

test("SharedListScreen reads from local SQLite snapshot when offline", async () => {
  await putSnapshot("publicList:demo-list-lecture", publicListBody, "2026-11-02T09:00:00.000Z");
  globalThis.fetch = jest.fn(async () => {
    throw new TypeError("Network request failed");
  });

  await render(<SharedListScreen />);
  expect(await screen.findByText("Liste de Camille")).toBeOnTheScreen();
  expect(await screen.findByText("Roman graphique")).toBeOnTheScreen();
});

test("SharedListScreen unfollows the list after confirmation and navigates back to MyLists", async () => {
  let deleted = false;
  fakeFetch({
    "GET /public/lists/demo-list-lecture": () => json(200, publicListBody),
    "DELETE /subscriptions/demo-list-lecture": async () => {
      deleted = true;
      return new Response(null, { status: 204 });
    },
    "GET /lists": () => json(200, { lists: [], subscriptions: [] }),
  });

  await render(<SharedListScreen />);
  expect(await screen.findByText("Roman graphique")).toBeOnTheScreen();

  await fireEvent.press(screen.getByTestId("shared.unfollow"));
  await fireEvent.press(await screen.findByTestId("shared.unfollow-confirm"));

  await waitFor(() => {
    expect(deleted).toBe(true);
    expect(router.replace).toHaveBeenCalledWith("/");
  });
});

test("SharedListScreen filters items by recipient and budget, and unlocks or unfollows a locked list", async () => {
  const twoItemsBody = {
    ...publicListBody,
    people: [
      { id: "p-1", label: "Camille" },
      { id: "p-2", label: "Alex" },
    ],
    items: [
      ...publicListBody.items,
      {
        id: "item-2",
        name: "Tasse artisanale",
        typeId: "cat-1",
        personId: "p-2",
        url: null,
        imageUrl: null,
        priceCents: 1500,
        priceLabel: "15,00 €",
        priority: "2",
        mine: false,
        reservationId: null,
      },
    ],
  };

  let locked = true;
  fakeFetch({
    "GET /public/lists/demo-list-lecture": () =>
      locked
        ? json(423, { error: { code: "readPasswordRequired", message: "Protégée" }, title: "Liste de Camille" })
        : json(200, twoItemsBody),
    "POST /public/lists/demo-list-lecture/unlock": async () => {
      locked = false;
      return json(200, { unlockToken: "tok", expiresAt: "2099-01-01T00:00:00.000Z" });
    },
    "GET /lists": () => json(200, { lists: [], subscriptions: [sharedSummary] }),
  });

  await render(<SharedListScreen />);
  // Écran verrouillé : le bouton de désabonnement est également présent
  expect(await screen.findByTestId("shared.unlock-screen")).toBeOnTheScreen();
  expect(screen.getByTestId("shared.unfollow")).toBeOnTheScreen();

  await fireEvent.changeText(screen.getByTestId("shared.unlock-password"), "secret-1234");
  await fireEvent.press(screen.getByTestId("shared.unlock-submit"));

  expect(await screen.findByText("Roman graphique")).toBeOnTheScreen();
  expect(screen.getByText("Tasse artisanale")).toBeOnTheScreen();

  // Filtre par personne "Alex" (p-2)
  await fireEvent.press(screen.getByTestId("tab-p-2"));
  expect(screen.queryByText("Roman graphique")).toBeNull();
  expect(screen.getByText("Tasse artisanale")).toBeOnTheScreen();

  // Revenir à "Tout le monde" puis filtrer par budget "under-20"
  await fireEvent.press(screen.getByRole("tab", { name: "Tout le monde" }));
  await fireEvent.press(screen.getByTestId("tab-under-20"));
  expect(screen.queryByText("Roman graphique")).toBeNull();
  expect(screen.getByText("Tasse artisanale")).toBeOnTheScreen();
});
