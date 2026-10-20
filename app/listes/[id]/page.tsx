import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser, origin } from "../../../src/auth/current";
import { findMembership } from "../../../src/domain/access";
import { listOffrir } from "../../../src/domain/offrir";
import { formatPrice } from "../../../src/domain/price";
import { IdeasKanban } from "@/components/site/ideas-kanban";
import { ItemForm } from "@/components/site/item-form";
import { LabelChips } from "@/components/site/label-chips";
import {
  cancelReservationAction,
  clearReadPasswordAction,
  deleteItemAction,
  deleteListAction,
  leaveAction,
  regenerateInviteAction,
  removeMemberAction,
  sendInviteAction,
  setItemArchivedFormAction,
  setReadPasswordAction,
} from "../../../src/server/actions";
import { hasReadPassword, MIN_READ_PASSWORD_LENGTH } from "../../../src/domain/read-password";
import { resolveTheme } from "../../../src/domain/theme";
import { getDocument } from "../../../src/store/db";
import { AppearanceForm } from "@/components/site/appearance-form";
import { CopyLinkField } from "@/components/site/copy-link-field";
import { LiveGiftMark } from "@/components/site/live-gift-mark";
import { WishlistThemeScope } from "@/components/site/wishlist-theme-scope";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getTranslations, translateError } from "@/src/i18n/server";

export const dynamic = "force-dynamic";

const TAB_IDS = ["idees", "archives", "reservations", "partage", "reglages"] as const;
type TabId = (typeof TAB_IDS)[number];

function parseTab(value: string | undefined): TabId {
  if (value === "categories") return "reglages";
  return TAB_IDS.includes(value as TabId) ? (value as TabId) : "idees";
}

function tabHref(listId: string, tab: TabId): string {
  return tab === "idees" ? `/listes/${listId}` : `/listes/${listId}?onglet=${tab}`;
}

