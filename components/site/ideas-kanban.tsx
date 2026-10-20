"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { GripVerticalIcon } from "lucide-react";
import { parsePriority } from "@/src/domain/priority";
import { deleteItemAction, setItemArchivedAction, setItemTypeAction } from "@/src/server/actions";
import { ItemForm } from "@/components/site/item-form";
import { PriorityStars } from "@/components/site/priority-stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type KanbanItem = {
  id: string;
  name: string;
  typeId: string;
  personId: string;
  personLabel: string;
  url: string | null;
  imageUrl: string | null;
  priceLabel: string | null;
  price: string;
  priority: string | null;
  sortOrder: number;
};

type TypeCol = { id: string; label: string };

function sortItems(items: KanbanItem[]): KanbanItem[] {
  return [...items].sort((a, b) => {
    const pa = parsePriority(a.priority) ?? 0;
    const pb = parsePriority(b.priority) ?? 0;
    return pb - pa || a.sortOrder - b.sortOrder || a.id.localeCompare(b.id);
  });
}

export function IdeasKanban({
  wishlistId,
  types,
  people,
  items,
}: {
  wishlistId: string;
  types: TypeCol[];
  people: { id: string; label: string }[];
  items: KanbanItem[];
}) {
  const { t, i18n } = useTranslation(["list", "errors", "common"]);
  const [board, setBoard] = useState(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overTypeId, setOverTypeId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setBoard(items);
  }, [items]);

  const columns = useMemo(() => {
    const sortedTypes = [...types].sort((a, b) => a.label.localeCompare(b.label, i18n.language));
    return sortedTypes.map((type) => ({
      type,
      items: sortItems(board.filter((item) => item.typeId === type.id)),
    }));
  }, [board, types, i18n.language]);

  const editingItem = editingId ? (board.find((item) => item.id === editingId) ?? null) : null;

  function onDrop(typeId: string) {
    if (!draggingId) return;
    const item = board.find((entry) => entry.id === draggingId);
    setDraggingId(null);
    setOverTypeId(null);
    if (!item || item.typeId === typeId) return;
    const previous = item.typeId;
    setBoard((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, typeId } : entry)),
    );
    setError(null);
    startTransition(async () => {
      const result = await setItemTypeAction({ wishlistId, itemId: item.id, typeId });
      if (!result.ok) {
        setBoard((current) =>
          current.map((entry) => (entry.id === item.id ? { ...entry, typeId: previous } : entry)),
        );
        setError(result.error);
      }
    });
  }

  function onArchive(itemId: string) {
    const snapshot = board;
    setBoard((current) => current.filter((entry) => entry.id !== itemId));
    if (editingId === itemId) setEditingId(null);
    setError(null);
    startTransition(async () => {
      const result = await setItemArchivedAction({ wishlistId, itemId, archived: true });
      if (!result.ok) {
        setBoard(snapshot);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex h-[80vh] w-full flex-col gap-2">
      <p className="max-w-3xl shrink-0 text-sm text-muted-foreground">{t("kanban.hint")}</p>
      {error ? (
        <p className="max-w-3xl shrink-0 text-sm text-destructive">
          {t(`errors:${error}`, { defaultValue: error })}
        </p>
      ) : null}
      {/* scaleY(-1) : scrollbar horizontale en haut */}
      <div className="scrollbar min-h-0 w-full flex-1 overflow-x-auto [transform:scaleY(-1)]">
        <div className={`flex h-full min-w-full gap-3 [transform:scaleY(-1)] ${pending ? "opacity-90" : ""}`}>
          {columns.map(({ type, items: columnItems }) => (
            <section
              key={type.id}
              className={`flex h-full min-w-[14rem] flex-1 flex-col gap-2 rounded-base border-2 border-border bg-secondary-background p-2 shadow-shadow ${
                overTypeId === type.id ? "border-main bg-main/10" : ""
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setOverTypeId(type.id);
              }}
              onDragLeave={() => {
                setOverTypeId((current) => (current === type.id ? null : current));
              }}
              onDrop={(event) => {
                event.preventDefault();
                onDrop(type.id);
              }}
            >
              <header className="flex shrink-0 items-baseline justify-between gap-2 px-1 pt-1">
                <h3 className="text-sm font-medium">{type.label}</h3>
                <span className="text-xs text-muted-foreground tabular-nums">{columnItems.length}</span>
              </header>
              <div className="scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                {columnItems.map((item) => (
                  <article
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    className={`cursor-pointer rounded-base border-2 border-border bg-background p-2 text-sm shadow-shadow ${
                      draggingId === item.id ? "opacity-50" : ""
                    }`}
                    onClick={() => setEditingId(item.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setEditingId(item.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        draggable
                        className="mt-0.5 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
                        aria-label={t("kanban.moveAria", { name: item.name })}
                        onClick={(event) => event.stopPropagation()}
                        onDragStart={(event) => {
                          event.stopPropagation();
                          setDraggingId(item.id);
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", item.id);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setOverTypeId(null);
                        }}
                      >
                        <GripVerticalIcon className="size-4" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="font-medium text-balance">{item.name}</span>
                        <PriorityStars value={item.priority} />
                        <span className="flex flex-wrap gap-1">
                          <Badge variant="outline">{item.personLabel}</Badge>
                          {item.priceLabel ? <Badge variant="outline">{item.priceLabel}</Badge> : null}
                        </span>
                        <button
                          type="button"
                          className="mt-0.5 w-fit text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onArchive(item.id);
                          }}
                        >
                          {t("kanban.archive")}
                        </button>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <Dialog open={editingItem !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          {editingItem ? (
            <>
              <DialogHeader>
                <DialogTitle>{t("kanban.editTitle")}</DialogTitle>
                <DialogDescription className="truncate">{editingItem.name}</DialogDescription>
              </DialogHeader>
              <ItemForm
                key={editingItem.id}
                wishlistId={wishlistId}
                types={types}
                people={people}
                item={editingItem}
                price={editingItem.price}
                onglet="idees"
              />
              <form action={deleteItemAction}>
                <input type="hidden" name="wishlistId" value={wishlistId} />
                <input type="hidden" name="itemId" value={editingItem.id} />
                <input type="hidden" name="onglet" value="idees" />
                <Button type="submit" variant="destructive" size="sm">
                  {t("common:actions.delete")}
                </Button>
              </form>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
