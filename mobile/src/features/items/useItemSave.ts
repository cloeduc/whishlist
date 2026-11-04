import { router, type Href } from "expo-router";
import { useRef, useState } from "react";

import { saveItem } from "@/data/items";

import type { Draft } from "./ItemForm";

/**
 * Saving an idea from the form. Accepted or queued (offline):
 * back to the list. Refused: the error stays below the form, and the next submit
 * resumes the same change (« Corriger ») instead of creating another one.
 *
 * Going back pops the screen if there is one behind; otherwise (app opened on the form, by a
 * share received on cold start) or with `toList`, the form is replaced by the list screen. Once
 * the idea is accepted, a new submit is ignored: no duplicate on a double tap.
 */
export function useItemSave(
  listId: string,
  options: { itemId?: string; create?: boolean; retrySeq?: number | null; errorCode?: string | null; toList?: boolean } = {},
) {
  const [error, setError] = useState<string | null>(options.errorCode ?? null);
  const [retrySeq, setRetrySeq] = useState<number | null>(options.retrySeq ?? null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const saved = useRef(false);

  async function submit(draft: Draft) {
    if (pending.current || saved.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await saveItem(listId, draft, { itemId: options.itemId, create: options.create, retrySeq });
      if (result.ok) {
        saved.current = true;
        if (!options.toList && router.canGoBack()) router.back();
        else router.replace(`/lists/${listId}` as Href);
        return;
      }
      setError(result.error);
      setRetrySeq(result.seq);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return { error, busy, submit };
}
