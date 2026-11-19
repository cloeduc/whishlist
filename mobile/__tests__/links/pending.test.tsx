import { render, screen } from "@testing-library/react-native";
import { useLocalSearchParams } from "expo-router";

import AuthLayout from "../../app/(auth)/_layout";
import ChangePassword from "../../app/change-password";
import { signIn, signOut } from "@/auth/session";
import { afterSignIn, clearPendingLink, setPendingLink, useNextLink } from "@/links/pending";

import { me } from "../helpers/fetch";
import { freshDb } from "../helpers/memory-db";

jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text: RNText } = jest.requireActual("react-native");
    return <RNText>{`redirect:${href}`}</RNText>;
  },
  Stack: () => null,
  useLocalSearchParams: jest.fn(() => ({})),
}));

beforeEach(freshDb);
afterEach(async () => {
  clearPendingLink();
  await signOut();
});

test("without a link: the home screen; with a link: the last one opened, until its screen clears it", () => {
  expect(afterSignIn()).toBe("/");
  setPendingLink("/links/invite/a");
  setPendingLink("/links/invite/b");
  expect(afterSignIn()).toBe("/links/invite/b");
  expect(afterSignIn()).toBe("/links/invite/b");
  clearPendingLink();
  expect(afterSignIn()).toBe("/");
});

test("once signed in, the person returns to the link that led them to sign in", async () => {
  setPendingLink("/links/invite/tok");
  await signIn({ token: "t", expiresAt: "2099-01-01T00:00:00.000Z", user: me });
  await render(<AuthLayout />);
  expect(screen.getByText("redirect:/links/invite/tok")).toBeOnTheScreen();
});

test("forced password change: it comes first, then the app resumes the link (R5)", async () => {
  setPendingLink("/links/invite/tok");
  await signIn({ token: "t", expiresAt: "2099-01-01T00:00:00.000Z", user: { ...me, mustChangePassword: true } });
  await render(<AuthLayout />);
  expect(screen.getByText("redirect:/change-password")).toBeOnTheScreen();
  await signIn({ token: "t", expiresAt: "2099-01-01T00:00:00.000Z", user: me });
  await render(<ChangePassword />);
  expect(screen.getByText("redirect:/links/invite/tok")).toBeOnTheScreen();
});

function SignInScreen() {
  useNextLink();
  return null;
}

async function openSignInWith(next: string | undefined) {
  jest.mocked(useLocalSearchParams).mockReturnValue(next === undefined ? {} : { next });
  await render(<SignInScreen />);
}

test("sign-in opened with an invitation in `next`: it is kept for after sign-in", async () => {
  await openSignInWith("/invite/tok");
  expect(afterSignIn()).toBe("/links/invite/tok");
});

test("sign-in opened with a list's management address in `next`, current or former form: it is kept (026)", async () => {
  await openSignInWith("/lists/abc");
  expect(afterSignIn()).toBe("/links/list/abc");
  clearPendingLink();
  await openSignInWith("/listes/abc");
  expect(afterSignIn()).toBe("/links/list/abc");
});

test("sign-in opened with any other `next`: ignored", async () => {
  await openSignInWith("/account");
  expect(afterSignIn()).toBe("/");
  await openSignInWith(undefined);
  expect(afterSignIn()).toBe("/");
});
