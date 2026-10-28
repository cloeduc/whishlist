import type { Database } from "./types";

/**
 * Identifiant choisi par le client pour ce qu'il crée (contrat api-v1-additions, feature 005) :
 * 16 à 32 caractères base64url, comme `newId()`. Un renvoi avec le même identifiant
 * est reconnu au lieu de créer un doublon.
 */
export const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{16,32}$/;

export function isClientId(id: string): boolean {
  return CLIENT_ID_PATTERN.test(id);
}

/** Vrai si un objet du document (liste, catégorie, « qui », idée) porte déjà cet identifiant. */
export function idTaken(doc: Database, id: string): boolean {
  return [doc.wishlists, doc.types, doc.people, doc.items].some((rows) => rows.some((row) => row.id === id));
}
