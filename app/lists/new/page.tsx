import { redirect } from "next/navigation";
import { currentUser } from "../../../src/auth/current";
import { listDefaults, memberListTitles, numberedTitle } from "../../../src/domain/list-defaults";
import { getDocument } from "../../../src/store/db";
import { NewListForm } from "@/components/site/new-list-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocale, getTranslations } from "@/src/i18n/server";
import { withLocale } from "@/src/i18n/locale-path";

export default async function NewListPage() {
  const [user, t, locale] = await Promise.all([currentUser(), getTranslations("home"), getLocale()]);
  if (!user) redirect(withLocale(locale, "/login?next=/lists/new"));
  if (user.mustChangePassword) redirect(withLocale(locale, "/account"));

  // Suggested names, computed as on the server: the placeholder shows what an empty field gives.
  const defaults = listDefaults(user.displayName, t);
  const doc = await getDocument();
  const suggestedTitle = numberedTitle(defaults.titleBase, memberListTitles(doc.memberships, doc.wishlists, user.id));

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle as="h1">{t("newList.title")}</CardTitle>
          <CardDescription>{t("newList.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <NewListForm
            placeholders={{ title: suggestedTitle, category: defaults.category, person: defaults.person }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
