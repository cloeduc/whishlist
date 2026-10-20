import Link from "next/link";
import { redirect } from "next/navigation";
import { GiftIcon } from "lucide-react";
import { currentUser } from "../src/auth/current";
import { getDocument } from "../src/store/db";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getTranslations } from "@/src/i18n/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, t] = await Promise.all([currentUser(), getTranslations("home")]);
  if (user?.mustChangePassword) redirect("/changer-mot-de-passe");
  if (!user) {
    return (
      <main className="flex flex-col gap-6">
        <div className="flex max-w-xl flex-col gap-2">
          <h1 className="text-2xl font-medium tracking-tight">{t("guest.title")}</h1>
          <p className="text-muted-foreground">{t("guest.body")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button nativeButton={false} render={<Link href="/inscription" />}>
            {t("guest.createAccount")}
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/connexion" />}>
            {t("guest.hasAccount")}
          </Button>
        </div>
      </main>
    );
  }
  const doc = await getDocument();
  const mine = doc.memberships
    .filter((membership) => membership.userId === user.id)
    .map((membership) => doc.wishlists.find((list) => list.id === membership.wishlistId))
    .filter((list) => list !== undefined);
  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-medium tracking-tight">{t("mine.title")}</h1>
      {mine.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GiftIcon />
            </EmptyMedia>
            <EmptyTitle>{t("mine.emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("mine.emptyBody")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/listes/new" />}>
              {t("mine.newList")}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {mine.map((list) => (
            <Card key={list.id} size="sm">
              <CardHeader>
                <CardTitle>
                  <Link href={`/listes/${list.id}`} className="hover:underline">
                    {list.title}
                  </Link>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
