import { ApiError, NetworkError } from "@/api/client";

import { getChange, markPending, markSending, markSent, nextPending, reject, type Change } from "./outbox";

/** What the sync asks of the server; tests replace it with a fake. */
export interface Transport {
  /** Sends a change; throws `ApiError` (refusal) or `NetworkError`. */
  send(change: Change): Promise<void>;
  /** Reloads the local copy of « Mes listes » and of the affected lists. */
  refresh(listIds: string[]): Promise<void>;
}

/** Lists to reload after a change: its own, and the target list of a move or a copy. */
function listsOf(change: Change): string[] {
  return change.kind === "moveItem" || change.kind === "copyItem" ? [change.listId, change.payload.targetListId] : [change.listId];
}

/** Wait before a new attempt: 1 s, 2 s, 4 s… capped at 1 minute (R6). */
export function retryDelay(attempts: number): number {
  return Math.min(60_000, 1000 * 2 ** Math.max(0, attempts - 1));
}

/** Response that says nothing about the change: we will retry later, without rejecting it. */
function isTransient(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (!(error instanceof ApiError)) return false;
  return error.status >= 500 || error.status === 401 || error.status === 410 || error.status === 429;
}

let transport: Transport | null = null;
let running: Promise<void> | null = null;
let again = false;
let timer: ReturnType<typeof setTimeout> | null = null;

export function setTransport(next: Transport): void {
  transport = next;
}

function schedule(delay: number) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void syncNow();
  }, delay);
}

/** One pass over the queue; returns `false` if it stopped for lack of an answer. */
async function run(send: Transport): Promise<boolean> {
  const touched = new Set<string>();
  try {
    for (let change = await nextPending(); change; change = await nextPending()) {
      await markSending(change.seq);
      try {
        await send.send(change);
        await markSent(change.seq);
        for (const id of listsOf(change)) touched.add(id);
      } catch (error) {
        // An idea already deleted: resending a deletion is a success (contract api-v1-additions).
        if (change.kind === "deleteItem" && error instanceof ApiError && error.code === "itemMissing") {
          await markSent(change.seq);
          touched.add(change.listId);
          continue;
        }
        if (isTransient(error)) {
          await markPending(change.seq);
          // 401: the session handles signing in again; the queue is kept for the same account.
          if (!(error instanceof ApiError && error.status === 401)) schedule(retryDelay(change.attempts + 1));
          return false;
        }
        // Business refusal: reported, and the other changes go on (FR-029a).
        await reject(change.seq, error instanceof ApiError ? error.code : "serverError");
        for (const id of listsOf(change)) touched.add(id);
      }
    }
  } finally {
    if (touched.size > 0) await send.refresh([...touched]).catch(() => {});
  }
  return true;
}

/**
 * Sends the queue one change at a time, in order (FR-028). Only one send at a time:
 * a call during a send waits for that same one, which also takes the changes added meanwhile.
 */
export function syncNow(): Promise<void> {
  if (!transport) return Promise.resolve();
  if (running) {
    // A change added during the send: a new pass will take it.
    again = true;
    return running;
  }
  const current = transport;
  running = (async () => {
    try {
      let completed: boolean;
      do {
        again = false;
        completed = await run(current);
      } while (again && completed);
    } finally {
      running = null;
    }
  })();
  return running;
}

export type Outcome = { status: "sent" } | { status: "pending" } | { status: "rejected"; errorCode: string };

/** After an add: sends right away if possible, and tells what became of the change. */
export async function sendAndWait(seq: number | null): Promise<Outcome> {
  if (seq === null) return { status: "sent" };
  await syncNow();
  const after = await getChange(seq);
  if (!after) return { status: "sent" };
  if (after.state === "rejected") return { status: "rejected", errorCode: after.errorCode ?? "serverError" };
  return { status: "pending" };
}

/** Tests: stops the scheduled new attempt. */
export function stopSync(): void {
  if (timer) clearTimeout(timer);
  timer = null;
}
