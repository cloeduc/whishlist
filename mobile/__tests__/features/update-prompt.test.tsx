import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as InAppUpdates from "expo-in-app-updates";
import { AppState, Platform, type AppStateStatus } from "react-native";

import { UpdatePrompt } from "@/features/update/UpdatePrompt";
import { i18n } from "@/i18n";
import { CHECK_INTERVAL_MS, SNOOZE_MS } from "@/update/policy";
import { getSnooze, setLastCheckAt, setSnooze } from "@/update/state";

import { freshDb } from "../helpers/memory-db";

const check = jest.mocked(InAppUpdates.checkForUpdate);
const start = jest.mocked(InAppUpdates.startUpdate);

/** The `AppState` listener registered by the component, to bring the app back to the foreground. */
function appStateListener(): (state: AppStateStatus) => void {
  const calls = jest.mocked(AppState.addEventListener).mock.calls;
  const last = calls[calls.length - 1];
  if (!last) throw new Error("no AppState listener");
  return last[1];
}

async function renderPrompt() {
  const rendered = await render(<UpdatePrompt enabled />);
  // Let the start-up check finish.
  await waitFor(() => expect(check).toHaveBeenCalled(), { timeout: 4000 });
  await act(async () => undefined);
  return rendered;
}

beforeEach(async () => {
  await freshDb();
  await i18n.changeLanguage("fr");
  jest.spyOn(AppState, "addEventListener").mockReturnValue({ remove: jest.fn() });
  check.mockReset().mockResolvedValue({ updateAvailable: false });
  start.mockReset().mockResolvedValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("iOS", () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, "OS", "ios");
  });

  test("a newer App Store version: the dialog, « Mettre à jour » opens the store page (021 US1)", async () => {
    check.mockResolvedValue({ updateAvailable: true, storeVersion: "1.3.0" });
    await renderPrompt();
    expect(await screen.findByText(i18n.t("mobile:update.title"))).toBeOnTheScreen();
    expect(screen.getByText(i18n.t("mobile:update.body"))).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId("update.prompt"));
    expect(start).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(i18n.t("mobile:update.title"))).toBeNull();
  });

  test("« Plus tard » closes the dialog and silences this version for 7 days", async () => {
    check.mockResolvedValue({ updateAvailable: true, storeVersion: "1.3.0" });
    await renderPrompt();
    await fireEvent.press(await screen.findByTestId("update.prompt-keep"));
    expect(start).not.toHaveBeenCalled();
    expect(screen.queryByText(i18n.t("mobile:update.title"))).toBeNull();
    await waitFor(async () => expect((await getSnooze())?.storeVersion).toBe("1.3.0"));
  });

  test("snoozed less than 7 days ago: no dialog; a newer version: the dialog again", async () => {
    await setSnooze({ storeVersion: "1.3.0", at: new Date(Date.now() - SNOOZE_MS + 60_000) });
    check.mockResolvedValue({ updateAvailable: true, storeVersion: "1.3.0" });
    const first = await renderPrompt();
    expect(screen.queryByText(i18n.t("mobile:update.title"))).toBeNull();
    await first.unmount();
    check.mockResolvedValue({ updateAvailable: true, storeVersion: "1.4.0" });
    await renderPrompt();
    expect(await screen.findByText(i18n.t("mobile:update.title"))).toBeOnTheScreen();
  });

  test("up to date, offline or store unreachable: nothing shown", async () => {
    const first = await renderPrompt();
    expect(screen.queryByText(i18n.t("mobile:update.title"))).toBeNull();
    await first.unmount();
    check.mockRejectedValue(new Error("offline"));
    await renderPrompt();
    expect(screen.queryByText(i18n.t("mobile:update.title"))).toBeNull();
  });

  test("development build: the store is never asked", async () => {
    await render(<UpdatePrompt enabled={false} />);
    await act(async () => undefined);
    expect(check).not.toHaveBeenCalled();
  });

  test("back in the foreground: asked again after 24 h only", async () => {
    await renderPrompt();
    expect(check).toHaveBeenCalledTimes(1);
    await act(async () => appStateListener()("active"));
    expect(check).toHaveBeenCalledTimes(1);
    await setLastCheckAt(new Date(Date.now() - CHECK_INTERVAL_MS));
    await act(async () => appStateListener()("active"));
    await waitFor(() => expect(check).toHaveBeenCalledTimes(2));
  });
});

describe("Android", () => {
  const { __emit: emit } = jest.requireMock<{ __emit: (name: string, event: unknown) => void }>("expo-in-app-updates");

  beforeEach(() => {
    jest.replaceProperty(Platform, "OS", "android");
  });

  test("a newer Play version: Google's flexible offer, no dialog of the app (021 US2)", async () => {
    check.mockResolvedValue({ updateAvailable: true, storeVersion: "12", flexibleAllowed: true });
    await renderPrompt();
    await waitFor(() => expect(start).toHaveBeenCalledWith(false));
    expect(screen.queryByText(i18n.t("mobile:update.title"))).toBeNull();
  });

  test("flexible update not allowed by Google Play: nothing", async () => {
    check.mockResolvedValue({ updateAvailable: true, storeVersion: "12", flexibleAllowed: false });
    await renderPrompt();
    expect(start).not.toHaveBeenCalled();
  });

  test("refusing Google's offer silences this version for 7 days", async () => {
    check.mockResolvedValue({ updateAvailable: true, storeVersion: "12", flexibleAllowed: true });
    const first = await renderPrompt();
    await waitFor(() => expect(start).toHaveBeenCalled());
    await act(async () => emit("updateCancelled", {}));
    await waitFor(async () => expect((await getSnooze())?.storeVersion).toBe("12"));
    await first.unmount();
    start.mockClear();
    await renderPrompt();
    expect(start).not.toHaveBeenCalled();
  });

  test("starting the update fails: nothing shown", async () => {
    check.mockResolvedValue({ updateAvailable: true, storeVersion: "12", flexibleAllowed: true });
    start.mockRejectedValue(new Error("ERR_START_UPDATE"));
    await renderPrompt();
    await waitFor(() => expect(start).toHaveBeenCalled());
    expect(screen.queryByText(i18n.t("mobile:update.title"))).toBeNull();
  });

  test("the listener is removed when the prompt goes away", async () => {
    check.mockResolvedValue({ updateAvailable: true, storeVersion: "12", flexibleAllowed: true });
    const first = await renderPrompt();
    await first.unmount();
    await act(async () => emit("updateCancelled", {}));
    expect(await getSnooze()).toBeNull();
  });
});
