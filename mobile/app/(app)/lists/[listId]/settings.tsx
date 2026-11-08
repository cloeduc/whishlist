import { useTranslation } from "react-i18next";

import { DeleteListCard } from "@/features/lists/DeleteListCard";
import { LabelEditor } from "@/features/lists/LabelEditor";
import { ListScreen } from "@/features/lists/ListScreen";
import { useOnline } from "@/network";
import { Alert } from "@/ui/Alert";

/**
 * Settings tab, from the categories / « qui » block of `10-liste-reglages.png` (FR-016), then the
 * owner's « Supprimer la liste » card (017). The list's appearance stays on the site in this version.
 * Offline, or for a list not sent yet: unavailable, with the explanation (FR-029b).
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
            <DeleteListCard list={list} owner={list.role === "owner"} disabled={disabled} />
          </>
        );
      }}
    </ListScreen>
  );
}
