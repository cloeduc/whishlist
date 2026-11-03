import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";

import MyLists from "../../app/(app)/index";
import FollowSharedList from "../../app/(app)/shared/follow";
import { signIn } from "@/auth/session";
import { resetStore } from "@/data/store";
import { i18n } from "@/i18n";

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

beforeEach(async () => {
  await freshDb();
  resetStore();
  await i18n.changeLanguage("fr");
  jest.clearAllMocks();
  jest.mocked(useLocalSearchParams).mockReturnValue({ readToken: "demo-list-lecture" });
  await signIn({ token: "secret-token", expiresAt: "2099-01-01T00:00:00.000Z", user: me });
});

test("MyLists renders the followed lists section and opens the follow screen or a followed list", async () => {
  fakeFetch({
    "GET /lists": () => json(200, { lists: [], subscriptions: [sharedSummary] }),
  });
  await render(<MyLists />);
  expect(await screen.findByText("Listes suivies")).toBeOnTheScreen();
  expect(await screen.findByText("Liste de Camille")).toBeOnTheScreen();

  await fireEvent.press(screen.getByTestId("lists.follow-open"));
  expect(router.push).toHaveBeenCalledWith("/shared/follow");

  await fireEvent.press(screen.getByTestId("lists.shared-card-demo-list-lecture"));
  expect(router.push).toHaveBeenCalledWith("/guest/demo-list-lecture");
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
    expect(router.replace).toHaveBeenCalledWith("/guest/demo-list-lecture");
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
