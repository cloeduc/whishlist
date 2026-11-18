import { currentUser } from "../../../src/auth/current";
import { canAccessPublicList } from "../../../src/auth/public-list";
import { listClaimedReservationIds } from "../../../src/auth/reservation-claim";
import { findGroupGiftByToken, groupGiftDetail } from "../../../src/domain/group-gift";
import { formatPrice } from "../../../src/domain/price";
import { getDocument } from "../../../src/store/db";
import { leaveGroupGiftAction } from "../../../src/server/actions";
import { ConfirmForm } from "@/components/site/confirm-form";
import { GroupGiftJoinForm } from "@/components/site/group-gift-join-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { intlLocale } from "@/src/i18n/config";
import { getLocale, getTranslations, translateError } from "@/src/i18n/server";
import { groupGiftSummaryText } from "@/src/site/group-gift-text";
import { ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";

/**
 * Page of a group gift (028), reached by its own link: the idea and the list's title only,
 * never the list's read link nor its other ideas.
 */
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const [t, doc] = await Promise.all([getTranslations("public"), getDocument()]);
  const gift = findGroupGiftByToken(doc, token);
  const item = gift ? doc.items.find((entry) => entry.id === gift.itemId) : undefined;
  return {
    title: item ? t("groupGift.pageTitle", { name: item.name }) : t("groupGift.missing"),
    robots: { index: false, follow: false },
  };
}

export default async function GroupGiftPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ ok?: string; e?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const [t, locale, doc, user] = await Promise.all([
    getTranslations("public"),
    getLocale(),
    getDocument(),
    currentUser(),
  ]);
  const gift = findGroupGiftByToken(doc, token);
  const list = gift ? doc.wishlists.find((entry) => entry.id === gift.wishlistId) : undefined;
  if (!gift || !list) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{t("groupGift.missing")}</EmptyTitle>
          <EmptyDescription>{t("groupGift.missingHint")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  if (!(await canAccessPublicList(doc, list, user))) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{t("unlock.heading")}</EmptyTitle>
          <EmptyDescription>{t("unlock.description")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  const account = user && !user.mustChangePassword ? user : null;
  const claimedIds = await listClaimedReservationIds(list.readToken);
  const priceLocale = intlLocale(locale);
  const detail = groupGiftDetail(doc, gift, { userId: account?.id ?? null, claimedIds }, priceLocale);
  const price = (cents: number | null) => formatPrice(cents, priceLocale);
  const pageError = query.e ? await translateError(query.e) : null;
  const { item } = detail;
  return (
    <main className="flex flex-col gap-6">
      {query.ok === "1" && detail.me ? (
        <Alert>
          <AlertTitle>{t("groupGift.joinedTitle")}</AlertTitle>
          <AlertDescription>{t("groupGift.joinedBody")}</AlertDescription>
        </Alert>
      ) : null}
      {pageError ? (
        <Alert variant="destructive">
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="size-28 shrink-0 rounded-base border-2 border-border object-cover shadow-shadow"
            referrerPolicy="no-referrer"
          />
        ) : null}
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{t("groupGift.badge")}</Badge>
            {detail.me ? <Badge variant="secondary">{t("groupGift.mine")}</Badge> : null}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">{item.name}</h1>
          <p className="text-muted-foreground text-pretty">{t("groupGift.fromList", { title: detail.listTitle })}</p>
          {item.priceLabel ? <p className="text-2xl leading-none font-bold tabular-nums">{item.priceLabel}</p> : null}
          {item.description ? (
            <p className="text-sm break-words whitespace-pre-line text-pretty">{item.description}</p>
          ) : null}
          {item.secondHandOk ? (
            <div>
              <Badge variant="outline">{t("secondHandBadge")}</Badge>
            </div>
          ) : null}
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("buyLinkAria", { name: item.name })}
              className="inline-flex w-fit items-center gap-1 text-sm underline underline-offset-2"
            >
              <ExternalLinkIcon className="size-3.5" aria-hidden />
              {t("buyLink")}
            </a>
          ) : null}
        </div>
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle>{groupGiftSummaryText(t, detail, priceLocale)}</CardTitle>
          <CardDescription>{t("groupGift.totalLine", { amount: price(detail.totalCents) })}</CardDescription>
        </CardHeader>
        <CardContent>
          <h2 className="mb-2 text-base font-medium">{t("groupGift.participantsTitle")}</h2>
          <ul className="flex flex-col gap-2">
            {detail.participations
              ? detail.participations.map((participation, index) => (
                  <li key={participation.reservationId ?? index} className="flex flex-col gap-0.5 text-sm">
                    <span className="font-medium">
                      {participation.name ?? t("groupGift.anonymous")}
                      {" · "}
                      {participation.amountCents !== null
                        ? price(participation.amountCents)
                        : t("groupGift.amountUnknown")}
                    </span>
                    {participation.note ? (
                      <span className="break-words whitespace-pre-line text-muted-foreground">{participation.note}</span>
                    ) : null}
                  </li>
                ))
              : detail.participantNames.map((name, index) => (
                  <li key={index} className="text-sm">
                    {name ?? t("groupGift.anonymous")}
                  </li>
                ))}
          </ul>
        </CardContent>
      </Card>

      {detail.me?.reservationId ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("groupGift.yourPart")}</CardTitle>
            <CardDescription>
              {detail.me.amountCents !== null
                ? t("groupGift.yourAmount", { amount: price(detail.me.amountCents) })
                : t("groupGift.amountUnknown")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConfirmForm
              title={t("groupGift.leaveTitle")}
              description={t("groupGift.leaveBody")}
              confirmLabel={t("groupGift.leaveConfirm")}
              cancelLabel={t("groupGift.leaveKeep")}
              action={leaveGroupGiftAction}
              fields={{ token, reservationId: detail.me.reservationId }}
              triggerLabel={t("groupGift.leave")}
              triggerVariant="outline"
              triggerSize="sm"
              confirmVariant="destructive"
            />
          </CardContent>
        </Card>
      ) : detail.status === "open" ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("groupGift.joinTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <GroupGiftJoinForm token={token} />
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
