import Link from "next/link";
import { currentUser } from "../../../src/auth/current";
import { canAccessPublicList } from "../../../src/auth/public-list";
import { listClaimedReservationIds } from "../../../src/auth/reservation-claim";
import {
  applyBudget,
  applyPerson,
  BUDGETS,
  categoryAnchorId,
  groupByCategory,
  parseBudget,
  sortByPriority,
  type BudgetId,
} from "../../../src/domain/filters";
import {
  listPublicVisibleItems,
  mineReservationIdsFor,
  toPublicItem,
} from "../../../src/domain/read";
import { resolveTheme, themeToCssVars } from "../../../src/domain/theme";
import { getDocument } from "../../../src/store/db";
import { PublicItemCard } from "@/components/site/public-item-card";
import { ReadUnlockForm } from "@/components/site/read-unlock-form";
import { WishlistCover } from "@/components/site/wishlist-cover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { intlLocale } from "@/src/i18n/config";
import { getLocale, getTranslations } from "@/src/i18n/server";
import type { CSSProperties } from "react";

function unlockErrorMessage(
  e: string | undefined,
  t: (key: string) => string,
): string | null {
  if (e === "bad" || e === "badPassword") return t("unlock.badPassword");
  if (e === "rate" || e === "rateLimited") return t("unlock.rateLimited");
  return null;
}

export const dynamic = "force-dynamic";

function listHref(readToken: string, qui: string | null, budget: BudgetId | null, hash?: string): string {
  const params = new URLSearchParams();
  if (qui) params.set("qui", qui);
  if (budget) params.set("budget", budget);
  const query = params.toString();
  const path = query ? `/l/${readToken}?${query}` : `/l/${readToken}`;
  return hash ? `${path}#${hash}` : path;
}

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: Promise<{ readToken: string }>;
  searchParams: Promise<{ qui?: string; budget?: string; ok?: string; e?: string }>;
}) {
  const { readToken } = await params;
  const query = await searchParams;
  const [t, locale, doc, user, claimedIds] = await Promise.all([
    getTranslations("public"),
    getLocale(),
    getDocument(),
    currentUser(),
    listClaimedReservationIds(readToken),
  ]);
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
        error={unlockErrorMessage(query.e, t)}
      />
    );
  }
  const mineIds = mineReservationIdsFor(doc, list.id, user?.id ?? null, claimedIds);
  const types = doc.types.filter((type) => type.wishlistId === list.id);
  const people = doc.people.filter((person) => person.wishlistId === list.id);
  const qui = people.some((person) => person.id === query.qui) ? query.qui! : null;
  const budget = parseBudget(query.budget);
  const priceLocale = intlLocale(locale);
  const visible = listPublicVisibleItems(doc, list.id, mineIds);
  const filtered = sortByPriority(applyBudget(applyPerson(visible, qui), budget));
  const groups = groupByCategory(
    filtered,
    types,
  ).map((group) => ({
    ...group,
    publicItems: group.items.map((item) => toPublicItem(doc, item, priceLocale, mineIds)),
  }));
  groups.sort((a, b) => a.label.localeCompare(b.label, locale));
  const allLabel = t("allList");
  const personLabel = people.find((person) => person.id === qui)?.label;
  const budgetLabel = budget ? t(`budgets.${budget}`) : null;
  const heading = [allLabel, personLabel, budgetLabel].filter(Boolean).join(" · ");
  const emptyTitle = qui || budget ? t("emptyFiltered") : t("emptyList");
  const emptyHint = qui || budget ? t("emptyHint") : t("emptyListHint");
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
          <p className="text-muted-foreground text-pretty text-sm">{t("intro")}</p>
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
            <EmptyDescription>{emptyHint}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-10">
          {groups.map((group) => (
            <section key={group.typeId} id={categoryAnchorId(group.typeId)} className="scroll-mt-6 flex flex-col gap-3">
              <h3 className="text-xl font-medium tracking-tight border-b-2 border-border pb-2">{group.label}</h3>
              {group.publicItems.map((item) => (
                <PublicItemCard
                  key={item.id}
                  item={item}
                  readToken={readToken}
                  buyLink={t("buyLink")}
                  buyLinkAria={t("buyLinkAria", { name: item.name })}
                  offerLabel={t("iOffer")}
                  mineLabel={t("reservation.mine")}
                  cancelLabel={t("reservation.cancel")}
                  cancelTitle={t("reservation.cancelTitle")}
                  cancelDescription={t("reservation.cancelBody")}
                  cancelConfirm={t("reservation.cancelConfirm")}
                  cancelKeep={t("reservation.cancelKeep")}
                />
              ))}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
