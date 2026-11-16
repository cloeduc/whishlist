import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import Constants from "expo-constants";

import { WhatsNew } from "@/features/whats-new/WhatsNew";
import { i18n } from "@/i18n";
import { getLastSeenVersion, setLastSeenVersion } from "@/whats-new/state";

import { freshDb } from "../helpers/memory-db";

/** The installed version, as the build gives it. */
function installVersion(version: string) {
  jest.replaceProperty(Constants, "expoConfig", { name: "app", slug: "app", version, extra: { apiUrl: "https://api.example.test" } });
}

async function renderWhatsNew(onShownChange = jest.fn()) {
  const rendered = await render(<WhatsNew enabled onShownChange={onShownChange} />);
  await waitFor(() => expect(onShownChange).toHaveBeenCalled());
  await act(async () => undefined);
  return { ...rendered, onShownChange };
}

beforeEach(async () => {
  await freshDb();
  await i18n.changeLanguage("fr");
  installVersion("1.1.1");
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("after an update: the news of the installed version; « C'est noté » closes it for good (022 US1)", async () => {
  await setLastSeenVersion("1.1.0");
  const { onShownChange, unmount } = await renderWhatsNew();
  expect(onShownChange).toHaveBeenLastCalledWith(true);
  expect(screen.getByText(i18n.t("mobile:whatsNew.title"))).toBeOnTheScreen();
  expect(screen.getByTestId("whats-new.version-1_1_1")).toHaveTextContent(i18n.t("mobile:whatsNew.version", { version: "1.1.1" }), {
    exact: false,
  });
  const sentences: unknown = i18n.t("mobile:whatsNew.releases.1_1_1", { returnObjects: true });
  for (const sentence of Array.isArray(sentences) ? sentences : []) {
    expect(screen.getByText(`• ${String(sentence)}`)).toBeOnTheScreen();
  }
  await fireEvent.press(screen.getByTestId("whats-new.done"));
  expect(onShownChange).toHaveBeenLastCalledWith(false);
  expect(screen.queryByText(i18n.t("mobile:whatsNew.title"))).toBeNull();
  await waitFor(async () => expect(await getLastSeenVersion()).toBe("1.1.1"));
  await unmount();

  const again = await renderWhatsNew();
  expect(again.onShownChange).toHaveBeenLastCalledWith(false);
  expect(screen.queryByText(i18n.t("mobile:whatsNew.title"))).toBeNull();
});

test("fresh install: nothing, and the installed version is recorded", async () => {
  const { onShownChange } = await renderWhatsNew();
  expect(onShownChange).toHaveBeenLastCalledWith(false);
  expect(screen.queryByText(i18n.t("mobile:whatsNew.title"))).toBeNull();
  await waitFor(async () => expect(await getLastSeenVersion()).toBe("1.1.1"));
});

test("update from a version that did not record itself (a saved copy on the phone): the news", async () => {
  const db = await freshDb();
  await db.run("INSERT INTO snapshot (key, body, fetchedAt) VALUES ('lists', '[]', '2026-11-16')");
  await renderWhatsNew();
  expect(screen.getByTestId("whats-new.version-1_1_1")).toBeOnTheScreen();
});

test("an older version than the one seen: nothing, and the seen version stays", async () => {
  await setLastSeenVersion("1.2.0");
  await renderWhatsNew();
  expect(screen.queryByText(i18n.t("mobile:whatsNew.title"))).toBeNull();
  expect(await getLastSeenVersion()).toBe("1.2.0");
});

test("in English: the English texts", async () => {
  await i18n.changeLanguage("en");
  await setLastSeenVersion("1.1.0");
  await renderWhatsNew();
  expect(screen.getByText("What's new")).toBeOnTheScreen();
  expect(screen.getByText("Got it")).toBeOnTheScreen();
});

test("development build: no dialog, and the update prompt is not held", async () => {
  const onShownChange = jest.fn();
  await render(<WhatsNew enabled={false} onShownChange={onShownChange} />);
  await act(async () => undefined);
  expect(onShownChange).toHaveBeenCalledWith(false);
  expect(await getLastSeenVersion()).toBeNull();
});
