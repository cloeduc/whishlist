import { currentUser } from "../../../../src/auth/current";
import { canAccessPublicList } from "../../../../src/auth/public-list";
import { availableItems } from "../../../../src/domain/reserve";
import { getDocument } from "../../../../src/store/db";
import { LinkButton } from "@/components/site/link-button";
import { ReadUnlockForm } from "@/components/site/read-unlock-form";
import { ReservationForm } from "@/components/site/reservation-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { getTranslations } from "@/src/i18n/server";

export default async function ReservePage({
  params,
  searchParams,
}: {
  params: Promise<{ readToken: string }>;
  searchParams: Promise<{ typeId?: string; itemId?: string }>;
}) {
  const { readToken } = await params;
  const query = await searchParams;
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
  const typeId = query.typeId ?? "";
  const types = doc.types.filter((type) => type.wishlistId === list.id);
  const choices = availableItems(doc, list.id, typeId);
  const picked = query.itemId
    ? choices.find((item) => item.id === query.itemId) ??
      doc.items.find((item) => item.id === query.itemId && item.wishlistId === list.id)
    : null;
  const offer = picked && choices.some((item) => item.id === picked.id) ? picked : null;
  return (
    <main className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight text-balance">{t("reserve.title")}</h1>
        <p className="text-muted-foreground text-pretty">{t("reserve.listContext", { title: list.title })}</p>
        <LinkButton href={`/l/${readToken}`} variant="link" className="h-auto w-fit px-0">
          {t("reserve.back")}
        </LinkButton>
      </div>
      {query.itemId && !offer ? (
        <Alert variant="destructive">
          <AlertDescription>{t("reserve.unavailable")}</AlertDescription>
        </Alert>
      ) : null}
      {offer ? null : (
        <Card>
          <CardHeader>
            <CardTitle>{t("reserve.typeTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="get">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="typeId">{t("reserve.filterLabel")}</FieldLabel>
                  <NativeSelect id="typeId" name="typeId" className="w-full" defaultValue={typeId}>
                    <NativeSelectOption value="">{t("reserve.allTypes")}</NativeSelectOption>
                    {types.map((type) => (
                      <NativeSelectOption key={type.id} value={type.id}>
                        {type.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Button type="submit" variant="outline">
                  {t("reserve.filterSubmit")}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      )}
      {/* One form, at the same place in the tree for both variants: when the picked idea is taken
          meanwhile, the refused action refreshes the page into the list of choices, and the form
          keeps what was typed; the notice above already says why, so the form does not repeat it. */}
      <Card>
        {offer ? (
          <CardHeader>
            <CardTitle>{t("reserve.offerTitle", { name: offer.name })}</CardTitle>
          </CardHeader>
        ) : null}
        <CardContent className={offer ? undefined : "pt-6"}>
          <ReservationForm
            readToken={readToken}
            typeId={offer ? "" : typeId}
            itemId={offer ? offer.id : null}
            choices={offer ? [] : choices.map((item) => ({ id: item.id, name: item.name }))}
            unavailableShown={Boolean(query.itemId) && !offer}
          />
        </CardContent>
      </Card>
    </main>
  );
}
