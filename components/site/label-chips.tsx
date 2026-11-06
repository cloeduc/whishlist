"use client";

import { XIcon } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { splitLabels } from "@/src/domain/split-labels";
import { manageLabelAction } from "@/src/server/actions";
import { FormRefusal } from "@/components/site/form-refusal";

type Chip = { id: string; label: string };
type LabelOp = Parameters<typeof manageLabelAction>[0];

const PENDING_PREFIX = "pending-";

/** A chip added optimistically: the server has not given it an id yet, so it cannot be renamed or deleted. */
function isPendingChip(chip: Chip): boolean {
  return chip.id.startsWith(PENDING_PREFIX);
}

/** What the chips look like while the server applies `op` (dropped when the transition ends). */
function applyOp(current: Chip[], op: LabelOp): Chip[] {
  if (op.op === "add") {
    const added = splitLabels(op.label ?? "").map((label, index) => ({ id: `${PENDING_PREFIX}${index}`, label }));
    return [...current, ...added];
  }
  if (op.op === "rename") return current.map((chip) => (chip.id === op.id ? { ...chip, label: op.label ?? chip.label } : chip));
  return current.filter((chip) => chip.id !== op.id);
}

export function LabelChips({
  wishlistId,
  kind,
  items,
  addPlaceholder,
  addLabel,
  addAria,
}: {
  wishlistId: string;
  kind: "type" | "person";
  items: Chip[];
  addPlaceholder: string;
  addLabel: string;
  addAria: string;
}) {
  const { t } = useTranslation(["list", "errors", "common"]);
  // The action refreshes the page: `items` comes back updated, or unchanged when refused.
  const [chips, applyOptimistic] = useOptimistic(items, applyOp);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(op: LabelOp, onOk?: () => void) {
    setError(null);
    startTransition(async () => {
      applyOptimistic(op);
      const result = await manageLabelAction(op);
      if (!result.ok) {
        setError(t(`errors:${result.error}`, { defaultValue: result.error }));
        return;
      }
      onOk?.();
    });
  }

  function addChip() {
    const label = draft.trim();
    if (!label || pending) return;
    run({ kind, op: "add", wishlistId, label }, () => setDraft(""));
  }

  function saveEdit() {
    if (!editingId) return;
    const label = editValue.trim();
    const previous = chips.find((chip) => chip.id === editingId)?.label ?? "";
    if (!label || label === previous) {
      setEditingId(null);
      return;
    }
    run({ kind, op: "rename", wishlistId, id: editingId, label }, () => setEditingId(null));
  }

  function removeChip(id: string) {
    run({ kind, op: "delete", wishlistId, id });
  }

  return (
    <div className={`flex flex-col gap-3 ${pending ? "opacity-90" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) =>
          editingId === chip.id ? (
            <Input
              key={chip.id}
              autoFocus
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
              onBlur={saveEdit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  saveEdit();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setEditingId(null);
                }
              }}
              className="h-8 w-40"
              aria-label={t("categories.renameAria", { label: chip.label })}
            />
          ) : (
            <Badge key={chip.id} variant="secondary" className="h-8 gap-1 pr-1">
              <button
                type="button"
                className="max-w-48 truncate px-0.5 text-left"
                disabled={isPendingChip(chip)}
                onClick={() => {
                  setEditingId(chip.id);
                  setEditValue(chip.label);
                }}
              >
                {chip.label}
              </button>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-base hover:bg-background focus-visible:ring-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50"
                disabled={isPendingChip(chip)}
                aria-label={t("categories.deleteChip", { label: chip.label })}
                onClick={() => removeChip(chip.id)}
              >
                <XIcon className="size-4" aria-hidden />
              </button>
            </Badge>
          ),
        )}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor={`label-add-${kind}`} className="text-sm font-medium">
            {addLabel}
          </label>
          <Input
            id={`label-add-${kind}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addChip();
              }
            }}
            placeholder={addPlaceholder}
            className="h-9 max-w-xs"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || !draft.trim()}
          onClick={addChip}
          aria-label={addAria}
        >
          {t("categories.add")}
        </Button>
      </div>
      <FormRefusal message={error} />
    </div>
  );
}
