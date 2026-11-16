import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { setSurpriseMode } from "@/data/sharing";
import { useServerAction } from "@/features/errors";
import { Alert } from "@/ui/Alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Checkbox } from "@/ui/Checkbox";

/**
 * « Garder la surprise », any member, as on the site (`components/site/surprise-mode-form.tsx`, 020):
 * « Ne pas voir les cadeaux réservés » for this account only. A direct call, disabled offline.
 */
export function SurpriseCard({ listId, enabled, disabled }: { listId: string; enabled: boolean; disabled: boolean }) {
  const { t } = useTranslation("list");
  const [done, setDone] = useState<"saved" | "cleared" | null>(null);
  const toggle = useServerAction(
    useCallback(
      async (next: boolean) => {
        setDone(null);
        await setSurpriseMode(listId, next);
        setDone(next ? "saved" : "cleared");
      },
      [listId],
    ),
  );
  return (
    <Card testID="share.surprise">
      <CardHeader>
        <CardTitle>{t("surprise.title")}</CardTitle>
        <CardDescription>{t("surprise.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Checkbox
          testID="share.surprise-toggle"
          checked={enabled}
          disabled={disabled || toggle.busy}
          label={t("surprise.toggle")}
          onChange={(next) => void toggle.run(next)}
        />
        {done ? <Alert testID="share.surprise-saved">{t(done === "saved" ? "surprise.saved" : "surprise.cleared")}</Alert> : null}
        {toggle.error ? (
          <Alert testID="share.surprise-error" variant="destructive">
            {toggle.error}
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
