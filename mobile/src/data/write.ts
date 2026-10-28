import { enqueue, retry, type NewChange } from "@/offline/outbox";
import { sendAndWait } from "@/offline/sync";

/**
 * Résultat d'un enregistrement passé par la file :
 * - `sent` : accepté par le serveur ; `pending` : gardé sur le téléphone, envoyé plus tard ;
 * - refus : le code d'erreur, et le `seq` à reprendre (« Corriger ») au prochain envoi du formulaire.
 */
export type WriteResult = { ok: true; status: "sent" | "pending" } | { ok: false; error: string; seq: number | null };

/**
 * Ajoute le changement à la file (ou reprend un changement refusé) et tente de l'envoyer tout de suite.
 * En ligne, le formulaire connaît donc la réponse du serveur ; hors ligne, il passe « en attente ».
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
