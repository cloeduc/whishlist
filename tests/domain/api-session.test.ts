import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { before, test } from "node:test";
import {
  findApiSessionUser,
  hashApiToken,
  issueApiSession,
  pruneApiSessions,
  revokeApiSession,
} from "../../src/auth/api-session";
import { SESSION_TTL_SEC } from "../../src/auth/session";
import { readDocument } from "../../src/store/db";
import { withTempDataPath } from "./helpers/temp-store";
import { apiDoc, ensurePasswordHash } from "./helpers/api-fixtures";

const NOW = Date.parse("2026-10-28T12:00:00.000Z");
const TTL_MS = SESSION_TTL_SEC * 1000;

before(ensurePasswordHash);

test("an API session keeps only the token's fingerprint", () => {
  const doc = apiDoc();
  const alex = doc.users[0]!;
  const issued = issueApiSession(doc, alex, NOW);
  assert.match(issued.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(issued.doc.apiSessions.length, 1);
  const stored = issued.doc.apiSessions[0]!;
  assert.equal(stored.tokenHash, hashApiToken(issued.token));
  assert.equal(stored.userId, "alex");
  assert.equal(stored.expiresAt, new Date(NOW + TTL_MS).toISOString());
  assert.equal(JSON.stringify(issued.doc).includes(issued.token), false);
  assert.equal(doc.apiSessions.length, 0, "le document d'origine n'est pas modifié");
});

test("a token lasts 30 days, for an existing account and with no password change", () => {
  const issued = issueApiSession(apiDoc(), apiDoc().users[0]!, NOW);
  assert.equal(findApiSessionUser(issued.doc, issued.token, NOW)?.id, "alex");
  assert.equal(findApiSessionUser(issued.doc, issued.token, NOW + TTL_MS - 1000)?.id, "alex");
  assert.equal(findApiSessionUser(issued.doc, issued.token, NOW + TTL_MS), null);
  assert.equal(findApiSessionUser(issued.doc, "jeton-inconnu", NOW), null);
  assert.equal(findApiSessionUser(issued.doc, "", NOW), null);

  const bumped = structuredClone(issued.doc);
  bumped.users[0]!.sessionVersion = 1;
  assert.equal(findApiSessionUser(bumped, issued.token, NOW), null);

  const deleted = structuredClone(issued.doc);
  deleted.users = deleted.users.filter((entry) => entry.id !== "alex");
  assert.equal(findApiSessionUser(deleted, issued.token, NOW), null);
});

test("revoking deletes only this token", () => {
  const first = issueApiSession(apiDoc(), apiDoc().users[0]!, NOW);
  const second = issueApiSession(first.doc, apiDoc().users[0]!, NOW);
  const revoked = revokeApiSession(second.doc, first.token);
  assert.equal(findApiSessionUser(revoked, first.token, NOW), null);
  assert.equal(findApiSessionUser(revoked, second.token, NOW)?.id, "alex");
});

test("the purge removes expired and stale sessions", () => {
  const old = issueApiSession(apiDoc(), apiDoc().users[0]!, NOW - TTL_MS - 1000);
  const stale = issueApiSession(old.doc, old.doc.users[1]!, NOW);
  const fresh = issueApiSession(stale.doc, stale.doc.users[0]!, NOW);
  fresh.doc.users[1]!.sessionVersion = 3;
  const pruned = pruneApiSessions(fresh.doc, NOW);
  assert.deepEqual(
    pruned.apiSessions.map((entry) => entry.tokenHash),
    [hashApiToken(fresh.token)],
  );
});

test("a wishlist.json without apiSessions is imported without migration", async () => {
  const legacy: Record<string, unknown> = { ...apiDoc() };
  delete legacy.apiSessions;
  await withTempDataPath(async (dataPath) => {
    await writeFile(dataPath, JSON.stringify(legacy), "utf8");
    const doc = await readDocument();
    assert.deepEqual(doc.apiSessions, []);
  });
});
