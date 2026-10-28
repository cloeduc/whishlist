import assert from "node:assert/strict";
import { test } from "node:test";
import { signReadUnlock, verifyReadUnlock } from "../../src/auth/read-unlock";
import { signReservationClaim, verifyReservationClaims } from "../../src/auth/reservation-claim";
import { apiDoc, TEST_SECRET } from "./helpers/api-fixtures";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-10-28T12:00:00.000Z");

test("un claim de réservation est accepté pour sa liste seulement", () => {
  const claim = signReservationClaim("rt", "r1", TEST_SECRET, NOW);
  assert.match(claim, /^\d+\.r1\.[A-Za-z0-9_-]+$/);
  assert.deepEqual([...verifyReservationClaims("rt", [claim], TEST_SECRET, NOW)], ["r1"]);
  assert.equal(verifyReservationClaims("autre", [claim], TEST_SECRET, NOW).size, 0);
  assert.equal(verifyReservationClaims("rt", [claim], "un-autre-secret-un-autre-secret-0000", NOW).size, 0);
});

test("un claim falsifié, futur ou trop vieux est ignoré", () => {
  const claim = signReservationClaim("rt", "r1", TEST_SECRET, NOW);
  const [iat, , mac] = claim.split(".");
  assert.equal(verifyReservationClaims("rt", [`${iat}.r2.${mac}`], TEST_SECRET, NOW).size, 0);
  assert.equal(verifyReservationClaims("rt", ["n'importe quoi"], TEST_SECRET, NOW).size, 0);
  const future = signReservationClaim("rt", "r1", TEST_SECRET, NOW + 5 * 60 * 1000);
  assert.equal(verifyReservationClaims("rt", [future], TEST_SECRET, NOW).size, 0);
  assert.equal(verifyReservationClaims("rt", [claim], TEST_SECRET, NOW + 89 * DAY_MS).size, 1);
  assert.equal(verifyReservationClaims("rt", [claim], TEST_SECRET, NOW + 91 * DAY_MS).size, 0);
});

test("au plus 50 claims sont lus", () => {
  const claims = Array.from({ length: 60 }, (_, i) => signReservationClaim("rt", `r${i}`, TEST_SECRET, NOW));
  const ids = verifyReservationClaims("rt", claims, TEST_SECRET, NOW);
  assert.equal(ids.size, 50);
  assert.equal(ids.has("r49"), true);
  assert.equal(ids.has("r50"), false);
});

test("un déverrouillage vaut 14 jours et tombe si le mot de passe change", () => {
  const list = { ...apiDoc().wishlists[0]!, readPasswordHash: "hash-1" };
  const token = signReadUnlock(list, TEST_SECRET, NOW);
  assert.equal(verifyReadUnlock(list, token, TEST_SECRET, NOW), true);
  assert.equal(verifyReadUnlock(list, token, TEST_SECRET, NOW + 13 * DAY_MS), true);
  assert.equal(verifyReadUnlock(list, token, TEST_SECRET, NOW + 15 * DAY_MS), false);
  assert.equal(verifyReadUnlock({ ...list, readPasswordHash: "hash-2" }, token, TEST_SECRET, NOW), false);
  assert.equal(verifyReadUnlock({ ...list, readToken: "autre" }, token, TEST_SECRET, NOW), false);
  assert.equal(verifyReadUnlock(list, "", TEST_SECRET, NOW), false);
});

test("une liste sans mot de passe n'a pas besoin de déverrouillage", () => {
  const list = apiDoc().wishlists[0]!;
  assert.equal(verifyReadUnlock(list, null, TEST_SECRET, NOW), true);
});
