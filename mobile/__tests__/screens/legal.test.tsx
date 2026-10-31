import NetInfo, { NetInfoStateType } from "@react-native-community/netinfo";
import { render, screen, waitFor } from "@testing-library/react-native";

import Mentions from "../../app/legal/mentions";
import Privacy from "../../app/legal/privacy";
import { NetworkError } from "@/api/client";
import { getSession } from "@/auth/session";
import { i18n } from "@/i18n";
import { watchNetwork } from "@/network";
import { putSnapshot } from "@/offline/snapshot";

import { fakeFetch, json } from "../helpers/fetch";
import { freshDb } from "../helpers/memory-db";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true } }));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);

const fr = (key: string) => i18n.t(`content:${key}`, { email: "contact@ohyoushouldnt.app" });
const optional = ["privacy.mailBody", "privacy.aiBody", "privacy.audienceBody"];

beforeEach(async () => {
  await freshDb();
  await i18n.changeLanguage("fr");
});

function capabilities(value: boolean) {
  return { apiVersion: "1.2.0", enrich: value, mail: value, analytics: value };
}

test("mentions: same texts as the site, Cloudflare as host, signed out", async () => {
  fakeFetch({});
  expect(getSession().status).not.toBe("signedIn");
  await render(<Mentions />);
  expect(await screen.findByText(fr("legal.publisherLaw"))).toBeOnTheScreen();
  expect(screen.getByText(fr("legal.hostAddress"))).toBeOnTheScreen();
  expect(screen.getByRole("link", { name: fr("legal.contact") })).toBeOnTheScreen();
});

test("privacy: without optional providers, only Cloudflare is listed", async () => {
  fakeFetch({ "GET /capabilities": () => json(200, capabilities(false)) });
  await render(<Privacy />);
  expect(await screen.findByText(fr("privacy.cloudflareBody"))).toBeOnTheScreen();
  await waitFor(() => {
    for (const key of optional) expect(screen.queryByText(fr(key))).toBeNull();
  });
});

test("privacy: configured providers each have their paragraph", async () => {
  fakeFetch({ "GET /capabilities": () => json(200, capabilities(true)) });
  await render(<Privacy />);
  for (const key of ["privacy.cloudflareBody", ...optional]) expect(await screen.findByText(fr(key))).toBeOnTheScreen();
});

test("privacy offline: the last known answer is used", async () => {
  await putSnapshot("capabilities", capabilities(false));
  globalThis.fetch = jest.fn(async () => {
    throw new NetworkError();
  });
  watchNetwork();
  const listener = jest.mocked(NetInfo.addEventListener).mock.calls[0][0];
  listener({ isConnected: false, isInternetReachable: false, type: NetInfoStateType.none, details: null, isWifiEnabled: false });
  await render(<Privacy />);
  expect(await screen.findByText(fr("privacy.cloudflareBody"))).toBeOnTheScreen();
  expect(screen.queryByText(fr("privacy.mailBody"))).toBeNull();
});

test("privacy offline and never online: optional paragraphs show with their « when configured » wording", async () => {
  globalThis.fetch = jest.fn(async () => {
    throw new NetworkError();
  });
  await render(<Privacy />);
  for (const key of ["privacy.cloudflareBody", ...optional]) expect(await screen.findByText(fr(key))).toBeOnTheScreen();
});
