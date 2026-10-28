import { useTranslation } from "react-i18next";

import { translateError } from "@/i18n";
import { discard } from "@/offline/outbox";

import { Alert } from "./Alert";
import { Button } from "./Button";

/**
 * Changement refusé par le serveur : alerte rouge avec la raison traduite,
 * « Corriger » (ouvre le formulaire) et « Abandonner » (FR-029a).
 */
export function RejectedAlert({ seq, errorCode, onFix }: { seq: number; errorCode: string; onFix?: () => void }) {
  const { t } = useTranslation("mobile");
  return (
    <Alert
      variant="destructive"
      testID="rejected-alert"
      title={t("offline.rejected")}
      actions={
        <>
          {onFix ? <Button title={t("offline.fix")} variant="neutral" size="sm" onPress={onFix} /> : null}
          <Button title={t("offline.discard")} variant="neutral" size="sm" onPress={() => void discard(seq)} />
        </>
      }
    >
      {translateError(errorCode)}
    </Alert>
  );
}
