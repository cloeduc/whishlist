import { stripLocalePrefix } from "../i18n/locale-path";
import { APP_SCHEME } from "../site/app-links";
import { clone, findMembership } from "./access";
import { hasReadPassword } from "./read-password";
import type { Database, Subscription, Wishlist } from "./types";

const RAW_TOKEN_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
const APP_SCHEME_PREFIX = `${APP_SCHEME}://`;
/** Un nom d'hôte (avec un point, ou `localhost`) suivi d'un chemin : lien collé sans `https://`. */
const HOST_FIRST_PATTERN = /^(?:localhost|[a-z0-9-]+(?:\.[a-z0-9-]+)+)(?::\d+)?\//i;

/**
 * Extrait un `readToken` de ce qu'une personne colle : lien complet (`https://.../l/<token>`,
 * `https://.../en/l/<token>`, schéma en majuscules), lien sans schéma (`ohyoushouldnt.app/l/<token>`),
 * lien de l'app (`ohyoushouldnt://l/<token>`), chemin (`/l/<token>`), sous-page de la liste
 * (`/l/<token>/reserver?…`) ou jeton brut.
 * Retourne `null` si l'entrée ne correspond pas à un lien de lecture de liste.
 */
export function extractReadToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (RAW_TOKEN_PATTERN.test(trimmed)) return trimmed;

  let pathname: string;
  if (trimmed.toLowerCase().startsWith(APP_SCHEME_PREFIX)) {
    // `ohyoushouldnt://l/<token>` : pour `URL`, `l` serait l'hôte ; les chemins sont ceux du site.
    pathname = `/${trimmed.slice(APP_SCHEME_PREFIX.length)}`;
  } else if (/^https?:\/\//i.test(trimmed) || HOST_FIRST_PATTERN.test(trimmed)) {
    try {
      pathname = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).pathname;
    } catch {
      return null;
    }
  } else {
    pathname = trimmed;
  }

  const { path } = stripLocalePrefix(pathname.split(/[?#]/)[0]);
  const match = /^\/l\/([A-Za-z0-9_-]{8,128})(?:\/.*)?$/.exec(path);
  return match ? match[1] : null;
}

/**
 * Listes que `userId` suit sans en être membre, avec leur abonnement. Devenir membre l'emporte :
 * une liste dont on est membre n'est jamais une liste suivie (« Mes listes », export, suppression du compte).
 */
export function followedListsOf(
  doc: Database,
  userId: string,
): { wishlist: Wishlist; subscription: Subscription }[] {
  return doc.subscriptions.flatMap((subscription) => {
    if (subscription.userId !== userId || findMembership(doc, subscription.wishlistId, userId)) return [];
    const wishlist = doc.wishlists.find((entry) => entry.id === subscription.wishlistId);
    return wishlist ? [{ wishlist, subscription }] : [];
  });
}

/** Lien d'un visiteur avec une liste publique : membre, ou abonné sans en être membre. */
export function viewerRelation(
  doc: Database,
  wishlistId: string,
  userId: string | null,
): { isMember: boolean; subscribed: boolean } {
  if (userId === null) return { isMember: false, subscribed: false };
  const isMember = findMembership(doc, wishlistId, userId) !== null;
  return { isMember, subscribed: !isMember && findSubscription(doc, wishlistId, userId) !== null };
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
 * - `verifiedHash` : empreinte du mot de passe de lecture contre laquelle l'appelant a vérifié l'accès
 *   (`null` pour une liste sans mot de passe). Si la liste a changé de mot de passe entre-temps,
 *   refuse `readPasswordChanged` : l'abonnement ne doit jamais mémoriser une empreinte non vérifiée.
 * - Refuse `alreadyMember` si l'utilisateur est déjà membre de la liste.
 * - Idempotent : si l'abonnement existe déjà, met à jour `readPasswordHash` et retourne `replayed: true`.
 */
export function subscribeWishlist(
  doc: Database,
  input: { wishlistId: string; userId: string; verifiedHash: string | null; now?: Date },
):
  | { ok: true; doc: Database; subscription: Subscription; replayed: boolean }
  | { ok: false; error: "listMissing" | "accountMissing" | "alreadyMember" | "readPasswordChanged" } {
  const wishlist = doc.wishlists.find((entry) => entry.id === input.wishlistId);
  if (!wishlist) return { ok: false, error: "listMissing" };
  if (!doc.users.some((entry) => entry.id === input.userId)) {
    return { ok: false, error: "accountMissing" };
  }
  if (findMembership(doc, wishlist.id, input.userId)) {
    return { ok: false, error: "alreadyMember" };
  }
  if (wishlist.readPasswordHash !== input.verifiedHash) {
    return { ok: false, error: "readPasswordChanged" };
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
 * `verifiedHash` est l'empreinte contre laquelle le mot de passe saisi a été vérifié : si la liste
 * a changé de mot de passe entre-temps, rien n'est mis à jour.
 */
export function syncSubscriptionUnlock(
  doc: Database,
  input: { wishlistId: string; userId: string; verifiedHash: string | null },
): Database {
  const wishlist = doc.wishlists.find((entry) => entry.id === input.wishlistId);
  const existing = findSubscription(doc, input.wishlistId, input.userId);
  if (!wishlist || !existing || wishlist.readPasswordHash !== input.verifiedHash) return doc;
  if (existing.readPasswordHash === wishlist.readPasswordHash) return doc;
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
