"use client";

import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MIN_PASSWORD_LENGTH } from "@/src/domain/passwords";
import { resetPasswordAction } from "@/src/server/actions";
import { FormRefusal } from "@/components/site/form-refusal";

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useTranslation(["auth", "errors"]);
  const [state, formAction, pending] = useActionState(resetPasswordAction, null);
  const error = !state
    ? null
    : state.error === "password"
      ? t("reset.errorPassword")
      : state.error === "rate"
        ? t("errors:rateLimited")
        : t("reset.errorGeneric");
  return (
    <form key={state?.attempt ?? 0} action={formAction}>
      <FieldGroup>
        <input type="hidden" name="token" value={token} />
        <FormRefusal message={error} />
        <Field>
          <FieldLabel htmlFor="password">{t("reset.password")}</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
          />
          <FieldDescription>{t("reset.passwordHint")}</FieldDescription>
        </Field>
        <Button type="submit" disabled={pending}>
          {t("reset.submit")}
        </Button>
      </FieldGroup>
    </form>
  );
}
