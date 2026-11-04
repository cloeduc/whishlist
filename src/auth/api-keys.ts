import { addApiKey, findApiKeyByHash, type ApiKeyView } from "../domain/api-keys";
import { hashSecretToken, newSecretToken } from "../domain/tokens";
import type { ApiKey, Database, User } from "../domain/types";

/** Key prefix: keys are recognized (and told apart from a session token) without the database. */
export const API_KEY_PREFIX = "oys_";

export function isApiKeyToken(token: string): boolean {
  return token.startsWith(API_KEY_PREFIX);
}

/** Draws the token of a new key and adds it to the account; the plain token is returned only here, once. */
export function createApiKey(
  doc: Database,
  user: User,
  input: { name: string },
  nowMs = Date.now(),
): { ok: true; doc: Database; token: string; key: ApiKeyView } | { ok: false; error: string } {
  const token = `${API_KEY_PREFIX}${newSecretToken()}`;
  const added = addApiKey(doc, user, { name: input.name, tokenHash: hashSecretToken(token), hint: token.slice(-4) }, nowMs);
  return added.ok ? { ...added, token } : added;
}

/** The key of this token and its account, or null (not a key, unknown key, revoked, account deleted). */
export function findApiKey(doc: Database, token: string): { key: ApiKey; user: User } | null {
  if (!isApiKeyToken(token)) return null;
  return findApiKeyByHash(doc, hashSecretToken(token));
}
