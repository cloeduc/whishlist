"use client";

import { useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { setSurpriseModeAction } from "@/src/server/actions";

/** Sharing tab, any member: « Ne pas voir les cadeaux réservés », for this member only (020). */
export function SurpriseModeForm({ wishlistId, enabled }: { wishlistId: string; enabled: boolean }) {
  const { t } = useTranslation("list");
  const [checked, setChecked] = useState(enabled);
  const [pending, startTransition] = useTransition();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("surprise.title")}</CardTitle>
        <CardDescription>{t("surprise.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Field orientation="horizontal">
          <Checkbox
            id="surprise-mode"
            checked={checked}
            disabled={pending}
            onCheckedChange={(next) => {
              setChecked(next);
              const formData = new FormData();
              formData.set("wishlistId", wishlistId);
              formData.set("enabled", next ? "1" : "0");
              formData.set("tab", "sharing");
              startTransition(() => setSurpriseModeAction(formData));
            }}
          />
          <FieldLabel htmlFor="surprise-mode">{t("surprise.toggle")}</FieldLabel>
        </Field>
      </CardContent>
    </Card>
  );
}
