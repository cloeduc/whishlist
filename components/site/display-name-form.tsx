"use client";

import { useActionState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateDisplayNameAction } from "@/src/server/actions";
import { FormRefusal } from "@/components/site/form-refusal";

/** Account page, Profile card. `notice` is the success message rendered by the page. */
export function DisplayNameForm({
  displayName,
  email,
  notice,
}: {
  displayName: string;
  email: string;
  notice: ReactNode;
}) {
  const { t } = useTranslation(["auth", "errors"]);
  const [state, formAction, pending] = useActionState(updateDisplayNameAction, null);
  return (
    <form key={state?.attempt ?? 0} action={formAction} className="flex flex-col gap-4">
      <FieldGroup>
        {state ? null : notice}
        <FormRefusal code={state?.error} />
        <Field>
          <FieldLabel htmlFor="displayName">{t("account.displayName")}</FieldLabel>
          <Input
            id="displayName"
            name="displayName"
            required
            maxLength={80}
            defaultValue={state ? state.values.displayName : displayName}
            autoComplete="nickname"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="account-email">{t("account.email")}</FieldLabel>
          <Input id="account-email" value={email} readOnly className="bg-muted" />
          <p className="text-xs text-muted-foreground">{t("account.emailHint")}</p>
        </Field>
        <Button type="submit" disabled={pending}>
          {t("account.saveName")}
        </Button>
      </FieldGroup>
    </form>
  );
}
