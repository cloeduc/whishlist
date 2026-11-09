import assert from "node:assert/strict";
import { test } from "node:test";
import {
  APP_LINK_ROUTES,
  androidAssociation,
  androidPathPrefixes,
  appleAssociation,
  appPathForSiteUrl,
} from "../../src/site/app-links";
import { androidAssociationResponse, appleAssociationResponse } from "../../src/site/app-links-config";
import { withEnv } from "./helpers/env";

const HOST = "ohyoushouldnt.app";
const to = (url: string) => appPathForSiteUrl(url, { apiHost: HOST });
const FINGERPRINT = Array.from({ length: 32 }, () => "AB").join(":");

test("each link in the table opens its screen, in French as under /en", () => {
  const cases: [string, string][] = [
    ["/confirm-email/tok", "/links/confirm-email/tok"],
    ["/reset-password/tok", "/links/reset-password/tok"],
    ["/invite/tok", "/links/invite/tok"],
    ["/login", "/login"],
    ["/register", "/register"],
    ["/l/read", "/guest/read"],
    ["/l/read/reserve", "/guest/read/reserve"],
    ["/l/read/types", "/guest/read"],
  ];
  assert.equal(cases.length >= APP_LINK_ROUTES.length, true);
  for (const [site, app] of cases) {
    assert.equal(to(`https://${HOST}${site}`), app, site);
    assert.equal(to(`https://${HOST}/en${site}`), app, `/en${site}`);
  }
});

test("the former French address of each link opens the same screen (018)", () => {
  const cases: [string, string][] = [
    ["/confirmer-email/tok?suite=%2Finviter%2FI", "/links/confirm-email/tok?next=%2Finvite%2FI"],
    ["/reinitialiser/tok", "/links/reset-password/tok"],
    ["/inviter/tok", "/links/invite/tok"],
    ["/connexion?next=%2Finviter%2FI", "/login?next=%2Finvite%2FI"],
    ["/inscription", "/register"],
    ["/l/read/reserver?itemId=i1", "/guest/read/reserve?itemId=i1"],
  ];
  for (const [site, app] of cases) {
    assert.equal(to(`https://${HOST}${site}`), app, site);
    assert.equal(to(`https://${HOST}/en${site}`), app, `/en${site}`);
    assert.equal(to(`ohyoushouldnt://${site.slice(1)}`), app, `scheme ${site}`);
    assert.equal(to(site), app, `path ${site}`);
  }
});

test("three address forms: web, app scheme, path only", () => {
  assert.equal(to(`https://${HOST}/reset-password/tok`), "/links/reset-password/tok");
  assert.equal(to("ohyoushouldnt://reset-password/tok"), "/links/reset-password/tok");
  assert.equal(to("ohyoushouldnt:///reset-password/tok"), "/links/reset-password/tok");
  assert.equal(to("/reset-password/tok"), "/links/reset-password/tok");
  assert.equal(to(`http://localhost:3010/reset-password/tok`), null);
  assert.equal(
    appPathForSiteUrl("http://localhost:3010/reset-password/tok", { apiHost: "localhost:3010" }),
    "/links/reset-password/tok",
  );
  assert.equal(to(`https://${HOST}/reset-password/tok/`), "/links/reset-password/tok");
});

test("query: only the expected keys pass, encoded", () => {
  assert.equal(
    to(`https://${HOST}/confirm-email/tok?next=%2Finvite%2Fabc&utm=x`),
    "/links/confirm-email/tok?next=%2Finvite%2Fabc",
  );
  assert.equal(to(`https://${HOST}/l/read/reserve?itemId=i1&typeId=t1#x`), "/guest/read/reserve?itemId=i1&typeId=t1");
  assert.equal(to(`https://${HOST}/login?next=%2Finvite%2Fabc`), "/login?next=%2Finvite%2Fabc");
  assert.equal(to(`https://${HOST}/invite/tok?foo=bar`), "/links/invite/tok");
  assert.equal(to(`https://${HOST}/l/read?typeId=`), "/guest/read");
});

