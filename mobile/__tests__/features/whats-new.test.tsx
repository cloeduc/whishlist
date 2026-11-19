import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { WhatsNew } from "@/features/whats-new/WhatsNew";
import { i18n } from "@/i18n";
import * as state from "@/whats-new/state";
import { getLastSeenVersion, setLastSeenVersion } from "@/whats-new/state";

import { installVersion } from "../helpers/app-version";
import { freshDb } from "../helpers/memory-db";


async function renderWhatsNew(onShownChange = jest.fn()) {
  const rendered = await render(<WhatsNew enabled onShownChange={onShownChange} />);
  await waitFor(() => expect(onShownChange).toHaveBeenCalled());
  await act(async () => undefined);
  return { ...rendered, onShownChange };
}

beforeEach(async () => {
  await freshDb();
  await i18n.changeLanguage("fr");
  installVersion("1.2.0");
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("after an update: the news of the installed version; « C'est noté » closes it for good (022 US1)", async () => {
  await setLastSeenVersion("1.1.0");
  const { onShownChange, unmount } = await renderWhatsNew();
  expect(onShownChange).toHaveBeenLastCalledWith(true);
  expect(screen.getByText(i18n.t("mobile:whatsNew.title"))).toBeOnTheScreen();
  expect(screen.getByTestId("whats-new.version-1_2_0")).toHaveTextContent(i18n.t("mobile:whatsNew.version", { version: "1.2.0" }), {
    exact: false,
  });
  const sentences: unknown = i18n.t("mobile:whatsNew.releases.1_2_0", { returnObjects: true });
  for (const sentence of Array.isArray(sentences) ? sentences : []) {
    expect(screen.getByText(`• ${String(sentence)}`)).toBeOnTheScreen();
  }
  await fireEvent.press(screen.getByTestId("whats-new.done"));
  expect(onShownChange).toHaveBeenLastCalledWith(false);
  expect(screen.queryByText(i18n.t("mobile:whatsNew.title"))).toBeNull();
  await waitFor(async () => expect(await getLastSeenVersion()).toBe("1.2.0"));
  await unmount();

  const again = await renderWhatsNew();
  expect(again.onShownChange).toHaveBeenLastCalledWith(false);
  expect(screen.queryByText(i18n.t("mobile:whatsNew.title"))).toBeNull();
});

test("fresh install: nothing, and the installed version is recorded", async () => {
  const { onShownChange } = await renderWhatsNew();
  expect(onShownChange).toHaveBeenLastCalledWith(false);
  expect(screen.queryByText(i18n.t("mobile:whatsNew.title"))).toBeNull();
  await waitFor(async () => expect(await getLastSeenVersion()).toBe("1.2.0"));
});

test("update from a version that did not record itself (a saved copy on the phone): the news", async () => {
  const db = await freshDb();
  await db.run("INSERT INTO snapshot (key, body, fetchedAt) VALUES ('lists', '[]', '2026-11-16')");
  await renderWhatsNew();
  expect(screen.getByTestId("whats-new.version-1_2_0")).toBeOnTheScreen();
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

test("closing by the system gesture (tap on the backdrop) also closes it for good (FR-003)", async () => {
  await setLastSeenVersion("1.1.0");
  const { onShownChange } = await renderWhatsNew();
  await fireEvent.press(screen.getByLabelText(i18n.t("common:actions.close"), { includeHiddenElements: true }));
  expect(screen.queryByText(i18n.t("mobile:whatsNew.title"))).toBeNull();
  expect(onShownChange).toHaveBeenLastCalledWith(false);
  await waitFor(async () => expect(await getLastSeenVersion()).toBe("1.2.0"));
});

test("a version without news after the one seen: no dialog, and it is recorded as seen (FR-007)", async () => {
  installVersion("1.2.1");
  await setLastSeenVersion("1.2.0");
  const { onShownChange } = await renderWhatsNew();
  expect(onShownChange).toHaveBeenLastCalledWith(false);
  expect(screen.queryByText(i18n.t("mobile:whatsNew.title"))).toBeNull();
  await waitFor(async () => expect(await getLastSeenVersion()).toBe("1.2.1"));
});

test("the local storage fails: no dialog, and the update prompt is not held (FR-008)", async () => {
  jest.spyOn(state, "getLastSeenVersion").mockRejectedValue(new Error("disk"));
  const { onShownChange } = await renderWhatsNew();
  expect(onShownChange).toHaveBeenLastCalledWith(false);
  expect(screen.queryByText(i18n.t("mobile:whatsNew.title"))).toBeNull();
});
