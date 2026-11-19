"use client";

import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { setGroupGiftAmountAction } from "@/src/server/actions";
import { FormRefusal } from "@/components/site/form-refusal";

/** A participant with an account changes or clears their amount (028, US4). `amount`: as typed in the field. */
export function GroupGiftAmountForm({
  token,
  reservationId,
  amount,
}: {
  token: string;
  reservationId: string;
  amount: string;
}) {
  const { t } = useTranslation(["public", "errors"]);
  const [state, formAction, pending] = useActionState(setGroupGiftAmountAction, null);
  return (
    <form key={state?.attempt ?? 0} action={formAction} className="flex w-full flex-col gap-3">
      <FormRefusal code={state?.error} />
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="reservationId" value={reservationId} />
      <Field>
        <FieldLabel htmlFor="my-amount">{t("groupGift.changeAmount")}</FieldLabel>
        <div className="flex gap-2">
          <Input
            id="my-amount"
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            defaultValue={state?.values.amount ?? amount}
          />
          <Button type="submit" variant="outline" disabled={pending}>
            {t("groupGift.saveAmount")}
          </Button>
        </div>
        <FieldDescription>{t("groupGift.changeAmountHint")}</FieldDescription>
      </Field>
    </form>
  );
}
