import { redirect } from "next/navigation";
import { currentUser } from "../../../src/auth/current";
import { createListAction } from "../../../src/server/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getTranslations, translateError } from "@/src/i18n/server";

export const dynamic = "force-dynamic";

export default async function NewListPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const [user, t, query] = await Promise.all([currentUser(), getTranslations("home"), searchParams]);
  if (!user) redirect("/connexion?next=/listes/new");
  if (user.mustChangePassword) redirect("/changer-mot-de-passe");
  const error = query.e ? await translateError(query.e) : null;
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("newList.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createListAction}>
            <FieldGroup>
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Field>
                <FieldLabel htmlFor="title">{t("newList.titleLabel")}</FieldLabel>
                <Input id="title" name="title" required />
              </Field>
              <Button type="submit">{t("newList.submit")}</Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
