import { useCallback, useEffect, useState } from "react";

import { ApiError, NetworkError, type Schemas } from "@/api/client";
import { errorText } from "@/features/errors";
import { appPathForUrl } from "@/links/routes";
import { getSnapshot, listsKey, publicListKey, putSnapshot, removeSnapshot } from "@/offline/snapshot";

import { readGuestList } from "./api";

export type GuestState =
  | { status: "loading" }
  | { status: "locked" }
  /** `fetchedAt`: offline copy of a followed list, read when the server does not answer; `null` online. */
  | { status: "ready"; list: Schemas["PublicList"]; fetchedAt: string | null }
  | { status: "missing" }
  | { status: "failed"; message: string };

/**
 * List seen as a guest, read again on open (as soon as `enabled`) and by `reload` (011, data-model « Écran invité »).
 * Only a followed list (`subscribed`, 012) keeps an offline copy, to view it without network.
 * A list opened from a link keeps none: a copy of the free ideas would lead to reserving an idea
 * already taken. Reserving always stays online.
 */
export function useGuestList(readToken: string, enabled = true): { state: GuestState; reload: () => void } {
  const [state, setState] = useState<GuestState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const key = publicListKey(readToken);
    void (async () => {
      try {
        const list = await readGuestList(readToken);
        if (list.subscribed) await putSnapshot(key, list);
        else await removeSnapshot(key);
        if (active) setState({ status: "ready", list, fetchedAt: null });
      } catch (error) {
        if (error instanceof NetworkError) {
          const copy = await getSnapshot<Schemas["PublicList"]>(key);
          if (!active) return;
          if (copy) setState({ status: "ready", list: copy.body, fetchedAt: copy.fetchedAt });
          else setState({ status: "failed", message: errorText(error) });
          return;
        }
        if (error instanceof ApiError && (error.code === "readPasswordRequired" || error.status === 404)) {
          await removeSnapshot(key);
        }
        if (!active) return;
        if (error instanceof ApiError && error.code === "readPasswordRequired") setState({ status: "locked" });
        else if (error instanceof ApiError && error.status === 404) setState({ status: "missing" });
        else setState({ status: "failed", message: errorText(error) });
      }
    })();
    return () => {
      active = false;
    };
  }, [readToken, attempt, enabled]);
  const reload = useCallback(() => setAttempt((count) => count + 1), []);
  return { state, reload };
}

/** List of this account whose public link carries this token (local copy of « Mes listes »), otherwise `null`. */
export async function memberListIdFor(readToken: string): Promise<string | null> {
  const lists = await getSnapshot<Schemas["ListSummary"][]>(listsKey);
  const guestPath = `/guest/${encodeURIComponent(readToken)}`;
  return lists?.body.find((list) => appPathForUrl(list.readUrl) === guestPath)?.id ?? null;
}
