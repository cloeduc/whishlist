"use client";

import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { sendInviteAction } from "@/src/server/actions";

/** Sharing tab: invite someone by email. */
export function InviteEmailForm({ wishlistId }: { wishlistId: string }) {
  const { t } = useTranslation(["list", "errors"]);
  const [state, formAction, pending] = useActionState(sendInviteAction, null);
  return (
    <form key={state?.attempt ?? 0} action={formAction}>
      <FieldGroup>
        <input type="hidden" name="wishlistId" value={wishlistId} />
        <input type="hidden" name="onglet" value="partage" />
        {state ? (
          <Alert variant="destructive">
            <AlertDescription>{t(`errors:${state.error}`, { defaultValue: state.error })}</AlertDescription>
          </Alert>
        ) : null}
        <Field>
          <FieldLabel htmlFor="invite-email">{t("share.inviteEmail")}</FieldLabel>
          <Input
            id="invite-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="prenom@exemple.fr"
            defaultValue={state?.values.email}
          />
        </Field>
        <Button type="submit" disabled={pending}>
          {t("share.sendInvite")}
        </Button>
      </FieldGroup>
    </form>
  );
}
