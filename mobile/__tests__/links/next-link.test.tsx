import { render } from "@testing-library/react-native";
import { useLocalSearchParams } from "expo-router";

import { afterSignIn, clearPendingLink, useNextLink } from "@/links/pending";

jest.mock("expo-router", () => ({ useLocalSearchParams: jest.fn(() => ({})) }));
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.0", extra: { apiUrl: "https://ohyoushouldnt.example.test" } } },
}));

function SignInScreen() {
  useNextLink();
  return null;
}

async function openSignInWith(next: string | undefined) {
  jest.mocked(useLocalSearchParams).mockReturnValue(next === undefined ? {} : { next });
  await render(<SignInScreen />);
}

beforeEach(clearPendingLink);

test("an invitation in `next` is kept for after sign-in", async () => {
  await openSignInWith("/invite/tok");
  expect(afterSignIn()).toBe("/links/invite/tok");
});

test("a list's management address in `next` is kept, under its current and former forms (026)", async () => {
  await openSignInWith("/lists/abc");
  expect(afterSignIn()).toBe("/links/list/abc");
  clearPendingLink();
  await openSignInWith("/listes/abc");
  expect(afterSignIn()).toBe("/links/list/abc");
});

test("any other `next` is ignored", async () => {
  await openSignInWith("/account");
  expect(afterSignIn()).toBe("/");
  await openSignInWith(undefined);
  expect(afterSignIn()).toBe("/");
});
