import { Redirect, router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { useSession } from "@/auth/session";
import { useMyLists } from "@/data/lists";
import { AuthLayout } from "@/features/account/AuthLayout";
import { ListAccessHelp } from "@/features/lists/ListAccessHelp";
import { linkedListTarget } from "@/links/linked-list";
import { clearPendingLink, setPendingLink } from "@/links/pending";
import { tokens } from "@/theme/tokens";
import { Button } from "@/ui/Button";

/**
 * A list's management address (`/lists/<id>` on the site) opened in the app (026). Without a session,
 * the address is kept during sign-in (like an invitation). Signed in: a member goes to the list,
 * anyone else sees the help screen. The decision uses the account's lists, refreshed from the server
 * when possible, otherwise the local copy.
 */
export default function ListLink() {
  const { listId, tab } = useLocalSearchParams<{ listId: string; tab?: string }>();
  const session = useSession();
  const self = `/links/list/${encodeURIComponent(listId)}${tab ? `?tab=${encodeURIComponent(tab)}` : ""}`;

  const signedIn = session.status === "signedIn";
  useEffect(() => {
    if (session.status === "signedOut" || session.status === "mustChangePassword") setPendingLink(self);
    else if (signedIn) clearPendingLink();
  }, [session.status, signedIn, self]);

  if (session.status === "mustChangePassword") return <Redirect href="/change-password" />;
  if (!signedIn) return <SignInFirst />;
  return <Decide listId={listId} tab={tab} />;
}

function SignInFirst() {
  const { t } = useTranslation(["public", "mobile"]);
  return (
    <AuthLayout title={t("mobile:links.listSignIn")} testID="link-list.screen">
      <View style={{ gap: tokens.space[2] }}>
        <Button testID="link-list.login" title={t("public:invite.login")} fullWidth onPress={() => router.push("/login")} />
        <Button
          testID="link-list.register"
          title={t("public:invite.register")}
          variant="neutral"
          fullWidth
          onPress={() => router.push("/register")}
        />
      </View>
    </AuthLayout>
  );
}

function Decide({ listId, tab }: { listId: string; tab?: string }) {
  const { t } = useTranslation("mobile");
  const { lists, subscriptions, settled } = useMyLists();
  const target = settled ? linkedListTarget(listId, tab, { lists, subscriptions }) : null;
  const screenPath = target?.kind === "screen" ? target.path : null;

  useEffect(() => {
    if (screenPath) router.replace(screenPath as Href);
  }, [screenPath]);

  if (target?.kind === "help") return <ListAccessHelp followedReadToken={target.followedReadToken} />;
  return (
    <AuthLayout title={t("links.listChecking")} testID="link-list.loading">
      {null}
    </AuthLayout>
  );
}
