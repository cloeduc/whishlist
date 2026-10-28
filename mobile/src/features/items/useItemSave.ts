import { router } from "expo-router";
import { useState } from "react";

import { saveItem } from "@/data/items";

import type { Draft } from "./ItemForm";

/**
 * Enregistrement d'une idée depuis le formulaire. Accepté ou mis en attente (hors ligne) :
 * retour à la liste. Refusé : l'erreur reste sous le formulaire, et le prochain envoi
 * reprend le même changement (« Corriger ») au lieu d'en créer un autre.
 */
export function useItemSave(
  listId: string,
  options: { itemId?: string; create?: boolean; retrySeq?: number | null; errorCode?: string | null } = {},
) {
  const [error, setError] = useState<string | null>(options.errorCode ?? null);
  const [retrySeq, setRetrySeq] = useState<number | null>(options.retrySeq ?? null);
  const [busy, setBusy] = useState(false);

  async function submit(draft: Draft) {
    setBusy(true);
    setError(null);
    try {
      const result = await saveItem(listId, draft, { itemId: options.itemId, create: options.create, retrySeq });
      if (result.ok) {
        router.back();
        return;
      }
      setError(result.error);
      setRetrySeq(result.seq);
    } finally {
      setBusy(false);
    }
  }

  return { error, busy, submit };
}
