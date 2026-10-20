import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "../../../src/auth/current";
import { joinInviteAction } from "../../../src/server/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getTranslations, translateError } from "@/src/i18n/server";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const [t, user] = await Promise.all([getTranslations("public"), currentUser()]);
  if (user?.mustChangePassword) redirect("/compte");
  const back = `/inviter/${token}`;
  if (!user) {
    return (
      <main className="flex max-w-xl flex-col gap-4">
        <h1 className="text-2xl font-medium tracking-tight">{t("invite.title")}</h1>
        <p className="text-muted-foreground">{t("invite.body")}</p>
        <div className="flex flex-wrap gap-2">
          <Button nativeButton={false} render={<Link href={`/inscription?next=${encodeURIComponent(back)}`} />}>
            {t("invite.register")}
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href={`/connexion?next=${encodeURIComponent(back)}`} />}>
            {t("invite.login")}
          </Button>
        </div>
      </main>
    );
  }
  if (!query.e) await joinInviteAction(token);
  const error = query.e ? await translateError(query.e) : null;
  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-medium tracking-tight">{t("invite.joinTitle")}</h1>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </main>
  );
}
