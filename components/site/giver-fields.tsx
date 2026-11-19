"use client";

import { useTranslation } from "react-i18next";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * Fields of the person who gives, shared by « J'offre » and « Participer » (028): the anti-bot honeypot
 * (`website`, must stay empty), the amount for a group gift, the name and the message, all optional.
 */
export function GiverFields({
  honeypotId,
  values,
  group,
}: {
  /** Unique on the page: two forms can sit side by side. */
  honeypotId: string;
  /** Values kept after a refusal. */
  values?: Record<string, string>;
  /** A participation in a group gift: the amount field and its hints. */
  group: boolean;
}) {
  const { t } = useTranslation("public");
  return (
    <>
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor={honeypotId}>Website</label>
        <input id={honeypotId} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {group ? (
        <Field>
          <FieldLabel htmlFor="amount">{t("groupGift.amount")}</FieldLabel>
          <Input id="amount" name="amount" inputMode="decimal" autoComplete="off" defaultValue={values?.amount} />
          <FieldDescription>{t("groupGift.amountHint")}</FieldDescription>
        </Field>
      ) : null}
      <Field>
        <FieldLabel htmlFor="fromName">{t("reserve.fromName")}</FieldLabel>
        <Input id="fromName" name="fromName" autoComplete="name" defaultValue={values?.fromName} />
      </Field>
      <Field>
        <FieldLabel htmlFor="note">{t("reserve.note")}</FieldLabel>
        <Textarea id="note" name="note" defaultValue={values?.note} />
        <FieldDescription>{group ? t("groupGift.privacyHint") : t("reserve.privacyHint")}</FieldDescription>
      </Field>
      <FieldDescription>{group ? t("groupGift.noPurchaseHint") : t("reserve.noPurchaseHint")}</FieldDescription>
    </>
  );
}
