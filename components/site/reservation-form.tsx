"use client";

import { useActionState, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { reserveAction } from "@/src/server/actions";
import { FormRefusal } from "@/components/site/form-refusal";

/** Refusals that the page's « plus disponible » notice already explains. */
const UNAVAILABLE_ERRORS = new Set(["itemAlreadyReserved", "itemNotInList"]);

/**
 * « J'offre » form: reserve on one's own, or start a group gift (028) with an optional amount. `itemId` set: the idea is already picked (hidden field); otherwise the person
 * picks one of `choices`. The `website` field is an anti-bot honeypot and must stay empty.
 * `unavailableShown`: the page already says the picked idea is no longer available, so a refusal
 * for that same reason is not repeated above the fields.
 */
export function ReservationForm({
  readToken,
  typeId,
  itemId,
  choices,
  unavailableShown = false,
}: {
  readToken: string;
  typeId: string;
  itemId: string | null;
  choices: { id: string; name: string }[];
  unavailableShown?: boolean;
}) {
  const { t } = useTranslation(["public", "errors"]);
  const [state, formAction, pending] = useActionState(reserveAction, null);
  const honeypotId = itemId ? "website-a" : "website-b";
  const keptItem = state?.values.itemId;
  const refusal = unavailableShown && state && UNAVAILABLE_ERRORS.has(state.error) ? null : state?.error;
  const [mode, setMode] = useState(state?.values.mode === "group" ? "group" : "single");
  const group = mode === "group";
  return (
    <form key={state?.attempt ?? 0} action={formAction}>
      <FieldGroup>
        <FormRefusal code={refusal} />
        <input type="hidden" name="readToken" value={readToken} />
        <input type="hidden" name="typeId" value={itemId ? "" : typeId} />
        {itemId ? <input type="hidden" name="itemId" value={itemId} /> : null}
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <label htmlFor={honeypotId}>Website</label>
          <input id={honeypotId} name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        {itemId ? null : (
          <Field>
            <FieldLabel htmlFor="itemId">{t("reserve.giftLabel")}</FieldLabel>
            <NativeSelect
              id="itemId"
              name="itemId"
              className="w-full"
              required
              defaultValue={keptItem && choices.some((item) => item.id === keptItem) ? keptItem : ""}
            >
              <NativeSelectOption value="" disabled>
                {t("reserve.choose")}
              </NativeSelectOption>
              {choices.map((item) => (
                <NativeSelectOption key={item.id} value={item.id}>
                  {item.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        )}
        <FieldSet>
          <FieldLegend variant="label">{t("reserve.modeLabel")}</FieldLegend>
          <RadioGroup
            name="mode"
            value={mode}
            onValueChange={(value) => setMode(value === "group" ? "group" : "single")}
          >
            <ModeChoice value="single" label={t("reserve.modeSingle")} hint={t("reserve.modeSingleHint")} />
            <ModeChoice value="group" label={t("reserve.modeGroup")} hint={t("reserve.modeGroupHint")} />
          </RadioGroup>
        </FieldSet>
        {group ? (
          <Field>
            <FieldLabel htmlFor="amount">{t("groupGift.amount")}</FieldLabel>
            <Input id="amount" name="amount" inputMode="decimal" autoComplete="off" defaultValue={state?.values.amount} />
            <p className="text-sm text-muted-foreground">{t("groupGift.amountHint")}</p>
          </Field>
        ) : null}
        <Field>
          <FieldLabel htmlFor="fromName">{t("reserve.fromName")}</FieldLabel>
          <Input id="fromName" name="fromName" autoComplete="name" defaultValue={state?.values.fromName} />
        </Field>
        <Field>
          <FieldLabel htmlFor="note">{t("reserve.note")}</FieldLabel>
          <Textarea id="note" name="note" defaultValue={state?.values.note} />
          <p className="text-sm text-muted-foreground">
            {group ? t("groupGift.privacyHint") : t("reserve.privacyHint")}
          </p>
        </Field>
        <p className="text-sm text-muted-foreground">
          {group ? t("groupGift.noPurchaseHint") : t("reserve.noPurchaseHint")}
        </p>
        <Button type="submit" disabled={pending}>
          {t("reserve.submit")}
        </Button>
      </FieldGroup>
    </form>
  );
}

function ModeChoice({ value, label, hint }: { value: string; label: string; hint: string }) {
  const id = `mode-${value}`;
  return (
    <div className="flex items-start gap-3">
      <RadioGroupItem id={id} value={value} aria-describedby={`${id}-hint`} className="mt-0.5" />
      <div className="flex flex-col gap-0.5">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      </div>
    </div>
  );
}
