import {
  claimsFor,
  claimsForScope,
  clearGuestAccess,
  forgetReservation,
  forgetUnlock,
  rememberClaimKey,
  saveClaim,
  saveUnlock,
  unlockTokenFor,
} from "@/features/guest/storage";

const DAY = 24 * 60 * 60 * 1000;

beforeEach(clearGuestAccess);

test("unlock token: kept per list until it expires, then forgotten", async () => {
  await saveUnlock("rt", "unlock-1", new Date(Date.now() + 14 * DAY).toISOString());
  await saveUnlock("old", "unlock-2", new Date(Date.now() - 1000).toISOString());
  expect(await unlockTokenFor("rt")).toBe("unlock-1");
  expect(await unlockTokenFor("old")).toBeNull();
  expect(await unlockTokenFor("autre")).toBeNull();
  await forgetUnlock("rt");
  expect(await unlockTokenFor("rt")).toBeNull();
});

test("claims: 90 days, per list, removed after cancellation", async () => {
  await saveClaim("rt", "r1", "claim-1");
  await saveClaim("rt", "r2", "claim-2");
  await saveClaim("autre", "r3", "claim-3");
  await saveClaim("rt", "r-old", "claim-old", Date.now() - 91 * DAY);
  expect(await claimsFor("rt")).toEqual(["claim-2", "claim-1"]);
  await forgetReservation("r2");
  expect(await claimsFor("rt")).toEqual(["claim-1"]);
  expect(await claimsFor("autre")).toEqual(["claim-3"]);
});

test("clearGuestAccess vide tout", async () => {
  await saveUnlock("rt", "unlock-1", new Date(Date.now() + DAY).toISOString());
  await saveClaim("rt", "r1", "claim-1");
  await clearGuestAccess();
  expect(await unlockTokenFor("rt")).toBeNull();
  expect(await claimsFor("rt")).toEqual([]);
});

test("claims of a group gift (028): filed under the gift's token and the list's claim key, found from both sides", async () => {
  // Joined through the gift's link: the app does not know the list's read link.
  await saveClaim({ giftToken: "gift-1", claimKey: "ck" }, "p1", "claim-gift");
  expect(await claimsForScope({ giftToken: "gift-1" })).toEqual(["claim-gift"]);
  // The list is opened later: once its claim key is known, the participation is sent with it.
  expect(await claimsForScope({ readToken: "rt" })).toEqual([]);
  await rememberClaimKey({ readToken: "rt" }, "ck");
  expect(await claimsForScope({ readToken: "rt" })).toEqual(["claim-gift"]);
  // Started from the list (read link known): the gift's screen finds it by its token or the key.
  await saveClaim({ readToken: "rt", claimKey: "ck", giftToken: "gift-2" }, "p2", "claim-started");
  expect(await claimsForScope({ giftToken: "gift-2" })).toEqual(["claim-started"]);
  await rememberClaimKey({ giftToken: "gift-3" }, "ck");
  expect(await claimsForScope({ giftToken: "gift-3" })).toEqual(["claim-started", "claim-gift"]);
  // Claims saved before 028 (read link only) are still read.
  await saveClaim("rt", "r-old", "claim-before");
  expect(await claimsFor("rt")).toEqual(["claim-before", "claim-started", "claim-gift"]);
  await clearGuestAccess();
  expect(await claimsForScope({ giftToken: "gift-3" })).toEqual([]);
});
