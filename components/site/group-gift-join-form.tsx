"use client";

import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { joinGroupGiftAction } from "@/src/server/actions";
import { FormRefusal } from "@/components/site/form-refusal";

/**
 * « Participer » to a group gift (028): name, message and amount, all optional.
 * The `website` field is an anti-bot honeypot and must stay empty.
 */
export function GroupGiftJoinForm({ token }: { token: string }) {
  const { t } = useTranslation(["public", "errors"]);
  const [state, formAction, pending] = useActionState(joinGroupGiftAction, null);
  return (
    <form key={state?.attempt ?? 0} action={formAction}>
      <FieldGroup>
        <FormRefusal code={state?.error} />
        <input type="hidden" name="token" value={token} />
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <label htmlFor="website-gift">Website</label>
          <input id="website-gift" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <Field>
          <FieldLabel htmlFor="amount">{t("groupGift.amount")}</FieldLabel>
          <Input id="amount" name="amount" inputMode="decimal" autoComplete="off" defaultValue={state?.values.amount} />
          <p className="text-sm text-muted-foreground">{t("groupGift.amountHint")}</p>
        </Field>
        <Field>
          <FieldLabel htmlFor="fromName">{t("reserve.fromName")}</FieldLabel>
          <Input id="fromName" name="fromName" autoComplete="name" defaultValue={state?.values.fromName} />
        </Field>
        <Field>
          <FieldLabel htmlFor="note">{t("reserve.note")}</FieldLabel>
          <Textarea id="note" name="note" defaultValue={state?.values.note} />
          <p className="text-sm text-muted-foreground">{t("groupGift.privacyHint")}</p>
        </Field>
        <p className="text-sm text-muted-foreground">{t("groupGift.noPurchaseHint")}</p>
        <Button type="submit" disabled={pending}>
          {t("groupGift.joinSubmit")}
        </Button>
      </FieldGroup>
    </form>
  );
}
