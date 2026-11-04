import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { ItemForm, emptyDraft } from "@/features/items/ItemForm";
import { useItemSave } from "@/features/items/useItemSave";
import { useList } from "@/features/lists/ListContext";
import { BackLink } from "@/ui/BackLink";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { LiveGiftMark } from "@/ui/LiveGiftMark";
import { Screen } from "@/ui/Screen";

/**
 * Add an idea (FR-013); works offline, the idea becomes « en attente » (FR-026).
 * From a share (`from=share`): `url` and `name` prefill the form, `fill` runs « Remplir depuis le
 * lien », and the saved idea opens the list (the previous screen was « Ajouter à une liste », or nothing on cold start).
 */
export default function NewItem() {
  const { t } = useTranslation("list");
  const { list, listId } = useList();
  const shared = useLocalSearchParams<{ url?: string; name?: string; fill?: string; from?: string }>();
  const save = useItemSave(listId, { toList: shared.from === "share" });
  if (!list) return <LiveGiftMark />;
  return (
    <Screen testID="item-form.screen">
      <BackLink fallback={`/lists/${listId}`} />
      <Card>
        <CardHeader>
          <CardTitle>{t("addIdea")}</CardTitle>
          <CardDescription>{t("addIdeaHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ItemForm
            list={list}
            initial={{ ...emptyDraft(list), url: shared.url ?? "", name: shared.name ?? "" }}
            autoFill={shared.fill === "1"}
            error={save.error}
            busy={save.busy}
            submitLabel={t("form.add")}
            onSubmit={(draft) => void save.submit(draft)}
          />
        </CardContent>
      </Card>
    </Screen>
  );
}
