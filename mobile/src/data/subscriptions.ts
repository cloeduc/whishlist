import { api, ApiError, done, ok, type Schemas } from "@/api/client";
import { unlockTokenFor } from "@/features/guest/storage";
import { publicListKey, removeSnapshot } from "@/offline/snapshot";

import { refreshLists } from "./store";

export type FollowResult =
  | { ok: true; subscription: Schemas["SubscribedListSummary"] }
  | { ok: false; error: "readPasswordRequired"; title: string | null }
  | { ok: false; error: string };

/**
 * Follows a public list by its link or its token. A protected list already unlocked on this
 * phone (list view) goes through its `X-Read-Unlock` proof; otherwise the server answers `423` with the
 * list title, and the screen asks for the password.
 */
export async function followList(input: {
  urlOrToken: string;
  password?: string;
  /** Token of the list, when known: its unlock proof goes with the request. */
  readToken?: string;
}): Promise<FollowResult> {
  const urlOrToken = input.urlOrToken.trim();
  if (!urlOrToken) return { ok: false, error: "subscriptionLinkInvalid" };
  const unlock = input.readToken ? await unlockTokenFor(input.readToken) : null;
  try {
    const subscription = await ok(
      api.POST("/subscriptions", {
        params: { header: unlock ? { "X-Read-Unlock": unlock } : {} },
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

/** Unfollow a list: its offline copy goes away with the subscription. */
export async function unfollowList(readToken: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await done(api.DELETE("/subscriptions/{readToken}", { params: { path: { readToken } } }));
    await removeSnapshot(publicListKey(readToken));
    await refreshLists();
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.code };
    throw error;
  }
}
