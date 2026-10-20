import Link from "next/link";
import { requestPasswordResetAction } from "../../src/server/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getTranslations } from "@/src/i18n/server";

export const dynamic = "force-dynamic";

export default async function MotDePasseOubliePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; lien?: string; sansmail?: string }>;
}) {
  const query = await searchParams;
  const t = await getTranslations("auth");
  const done = query.ok === "1";
  const lien = query.lien && query.lien.startsWith("http") ? query.lien : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("forgot.title")}</CardTitle>
          <CardDescription>{t("forgot.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="flex flex-col gap-3">
              <Alert>
                <AlertDescription>{t("forgot.sent")}</AlertDescription>
              </Alert>
              {query.sansmail === "1" && !lien ? (
                <p className="text-sm text-muted-foreground">{t("forgot.noMail")}</p>
              ) : null}
              {lien ? (
                <Alert>
                  <AlertDescription className="flex flex-col gap-2">
                    <span>{t("forgot.devLink")}</span>
                    <Link href={lien} className="break-all underline underline-offset-2">
                      {lien}
                    </Link>
                  </AlertDescription>
                </Alert>
              ) : null}
              <Button variant="outline" nativeButton={false} render={<Link href="/connexion" />}>
                {t("forgot.back")}
              </Button>
            </div>
          ) : (
            <form action={requestPasswordResetAction}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">{t("forgot.email")}</FieldLabel>
                  <Input id="email" name="email" type="email" required autoComplete="email" />
                </Field>
                <Button type="submit">{t("forgot.submit")}</Button>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
      {!done ? (
        <Button variant="link" nativeButton={false} render={<Link href="/connexion" />}>
          {t("forgot.back")}
        </Button>
      ) : null}
    </main>
  );
}
