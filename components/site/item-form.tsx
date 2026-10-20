"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { PriorityStarPicker } from "@/components/site/priority-star-picker";
import {
  enrichFromUrlAction,
  saveItemAction,
  type ItemFormDraft,
  type SaveItemState,
} from "@/src/server/actions";

function initialDraft(input: {
  item?: {
    name: string;
    typeId: string;
    personId: string;
    url: string | null;
    imageUrl: string | null;
    priority: string | null;
  };
  price?: string;
  types: { id: string }[];
  people: { id: string }[];
}): ItemFormDraft {
  return {
    name: input.item?.name ?? "",
    typeId: input.item?.typeId ?? input.types[0]?.id ?? "",
    personId: input.item?.personId ?? input.people[0]?.id ?? "",
    url: input.item?.url ?? "",
    imageUrl: "",
    price: input.price ?? "",
    priority: input.item?.priority && /^[1-5]$/.test(input.item.priority) ? input.item.priority : "",
  };
}

export function ItemForm({
  wishlistId,
  types,
  people,
  item,
  price,
  onglet = "idees",
}: {
  wishlistId: string;
  types: { id: string; label: string }[];
  people: { id: string; label: string }[];
  item?: {
    id: string;
    name: string;
    typeId: string;
    personId: string;
    url: string | null;
    imageUrl: string | null;
    priority: string | null;
  };
  price?: string;
  onglet?: string;
}) {
  const { t } = useTranslation(["list", "common", "errors"]);
  const id = item?.id ?? "new";
  const [state, formAction, pending] = useActionState(saveItemAction, null as SaveItemState);
  const [draft, setDraft] = useState(() => initialDraft({ item, price, types, people }));
  const [previewImage, setPreviewImage] = useState(item?.imageUrl ?? "");
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [enrichPending, startEnrich] = useTransition();

  useEffect(() => {
    if (state?.draft) {
      setDraft(state.draft);
      if (state.draft.imageUrl) setPreviewImage(state.draft.imageUrl);
    }
  }, [state]);

  function setField<K extends keyof ItemFormDraft>(key: K, value: ItemFormDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function enrich() {
    setEnrichError(null);
    startEnrich(async () => {
      const result = await enrichFromUrlAction({ url: draft.url, wishlistId });
      if (!result.ok) {
        setEnrichError(result.error);
        return;
      }
      setDraft((prev) => ({
        ...prev,
        name: result.name || prev.name,
        price: result.price || prev.price,
        imageUrl: result.imageUrl || prev.imageUrl,
        typeId: result.typeId || prev.typeId,
      }));
      if (result.imageUrl) setPreviewImage(result.imageUrl);
    });
  }

  const errorCode = state?.error ?? enrichError;
  const error = errorCode ? t(`errors:${errorCode}`, { defaultValue: errorCode }) : null;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <FieldGroup className="gap-3">
        <input type="hidden" name="wishlistId" value={wishlistId} />
        <input type="hidden" name="onglet" value={onglet} />
        {item ? <input type="hidden" name="itemId" value={item.id} /> : null}
        {error ? (
          <p className="rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}
        <Field>
          <FieldLabel htmlFor={`${id}-url`}>{t("form.url")}</FieldLabel>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <Input
              id={`${id}-url`}
              name="url"
              type="url"
              value={draft.url}
              onChange={(e) => setField("url", e.target.value)}
              placeholder="https://"
              className="min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="neutral"
              disabled={enrichPending || !draft.url.trim()}
              onClick={enrich}
              className="shrink-0"
            >
              {enrichPending ? t("common:actions.loading") : t("form.fetchInfos")}
            </Button>
          </div>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-name`}>{t("form.name")}</FieldLabel>
          <Input
            id={`${id}-name`}
            name="name"
            required
            value={draft.name}
            onChange={(e) => setField("name", e.target.value)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_6.5rem_auto] sm:items-end">
          <Field>
            <FieldLabel htmlFor={`${id}-type`}>{t("form.type")}</FieldLabel>
            <NativeSelect
              id={`${id}-type`}
              name="typeId"
              className="w-full"
              value={draft.typeId}
              onChange={(e) => setField("typeId", e.target.value)}
              required
            >
              {types.map((type) => (
                <NativeSelectOption key={type.id} value={type.id}>
                  {type.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-person`}>{t("form.person")}</FieldLabel>
            <NativeSelect
              id={`${id}-person`}
              name="personId"
              className="w-full"
              value={draft.personId}
              onChange={(e) => setField("personId", e.target.value)}
              required
            >
              {people.map((person) => (
                <NativeSelectOption key={person.id} value={person.id}>
                  {person.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-price`}>{t("form.price")}</FieldLabel>
            <Input
              id={`${id}-price`}
              name="price"
              inputMode="decimal"
              value={draft.price}
              onChange={(e) => setField("price", e.target.value)}
              placeholder={t("form.pricePlaceholder")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-priority`}>{t("form.priority")}</FieldLabel>
            <PriorityStarPicker
              id={`${id}-priority`}
              value={draft.priority}
              onChange={(next) => setField("priority", next)}
            />
            <FieldDescription>{t("form.priorityHint")}</FieldDescription>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor={`${id}-image`}>{t("form.image")}</FieldLabel>
          <div className="flex items-center gap-2">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow">
              {previewImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewImage}
                  alt=""
                  className="size-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : null}
            </div>
            <Input
              id={`${id}-image`}
              name="imageUrl"
              type="url"
              value={draft.imageUrl || previewImage}
              onChange={(e) => {
                const next = e.target.value;
                setField("imageUrl", next);
                setPreviewImage(next);
              }}
              placeholder="https://"
              className="min-w-0 flex-1"
            />
          </div>
        </Field>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? t("common:actions.loading") : item ? t("form.save") : t("form.add")}
        </Button>
      </FieldGroup>
    </form>
  );
}
