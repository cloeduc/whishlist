import assert from "node:assert/strict";
import { test } from "node:test";
import robots from "../../app/robots";
import sitemap from "../../app/sitemap";
import { canonicalSitePath } from "../../src/site/legacy-paths";
import { withEnv } from "./helpers/env";

const ORIGIN = "https://ohyoushouldnt.example.test";
const pathOf = (url: string) => new URL(url).pathname.replace(/^\/en(?=\/|$)/, "") || "/";

test("the sitemap lists only English addresses, with their /en alternates (018, FR-002, SC-006)", async () => {
  await withEnv({ APP_ORIGIN: ORIGIN }, async () => {
    const entries = sitemap();
    const urls = entries.flatMap((entry) => [entry.url, ...Object.values(entry.alternates?.languages ?? {})]).filter((url) => url !== undefined);
    for (const url of urls) assert.equal(canonicalSitePath(pathOf(url), "").changed, false, url);
    for (const path of ["/about", "/legal-notice", "/privacy"]) {
      assert.equal(urls.includes(`${ORIGIN}${path}`), true, path);
      assert.equal(urls.includes(`${ORIGIN}/en${path}`), true, `/en${path}`);
    }
  });
});

test("robots.txt keeps the private addresses and their former forms out of crawlers", async () => {
  await withEnv({ APP_ORIGIN: ORIGIN }, async () => {
    const rules = robots().rules;
    const disallow = [rules].flat().flatMap((rule) => [rule.disallow ?? []].flat());
    for (const path of ["/invite/", "/en/invite/", "/inviter/", "/en/inviter/", "/account", "/compte", "/lists/", "/listes/", "/login", "/register"]) {
      assert.equal(disallow.includes(path), true, path);
    }
  });
});
