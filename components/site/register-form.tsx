"use client";

import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MIN_PASSWORD_LENGTH } from "@/src/domain/passwords";
import { registerAction } from "@/src/server/actions";

const ERROR_KEYS: Record<string, string> = {
  password: "register.errorPassword",
  rate: "register.rateLimited",
  fields: "register.errorFields",
};

export function RegisterForm({ next }: { next: string }) {
  const { t } = useTranslation("auth");
  const [state, formAction, pending] = useActionState(registerAction, null);
  const error = state ? t(ERROR_KEYS[state.error] ?? "register.errorFields") : null;
  return (
    <form key={state?.attempt ?? 0} action={formAction}>
      <FieldGroup>
        <input type="hidden" name="next" value={next} />
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Field>
          <FieldLabel htmlFor="displayName">{t("register.name")}</FieldLabel>
          <Input
            id="displayName"
            name="displayName"
            required
            autoComplete="nickname"
            defaultValue={state?.values.displayName}
          />
          <FieldDescription>{t("register.nameHint")}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="email">{t("register.email")}</FieldLabel>
          <Input id="email" name="email" type="email" required autoComplete="email" defaultValue={state?.values.email} />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">{t("register.password")}</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
          />
          <FieldDescription>{t("register.passwordHint")}</FieldDescription>
        </Field>
        <Button type="submit" disabled={pending}>
          {t("register.submit")}
        </Button>
      </FieldGroup>
    </form>
  );
}
