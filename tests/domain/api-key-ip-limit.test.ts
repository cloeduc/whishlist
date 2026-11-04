import assert from "node:assert/strict";
import { before, test } from "node:test";
import { API_KEY_PREFIX, createApiKey } from "../../src/auth/api-keys";
import { API_KEY_FAILURE_RATE, apiKeyUser } from "../../src/server/api/auth";
import { mcpAccess } from "../../src/server/mcp/gate";
import { apiDoc, ensurePasswordHash, withStore } from "./helpers/api-fixtures";
import { withEnv } from "./helpers/env";

before(ensurePasswordHash);

const IP = "203.0.113.7";
const OTHER_IP = "198.51.100.9";
const unknownKey = (n: number) => `${API_KEY_PREFIX}inconnue-${n}`;
const isRateLimited = (error: Error) => error.message === "rateLimited";

function withKey() {
  const doc = apiDoc();
  const created = createApiKey(doc, doc.users[0]!, { name: "Claude" });
  if (!created.ok) throw new Error(created.error);
  return created;
}

/** Uses up the allowed failures of `ip`: each one stays a plain refusal (null). */
async function failUpToLimit(ip: string) {
  for (let i = 0; i < API_KEY_FAILURE_RATE.limit; i++) assert.equal(await apiKeyUser(unknownKey(i), ip), null, `échec ${i + 1}`);
}

test("per-IP limit: 20 unknown keys in 15 minutes, like sign-in failures", () => {
  assert.deepEqual(API_KEY_FAILURE_RATE, { limit: 20, windowMs: 15 * 60 * 1000 });
});

test("unknown key: beyond the limit, the IP gets rateLimited, even with a valid key; another IP does not", async () => {
  const { doc, token } = withKey();
  await withStore(doc, async () => {
    await failUpToLimit(IP);
    await assert.rejects(() => apiKeyUser(unknownKey(99), IP), isRateLimited);
    await assert.rejects(() => apiKeyUser(token, IP), isRateLimited, "l'IP bloquée ne teste plus aucune clé");
    assert.equal((await apiKeyUser(token, OTHER_IP))?.id, "alex");
    assert.equal(await apiKeyUser(unknownKey(1), OTHER_IP), null, "les échecs sont comptés par IP");
  });
});

test("only failures count: requests with a valid key do not use the IP's budget", async () => {
  const { doc, token } = withKey();
  await withStore(doc, async () => {
    for (let i = 0; i < 100; i++) assert.equal((await apiKeyUser(token, IP))?.id, "alex");
    await failUpToLimit(IP);
    await assert.rejects(() => apiKeyUser(unknownKey(99), IP), isRateLimited);
  });
});

test("a revoked key counts as a failure", async () => {
  const { doc, token } = withKey();
  await withStore({ ...doc, apiKeys: [] }, async () => {
    for (let i = 0; i < API_KEY_FAILURE_RATE.limit; i++) assert.equal(await apiKeyUser(token, IP), null);
    await assert.rejects(() => apiKeyUser(token, IP), isRateLimited);
  });
});

test("MCP: unauthorized up to the limit, then rateLimited for this IP", async () => {
  const { doc, token } = withKey();
  const access = (authorization: string, ip: string) =>
    mcpAccess({ origin: null, siteOrigin: "https://ohyoushouldnt.example.test", authorization: `Bearer ${authorization}`, ip });
  await withStore(doc, async () => {
    for (let i = 0; i < API_KEY_FAILURE_RATE.limit; i++) {
      assert.deepEqual(await access(unknownKey(i), IP), { ok: false, error: "unauthorized" });
    }
    assert.deepEqual(await access(unknownKey(99), IP), { ok: false, error: "rateLimited" });
    assert.deepEqual(await access(token, IP), { ok: false, error: "rateLimited" });
    const other = await access(token, OTHER_IP);
    assert.equal(other.ok && other.user.id, "alex");
  });
});

test("without a trusted IP: in production a failure is refused, a valid key passes", async () => {
  const { doc, token } = withKey();
  await withStore(doc, async () => {
    await withEnv({ NODE_ENV: "production" }, async () => {
      await assert.rejects(() => apiKeyUser(unknownKey(1), null), isRateLimited);
      assert.equal((await apiKeyUser(token, null))?.id, "alex");
    });
    await withEnv({ NODE_ENV: "test" }, async () => {
      assert.equal(await apiKeyUser(unknownKey(1), null), null, "en dev, pas de limite sans IP");
    });
  });
});
