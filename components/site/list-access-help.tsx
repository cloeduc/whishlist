import { LinkButton } from "@/components/site/link-button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getTranslations } from "@/src/i18n/server";

/**
 * Shown to a signed-in account that opens a list's management address without being a member (026).
 * Says nothing about the list itself: no title, owner or link.
 */
export async function ListAccessHelp() {
  const t = await getTranslations("list");
  return (
    <main className="flex w-full flex-col">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>
            <h1 className="text-2xl font-medium tracking-tight">{t("accessHelp.title")}</h1>
          </EmptyTitle>
          <EmptyDescription>{t("accessHelp.body")}</EmptyDescription>
          <EmptyDescription>{t("accessHelp.howTo")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <LinkButton href="/lists">{t("accessHelp.backToLists")}</LinkButton>
        </EmptyContent>
      </Empty>
    </main>
  );
}
