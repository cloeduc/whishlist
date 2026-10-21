import assert from "node:assert/strict";
import { test } from "node:test";
import { contentSecurityPolicy } from "../../src/server/content-security";

test("CSP de production autorise le nonce et les images http(s), pas eval", () => {
  const policy = contentSecurityPolicy({ dev: false, nonce: "abc+def=" });
  assert.equal(policy.nonce, "abc+def=");
  assert.match(policy.value, /script-src 'self' 'nonce-abc\+def=' 'strict-dynamic'/);
  assert.doesNotMatch(policy.value, /script-src[^;]*unsafe-inline/);
  assert.doesNotMatch(policy.value, /unsafe-eval/);
  assert.match(policy.value, /style-src 'self' 'nonce-abc\+def='/);
  assert.match(policy.value, /style-src-attr 'unsafe-inline'/);
  assert.match(policy.value, /img-src 'self' http: https: data: blob:/);
  assert.match(policy.value, /frame-ancestors 'none'/);
  assert.match(policy.value, /upgrade-insecure-requests/);
});

test("CSP de développement garde unsafe-eval et n'impose pas https", () => {
  const policy = contentSecurityPolicy({ dev: true, nonce: "dev" });
  assert.match(policy.value, /'unsafe-eval'/);
  assert.doesNotMatch(policy.value, /upgrade-insecure-requests/);
});
