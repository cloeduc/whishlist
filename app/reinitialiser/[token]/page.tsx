import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findValidPasswordReset } from "../../../src/domain/password-reset";
import { getDocument } from "../../../src/store/db";
import { LinkButton } from "@/components/site/link-button";
import { ResetPasswordForm } from "@/components/site/reset-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "@/src/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return {
    title: t("reset.metaTitle"),
    description: t("reset.metaDescription"),
  };
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [t, doc] = await Promise.all([getTranslations("auth"), getDocument()]);
  if (!findValidPasswordReset(doc, token)) notFound();

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle as="h1">{t("reset.title")}</CardTitle>
          <CardDescription>{t("reset.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm token={token} />
        </CardContent>
      </Card>
      <LinkButton href="/mot-de-passe-oublie" variant="link">
        {t("reset.newLink")}
      </LinkButton>
    </main>
  );
}
