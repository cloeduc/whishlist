import assert from "node:assert/strict";
import { test } from "node:test";
import { isSiteLink } from "../../src/site/dev-link";

const ORIGIN = "http://localhost:3010";

test("dev link: only a page of this site, of the right type", () => {
  assert.equal(isSiteLink(`${ORIGIN}/confirm-email/abc?next=%2F`, ORIGIN, "/confirm-email/"), true);
  assert.equal(isSiteLink(`${ORIGIN}/en/confirm-email/abc`, ORIGIN, "/confirm-email/"), true);
  assert.equal(isSiteLink(`${ORIGIN}/reset-password/abc`, ORIGIN, "/reset-password/"), true);
  for (const url of [
    "https://evil.example/confirm-email/abc",
    `${ORIGIN}.evil.example/confirm-email/abc`,
    `${ORIGIN}/account`,
    `${ORIGIN}/reset-password/abc`,
    "javascript:alert(1)",
    "pas une url",
    "",
    null,
    undefined,
  ]) {
    assert.equal(isSiteLink(url, ORIGIN, "/confirm-email/"), false, String(url));
  }
});
