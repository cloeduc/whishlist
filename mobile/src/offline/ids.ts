import { getRandomBytes } from "expo-crypto";

// Contrat api-v1-additions : même règle que le serveur.
export { isClientId } from "../../../src/domain/client-ids";

const BASE64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** Même format que `newId()` du serveur : 12 octets aléatoires → 16 caractères base64url. */
export function newClientId(): string {
  const bytes = getRandomBytes(12);
  let id = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    id += BASE64URL[(chunk >> 18) & 63] + BASE64URL[(chunk >> 12) & 63] + BASE64URL[(chunk >> 6) & 63] + BASE64URL[chunk & 63];
  }
  return id;
}
