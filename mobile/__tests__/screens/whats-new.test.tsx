import { render, screen } from "@testing-library/react-native";
import Constants from "expo-constants";

import WhatsNewScreen from "../../app/(app)/whats-new";
import { i18n } from "@/i18n";
import { RELEASES } from "@/whats-new/releases";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true } }));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("@/whats-new/releases", () => ({
  RELEASES: ["1.1.1", "1.1.2"],
  releaseKey: (version: string) => version.replaceAll(".", "_"),
}));

function installVersion(version: string) {
  jest.replaceProperty(Constants, "expoConfig", { name: "app", slug: "app", version, extra: { apiUrl: "https://api.example.test" } });
}

beforeEach(async () => {
  await i18n.changeLanguage("fr");
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("each version up to the installed one, newest first, with its news (022 US2)", async () => {
  installVersion("1.1.2");
  await render(<WhatsNewScreen />);
  expect(await screen.findByTestId("whats-new.screen")).toBeOnTheScreen();
  const sections = screen.getAllByTestId(/^whats-new\.section-/).map((node) => node.props.testID);
  expect(sections).toEqual(["whats-new.section-1_1_2", "whats-new.section-1_1_1"]);
  expect(screen.getByText(i18n.t("mobile:whatsNew.version", { version: "1.1.1" }))).toBeOnTheScreen();
  const sentences: unknown = i18n.t("mobile:whatsNew.releases.1_1_1", { returnObjects: true });
  for (const sentence of Array.isArray(sentences) ? sentences : []) {
    expect(screen.getByText(`• ${String(sentence)}`)).toBeOnTheScreen();
  }
  expect(RELEASES).toContain("1.1.2");
});

test("a version newer than the installed one is not listed", async () => {
  installVersion("1.1.1");
  await render(<WhatsNewScreen />);
  expect(await screen.findByTestId("whats-new.section-1_1_1")).toBeOnTheScreen();
  expect(screen.queryByTestId("whats-new.section-1_1_2")).toBeNull();
});
