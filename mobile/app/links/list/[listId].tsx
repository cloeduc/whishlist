import { Redirect, router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useMyLists } from "@/data/lists";
import { AuthLayout } from "@/features/account/AuthLayout";
import { SignInChoices } from "@/features/account/SignInChoices";
import { ListAccessHelp } from "@/features/lists/ListAccessHelp";
import { linkedListTarget } from "@/links/linked-list";
import { useResumableLink } from "@/links/pending";

/**
 * A list's management address (`/lists/<id>` on the site) opened in the app (026). Without a session,
 * the address is kept during sign-in (like an invitation). Signed in: a member goes to the list,
 * anyone else sees the help screen. The decision uses the account's lists, refreshed from the server
 * when possible, otherwise the local copy.
 */
export default function ListLink() {
  const { t } = useTranslation("mobile");
  const { listId, tab } = useLocalSearchParams<{ listId: string; tab?: string }>();
  const session = useResumableLink(`/links/list/${encodeURIComponent(listId)}${tab ? `?tab=${encodeURIComponent(tab)}` : ""}`);

  if (session.status === "mustChangePassword") return <Redirect href="/change-password" />;
  if (session.status !== "signedIn") {
    return (
      <SignInChoices
        title={t("links.listSignIn")}
        screenTestID="link-list.screen"
        registerTestID="link-list.register"
        loginTestID="link-list.login"
      />
    );
  }
  return <Decide listId={listId} tab={tab} />;
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
