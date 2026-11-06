"use client";

import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestEmailChangeAction } from "@/src/server/actions";
import { FormRefusal } from "@/components/site/form-refusal";

/** Account page, email card: ask for a new address. */
export function EmailChangeForm() {
  const { t } = useTranslation(["auth", "errors"]);
  const [state, formAction, pending] = useActionState(requestEmailChangeAction, null);
  return (
    <form key={state?.attempt ?? 0} action={formAction}>
      <FieldGroup>
        <FormRefusal code={state?.error} />
        <Field>
          <FieldLabel htmlFor="new-email">{t("account.emailChange.newEmail")}</FieldLabel>
          <Input id="new-email" name="email" type="email" required autoComplete="email" defaultValue={state?.values.email} />
        </Field>
        <Field>
          <FieldLabel htmlFor="email-current-password">{t("account.emailChange.currentPassword")}</FieldLabel>
          <Input id="email-current-password" name="currentPassword" type="password" required autoComplete="current-password" />
        </Field>
        <Button type="submit" disabled={pending}>
          {t("account.emailChange.submit")}
        </Button>
      </FieldGroup>
    </form>
  );
}
