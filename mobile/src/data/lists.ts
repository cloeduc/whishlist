import { newClientId } from "@/offline/ids";

import { write, type WriteResult } from "./write";

export { useMemberList, useMyLists, refreshList, refreshLists } from "./store";

/**
 * Crée une liste avec sa première catégorie et son premier « qui » (FR-011).
 * Les identifiants sont choisis ici (R5) : la liste s'ouvre tout de suite, même hors ligne,
 * et un renvoi ne crée pas de doublon. Seuls les champs vides sont vérifiés sur le téléphone,
 * avec les codes du serveur ; le reste est vérifié à l'envoi (FR-041).
 */
export async function createList(
  input: { title: string; category: string; person: string },
  retrySeq?: number | null,
  ids = { id: newClientId(), categoryId: newClientId(), personId: newClientId() },
): Promise<WriteResult & { listId: string }> {
  const listId = ids.id;
  if (!input.title.trim()) return { ok: false, error: "listNeedsTitle", seq: retrySeq ?? null, listId };
  if (!input.category.trim()) return { ok: false, error: "listNeedsCategory", seq: retrySeq ?? null, listId };
  if (!input.person.trim()) return { ok: false, error: "listNeedsPerson", seq: retrySeq ?? null, listId };
  const result = await write({ kind: "createList", listId, targetId: listId, payload: { ...input, ...ids } }, retrySeq);
  return { ...result, listId };
}
