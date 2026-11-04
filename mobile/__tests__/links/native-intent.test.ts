import { redirectSystemPath } from "../../app/+native-intent";

// The test build targets https://api.example.test (__tests__/setup.ts).
describe("receiving a link (011)", () => {
  it("web link of this build's server, or scheme link: the app screen", () => {
    expect(redirectSystemPath({ path: "https://api.example.test/en/reinitialiser/tok", initial: true })).toBe(
      "/links/reset-password/tok",
    );
    expect(redirectSystemPath({ path: "ohyoushouldnt://inviter/tok", initial: false })).toBe("/links/invite/tok");
    expect(redirectSystemPath({ path: "/l/read/reserver?itemId=i1", initial: false })).toBe(
      "/guest/read/reserve?itemId=i1",
    );
  });

  it("unknown, foreign-server or malformed address: the home screen, without throwing", () => {
    for (const path of [
      "ohyoushouldnt://guide",
      "https://evil.example/inviter/tok",
      "ohyoushouldnt://inviter/%E0%A4%A",
      "",
    ]) {
      expect(redirectSystemPath({ path, initial: true })).toBe("/");
    }
  });
});
