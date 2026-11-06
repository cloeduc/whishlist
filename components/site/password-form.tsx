"use client";

import { useActionState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MIN_PASSWORD_LENGTH } from "@/src/domain/passwords";
import { changePasswordAction } from "@/src/server/actions";

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
        {state ? (
          <Alert variant="destructive">
            <AlertDescription>{t(ERROR_KEYS[state.error] ?? "changePassword.errorGeneric")}</AlertDescription>
          </Alert>
        ) : null}
        {!forced ? (
          <Field>
            <FieldLabel htmlFor="currentPassword">{t("changePassword.current")}</FieldLabel>
            <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
          </Field>
        ) : null}
        <Field>
          <FieldLabel htmlFor="password">{t("changePassword.next")}</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
          />
          <FieldDescription>{t("changePassword.nextHint")}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm">{t("changePassword.confirm")}</FieldLabel>
          <Input
            id="confirm"
            name="confirm"
            type="password"
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
