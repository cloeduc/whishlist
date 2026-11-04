import { enqueue, retry, type NewChange } from "@/offline/outbox";
import { sendAndWait } from "@/offline/sync";

/**
 * Result of a save made through the queue:
 * - `sent`: accepted by the server; `pending`: kept on the phone, sent later;
 * - refusal: the error code, and the `seq` to resume (« Corriger ») on the next form submit.
 */
export type WriteResult = { ok: true; status: "sent" | "pending" } | { ok: false; error: string; seq: number | null };

/**
 * Adds the change to the queue (or resumes a rejected change) and tries to send it right away.
 * Online, the form therefore knows the server's answer; offline, it becomes « en attente ».
 */
export async function write(change: NewChange, retrySeq?: number | null): Promise<WriteResult> {
  let seq: number | null;
  if (retrySeq) {
    await retry(retrySeq, change.payload);
    seq = retrySeq;
  } else {
    seq = await enqueue(change);
  }
  const outcome = await sendAndWait(seq);
  if (outcome.status === "rejected") return { ok: false, error: outcome.errorCode, seq };
  return { ok: true, status: outcome.status };
}
