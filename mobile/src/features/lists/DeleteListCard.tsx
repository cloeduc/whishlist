import { router } from "expo-router";
import { useCallback, useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";

import { deleteList } from "@/data/sharing";
import { usePendingCountFor } from "@/data/store";
import { useServerAction } from "@/features/errors";
import { withPendingLost } from "@/features/sharing/pendingLost";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { ConfirmDialog } from "@/ui/ConfirmDialog";

/**
 * Deleting a list (017, US5): the site's confirmation, then back to « Mes listes ». Used by the
 * « Supprimer la liste » card of the settings, and offered to a person alone who tries to leave.
 * Gives the confirmation's props: each screen renders it with its own testID.
 */
export function useDeleteList(list: { id: string; title: string }) {
  const { t } = useTranslation(["list", "mobile"]);
  const pending = usePendingCountFor(list.id);
  const [asking, setAsking] = useState(false);
  const action = useServerAction(
    useCallback(async () => {
      await deleteList(list.id);
      router.replace("/");
    }, [list.id]),
  );
  const dialog: Omit<ComponentProps<typeof ConfirmDialog>, "testID"> = {
    visible: asking,
    title: t("list:confirm.deleteListTitle", { name: list.title }),
    body: withPendingLost(t("list:confirm.deleteListBody"), pending, t),
    confirmLabel: t("list:confirm.deleteListConfirm"),
    keepLabel: t("list:confirm.deleteListKeep"),
    onKeep: () => setAsking(false),
    onConfirm: () => {
      setAsking(false);
      void action.run();
    },
  };
  return { ask: () => setAsking(true), busy: action.busy, error: action.error, dialog };
}

/**
 * « Supprimer la liste » card of the site's settings tab, owner only. Mounted for every role: when
 * the server refuses because the role changed elsewhere, the reloaded list makes the account a
 * member, the card goes and its refusal stays readable.
 */
export function DeleteListCard({ list, owner, disabled }: { list: { id: string; title: string }; owner: boolean; disabled: boolean }) {
  const { t } = useTranslation("list");
  const deletion = useDeleteList(list);
  if (!owner) {
    return deletion.error ? (
      <Alert testID="settings.delete-error" variant="destructive">
        {deletion.error}
      </Alert>
    ) : null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.danger")}</CardTitle>
        <CardDescription>{t("settings.dangerHint")}</CardDescription>
      </CardHeader>
      <CardContent>
        {deletion.error ? (
          <Alert testID="settings.delete-error" variant="destructive">
            {deletion.error}
          </Alert>
        ) : null}
        <Button
          testID="settings.delete-list"
          title={t("settings.delete")}
          variant="destructive"
          fullWidth
          disabled={disabled || deletion.busy}
          onPress={deletion.ask}
        />
      </CardContent>
      <ConfirmDialog {...deletion.dialog} testID="settings.delete-confirm" />
    </Card>
  );
}

/**
 * Offered under the `aloneMustDelete` refusal of « Quitter cette liste » (spec, US2 scenario 6):
 * alone, the person closes the list by deleting it, after the same confirmation.
 */
export function AloneDeleteButton({ list, disabled }: { list: { id: string; title: string }; disabled: boolean }) {
  const { t } = useTranslation("list");
  const deletion = useDeleteList(list);
  return (
    <>
      {deletion.error ? (
        <Alert testID="share.alone-delete-error" variant="destructive">
          {deletion.error}
        </Alert>
      ) : null}
      <Button
        testID="share.alone-delete"
        title={t("settings.delete")}
        variant="destructive"
        fullWidth
        disabled={disabled || deletion.busy}
        onPress={deletion.ask}
      />
      <ConfirmDialog {...deletion.dialog} testID="share.delete-confirm" />
    </>
  );
}
