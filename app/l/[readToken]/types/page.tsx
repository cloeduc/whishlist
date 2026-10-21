import { currentUser } from "../../../../src/auth/current";
import { canAccessPublicList } from "../../../../src/auth/public-list";
import { getDocument } from "../../../../src/store/db";
import { LinkButton } from "@/components/site/link-button";
import { ReadUnlockForm } from "@/components/site/read-unlock-form";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getTranslations } from "@/src/i18n/server";

export const dynamic = "force-dynamic";

export default async function TypesPage({ params }: { params: Promise<{ readToken: string }> }) {
  const { readToken } = await params;
  const [t, doc, user] = await Promise.all([getTranslations("public"), getDocument(), currentUser()]);
  const list = doc.wishlists.find((entry) => entry.readToken === readToken);
  if (!list) {
    return (
      <main>
        <h1 className="text-2xl font-medium tracking-tight">{t("missingList")}</h1>
      </main>
    );
  }
  if (!(await canAccessPublicList(doc, list, user))) {
    return (
      <ReadUnlockForm
        readToken={readToken}
        title={list.title}
        heading={t("unlock.heading")}
        description={t("unlock.description")}
        passwordLabel={t("unlock.password")}
        passwordHint={t("unlock.passwordHint")}
        submit={t("unlock.submit")}
        error={null}
      />
    );
  }
  const types = doc.types
    .filter((type) => type.wishlistId === list.id)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
  return (
    <main className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">{t("typesPage.title")}</h1>
        <LinkButton href={`/l/${readToken}`} variant="link" className="h-auto w-fit px-0">
          {t("typesPage.back")}
        </LinkButton>
      </div>
      {types.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t("typesPage.empty")}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {types.map((type) => (
            <li key={type.id}>
              <Badge variant="secondary">{type.label}</Badge>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
