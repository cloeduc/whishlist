import { useTranslation } from "react-i18next";

import { LabelEditor } from "@/features/lists/LabelEditor";
import { ListScreen } from "@/features/lists/ListScreen";
import { useOnline } from "@/network";
import { Alert } from "@/ui/Alert";

/**
 * Onglet Réglages, d'après le bloc catégories / « qui » de `10-liste-reglages.png` (FR-016).
 * Apparence et suppression de la liste restent sur le site dans cette version.
 * Hors ligne, ou pour une liste pas encore envoyée : indisponible, avec l'explication (FR-029b).
 */
export default function Settings() {
  const { t } = useTranslation("mobile");
  const online = useOnline();
  return (
    <ListScreen tab="reglages">
      {(list) => {
        const disabled = !online || list.localOnly;
        return (
          <>
            {disabled ? <Alert>{list.localOnly ? t("lists.notSentYet") : t("settings.offline")}</Alert> : null}
            <LabelEditor
              listId={list.id}
              kind="types"
              labels={[...list.categories].sort((a, b) => a.sortOrder - b.sortOrder)}
              disabled={disabled}
            />
            <LabelEditor listId={list.id} kind="people" labels={list.people} disabled={disabled} />
          </>
        );
      }}
    </ListScreen>
  );
}
