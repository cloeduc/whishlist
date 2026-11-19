import { LinkButton } from "@/components/site/link-button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getTranslations } from "@/src/i18n/server";

/**
 * Shown to a signed-in account that opens a list's management address without being a member (026).
 * Says nothing about the list itself: no title, owner or link, unless the account already follows it,
 * in which case `followedReadPath` (the list's public address, already known to that account) is offered.
 */
export async function ListAccessHelp({ followedReadPath }: { followedReadPath: string | null }) {
  const t = await getTranslations("list");
  return (
    <main className="flex w-full flex-col">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>
            <h1 className="text-2xl font-medium tracking-tight">{t("accessHelp.title")}</h1>
          </EmptyTitle>
          <EmptyDescription>{t("accessHelp.body")}</EmptyDescription>
          <EmptyDescription>{t(followedReadPath ? "accessHelp.followedBody" : "accessHelp.howTo")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row flex-wrap justify-center">
          {followedReadPath ? <LinkButton href={followedReadPath}>{t("accessHelp.viewFollowed")}</LinkButton> : null}
          <LinkButton href="/lists" variant={followedReadPath ? "neutral" : "default"}>
            {t("accessHelp.backToLists")}
          </LinkButton>
        </EmptyContent>
      </Empty>
    </main>
  );
}
