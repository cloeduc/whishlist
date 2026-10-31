import {
  deleteAccount,
  exportAccount,
  previewAccountDeletion,
  type AccountDeletionPreview,
  type AccountExport,
} from "../../domain/account";
import { verifyPassword } from "../../domain/passwords";
import { readDocument, updateDocument } from "../../store/db";
import { rateLimitForIp } from "../rate-limit";
import { activeUser, type CommandContext, type CommandResult } from "./context";

/** Ce que supprimerait la suppression du compte connecté. Ne modifie rien. */
export async function previewOwnDeletion(
  ctx: CommandContext,
): Promise<CommandResult<{ preview: AccountDeletionPreview }>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  return { ok: true, preview: previewAccountDeletion(await readDocument(), active.user.id) };
}

/**
 * Supprime le compte connecté après vérification du mot de passe, en une seule écriture.
 * Les cookies du site et les jetons d'API ne trouvent plus le compte ensuite.
 */
export async function deleteOwnAccount(ctx: CommandContext, input: { password: string }): Promise<CommandResult> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  const userId = active.user.id;
  rateLimitForIp(`delete-account:${userId}`, ctx.ip, 10, 15 * 60 * 1000);
  return updateDocument<CommandResult>(async (doc) => {
    const user = doc.users.find((entry) => entry.id === userId);
    if (!user) return { doc, result: { ok: false, error: "accountMissing" } };
    if (!(await verifyPassword(input.password, user.passwordHash))) {
      return { doc, result: { ok: false, error: "wrongCurrentPassword" } };
    }
    const removed = deleteAccount(doc, { userId });
    if (!removed.ok) return { doc, result: removed };
    return { doc: removed.doc, result: { ok: true } };
  });
}

export async function exportOwnAccount(ctx: CommandContext): Promise<CommandResult<{ data: AccountExport }>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  rateLimitForIp(`export:${active.user.id}`, ctx.ip, 5, 60 * 60 * 1000);
  const data = exportAccount(await readDocument(), active.user.id, { origin: ctx.origin, locale: ctx.locale });
  if (!data) return { ok: false, error: "accountMissing" };
  return { ok: true, data };
}
