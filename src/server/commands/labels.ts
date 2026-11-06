import "server-only";
import {
  addPerson,
  addType,
  deletePerson,
  deleteType,
  renamePerson,
  renameType,
  reorderTypes as reorderTypesRule,
  splitLabels,
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

function labelViewFor(doc: Database, input: LabelInput, id: string): LabelView | null {
  const entries = input.kind === "type" ? doc.types : doc.people;
  const entry = entries.find((candidate) => candidate.id === id && candidate.wishlistId === input.wishlistId);
  return entry ? { id: entry.id, label: entry.label } : null;
}

/**
 * Add, rename or remove a category or a « qui ». Returns the stored label (except on removal).
 *
 * On add, an entry separated by commas creates several entries (`splitLabels`): everything
 * goes in the same write, so a refusal on one stores none. `label` stays the
 * first one for callers that expect only one; `labels` carries them all.
 */
export async function manageLabel(
  ctx: CommandContext,
  input: LabelInput,
): Promise<CommandResult<{ label: LabelView | null; labels: LabelView[] }>> {
  const active = activeUser(ctx);
  if (!active.ok) return active;
  type Result = CommandResult<{ label: LabelView | null; labels: LabelView[] }>;
  return updateDocument<Result>((doc) => {
    if (input.op !== "add") {
      const saved = applyLabel(doc, active.user.id, input);
      if (!saved.ok) return { doc, result: saved };
      const view = labelViewFor(saved.doc, input, saved.id ?? input.id ?? "");
      return { doc: saved.doc, result: { ok: true, label: view, labels: view ? [view] : [] } };
    }

    // Nothing usable (empty, or only separators): let the domain return its
    // usual error with an empty label — above all not the raw entry, « , , » would pass.
    const parts = splitLabels(input.label ?? "");
    const labels = parts.length > 0 ? parts : [""];
    let current = doc;
    const views: LabelView[] = [];
    for (const label of labels) {
      const saved = applyLabel(current, active.user.id, { ...input, label });
      if (!saved.ok) return { doc, result: saved };
      current = saved.doc;
      const view = labelViewFor(current, input, saved.id ?? "");
      if (view) views.push(view);
    }
    return { doc: current, result: { ok: true, label: views[0] ?? null, labels: views } };
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
