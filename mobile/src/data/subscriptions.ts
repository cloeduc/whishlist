import { api, ApiError, done, ok, type Schemas } from "@/api/client";
import { saveUnlock } from "@/features/guest/storage";

import { forgetPublicList, readUnlockHeader, refreshLists, refreshPublicList } from "./store";

export type FollowResult =
  | { ok: true; subscription: Schemas["SubscribedListSummary"] }
  | { ok: false; error: "readPasswordRequired"; title: string | null }
  | { ok: false; error: string };

/**
 * S'abonne à une liste publique par son lien ou son jeton.
 * Si la liste est protégée par mot de passe et non déverrouillée, retourne `readPasswordRequired` avec son titre.
 */
export async function followList(input: { urlOrToken: string; password?: string }): Promise<FollowResult> {
  const urlOrToken = input.urlOrToken.trim();
  if (!urlOrToken) return { ok: false, error: "subscriptionLinkInvalid" };
  try {
    const subscription = await ok(
      api.POST("/subscriptions", {
        body: { urlOrToken, ...(input.password ? { password: input.password } : {}) },
      }),
    );
    await refreshLists();
    return { ok: true, subscription };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 423) return { ok: false, error: "readPasswordRequired", title: error.title ?? null };
      return { ok: false, error: error.code };
    }
    throw error;
  }
}

/** Déverrouille une liste suivie protégée par mot de passe et met à jour l'abonnement côté serveur. */
export async function unlockSharedList(readToken: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!password) return { ok: false, error: "passwordRequired" };
  try {
    const answer = await ok(
      api.POST("/public/lists/{readToken}/unlock", {
        params: { path: { readToken } },
        body: { password },
      }),
    );
    if (answer.unlockToken && answer.expiresAt) await saveUnlock(readToken, answer.unlockToken, answer.expiresAt);
    await Promise.all([refreshPublicList(readToken), refreshLists()]);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.code };
    throw error;
  }
}

/** Réserve une idée sur une liste suivie. */
export async function reserveSharedItem(
  readToken: string,
  input: { itemId: string; fromName?: string; note?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await ok(
      api.POST("/public/lists/{readToken}/reservations", {
        params: { path: { readToken }, header: await readUnlockHeader(readToken) },
        body: {
          itemId: input.itemId,
          ...(input.fromName?.trim() ? { fromName: input.fromName.trim() } : {}),
          ...(input.note?.trim() ? { note: input.note.trim() } : {}),
        },
      }),
    );
    await refreshPublicList(readToken);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.code };
    throw error;
  }
}

/** Annule sa propre réservation sur une liste suivie. */
export async function cancelSharedReservation(
  readToken: string,
  reservationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await done(
      api.DELETE("/public/lists/{readToken}/reservations/{reservationId}", {
        params: { path: { readToken, reservationId } },
      }),
    );
    await refreshPublicList(readToken);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.code };
    throw error;
  }
}

/** Se désabonne d'une liste suivie et retire sa copie locale. */
export async function unfollowList(readToken: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await done(api.DELETE("/subscriptions/{readToken}", { params: { path: { readToken } } }));
    await forgetPublicList(readToken);
    await refreshLists();
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.code };
    throw error;
  }
}
