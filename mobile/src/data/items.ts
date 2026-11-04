import { api, ok, type Schemas } from "@/api/client";
import { newClientId } from "@/offline/ids";
import type { ViewItem } from "@/offline/optimistic";
import type { ChangePayloads } from "@/offline/outbox";

import { parsePrice } from "../../../src/domain/price";
import { write, type WriteResult } from "./write";

export type ItemInput = ChangePayloads["updateItem"];

/** What the phone checks before sending: enough to build a valid request (data-model.md). */
function localError(input: ItemInput): string | null {
  if (!input.name.trim()) return "itemNeedsName";
  if (parsePrice(input.price ?? "") === "invalid") return "priceInvalid";
  return null;
}

/**
 * Adds or edits an idea, through the write queue.
 * Creation: without `itemId`, or with `create` to fix a rejected creation (same id).
 * The price is sent as typed (« 24,90 »): the server reads it with the same rule as the site.
 */
export async function saveItem(
  listId: string,
  input: ItemInput,
  options: { itemId?: string; create?: boolean; retrySeq?: number | null } = {},
): Promise<WriteResult & { itemId: string }> {
  const itemId = options.itemId ?? newClientId();
  const error = localError(input);
  if (error) return { ok: false, error, seq: options.retrySeq ?? null, itemId };
  const create = options.create ?? options.itemId === undefined;
  const result = create
    ? await write({ kind: "createItem", listId, targetId: itemId, payload: { ...input, id: itemId } }, options.retrySeq)
    : await write({ kind: "updateItem", listId, targetId: itemId, payload: input }, options.retrySeq);
  return { ...result, itemId };
}

/** Archive / unarchive, or change category. */
export function patchItem(listId: string, itemId: string, payload: ChangePayloads["patchItem"]): Promise<WriteResult> {
  return write({ kind: "patchItem", listId, targetId: itemId, payload });
}

/** Delete an idea (after confirmation, FR-013). */
export function deleteItem(listId: string, itemId: string): Promise<WriteResult> {
  return write({ kind: "deleteItem", listId, targetId: itemId, payload: {} });
}

export type Enriched = { name: string; price: string; imageUrl: string; typeId: string; description: string; usedLlm: boolean };

/**
 * Prefill from a product link: creates nothing, requires the network (FR-029b).
 * The server always reads the page; `capabilities.enrich` says whether it also uses an AI.
 */
export async function enrich(listId: string, url: string): Promise<Enriched> {
  const { name, price, imageUrl, typeId, description, usedLlm } = await ok(
    api.POST("/lists/{listId}/enrich", { params: { path: { listId } }, body: { url } }),
  );
  // A server older than 1.5.0 does not return it.
  return { name, price, imageUrl, typeId, description: description ?? "", usedLlm };
}

/**
 * Move or copy an idea to a list (the same list is allowed for a copy), through the queue.
 * The change keeps a preview of the idea, to show it in the target list before it is sent.
 */
export async function transferItem(
  listId: string,
  item: ViewItem,
  mode: "move" | "copy",
  target: { listId: string; typeId: string; personId: string },
): Promise<WriteResult> {
  const { pending: _pending, rejected: _rejected, ...preview } = item;
  const body = { targetListId: target.listId, typeId: target.typeId, personId: target.personId, preview };
  if (mode === "move") return write({ kind: "moveItem", listId, targetId: item.id, payload: body });
  const id = newClientId();
  return write({ kind: "copyItem", listId, targetId: id, payload: { ...body, id } });
}

export type MemberItem = Schemas["MemberItem"];
