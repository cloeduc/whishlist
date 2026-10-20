import Link from "next/link";
import { availableItems } from "../../../../src/domain/reserve";
import { reserveAction } from "../../../../src/server/actions";
import { getDocument } from "../../../../src/store/db";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { getTranslations, translateError } from "@/src/i18n/server";

export const dynamic = "force-dynamic";

export default async function ReserverPage({
  params,
  searchParams,
}: {
  params: Promise<{ readToken: string }>;
  searchParams: Promise<{ typeId?: string; itemId?: string; e?: string }>;
}) {
  const { readToken } = await params;
  const query = await searchParams;
  const [t, doc] = await Promise.all([getTranslations("public"), getDocument()]);
  const list = doc.wishlists.find((entry) => entry.readToken === readToken);
  if (!list) {
    return (
      <main>
        <h1 className="text-2xl font-medium tracking-tight">{t("missingList")}</h1>
      </main>
    );
  }
  const typeId = query.typeId ?? "";
  const types = doc.types.filter((type) => type.wishlistId === list.id);
  const choices = availableItems(doc, list.id, typeId);
  const picked = query.itemId
    ? choices.find((item) => item.id === query.itemId) ??
      doc.items.find((item) => item.id === query.itemId && item.wishlistId === list.id)
    : null;
  const pickedAvailable = picked ? choices.some((item) => item.id === picked.id) : false;
  const title = t("reserve.titleNamed", { title: list.title });
  const error = query.e ? await translateError(query.e) : null;
  return (
    <main className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight text-balance">{title}</h1>
        <Button variant="link" className="h-auto w-fit px-0" nativeButton={false} render={<Link href={`/l/${readToken}`} />}>
          {t("reserve.back")}
        </Button>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {query.itemId && !pickedAvailable ? (
        <Alert variant="destructive">
          <AlertDescription>{t("reserve.unavailable")}</AlertDescription>
        </Alert>
      ) : null}
      {pickedAvailable && picked ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("reserve.offerTitle", { name: picked.name })}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={reserveAction}>
              <FieldGroup>
                <input type="hidden" name="readToken" value={readToken} />
                <input type="hidden" name="typeId" value="" />
                <input type="hidden" name="itemId" value={picked.id} />
                <Field>
                  <FieldLabel htmlFor="fromName">{t("reserve.fromName")}</FieldLabel>
                  <Input id="fromName" name="fromName" autoComplete="name" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="note">{t("reserve.note")}</FieldLabel>
                  <Textarea id="note" name="note" />
                </Field>
                <Button type="submit">{t("reserve.submit")}</Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
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
          <Card>
            <CardHeader>
              <CardTitle>{t("reserve.giftTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={reserveAction}>
                <FieldGroup>
                  <input type="hidden" name="readToken" value={readToken} />
                  <input type="hidden" name="typeId" value={typeId} />
                  <Field>
                    <FieldLabel htmlFor="itemId">{t("reserve.giftLabel")}</FieldLabel>
                    <NativeSelect id="itemId" name="itemId" className="w-full" required defaultValue="">
                      <NativeSelectOption value="" disabled>
                        {t("reserve.choose")}
                      </NativeSelectOption>
                      {choices.map((item) => (
                        <NativeSelectOption key={item.id} value={item.id}>
                          {item.name}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="fromName">{t("reserve.fromName")}</FieldLabel>
                    <Input id="fromName" name="fromName" autoComplete="name" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="note">{t("reserve.note")}</FieldLabel>
                    <Textarea id="note" name="note" />
                  </Field>
                  <Button type="submit">{t("reserve.submit")}</Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
