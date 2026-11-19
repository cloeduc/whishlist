import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import ConfirmEmailLink from "../../app/links/confirm-email/[token]";
import { getSession, signIn, signOut } from "@/auth/session";
import { i18n } from "@/i18n";

import { fakeFetch, json, me } from "../helpers/fetch";
import { freshDb } from "../helpers/memory-db";

const params: { token: string; next?: string } = { token: "tok" };
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => params,
}));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);

beforeEach(async () => {
  await freshDb();
  await signOut();
  await i18n.changeLanguage("fr");
  params.token = "tok";
  delete params.next;
  jest.mocked(router.replace).mockClear();
});

const confirmed = (purpose: "verify" | "change", ownAccount = true) => () =>
  json(200, { purpose, ownAccount, suite: null });

test("signed in, address not confirmed: the link confirms on opening and the account is reloaded", async () => {
  await signIn({ token: "t", expiresAt: "2099-01-01T00:00:00.000Z", user: { ...me, emailVerified: false } });
  const { calls } = fakeFetch({
    "POST /auth/email-confirmation": confirmed("verify"),
    "GET /me": () => json(200, me),
  });
  await render(<ConfirmEmailLink />);
  expect(await screen.findByTestId("confirm-email.status")).toHaveTextContent(/Votre adresse e-mail est confirmée/);
  expect(calls.filter((call) => call === "POST /auth/email-confirmation")).toHaveLength(1);
  expect(calls).toContain("GET /me");
  const session = getSession();
  expect(session.status === "signedIn" && session.user?.emailVerified).toBe(true);
  expect(screen.getByTestId("confirm-email.next")).toHaveTextContent("Mes listes");
});

test("without a session: address confirmed, then sign-in is offered", async () => {
  fakeFetch({ "POST /auth/email-confirmation": confirmed("verify", false) });
  await render(<ConfirmEmailLink />);
  await screen.findByTestId("confirm-email.status");
  expect(screen.getByTestId("confirm-email.next")).toHaveTextContent("Se connecter");
});

test("changement d'adresse de son propre compte : « Mon compte »", async () => {
  await signIn({ token: "t", expiresAt: "2099-01-01T00:00:00.000Z", user: me });
  const changed = { ...me, email: "alex.nouveau@example.test" };
  const { calls } = fakeFetch({ "POST /auth/email-confirmation": confirmed("change"), "GET /me": () => json(200, changed) });
  await render(<ConfirmEmailLink />);
  expect(await screen.findByTestId("confirm-email.status")).toHaveTextContent(/nouvelle adresse de connexion/);
  expect(screen.getByTestId("confirm-email.next")).toHaveTextContent("Mon compte");
  // « Mon compte » reloads the account: the new address is already there (US1-4, FR-007).
  expect(calls).toContain("GET /me");
  await waitFor(() => {
    const session = getSession();
    expect(session.status === "signedIn" && session.user?.email).toBe("alex.nouveau@example.test");
  });
});

test("signed in to another account than the link's (US1-8): no « Mon compte », no address shown", async () => {
  await signIn({ token: "t", expiresAt: "2099-01-01T00:00:00.000Z", user: me });
  fakeFetch({ "POST /auth/email-confirmation": confirmed("change", false), "GET /me": () => json(200, me) });
  await render(<ConfirmEmailLink />);
  await screen.findByTestId("confirm-email.status");
  expect(screen.getByTestId("confirm-email.next")).toHaveTextContent("Mes listes");
  expect(screen.queryByText(/@example\.test/)).toBeNull();
});

test("expired link: the site's message, with no address shown", async () => {
  fakeFetch({
    "POST /auth/email-confirmation": () =>
      json(400, { error: { code: "confirmationLinkExpired", message: "x" } }),
  });
  await render(<ConfirmEmailLink />);
  expect(await screen.findByTestId("confirm-email.error")).toBeOnTheScreen();
  expect(screen.queryByText(/@example\.test/)).toBeNull();
  expect(screen.queryByTestId("confirm-email.retry")).toBeNull();
  // Without a session: how to ask for a link again, like the site's page.
  expect(screen.getByTestId("confirm-email.login-to-resend")).toBeOnTheScreen();
});

test("server unreachable: « Réessayer » retries the confirmation", async () => {
  let attempts = 0;
  fakeFetch({
    "POST /auth/email-confirmation": () => {
      attempts += 1;
      if (attempts === 1) throw new TypeError("Network request failed");
      return json(200, { purpose: "verify", ownAccount: false, suite: null });
    },
  });
  await render(<ConfirmEmailLink />);
  const retry = await screen.findByTestId("confirm-email.retry");
  await fireEvent.press(retry);
  expect(await screen.findByTestId("confirm-email.status")).toBeOnTheScreen();
  expect(attempts).toBe(2);
});

test("sign-up from an invitation: « Reprendre l'invitation » leads to the invitation screen", async () => {
  params.next = "/invite/it";
  let sent: unknown;
  fakeFetch({
    "POST /auth/email-confirmation": async (request) => {
      sent = await request.json();
      return json(200, { purpose: "verify", ownAccount: false, suite: "/invite/it" });
    },
  });
  await render(<ConfirmEmailLink />);
  const next = await screen.findByTestId("confirm-email.next");
  expect(next).toHaveTextContent("Reprendre l’invitation");
  await fireEvent.press(next);
  expect(router.replace).toHaveBeenCalledWith("/links/invite/it");
  expect(sent).toMatchObject({ token: "tok", suite: "/invite/it" });
});

test("a server that still returns a former French invitation path: the invitation is resumed (018)", async () => {
  params.next = "/invite/it";
  fakeFetch({
    "POST /auth/email-confirmation": () => json(200, { purpose: "verify", ownAccount: false, suite: "/inviter/it" }),
  });
  await render(<ConfirmEmailLink />);
  await fireEvent.press(await screen.findByTestId("confirm-email.next"));
  expect(router.replace).toHaveBeenCalledWith("/links/invite/it");
});
