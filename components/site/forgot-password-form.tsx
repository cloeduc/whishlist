"use client";

import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestPasswordResetAction } from "@/src/server/actions";

export function ForgotPasswordForm() {
  const { t } = useTranslation("auth");
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, null);
  return (
    <form key={state?.attempt ?? 0} action={formAction}>
      <FieldGroup>
        {state ? (
          <Alert variant="destructive">
            <AlertDescription>{t("forgot.rateLimited")}</AlertDescription>
          </Alert>
        ) : null}
        <Field>
          <FieldLabel htmlFor="email">{t("forgot.email")}</FieldLabel>
          <Input id="email" name="email" type="email" required autoComplete="email" defaultValue={state?.values.email} />
        </Field>
        <Button type="submit" disabled={pending}>
          {t("forgot.submit")}
        </Button>
      </FieldGroup>
    </form>
  );
}
