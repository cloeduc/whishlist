import assert from "node:assert/strict";
import test from "node:test";
import { analyticsBeforeSendSource, analyticsCollectAllowed } from "../../src/site/analytics-public";
import { analyticsConfig, analyticsUpstreamHeaders, prepareAnalyticsEvent } from "../../src/server/analytics";

const ID = "11111111-2222-4333-8444-555555555555";

test("without both variables, analytics is absent", () => {
  assert.equal(analyticsConfig({}), null);
  assert.equal(analyticsConfig({ UMAMI_WEBSITE_ID: ID }), null);
  assert.equal(analyticsConfig({ UMAMI_URL: "http://analytics.internal" }), null);
  assert.equal(analyticsConfig({ UMAMI_WEBSITE_ID: "pas-un-uuid", UMAMI_URL: "http://analytics.internal" }), null);
  assert.equal(
    analyticsConfig({ UMAMI_WEBSITE_ID: ID, UMAMI_URL: "http://user:secret@analytics.internal" }),
    null,
  );
});

test("only the origin is kept, not the path or a hardcoded identifier", () => {
  const config = analyticsConfig({
    UMAMI_WEBSITE_ID: ID,
    UMAMI_URL: "https://analytics.example/ignored",
  });
  assert.deepEqual(config, { websiteId: ID, upstream: "https://analytics.example" });
});

test("list, account and invite addresses are not sent", () => {
  assert.equal(analyticsCollectAllowed("/"), true);
  assert.equal(analyticsCollectAllowed("/en/faq"), true);
  assert.equal(analyticsCollectAllowed("/l/secret"), false);
  assert.equal(analyticsCollectAllowed("/en/l/secret"), false);
  assert.equal(analyticsCollectAllowed("/inviter/secret"), false);
  assert.equal(analyticsCollectAllowed("/en/reinitialiser/secret"), false);
  assert.equal(analyticsCollectAllowed("/confirmer-email/secret?suite=%2Finviter%2Fx"), false);
  assert.equal(analyticsCollectAllowed("/en/confirmer-email/secret"), false);
  assert.equal(analyticsCollectAllowed("/listes/abc"), false);
  assert.equal(analyticsCollectAllowed("/connexion"), false);
  // English addresses (018), and their former French forms above.
  for (const path of ["/invite/secret", "/en/reset-password/secret", "/confirm-email/secret?next=%2Finvite%2Fx", "/lists/abc", "/login", "/account", "/register", "/forgot-password", "/change-password"]) {
    assert.equal(analyticsCollectAllowed(path), false, path);
  }
  assert.equal(analyticsCollectAllowed("/about"), true);
  assert.equal(analyticsCollectAllowed("/legal-notice"), true);
  assert.equal(analyticsCollectAllowed("/u/script.js"), false);
});

test("the filter script contains no instance identifier", () => {
  const source = analyticsBeforeSendSource();
  assert.match(source, /wishlist-analytics-optout/);
  assert.match(source, /\/reinitialiser/);
  assert.match(source, /\/confirmer-email/);
  assert.match(source, /\/reset-password/);
  assert.match(source, /\/confirm-email/);
  assert.doesNotMatch(source, /UMAMI_URL|website-id|analytics\.example/);
});

test("the server does not forward a list and enforces the configured site", () => {
  const page = JSON.stringify({
    type: "event",
    payload: {
      website: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      hostname: "evil.example",
      url: "https://ohyoushouldnt.app/faq?next=/l/secret",
      title: "FAQ",
      referrer: "https://ohyoushouldnt.app/l/secret",
      screen: "800x600",
      language: "fr",
    },
  });
  const clean = prepareAnalyticsEvent(page, ID, "ohyoushouldnt.app");
  assert.equal(typeof clean, "string");
  const body = JSON.parse(clean as string) as { payload: Record<string, string> };
  assert.equal(body.payload.website, ID);
  assert.equal(body.payload.hostname, "ohyoushouldnt.app");
  assert.equal(body.payload.url, "/faq");
  assert.equal(body.payload.referrer, "");
  assert.equal(prepareAnalyticsEvent(JSON.stringify({ type: "event", payload: { url: "/l/secret" } }), ID, "h"), "drop");
  assert.equal(prepareAnalyticsEvent("{", ID, "h"), "invalid");
});

test("the IP address and the cookie are not relayed", () => {
  const headers = analyticsUpstreamHeaders(
    {
      get(name: string) {
        if (name === "content-type") return "application/json";
        if (name === "cookie") return "wishlist_session=secret";
        if (name === "x-forwarded-for") return "203.0.113.5";
        return null;
      },
    },
    ID,
  );
  assert.equal(headers.get("x-umami-website-id"), ID);
  assert.equal(headers.get("x-forwarded-for"), "0.0.0.0");
  assert.equal(headers.get("cookie"), null);
  assert.equal(headers.get("content-type"), "application/json");
});
