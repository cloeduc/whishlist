import { clone, findMembership } from "./access";
import { hasReadPassword } from "./read-password";
import type { Database, Subscription, Wishlist } from "./types";

const RAW_TOKEN_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

/**
 * Extrait un `readToken` depuis un lien public complet (`https://.../l/<token>`,
 * `https://.../en/l/<token>`), un chemin (`/l/<token>`) ou un jeton brut.
 * Retourne `null` si l'entrée ne correspond pas à un lien de lecture de liste.
 */
export function extractReadToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (RAW_TOKEN_PATTERN.test(trimmed)) return trimmed;

  let pathname = trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      pathname = new URL(trimmed).pathname;
    } catch {
      return null;
    }
  } else {
    const q = pathname.indexOf("?");
    if (q >= 0) pathname = pathname.slice(0, q);
    const h = pathname.indexOf("#");
    if (h >= 0) pathname = pathname.slice(0, h);
  }

  const match = /^(?:\/(?:fr|en))?\/l\/([A-Za-z0-9_-]{8,128})\/?$/.exec(pathname);
  if (!match) return null;
  return match[1];
}

export function findSubscription(
  doc: Database,
  wishlistId: string,
  userId: string,
): Subscription | null {
  return (
    doc.subscriptions.find(
      (entry) => entry.wishlistId === wishlistId && entry.userId === userId,
    ) ?? null
  );
}

/**
 * Indique si l'abonnement donne accès en lecture sans ressaisir le mot de passe :
 * vrai si la liste n'a pas de mot de passe ou si l'empreinte mémorisée correspond à celle de la liste.
 */
export function isSubscriptionUnlocked(wishlist: Wishlist, subscription: Subscription): boolean {
  if (!hasReadPassword(wishlist)) return true;
  return subscription.readPasswordHash === wishlist.readPasswordHash;
}

/**
 * Abonne `userId` à `wishlistId`.
 * - Refuse `alreadyMember` si l'utilisateur est déjà membre de la liste.
 * - Idempotent : si l'abonnement existe déjà, met à jour `readPasswordHash` et retourne `replayed: true`.
 */
export function subscribeWishlist(
  doc: Database,
  input: { wishlistId: string; userId: string; now?: Date },
):
  | { ok: true; doc: Database; subscription: Subscription; replayed: boolean }
  | { ok: false; error: "listMissing" | "accountMissing" | "alreadyMember" } {
  const wishlist = doc.wishlists.find((entry) => entry.id === input.wishlistId);
  if (!wishlist) return { ok: false, error: "listMissing" };
  if (!doc.users.some((entry) => entry.id === input.userId)) {
    return { ok: false, error: "accountMissing" };
  }
  if (findMembership(doc, wishlist.id, input.userId)) {
    return { ok: false, error: "alreadyMember" };
  }
  const existing = findSubscription(doc, wishlist.id, input.userId);
  if (existing) {
    if (existing.readPasswordHash === wishlist.readPasswordHash) {
      return { ok: true, doc, subscription: existing, replayed: true };
    }
    const next = clone(doc);
    const target = findSubscription(next, wishlist.id, input.userId)!;
    target.readPasswordHash = wishlist.readPasswordHash;
    return { ok: true, doc: next, subscription: target, replayed: true };
  }
  const next = clone(doc);
  const subscription: Subscription = {
    wishlistId: wishlist.id,
    userId: input.userId,
    readPasswordHash: wishlist.readPasswordHash,
    createdAt: (input.now ?? new Date()).toISOString(),
  };
  next.subscriptions.push(subscription);
  return { ok: true, doc: next, subscription, replayed: false };
}

/**
 * Met à jour `readPasswordHash` d'un abonnement existant après déverrouillage de la liste.
 */
export function syncSubscriptionUnlock(
  doc: Database,
  input: { wishlistId: string; userId: string },
): Database {
  const wishlist = doc.wishlists.find((entry) => entry.id === input.wishlistId);
  const existing = findSubscription(doc, input.wishlistId, input.userId);
  if (!wishlist || !existing || existing.readPasswordHash === wishlist.readPasswordHash) {
    return doc;
  }
  const next = clone(doc);
  const target = findSubscription(next, input.wishlistId, input.userId)!;
  target.readPasswordHash = wishlist.readPasswordHash;
  return next;
}

/**
 * Retire l'abonnement de `userId` à `wishlistId`.
 * Les réservations faites par `userId` sur cette liste ne sont pas touchées.
 */
export function unsubscribeWishlist(
  doc: Database,
  input: { wishlistId: string; userId: string },
): { ok: true; doc: Database } | { ok: false; error: "listMissing" } {
  const existing = findSubscription(doc, input.wishlistId, input.userId);
  if (!existing) return { ok: false, error: "listMissing" };
  const next = clone(doc);
  next.subscriptions = next.subscriptions.filter(
    (entry) => !(entry.wishlistId === input.wishlistId && entry.userId === input.userId),
  );
  return { ok: true, doc: next };
}
