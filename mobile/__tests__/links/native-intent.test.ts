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

  it("English addresses (018) open the same screens as their former French forms", () => {
    const cases: [string, string][] = [
      ["https://api.example.test/en/reset-password/tok", "/links/reset-password/tok"],
      ["https://api.example.test/confirm-email/tok?next=%2Finvite%2Fit", "/links/confirm-email/tok?next=%2Finvite%2Fit"],
      ["https://api.example.test/confirmer-email/tok?suite=%2Finviter%2Fit", "/links/confirm-email/tok?next=%2Finvite%2Fit"],
      ["ohyoushouldnt://invite/tok", "/links/invite/tok"],
      ["ohyoushouldnt://login?next=%2Finvite%2Ftok", "/login?next=%2Finvite%2Ftok"],
      ["ohyoushouldnt://connexion?next=%2Finviter%2Ftok", "/login?next=%2Finvite%2Ftok"],
      ["/register", "/register"],
      ["/inscription", "/register"],
      ["/l/read/reserve?itemId=i1", "/guest/read/reserve?itemId=i1"],
    ];
    for (const [path, screen] of cases) expect(redirectSystemPath({ path, initial: false })).toBe(screen);
  });

  it("unknown, foreign-server or malformed address: the home screen, without throwing", () => {
    for (const path of [
      "ohyoushouldnt://guide",
      "https://evil.example/inviter/tok",
      "https://evil.example/invite/tok",
      "https://api.example.test/lists/abc?tab=sharing",
      "ohyoushouldnt://inviter/%E0%A4%A",
      "",
    ]) {
      expect(redirectSystemPath({ path, initial: true })).toBe("/");
    }
  });
});
