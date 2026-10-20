import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "../../../src/auth/current";
import { joinInviteAction } from "../../../src/server/actions";
import { getDocument } from "../../../src/store/db";
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
  const [t, user, doc] = await Promise.all([getTranslations("public"), currentUser(), getDocument()]);
  if (user?.mustChangePassword) redirect("/compte");
  const list = doc.wishlists.find((entry) => entry.inviteToken === token);
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
      <h1 className="text-2xl font-medium tracking-tight">
        {t("invite.joinTitle", { title: list?.title ?? "…" })}
      </h1>
      {list ? <p className="text-muted-foreground">{t("invite.joinHint")}</p> : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </main>
  );
}
