import type { components, paths } from "@/api/schema";

import { getDb, type Db } from "./db";

type ItemInput = components["schemas"]["ItemInput"];
type CreateListBody = paths["/lists"]["post"]["requestBody"]["content"]["application/json"];
type PatchItemBody = paths["/lists/{listId}/items/{itemId}"]["patch"]["requestBody"]["content"]["application/json"];
type ItemTransfer = components["schemas"]["ItemTransfer"];
/** The idea as it was at the time of the change: enough to show it in the target list before sending. Never sent. */
type TransferPreview = { preview: components["schemas"]["MemberItem"] };

/**
 * Default values computed on the phone when a list is created (data/lists.ts), for the offline
 * view of fields left empty. Never sent: the server computes its own, which win.
 */
export type ListPreview = { title: string; category: string; person: string };

/** Body sent for each kind of change, in the contract format (except `preview`, kept on the phone). */
export type ChangePayloads = {
  // Fields stay as typed, empty ones included: the server fills the empty ones (contract, POST /lists).
  createList: CreateListBody & { title: string; category: string; person: string; id: string; categoryId: string; personId: string; preview?: ListPreview };
  createItem: ItemInput & { id: string };
  updateItem: ItemInput;
  patchItem: PatchItemBody;
  deleteItem: Record<string, never>;
  moveItem: ItemTransfer & TransferPreview;
  copyItem: ItemTransfer & TransferPreview & { id: string };
};
export type ChangeKind = keyof ChangePayloads;

/** Body of `POST /lists`: the creation as typed, without the local preview. */
export function createListBody(payload: ChangePayloads["createList"]): CreateListBody {
  const { title, category, person, id, categoryId, personId } = payload;
  return { title, category, person, id, categoryId, personId };
}

export type NewChange = {
  [K in ChangeKind]: { kind: K; listId: string; targetId: string; payload: ChangePayloads[K] };
}[ChangeKind];

export type ChangeState = "pending" | "sending" | "rejected";

/** A change in the queue (data-model.md, « outbox »). */
export type Change = NewChange & {
  seq: number;
  state: ChangeState;
  errorCode: string | null;
  attempts: number;
  createdAt: string;
};

type Row = Omit<Change, "payload"> & { payload: string };

const listeners = new Set<() => void>();

/** Notifies the screens and the sync that a change was added or processed. */
export function onOutboxChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const listener of listeners) listener();
}

function fromRow(row: Row): Change {
  return { ...row, payload: JSON.parse(row.payload) };
}

export async function listChanges(): Promise<Change[]> {
  const db = await getDb();
  const rows = await db.all<Row>("SELECT * FROM outbox ORDER BY seq");
  return rows.map(fromRow);
}

/**
 * A change depends on an older one that targets the same object, or that creates its list.
 * If that one is rejected, this one is too (FR-029a).
 */
export function dependsOn(change: Pick<Change, "listId" | "targetId">, earlier: Pick<Change, "kind" | "targetId">): boolean {
  return earlier.targetId === change.targetId || (earlier.kind === "createList" && earlier.targetId === change.listId);
}

async function insert(db: Db, change: NewChange, state: ChangeState, errorCode: string | null): Promise<number> {
  const result = await db.run(
    "INSERT INTO outbox (kind, listId, targetId, payload, state, errorCode, attempts, createdAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?)",
    [change.kind, change.listId, change.targetId, JSON.stringify(change.payload), state, errorCode, new Date().toISOString()],
  );
  return result.lastInsertRowId;
}

async function setPayload(db: Db, seq: number, payload: unknown) {
  await db.run("UPDATE outbox SET payload = ? WHERE seq = ?", [JSON.stringify(payload), seq]);
}

/**
 * Adds a change at the end of the queue, compacting the still `pending` changes
 * of the same idea (data-model.md, « Compaction »):
 * - `updateItem` replaces a pending `updateItem`; `patchItem` merges into a pending `patchItem`;
 * - after a pending `createItem`, an edit merges into the creation;
 * - `deleteItem` after a pending `createItem`: both disappear.
 * Returns the `seq` of the change that carries the final state (null if nothing is left to send).
 */
