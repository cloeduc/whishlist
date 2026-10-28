import {
  addPerson,
  addType,
  deletePerson,
  deleteType,
  renamePerson,
  renameType,
  reorderTypes as reorderTypesRule,
} from "../../domain/items";
import type { Database } from "../../domain/types";
import { updateDocument } from "../../store/db";
import type { LabelView } from "../api/views";
import { activeUser, type CommandContext, type CommandResult } from "./context";

export type LabelInput = {
  kind: "type" | "person";
  op: "add" | "rename" | "delete";
  wishlistId: string;
  id?: string;
  label?: string;
};

type Saved = { ok: true; doc: Database; id?: string } | { ok: false; error: string };

function applyLabel(doc: Database, actorId: string, input: LabelInput): Saved {
  const { wishlistId } = input;
  const label = input.label ?? "";
  const id = input.id ?? "";
  if (input.kind === "type") {
    if (input.op === "add") {
      const saved = addType(doc, { wishlistId, actorId, label });
      return saved.ok ? { ok: true, doc: saved.doc, id: saved.typeId } : saved;
    }
    if (input.op === "rename") return renameType(doc, { wishlistId, actorId, typeId: id, label });
    return deleteType(doc, { wishlistId, actorId, typeId: id });
  }
  if (input.op === "add") {
    const saved = addPerson(doc, { wishlistId, actorId, label });
    return saved.ok ? { ok: true, doc: saved.doc, id: saved.personId } : saved;
  }
  if (input.op === "rename") return renamePerson(doc, { wishlistId, actorId, personId: id, label });
  return deletePerson(doc, { wishlistId, actorId, personId: id });
}

/** Ajouter, renommer ou retirer une catégorie ou un « qui ». Rend le libellé enregistré (sauf retrait). */
export async function manageLabel(
  ctx: CommandContext,
  input: LabelInput,
): Promise<CommandResult<{ label: LabelView | null }>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  return updateDocument<CommandResult<{ label: LabelView | null }>>((doc) => {
    const saved = applyLabel(doc, active.user.id, input);
    if (!saved.ok) return { doc, result: saved };
    const id = saved.id ?? input.id ?? "";
    const entries = input.kind === "type" ? saved.doc.types : saved.doc.people;
    const entry = entries.find((candidate) => candidate.id === id && candidate.wishlistId === input.wishlistId);
    return { doc: saved.doc, result: { ok: true, label: entry ? { id: entry.id, label: entry.label } : null } };
  });
}

export async function reorderTypes(
  ctx: CommandContext,
  input: { wishlistId: string; orderedTypeIds: string[] },
): Promise<CommandResult> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  return updateDocument<CommandResult>((doc) => {
    const saved = reorderTypesRule(doc, { ...input, actorId: active.user.id });
    return saved.ok ? { doc: saved.doc, result: { ok: true } } : { doc, result: saved };
  });
}
