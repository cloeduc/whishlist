import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "../src/auth/current";
import { resolveTheme } from "../src/domain/theme";
import { getDocument } from "../src/store/db";
import { GiftMark } from "@/components/site/gift-mark";
import { WishlistCover } from "@/components/site/wishlist-cover";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getTranslations } from "@/src/i18n/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, t] = await Promise.all([currentUser(), getTranslations("home")]);
  if (user?.mustChangePassword) redirect("/compte");
  if (!user) {
    return (
      <main className="flex flex-col gap-6">
        <div className="flex max-w-xl flex-col gap-4">
          <GiftMark className="size-[88px]" />
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{t("guest.title")}</h1>
            <p className="text-muted-foreground">{t("guest.body")}</p>
          </div>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium tracking-tight">{t("mine.title")}</h1>
        <Button size="sm" nativeButton={false} render={<Link href="/listes/new" />}>
          {t("mine.newList")}
        </Button>
      </div>
      {mine.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <GiftMark className="size-16" />
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
              <CardHeader className="flex flex-row items-center gap-3">
                <Link href={`/listes/${list.id}`} className="shrink-0" tabIndex={-1} aria-hidden>
                  <WishlistCover
                    coverImageUrl={list.coverImageUrl}
                    theme={resolveTheme(list.theme)}
                    size="xs"
                    framed={false}
                  />
                </Link>
                <div className="flex min-w-0 flex-col gap-1">
                  <CardTitle>
                    <Link href={`/listes/${list.id}`} className="hover:underline">
                      {list.title}
                    </Link>
                  </CardTitle>
                  {list.subtitle ? (
                    <CardDescription className="line-clamp-2">{list.subtitle}</CardDescription>
                  ) : null}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
