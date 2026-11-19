import { render, screen } from "@testing-library/react-native";

import WhatsNewScreen from "../../app/(app)/whats-new";
import { i18n } from "@/i18n";
import { RELEASES } from "@/whats-new/releases";

import { installVersion } from "../helpers/app-version";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true } }));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("@/whats-new/releases", () => ({
  ...jest.requireActual<typeof import("@/whats-new/releases")>("@/whats-new/releases"),
  RELEASES: ["1.2.0", "1.2.1"],
}));


beforeEach(async () => {
  await i18n.changeLanguage("fr");
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("each version up to the installed one, newest first, with its news (022 US2)", async () => {
  installVersion("1.2.1");
  await render(<WhatsNewScreen />);
  expect(await screen.findByTestId("whats-new.screen")).toBeOnTheScreen();
  const sections = screen.getAllByTestId(/^whats-new\.section-/).map((node) => node.props.testID);
  expect(sections).toEqual(["whats-new.section-1_2_1", "whats-new.section-1_2_0"]);
  expect(screen.getByText(i18n.t("mobile:whatsNew.version", { version: "1.2.0" }))).toBeOnTheScreen();
  const sentences: unknown = i18n.t("mobile:whatsNew.releases.1_2_0", { returnObjects: true });
  for (const sentence of Array.isArray(sentences) ? sentences : []) {
    expect(screen.getByText(`• ${String(sentence)}`)).toBeOnTheScreen();
  }
  expect(RELEASES).toContain("1.2.1");
});

test("a version newer than the installed one is not listed", async () => {
  installVersion("1.2.0");
  await render(<WhatsNewScreen />);
  expect(await screen.findByTestId("whats-new.section-1_2_0")).toBeOnTheScreen();
  expect(screen.queryByTestId("whats-new.section-1_2_1")).toBeNull();
});
