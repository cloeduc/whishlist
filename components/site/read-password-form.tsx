"use client";

import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MIN_READ_PASSWORD_LENGTH } from "@/src/domain/read-password";
import { setReadPasswordAction } from "@/src/server/actions";

/** Sharing tab (owner): set or change the list's read password. */
export function ReadPasswordForm({ wishlistId, hasPassword }: { wishlistId: string; hasPassword: boolean }) {
  const { t } = useTranslation(["list", "errors"]);
  const [state, formAction, pending] = useActionState(setReadPasswordAction, null);
  return (
    <form key={state?.attempt ?? 0} action={formAction}>
      <FieldGroup>
        <input type="hidden" name="wishlistId" value={wishlistId} />
        <input type="hidden" name="onglet" value="partage" />
        <p className="text-sm font-medium">
          {hasPassword ? t("share.readPasswordChange") : t("share.readPasswordDefine")}
        </p>
        {state ? (
          <Alert variant="destructive">
            <AlertDescription>{t(`errors:${state.error}`, { defaultValue: state.error })}</AlertDescription>
          </Alert>
        ) : null}
        <Field>
          <FieldLabel htmlFor="read-password">{t("share.readPasswordLabel")}</FieldLabel>
          <Input
            id="read-password"
            name="password"
            type="password"
            required
            minLength={MIN_READ_PASSWORD_LENGTH}
            autoComplete="new-password"
          />
        </Field>
        <Button type="submit" disabled={pending}>
          {t("share.readPasswordSave")}
        </Button>
      </FieldGroup>
    </form>
  );
}
