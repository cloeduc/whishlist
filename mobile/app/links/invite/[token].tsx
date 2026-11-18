import { Redirect, router, useLocalSearchParams, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api, NetworkError, ok } from "@/api/client";
import { refreshList, refreshLists } from "@/data/lists";
import { AuthLayout } from "@/features/account/AuthLayout";
import { SignInChoices } from "@/features/account/SignInChoices";
import { VerificationBanner } from "@/features/account/VerificationBanner";
import { errorText, useServerAction } from "@/features/errors";
import { useResumableLink } from "@/links/pending";
import { useOnline } from "@/network";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { NetworkNote } from "@/ui/NetworkNote";
import { Text } from "@/ui/Text";

type Preview =
  | { status: "loading" }
  | { status: "ready"; title: string }
  | { status: "failed"; message: string; retry: boolean };

/**
 * Invite link opened in the app (011, US2), like the site's `/invite/{token}`. Without a session, the link
 * is kept during sign-in or sign-up, then the screen comes back here (R5). Signed in: the title of
 * the list and « Rejoindre »; an account that is already a member goes straight to the list.
 */
export default function InviteLink() {
  const { t } = useTranslation(["public", "auth", "mobile"]);
  const { token } = useLocalSearchParams<{ token: string }>();
  const online = useOnline();
  const session = useResumableLink(`/links/invite/${encodeURIComponent(token)}`);
  const [preview, setPreview] = useState<Preview>({ status: "loading" });

  const openList = useCallback(async (listId: string) => {
    await refreshLists();
    await refreshList(listId);
    router.replace(`/lists/${listId}` as Href);
  }, []);

  const signedIn = session.status === "signedIn";

  // Read on open once signed in, and on each « Réessayer ». The initial state is « loading ».
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    void (async () => {
      try {
        const answer = await ok(api.GET("/invitations/{inviteToken}", { params: { path: { inviteToken: token } } }));
        if (!active) return;
        if (answer.listId) await openList(answer.listId);
        else setPreview({ status: "ready", title: answer.title });
      } catch (error) {
        if (active) setPreview({ status: "failed", message: errorText(error), retry: error instanceof NetworkError });
      }
    })();
    return () => {
      active = false;
    };
  }, [signedIn, token, openList, attempt]);

  const join = useServerAction(
    useCallback(async () => {
      const list = await ok(api.POST("/invitations/{inviteToken}/accept", { params: { path: { inviteToken: token } } }));
      await openList(list.id);
    }, [token, openList]),
  );

  if (session.status === "mustChangePassword") return <Redirect href="/change-password" />;

  if (!signedIn) {
    return (
      <SignInChoices
        title={t("public:invite.title")}
        description={t("public:invite.body")}
        screenTestID="invite.screen"
        registerTestID="invite.register"
        loginTestID="invite.login"
      />
    );
  }

  if (preview.status !== "ready") {
    return (
      <AuthLayout title={t("public:invite.title")} testID="invite.screen">
        {preview.status === "loading" ? <Text>{t("mobile:links.inviteChecking")}</Text> : null}
        {preview.status === "failed" ? (
          <>
            <Alert testID="invite.error" variant="destructive">
              {preview.message}
            </Alert>
            {preview.retry ? (
              <Button testID="invite.retry" title={t("mobile:retry")} variant="neutral" onPress={() => {
                  setPreview({ status: "loading" });
                  setAttempt((count) => count + 1);
                }}
              />
            ) : (
              <Button testID="invite.home" title={t("auth:confirmEmail.myLists")} variant="neutral" onPress={() => router.replace("/")} />
            )}
          </>
        ) : null}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t("public:invite.joinTitle", { title: preview.title })}
      description={t("public:invite.joinHint")}
      testID="invite.screen"
    >
      {join.error ? (
        <Alert testID="invite.join-error" variant="destructive">
          {join.error}
        </Alert>
      ) : null}
      <VerificationBanner />
      <Button
        testID="invite.join"
        title={t("public:invite.join")}
        fullWidth
        disabled={!online || join.busy}
        onPress={() => void join.run()}
      />
      <NetworkNote />
    </AuthLayout>
  );
}
