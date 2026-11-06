"use client";

import { useActionState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { MIN_PASSWORD_LENGTH } from "@/src/domain/passwords";
import { changePasswordAction } from "@/src/server/actions";
import { FormRefusal } from "@/components/site/form-refusal";

const ERROR_KEYS: Record<string, string> = {
  mismatch: "changePassword.errorMismatch",
  current: "changePassword.errorCurrent",
  password: "changePassword.errorPassword",
  rateLimited: "errors:rateLimited",
};

/** Account page: change the password (`forced`: first sign-in, no current password asked). */
export function PasswordForm({ forced, notice }: { forced: boolean; notice: ReactNode }) {
  const { t } = useTranslation(["auth", "errors"]);
  const [state, formAction, pending] = useActionState(changePasswordAction, null);
  return (
    <form key={state?.attempt ?? 0} action={formAction}>
      <FieldGroup>
        {state ? null : notice}
        <FormRefusal message={state ? t(ERROR_KEYS[state.error] ?? "changePassword.errorGeneric") : null} />
        {!forced ? (
          <Field>
            <FieldLabel htmlFor="currentPassword">{t("changePassword.current")}</FieldLabel>
            <PasswordInput id="currentPassword" name="currentPassword" required autoComplete="current-password" />
          </Field>
        ) : null}
        <Field>
          <FieldLabel htmlFor="password">{t("changePassword.next")}</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
          />
          <FieldDescription>{t("changePassword.nextHint")}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm">{t("changePassword.confirm")}</FieldLabel>
          <PasswordInput
            id="confirm"
            name="confirm"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
          />
        </Field>
        <Button type="submit" disabled={pending}>
          {forced ? t("changePassword.submitForced") : t("changePassword.submit")}
        </Button>
      </FieldGroup>
    </form>
  );
}
