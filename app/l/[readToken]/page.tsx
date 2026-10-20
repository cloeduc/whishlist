import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import {
  applyBudget,
  applyPerson,
  applyView,
  BUDGETS,
  categoryAnchorId,
  groupByCategory,
  parseBudget,
  sortByPriority,
  type BudgetId,
} from "../../../src/domain/filters";
import { toPublicItem, type PublicItem } from "../../../src/domain/read";
import { resolveTheme, themeToCssVars } from "../../../src/domain/theme";
import { getDocument } from "../../../src/store/db";
import { PriorityStars } from "@/components/site/priority-stars";
import { WishlistCover } from "@/components/site/wishlist-cover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getLocale, getTranslations } from "@/src/i18n/server";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";

function listHref(readToken: string, qui: string | null, budget: BudgetId | null, hash?: string): string {
  const params = new URLSearchParams();
  if (qui) params.set("qui", qui);
  if (budget) params.set("budget", budget);
  const query = params.toString();
  const path = query ? `/l/${readToken}?${query}` : `/l/${readToken}`;
  return hash ? `${path}#${hash}` : path;
}

function ItemCard({
  item,
  readToken,
  buyLink,
  offerLabel,
}: {
  item: PublicItem;
  readToken: string;
  buyLink: string;
  offerLabel: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt=""
              className="size-20 shrink-0 rounded-base border-2 border-border object-cover shadow-shadow"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <CardTitle className="text-balance">{item.name}</CardTitle>
                <PriorityStars value={item.priority} />
              </div>
              {item.priceLabel ? (
                <p className="shrink-0 text-2xl leading-none font-bold tabular-nums">{item.priceLabel}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CardDescription className="flex flex-wrap gap-2">
                <Badge variant="outline">{item.personLabel}</Badge>
              </CardDescription>
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1 text-xs leading-none underline underline-offset-2"
                >
                  <ExternalLinkIcon className="size-3" />
                  {buyLink}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardFooter className="border-t-2 border-border pt-3">
        <Button
          size="sm"
          className="w-full sm:w-auto"
          nativeButton={false}
          render={<Link href={`/l/${readToken}/reserver?itemId=${encodeURIComponent(item.id)}`} />}
        >
          {offerLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: Promise<{ readToken: string }>;
  searchParams: Promise<{ qui?: string; budget?: string; ok?: string }>;
}) {
  const { readToken } = await params;
  const query = await searchParams;
  const [t, locale, doc] = await Promise.all([getTranslations("public"), getLocale(), getDocument()]);
  const list = doc.wishlists.find((entry) => entry.readToken === readToken);
  if (!list) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{t("missingList")}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }
  const types = doc.types.filter((type) => type.wishlistId === list.id);
  const people = doc.people.filter((person) => person.wishlistId === list.id);
  const qui = people.some((person) => person.id === query.qui) ? query.qui! : null;
  const budget = parseBudget(query.budget);
  const reserved = new Set(
    doc.reservations.filter((reservation) => reservation.wishlistId === list.id).map((reservation) => reservation.itemId),
  );
  const filtered = sortByPriority(applyBudget(applyPerson(applyView(doc, list.id, null), qui), budget)).filter(
    (item) => !reserved.has(item.id),
  );
  const groups = groupByCategory(filtered, types).map((group) => group);
  // locale-aware sort of category labels already in domain with "fr" — re-sort here
  groups.sort((a, b) => a.label.localeCompare(b.label, locale));
  const allLabel = t("allList");
  const personLabel = people.find((person) => person.id === qui)?.label;
  const budgetLabel = budget ? t(`budgets.${budget}`) : null;
  const heading = [allLabel, personLabel, budgetLabel].filter(Boolean).join(" · ");
  const emptyTitle = qui || budget ? t("emptyFiltered") : t("emptyList");
  const theme = resolveTheme(list.theme);
  const cssVars = themeToCssVars(theme);
  const rootCss = Object.entries(cssVars)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
  return (
    <main className="flex flex-col gap-6" style={cssVars as CSSProperties}>
      <style dangerouslySetInnerHTML={{ __html: `:root{${rootCss}}` }} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <WishlistCover coverImageUrl={list.coverImageUrl} theme={theme} size="md" />
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{list.title}</h1>
          {list.subtitle ? <p className="text-muted-foreground text-pretty">{list.subtitle}</p> : null}
        </div>
      </div>
      <nav aria-label={t("categoriesNav")} className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="h-auto max-w-full whitespace-normal text-left"
          variant="default"
          nativeButton={false}
          render={<Link href={listHref(readToken, qui, budget)} aria-current="true" />}
        >
          {allLabel}
        </Button>
        {groups.map((group) => (
          <Button
            key={group.typeId}
            size="sm"
            className="h-auto max-w-full whitespace-normal text-left"
            variant="outline"
            nativeButton={false}
            render={<Link href={listHref(readToken, qui, budget, categoryAnchorId(group.typeId))} />}
          >
            {group.label}
          </Button>
        ))}
      </nav>
      {people.length > 0 ? (
        <nav aria-label={t("whoNav")} className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("who")}</span>
          <Button
            size="sm"
            className="h-auto max-w-full whitespace-normal text-left"
            variant={qui === null ? "default" : "outline"}
            nativeButton={false}
            render={<Link href={listHref(readToken, null, budget)} aria-current={qui === null ? "true" : undefined} />}
          >
            {t("everyone")}
          </Button>
          {people.map((person) => (
            <Button
              key={person.id}
              size="sm"
              className="h-auto max-w-full whitespace-normal text-left"
              variant={qui === person.id ? "default" : "outline"}
              nativeButton={false}
              render={
                <Link
                  href={listHref(readToken, person.id, budget)}
                  aria-current={qui === person.id ? "true" : undefined}
                />
              }
            >
              {person.label}
            </Button>
          ))}
        </nav>
      ) : null}
      <nav aria-label={t("budgetNav")} className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("budget")}</span>
        <Button
          size="sm"
          className="h-auto max-w-full whitespace-normal text-left"
          variant={budget === null ? "default" : "outline"}
          nativeButton={false}
          render={<Link href={listHref(readToken, qui, null)} aria-current={budget === null ? "true" : undefined} />}
        >
          {t("allPrices")}
        </Button>
        {BUDGETS.map((entry) => (
          <Button
            key={entry.id}
            size="sm"
            className="h-auto max-w-full whitespace-normal text-left"
            variant={budget === entry.id ? "default" : "outline"}
            nativeButton={false}
            render={
              <Link
                href={listHref(readToken, qui, entry.id)}
                aria-current={budget === entry.id ? "true" : undefined}
              />
            }
          >
            {t(`budgets.${entry.id}`)}
          </Button>
        ))}
      </nav>
      <div className="flex flex-wrap gap-2">
        <Button nativeButton={false} render={<Link href={`/l/${readToken}/reserver`} />}>
          {t("reserveIdea")}
        </Button>
        <Button variant="ghost" nativeButton={false} render={<Link href={`/l/${readToken}/types`} />}>
          {t("types")}
        </Button>
      </div>
      {query.ok ? (
        <Alert>
          <AlertTitle>{t("reservedTitle")}</AlertTitle>
          <AlertDescription>{t("reservedBody")}</AlertDescription>
        </Alert>
      ) : null}
      <h2 className="text-lg font-medium">{heading}</h2>
      {groups.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{t("emptyHint")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-10">
          {groups.map((group) => (
            <section key={group.typeId} id={categoryAnchorId(group.typeId)} className="scroll-mt-6 flex flex-col gap-3">
              <h3 className="text-xl font-medium tracking-tight border-b-2 border-border pb-2">{group.label}</h3>
              {group.items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={toPublicItem(doc, item)}
                  readToken={readToken}
                  buyLink={t("buyLink")}
                  offerLabel={t("iOffer")}
                />
              ))}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