export async function enqueue(change: NewChange): Promise<number | null> {
  const db = await getDb();
  let seq: number | null = null;
  await db.transaction(async () => {
    const earlier = (await db.all<Row>("SELECT * FROM outbox ORDER BY seq")).map(fromRow);
    const rejectedParent = earlier.find((row) => row.state === "rejected" && dependsOn(change, row));
    if (rejectedParent) {
      seq = await insert(db, change, "rejected", rejectedParent.errorCode);
      return;
    }
    const sameItem = earlier.filter((row) => row.state === "pending" && row.targetId === change.targetId);
    const created = sameItem.find((row) => row.kind === "createItem");

    if (change.kind === "deleteItem") {
      // A pending move stays: the deletion targets the idea in its target list.
      const dropped = created ? sameItem : sameItem.filter((row) => row.kind !== "moveItem");
      for (const row of dropped) await db.run("DELETE FROM outbox WHERE seq = ?", [row.seq]);
      // An idea never sent: nothing to delete on the server.
      if (!created) seq = await insert(db, change, "pending", null);
      return;
    }
    if (created && created.kind === "createItem" && change.kind === "updateItem") {
      await setPayload(db, created.seq, { ...change.payload, id: created.payload.id });
      seq = created.seq;
      return;
    }
    if (created && created.kind === "createItem" && change.kind === "patchItem" && change.payload.typeId !== undefined && change.payload.archived === undefined) {
      await setPayload(db, created.seq, { ...created.payload, typeId: change.payload.typeId });
      seq = created.seq;
      return;
    }
    const previous = sameItem.find((row) => row.kind === change.kind);
    if (previous && previous.kind === "patchItem" && change.kind === "patchItem") {
      await setPayload(db, previous.seq, { ...previous.payload, ...change.payload });
      seq = previous.seq;
      return;
    }
    if (previous && change.kind === "updateItem") await db.run("DELETE FROM outbox WHERE seq = ?", [previous.seq]);
    seq = await insert(db, change, "pending", null);
  });
  emit();
  return seq;
}

export async function getChange(seq: number): Promise<Change | null> {
  const db = await getDb();
  const row = await db.first<Row>("SELECT * FROM outbox WHERE seq = ?", [seq]);
  return row ? fromRow(row) : null;
}

/** Next change to send, in order. */
export async function nextPending(): Promise<Change | null> {
  const db = await getDb();
  const row = await db.first<Row>("SELECT * FROM outbox WHERE state = 'pending' ORDER BY seq LIMIT 1");
  return row ? fromRow(row) : null;
}

export async function markSending(seq: number): Promise<void> {
  const db = await getDb();
  await db.run("UPDATE outbox SET state = 'sending', attempts = attempts + 1 WHERE seq = ?", [seq]);
}

/** Accepted by the server: removed from the queue. */
export async function markSent(seq: number): Promise<void> {
  const db = await getDb();
  await db.run("DELETE FROM outbox WHERE seq = ?", [seq]);
  emit();
}

/** No answer (network, 5xx, 401): it goes back to pending, for a new attempt. */
export async function markPending(seq: number): Promise<void> {
  const db = await getDb();
  await db.run("UPDATE outbox SET state = 'pending' WHERE seq = ?", [seq]);
}

/** Server refusal: the change and those that depend on it become `rejected` with the same code. */
export async function reject(seq: number, errorCode: string): Promise<void> {
  const db = await getDb();
  await db.transaction(async () => {
    const all = (await db.all<Row>("SELECT * FROM outbox ORDER BY seq")).map(fromRow);
    const refused = all.find((row) => row.seq === seq);
    if (!refused) return;
    const cascade = [refused, ...all.filter((row) => row.seq > seq && row.state !== "rejected" && dependsOn(row, refused))];
    for (const row of cascade) {
      await db.run("UPDATE outbox SET state = 'rejected', errorCode = ? WHERE seq = ?", [errorCode, row.seq]);
    }
  });
  emit();
}

/** Changes rejected because of `seq` (same code, newer, dependent). */
function followers(all: Change[], parent: Change): Change[] {
  return all.filter(
    (row) => row.seq > parent.seq && row.state === "rejected" && row.errorCode === parent.errorCode && dependsOn(row, parent),
  );
}

/** « Corriger »: the rejected change is sent again with an edited body, and those that depended on it with it. */
export async function retry(seq: number, payload: NewChange["payload"]): Promise<void> {
  const db = await getDb();
  await db.transaction(async () => {
    const all = (await db.all<Row>("SELECT * FROM outbox ORDER BY seq")).map(fromRow);
    const parent = all.find((row) => row.seq === seq);
    if (!parent) return;
    for (const row of followers(all, parent)) {
      await db.run("UPDATE outbox SET state = 'pending', errorCode = NULL WHERE seq = ?", [row.seq]);
    }
    await db.run("UPDATE outbox SET state = 'pending', errorCode = NULL, payload = ? WHERE seq = ?", [JSON.stringify(payload), seq]);
  });
  emit();
}

/** « Abandonner »: the rejected change disappears, with those that depended on it. */
export async function discard(seq: number): Promise<void> {
  const db = await getDb();
  await db.transaction(async () => {
    const all = (await db.all<Row>("SELECT * FROM outbox ORDER BY seq")).map(fromRow);
    const parent = all.find((row) => row.seq === seq);
    if (!parent) return;
    for (const row of [parent, ...followers(all, parent)]) await db.run("DELETE FROM outbox WHERE seq = ?", [row.seq]);
  });
  emit();
}

/** At startup: an interrupted send (app killed) goes back to pending; resending is safe (R5). */
export async function resetSending(): Promise<void> {
  const db = await getDb();
  await db.run("UPDATE outbox SET state = 'pending' WHERE state = 'sending'");
}

export async function pendingCount(): Promise<number> {
  const db = await getDb();
  const row = await db.first<{ count: number }>("SELECT COUNT(*) AS count FROM outbox WHERE state != 'rejected'");
  return row?.count ?? 0;
}
