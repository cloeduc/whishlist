import Link from "next/link";
import { getDocument } from "../../../../src/store/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getTranslations } from "@/src/i18n/server";

export const dynamic = "force-dynamic";

export default async function TypesPage({ params }: { params: Promise<{ readToken: string }> }) {
  const { readToken } = await params;
  const [t, doc] = await Promise.all([getTranslations("public"), getDocument()]);
  const list = doc.wishlists.find((entry) => entry.readToken === readToken);
  if (!list) {
    return (
      <main>
        <h1 className="text-2xl font-medium tracking-tight">{t("missingList")}</h1>
      </main>
    );
  }
  const types = doc.types.filter((type) => type.wishlistId === list.id);
  return (
    <main className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">{t("typesPage.title")}</h1>
        <Button variant="link" className="h-auto w-fit px-0" nativeButton={false} render={<Link href={`/l/${readToken}`} />}>
          {t("typesPage.back")}
        </Button>
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
