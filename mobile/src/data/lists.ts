import { newClientId } from "@/offline/ids";
import type { ListPreview } from "@/offline/outbox";

import { listDefaults, numberedTitle } from "../../../src/domain/list-defaults";

import { write, type WriteResult } from "./write";

export { useMemberList, useMyLists, refreshList, refreshLists } from "./store";

type Translate = (key: string, vars?: Record<string, string>) => string;

/**
 * Values a field left empty takes, computed as on the site (`src/domain/list-defaults.ts`):
 * account name, texts of the `home` namespace in the app language, the one the app sends to the server.
 * The name is numbered from the lists known to the phone; offline, the number may differ from
 * the one the server will pick, and the server's one is kept after sending.
 */
export function newListDefaults(displayName: string, takenTitles: Iterable<string>, t: Translate): ListPreview {
  const defaults = listDefaults(displayName, t);
  return { title: numberedTitle(defaults.titleBase, takenTitles), category: defaults.category, person: defaults.person };
}

/**
 * Creates a list with its first category and its first « qui » (FR-011). As on the site, no
 * field is required: an empty field is sent empty and the server gives it its default value.
 * `preview` (see `newListDefaults`) is only used to show the list before it is created on the server.
 * The ids are picked here (R5): the list opens right away, even offline,
 * and a resend creates no duplicate. The rest is checked when sending (FR-041).
 */
export async function createList(
  input: { title: string; category: string; person: string },
  preview: ListPreview,
  retrySeq?: number | null,
  ids = { id: newClientId(), categoryId: newClientId(), personId: newClientId() },
): Promise<WriteResult & { listId: string }> {
  const listId = ids.id;
  const result = await write({ kind: "createList", listId, targetId: listId, payload: { ...input, ...ids, preview } }, retrySeq);
  return { ...result, listId };
}
