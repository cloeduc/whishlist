import type { Database } from "./types";

/**
 * Id chosen by the client for what it creates (api-v1-additions contract, feature 005):
 * 16 to 32 base64url characters, like `newId()`. A resend with the same id
 * is recognized instead of creating a duplicate.
 */
export const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{16,32}$/;

export function isClientId(id: string): boolean {
  return CLIENT_ID_PATTERN.test(id);
}

/** True if an object of the document (list, category, « qui », idea) already has this id. */
export function idTaken(doc: Database, id: string): boolean {
  return [doc.wishlists, doc.types, doc.people, doc.items].some((rows) => rows.some((row) => row.id === id));
}
