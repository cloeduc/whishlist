import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";

import ListLink from "../../app/links/list/[listId]";
import { signIn, signOut } from "@/auth/session";
import { refreshLists, resetStore } from "@/data/store";
import { i18n } from "@/i18n";
import { afterSignIn, clearPendingLink } from "@/links/pending";

import { fakeFetch, json, me } from "../helpers/fetch";
import { freshDb } from "../helpers/memory-db";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: jest.fn(() => ({ listId: "mine" })),
  Redirect: ({ href }: { href: string }) => {
    const { Text: RNText } = jest.requireActual("react-native");
    return <RNText>{`redirect:${href}`}</RNText>;
  },
}));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);

const summary = {
  id: "mine",
  title: "Nos envies",
  subtitle: null,
  coverImageUrl: null,
  theme: {},
  role: "owner",
  itemCount: 3,
  readUrl: "https://ohyoushouldnt.example.test/l/mine-read",
};
const followed = {
  id: "followed",
  readToken: "followed-read",
  title: "Liste de Sam",
  subtitle: null,
  coverImageUrl: null,
  theme: {},
  itemCount: 2,
  readUrl: "https://ohyoushouldnt.example.test/l/followed-read",
  subscribedAt: "2026-11-01T00:00:00.000Z",
  locked: false,
  customTitle: null,
  customOwnerName: null,
  ownerName: "Sam",
};
const lists = () => json(200, { lists: [summary], subscriptions: [followed] });

beforeEach(async () => {
  await freshDb();
  resetStore();
  await signOut();
  clearPendingLink();
  await i18n.changeLanguage("fr");
  jest.mocked(router.replace).mockClear();
  jest.mocked(router.push).mockClear();
  jest.mocked(useLocalSearchParams).mockReturnValue({ listId: "mine" });
});

async function signInAs(user = me) {
  fakeFetch({});
  await signIn({ token: "t", expiresAt: "2099-01-01T00:00:00.000Z", user });
}

test("a member goes to the list", async () => {
  await signInAs();
  fakeFetch({ "GET /lists": lists });
  await render(<ListLink />);
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/lists/mine"));
  expect(afterSignIn()).toBe("/");
});

test("a member goes to the screen of the tab named by the address", async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ listId: "mine", tab: "sharing" });
  await signInAs();
  fakeFetch({ "GET /lists": lists });
  await render(<ListLink />);
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/lists/mine/share"));
});

test("not a member: the help screen, which says nothing about the list and leads home", async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ listId: "someone-else" });
  await signInAs();
  fakeFetch({ "GET /lists": lists });
  await render(<ListLink />);
  expect(await screen.findByTestId("link-list.help")).toBeOnTheScreen();
  expect(screen.getByText("Cette adresse sert à gérer la liste")).toBeOnTheScreen();
  expect(screen.getByText(/demandez le lien de la liste/)).toBeOnTheScreen();
  expect(screen.queryByText(/Nos envies|Liste de Sam/)).toBeNull();
  await fireEvent.press(screen.getByTestId("link-list.back"));
  expect(router.replace).toHaveBeenCalledWith("/");
});

test("a follower: the help screen offers the followed list", async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ listId: "followed" });
  await signInAs();
  fakeFetch({ "GET /lists": lists });
  await render(<ListLink />);
  expect(await screen.findByTestId("link-list.help")).toBeOnTheScreen();
  expect(screen.getByText(/Vous suivez déjà cette liste/)).toBeOnTheScreen();
  expect(screen.queryByText(/demandez le lien de la liste/)).toBeNull();
  await fireEvent.press(screen.getByTestId("link-list.view-followed"));
  expect(router.replace).toHaveBeenCalledWith("/guest/followed-read");
});

test("not a follower: no « Voir la liste »", async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ listId: "someone-else" });
  await signInAs();
  fakeFetch({ "GET /lists": lists });
  await render(<ListLink />);
  expect(await screen.findByTestId("link-list.help")).toBeOnTheScreen();
  expect(screen.queryByTestId("link-list.view-followed")).toBeNull();
});

test("without network: the decision uses the local copy of the lists", async () => {
  await signInAs();
  fakeFetch({ "GET /lists": lists });
  await refreshLists();
  resetStore();
  fakeFetch({
    "GET /lists": () => {
      throw new TypeError("Network request failed");
    },
  });
  await render(<ListLink />);
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/lists/mine"));
});

test("without network nor local copy: the help screen", async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ listId: "unknown" });
  await signInAs();
  fakeFetch({
    "GET /lists": () => {
      throw new TypeError("Network request failed");
    },
  });
  await render(<ListLink />);
  expect(await screen.findByTestId("link-list.help")).toBeOnTheScreen();
});

test("without a session: the address is kept and sign-in is offered", async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ listId: "mine", tab: "sharing" });
  fakeFetch({});
  await render(<ListLink />);
  expect(screen.getByTestId("link-list.screen")).toBeOnTheScreen();
  await fireEvent.press(screen.getByTestId("link-list.login"));
  expect(router.push).toHaveBeenCalledWith("/login");
  expect(afterSignIn()).toBe("/links/list/mine?tab=sharing");
});

test("forced password change: it comes first, the address is kept", async () => {
  await signInAs({ ...me, mustChangePassword: true });
  await render(<ListLink />);
  expect(screen.getByText("redirect:/change-password")).toBeOnTheScreen();
  expect(afterSignIn()).toBe("/links/list/mine");
});
