import NetInfo, { NetInfoStateType } from "@react-native-community/netinfo";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { Linking } from "react-native";

import Account from "../../app/(app)/account";
import { signIn } from "@/auth/session";
import { resetStore } from "@/data/store";
import { i18n } from "@/i18n";
import { watchNetwork } from "@/network";
import { tokens } from "@/theme/tokens";

import { fakeFetch, me } from "../helpers/fetch";
import { freshDb } from "../helpers/memory-db";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true } }));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.0", extra: { apiUrl: "https://api.example.test" } } },
}));

beforeEach(async () => {
  await freshDb();
  resetStore();
  await i18n.changeLanguage("fr");
  fakeFetch({});
  await signIn({ token: "secret-token", expiresAt: "2099-01-01T00:00:00.000Z", user: me });
});

type Node = { props: Record<string, unknown>; children: (Node | string)[] | null };

/** Libellés des boutons et liens, dans l'ordre de l'écran. */
function actions(): string[] {
  const labels: string[] = [];
  const walk = (node: Node | string) => {
    if (typeof node === "string") return;
    const role = node.props.accessibilityRole;
    if (role === "button" || role === "link") labels.push(String(node.props.accessibilityLabel));
    for (const child of node.children ?? []) walk(child);
  };
  walk(screen.toJSON() as unknown as Node);
  return labels;
}

test("the bottom section, in the order of FR-001, ends with the destructive deletion", async () => {
  await render(<Account />);
  await screen.findByText("Vos données et informations");
  const labels = actions();
  const expected = [
    "Mentions légales",
    "Données personnelles",
    "Télécharger mes données",
    "Licences",
    "Nous écrire",
    "Se déconnecter",
    "Supprimer mon compte",
  ];
  expect(labels.slice(-expected.length)).toEqual(expected);
  expect(screen.getByText("Version 1.0.0")).toBeOnTheScreen();
  expect(screen.getByTestId("delete-account-box")).toHaveStyle({ backgroundColor: tokens.colors.destructive });
});

test("the links open the legal screens, the deletion screen and the e-mail app", async () => {
  const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  await render(<Account />);
  await fireEvent.press(await screen.findByRole("link", { name: "Mentions légales" }));
  await fireEvent.press(screen.getByRole("link", { name: "Données personnelles" }));
  await fireEvent.press(screen.getByRole("link", { name: "Licences" }));
  await fireEvent.press(screen.getByRole("button", { name: "Supprimer mon compte" }));
  expect(jest.mocked(router.push).mock.calls.map(([path]) => path)).toEqual([
    "/legal/mentions",
    "/legal/privacy",
    "/legal/licenses",
    "/delete-account",
  ]);
  await fireEvent.press(screen.getByRole("link", { name: "Nous écrire" }));
  expect(openURL).toHaveBeenCalledWith("mailto:contact@ohyoushouldnt.app");
});

// Dernier : le réseau reste coupé pour la suite du fichier.
test("offline: download and deletion are disabled, the legal pages stay open", async () => {
  watchNetwork();
  const listener = jest.mocked(NetInfo.addEventListener).mock.calls[0][0];
  await render(<Account />);
  await screen.findByText("Vos données et informations");
  listener({ isConnected: false, isInternetReachable: false, type: NetInfoStateType.none, details: null, isWifiEnabled: false });
  expect(await screen.findByRole("button", { name: "Supprimer mon compte" })).toBeDisabled();
  expect(screen.getByRole("link", { name: "Télécharger mes données" })).toBeDisabled();
  expect(screen.getByRole("link", { name: "Mentions légales" })).toBeEnabled();
});