test("addresses the app does not handle: null", () => {
  for (const url of [
    `https://${HOST}/`,
    `https://${HOST}/en`,
    `https://${HOST}/guide`,
    `https://${HOST}/compte/export`,
    `https://${HOST}/account/export`,
    `https://${HOST}/api/v1/me`,
    // Opened in the browser on purpose from the app (« Gérer le partage sur le site »).
    `https://${HOST}/listes/abc?onglet=partage`,
    `https://${HOST}/lists/abc?tab=sharing`,
    `https://${HOST}/invite/`,
    `https://${HOST}/invite//x`,
    `https://${HOST}/invite/a%2Fb`,
    `https://${HOST}/invite/%E0%A4%A`,
    `https://${HOST}/l/read/autre`,
    `https://evil.example/invite/tok`,
    `https://${HOST}.evil.example/invite/tok`,
    "//evil.example/invite/tok",
    "javascript:alert(1)",
    "",
  ]) {
    assert.equal(to(url), null, url);
  }
});

test("a token is decoded then re-encoded once", () => {
  assert.equal(to(`https://${HOST}/invite/a%20b`), "/links/invite/a%20b");
  assert.equal(to(`https://${HOST}/invite/a-b_c`), "/links/invite/a-b_c");
});

test("Apple file: the published app and each path, with and without /en", () => {
  const detail = appleAssociation("ABCDE12345").applinks.details[0]!;
  assert.deepEqual(detail.appIDs, ["ABCDE12345.app.ohyoushouldnt.mobile"]);
  const paths = detail.components.map((component) => component["/"]);
  // New addresses and their former French forms (018), which old emails still carry.
  for (const path of [
    "/confirm-email/*",
    "/en/confirm-email/*",
    "/l/*/reserve",
    "/login",
    "/confirmer-email/*",
    "/en/confirmer-email/*",
    "/l/*/reserver",
    "/connexion",
    "/en/inviter/*",
    "/reinitialiser/*",
    "/inscription",
  ]) {
    assert.equal(paths.includes(path), true, path);
  }
  assert.equal(new Set(paths).size, paths.length);
  assert.equal(paths.some((path) => path.startsWith("/guide") || path.startsWith("/listes") || path.startsWith("/lists") || path.startsWith("/compte") || path === "/"), false);
});

test("Android file: malformed fingerprints ignored, prefixes from the table", () => {
  const [entry] = androidAssociation([FINGERPRINT.toLowerCase(), "pas-une-empreinte", " "]);
  assert.equal(entry!.target.package_name, "app.ohyoushouldnt.mobile");
  assert.deepEqual(entry!.target.sha256_cert_fingerprints, [FINGERPRINT]);
  const prefixes = androidPathPrefixes();
  for (const prefix of ["/confirm-email/", "/en/confirm-email/", "/l/", "/login", "/en/register", "/confirmer-email/", "/en/confirmer-email/", "/connexion", "/en/inscription", "/inviter/", "/reinitialiser/"]) {
    assert.equal(prefixes.includes(prefix), true, prefix);
  }
  assert.equal(new Set(prefixes).size, prefixes.length);
  assert.equal(prefixes.some((prefix) => prefix.includes("/listes") || prefix.includes("/lists") || prefix.includes("/compte")), false);
});

function assertJsonHeaders(response: Response) {
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/json");
  assert.equal(response.headers.get("cache-control"), "public, max-age=3600");
}

test("GET /.well-known/apple-app-site-association: 404 without APPLE_TEAM_ID, JSON otherwise", async () => {
  await withEnv({ APPLE_TEAM_ID: undefined }, () => assert.equal(appleAssociationResponse().status, 404));
  await withEnv({ APPLE_TEAM_ID: "trop-court" }, () => assert.equal(appleAssociationResponse().status, 404));
  await withEnv({ APPLE_TEAM_ID: "abcde12345" }, async () => {
    const response = appleAssociationResponse();
    assertJsonHeaders(response);
    const body = await response.json();
    assert.deepEqual(body.applinks.details[0].appIDs, ["ABCDE12345.app.ohyoushouldnt.mobile"]);
  });
});

test("GET /.well-known/assetlinks.json: 404 without a valid fingerprint, JSON otherwise", async () => {
  await withEnv({ ANDROID_CERT_SHA256: undefined }, () => assert.equal(androidAssociationResponse().status, 404));
  await withEnv({ ANDROID_CERT_SHA256: "nimporte-quoi" }, () => assert.equal(androidAssociationResponse().status, 404));
  await withEnv({ ANDROID_CERT_SHA256: `${FINGERPRINT}, ${FINGERPRINT.replace(/^AB/, "CD")}` }, async () => {
    const response = androidAssociationResponse();
    assertJsonHeaders(response);
    const body = await response.json();
    assert.equal(body[0].target.sha256_cert_fingerprints.length, 2);
  });
});
