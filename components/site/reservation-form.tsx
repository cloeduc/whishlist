"use client";

import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { reserveAction } from "@/src/server/actions";

/**
 * « J'offre » form. `itemId` set: the idea is already picked (hidden field); otherwise the person
 * picks one of `choices`. The `website` field is an anti-bot honeypot and must stay empty.
 */
export function ReservationForm({
  readToken,
  typeId,
  itemId,
  choices,
}: {
  readToken: string;
  typeId: string;
  itemId: string | null;
  choices: { id: string; name: string }[];
}) {
  const { t } = useTranslation(["public", "errors"]);
  const [state, formAction, pending] = useActionState(reserveAction, null);
  const honeypotId = itemId ? "website-a" : "website-b";
  const keptItem = state?.values.itemId;
  return (
    <form key={state?.attempt ?? 0} action={formAction}>
      <FieldGroup>
        {state ? (
          <Alert variant="destructive">
            <AlertDescription>{t(`errors:${state.error}`, { defaultValue: state.error })}</AlertDescription>
          </Alert>
        ) : null}
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
        <Field>
          <FieldLabel htmlFor="fromName">{t("reserve.fromName")}</FieldLabel>
          <Input id="fromName" name="fromName" autoComplete="name" defaultValue={state?.values.fromName} />
        </Field>
        <Field>
          <FieldLabel htmlFor="note">{t("reserve.note")}</FieldLabel>
          <Textarea id="note" name="note" defaultValue={state?.values.note} />
          <p className="text-sm text-muted-foreground">{t("reserve.privacyHint")}</p>
        </Field>
        <p className="text-sm text-muted-foreground">{t("reserve.noPurchaseHint")}</p>
        <Button type="submit" disabled={pending}>
          {t("reserve.submit")}
        </Button>
      </FieldGroup>
    </form>
  );
}