function euros(cents: number | null): string {
  if (cents === null) return "";
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

export default async function EditListPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ e?: string; ok?: string; onglet?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const tab = parseTab(query.onglet);
  const [t, tErrors, user, doc] = await Promise.all([
    getTranslations("list"),
    getTranslations("errors"),
    currentUser(),
    getDocument(),
  ]);
  if (!user) redirect(`/connexion?next=/listes/${id}`);
  if (user.mustChangePassword) redirect("/compte");
  const list = doc.wishlists.find((entry) => entry.id === id);
  if (!list) notFound();
  const membership = findMembership(doc, id, user.id);
  if (!membership) {
    return (
      <main className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">{tErrors("accessDenied")}</h1>
        <p className="text-muted-foreground">{tErrors("notMember")}</p>
      </main>
    );
  }
  const base = await origin();
  const readUrl = `${base}/l/${list.readToken}`;
  const inviteUrl = `${base}/inviter/${list.inviteToken}`;
  const types = doc.types.filter((type) => type.wishlistId === id);
  const people = doc.people.filter((person) => person.wishlistId === id);
  const items = doc.items.filter((item) => item.wishlistId === id).sort((a, b) => a.sortOrder - b.sortOrder);
  const activeItems = items.filter((item) => !item.archived);
  const archivedItems = items.filter((item) => item.archived);
  const members = doc.memberships
    .filter((entry) => entry.wishlistId === id)
    .map((entry) => ({ ...entry, user: doc.users.find((account) => account.id === entry.userId) }));
  const reservations = listOffrir(doc, id);
  const personLabel = new Map(people.map((person) => [person.id, person.label]));
  const typeLabel = new Map(types.map((type) => [type.id, type.label]));
  const kanbanItems = activeItems.map((item) => ({
    id: item.id,
    name: item.name,
    typeId: item.typeId,
    personId: item.personId,
    personLabel: personLabel.get(item.personId) ?? item.personId,
    url: item.url,
    imageUrl: item.imageUrl,
    priceLabel: formatPrice(item.priceCents),
    price: euros(item.priceCents),
    priority: item.priority,
    sortOrder: item.sortOrder,
  }));
  const error = query.e ? await translateError(query.e) : null;
  const theme = resolveTheme(list.theme);
  return (
    <WishlistThemeScope theme={theme}>
    <main className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <LiveGiftMark className="size-12" />
          <h1 className="text-2xl font-medium tracking-tight">{list.title}</h1>
        </div>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={readUrl} />}>
          {t("viewAsGuest")}
        </Button>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {query.ok === "invite" ? (
        <Alert>
          <AlertDescription>{t("inviteSent")}</AlertDescription>
        </Alert>
      ) : null}
      {query.ok === "readPassword" ? (
        <Alert>
          <AlertDescription>{t("share.readPasswordSaved")}</AlertDescription>
        </Alert>
      ) : null}
      {query.ok === "readPasswordCleared" ? (
        <Alert>
          <AlertDescription>{t("share.readPasswordCleared")}</AlertDescription>
        </Alert>
      ) : null}
      <nav aria-label={t("tabs.navLabel")} className="flex flex-wrap gap-2">
        {TAB_IDS.map((entry) => (
          <Button
            key={entry}
            size="sm"
            className="h-auto max-w-full whitespace-normal text-left"
            variant={tab === entry ? "default" : "outline"}
            nativeButton={false}
            render={
              <Link href={tabHref(id, entry)} aria-current={tab === entry ? "true" : undefined} />
            }
          >
            {t(`tabs.${entry}`)}
            {entry === "reservations" && reservations.length > 0 ? ` (${reservations.length})` : null}
            {entry === "idees" ? ` (${activeItems.length})` : null}
            {entry === "archives" && archivedItems.length > 0 ? ` (${archivedItems.length})` : null}
          </Button>
        ))}
      </nav>

      {tab === "idees" ? (
        <div className="flex flex-col gap-6">
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>{t("addIdea")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ItemForm wishlistId={id} types={types} people={people} onglet="idees" />
            </CardContent>
          </Card>
          <div className="relative left-1/2 w-screen -translate-x-1/2 px-4">
            <IdeasKanban
              wishlistId={id}
              types={types.map((type) => ({ id: type.id, label: type.label }))}
              people={people.map((person) => ({ id: person.id, label: person.label }))}
              items={kanbanItems}
            />
          </div>
        </div>
      ) : null}

      {tab === "archives" ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">{t("archives.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("archives.hint")}</p>
          {archivedItems.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{t("archives.empty")}</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            archivedItems.map((item) => (
              <Card key={item.id} size="sm">
                <CardHeader>
                  <CardTitle className="text-balance">{item.name}</CardTitle>
                  <CardDescription className="flex flex-wrap gap-1">
                    <Badge variant="secondary">{typeLabel.get(item.typeId) ?? item.typeId}</Badge>
                    <Badge variant="outline">{personLabel.get(item.personId) ?? item.personId}</Badge>
                    {item.priceCents !== null ? <Badge variant="outline">{formatPrice(item.priceCents)}</Badge> : null}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <form action={setItemArchivedFormAction}>
                    <input type="hidden" name="wishlistId" value={id} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="archived" value="0" />
                    <input type="hidden" name="onglet" value="archives" />
                    <Button type="submit" variant="outline" size="sm">
                      {t("archives.restore")}
                    </Button>
                  </form>
                  <form action={deleteItemAction}>
                    <input type="hidden" name="wishlistId" value={id} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="onglet" value="archives" />
                    <Button type="submit" variant="destructive" size="sm">
                      {t("archives.deleteForever")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      ) : null}

      {tab === "reservations" ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">{t("reservations.title")}</h2>
          {reservations.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{t("reservations.empty")}</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            reservations.map((row) => (
              <Card key={row.reservationId} size="sm">
                <CardHeader>
                  <CardTitle className="text-balance">{row.itemName}</CardTitle>
                  {row.typeLabel ? (
                    <CardDescription>
                      <Badge variant="secondary">{row.typeLabel}</Badge>
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="flex flex-col items-start gap-3">
                  {row.fromName ? <p>{t("reservations.from", { name: row.fromName })}</p> : null}
                  {row.note ? <p className="text-muted-foreground">{row.note}</p> : null}
                  <form action={cancelReservationAction}>
                    <input type="hidden" name="wishlistId" value={id} />
                    <input type="hidden" name="reservationId" value={row.reservationId} />
                    <input type="hidden" name="onglet" value="reservations" />
                    <Button type="submit" variant="outline" size="sm">
                      {t("reservations.cancel")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      ) : null}

      {tab === "partage" ? (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("share.title")}</CardTitle>
              <CardDescription>{t("share.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <CopyLinkField id="read-url" label={t("share.readLink")} value={readUrl} />
                <CopyLinkField
                  id="invite-url"
                  label={t("share.inviteLink")}
                  value={inviteUrl}
                  hint={t("share.inviteHint")}
                />
                <form action={sendInviteAction} className="flex flex-col gap-3">
                  <input type="hidden" name="wishlistId" value={id} />
                  <input type="hidden" name="onglet" value="partage" />
                  <Field>
                    <FieldLabel htmlFor="invite-email">{t("share.inviteEmail")}</FieldLabel>
                    <Input
                      id="invite-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="prenom@exemple.fr"
                    />
                    <FieldDescription>{t("share.inviteEmailHint")}</FieldDescription>
                  </Field>
                  <Button type="submit">{t("share.sendInvite")}</Button>
                </form>
                {membership.role === "owner" ? (
                  <form action={regenerateInviteAction}>
                    <input type="hidden" name="wishlistId" value={id} />
                    <input type="hidden" name="onglet" value="partage" />
                    <Button type="submit" variant="outline">
                      {t("share.regenerate")}
                    </Button>
                  </form>
                ) : null}
              </FieldGroup>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("share.readPassword")}</CardTitle>
              <CardDescription>{t("share.readPasswordHint")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                {hasReadPassword(list) ? t("share.readPasswordSet") : t("share.readPasswordUnset")}
              </p>
              <form action={setReadPasswordAction}>
                <FieldGroup>
                  <input type="hidden" name="wishlistId" value={id} />
                  <input type="hidden" name="onglet" value="partage" />
                  <Field>
                    <FieldLabel htmlFor="read-password">{t("share.readPasswordLabel")}</FieldLabel>
                    <Input
                      id="read-password"
                      name="password"
                      type="password"
                      required
                      minLength={MIN_READ_PASSWORD_LENGTH}
                      autoComplete="new-password"
                    />
                  </Field>
                  <Button type="submit">{t("share.readPasswordSave")}</Button>
                </FieldGroup>
              </form>
              {hasReadPassword(list) ? (
                <form action={clearReadPasswordAction}>
                  <input type="hidden" name="wishlistId" value={id} />
                  <input type="hidden" name="onglet" value="partage" />
                  <Button type="submit" variant="outline">
                    {t("share.readPasswordClear")}
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("share.members")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {members.map((member) => (
                <div key={member.userId} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    {member.user?.displayName}
                    {member.role === "owner" ? <Badge variant="secondary">{t("share.owner")}</Badge> : null}
                  </span>
                  {membership.role === "owner" && member.userId !== user.id ? (
                    <form action={removeMemberAction}>
                      <input type="hidden" name="wishlistId" value={id} />
                      <input type="hidden" name="userId" value={member.userId} />
                      <input type="hidden" name="onglet" value="partage" />
                      <Button type="submit" variant="outline" size="sm">
                        {t("share.remove")}
                      </Button>
                    </form>
                  ) : null}
                </div>
              ))}
              <form action={leaveAction} className="pt-2">
                <input type="hidden" name="wishlistId" value={id} />
                <input type="hidden" name="onglet" value="partage" />
                <Button type="submit" variant="outline">
                  {t("share.leave")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "reglages" ? (
        <div className="flex max-w-3xl flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("categories.types")}</CardTitle>
              <CardDescription>{t("categories.typesHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              <LabelChips
                wishlistId={id}
                kind="type"
                items={types.map((type) => ({ id: type.id, label: type.label }))}
                addPlaceholder={t("categories.newTypePlaceholder")}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("categories.people")}</CardTitle>
              <CardDescription>{t("categories.peopleHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              <LabelChips
                wishlistId={id}
                kind="person"
                items={people.map((person) => ({ id: person.id, label: person.label }))}
                addPlaceholder={t("categories.newPersonPlaceholder")}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.appearance")}</CardTitle>
              <CardDescription>{t("settings.appearanceHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              <AppearanceForm
                wishlistId={id}
                title={list.title}
                subtitle={list.subtitle}
                coverImageUrl={list.coverImageUrl}
                theme={theme}
              />
            </CardContent>
          </Card>
          {membership.role === "owner" ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.danger")}</CardTitle>
                <CardDescription>{t("settings.dangerHint")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={deleteListAction}>
                  <input type="hidden" name="wishlistId" value={id} />
                  <input type="hidden" name="onglet" value="reglages" />
                  <Button type="submit" variant="destructive">
                    {t("settings.delete")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </main>
    </WishlistThemeScope>
  );
}
