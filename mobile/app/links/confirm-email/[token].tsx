import { router, useLocalSearchParams, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { api, NetworkError, ok } from "@/api/client";
import { refreshMe, useSession } from "@/auth/session";
import { AuthLayout } from "@/features/account/AuthLayout";
import { VerificationBanner } from "@/features/account/VerificationBanner";
import { errorText } from "@/features/errors";
import { appPathForUrl } from "@/links/routes";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Text } from "@/ui/Text";

type Outcome =
  | { status: "pending" }
  | { status: "done"; purpose: "verify" | "change"; ownAccount: boolean; suite: string | null }
  | { status: "failed"; message: string; retry: boolean };

/**
 * Address confirmation link opened in the app (011, R6): confirmed on open, without a button.
 * The site keeps its button because email antivirus tools open web links; they do not open the app.
 * The address is never shown: the link may belong to another account.
 */
export default function ConfirmEmailLink() {
  const { t } = useTranslation(["auth", "mobile"]);
  // `next`: where to resume (an invitation); the API field keeps its former name, `suite`.
  const { token, next: resumePath } = useLocalSearchParams<{ token: string; next?: string }>();
  const session = useSession();
  const signedIn = session.status === "signedIn";
  const [outcome, setOutcome] = useState<Outcome>({ status: "pending" });
  const started = useRef(false);

  const confirm = useCallback(async () => {
    setOutcome({ status: "pending" });
    try {
      const answer = await ok(api.POST("/auth/email-confirmation", { body: { token, suite: resumePath || undefined } }));
      setOutcome({ status: "done", ...answer });
      // The « confirmez votre adresse » banner and « Mon compte » follow the reloaded account.
      await refreshMe().catch(() => undefined);
    } catch (error) {
      setOutcome({ status: "failed", message: errorText(error), retry: error instanceof NetworkError });
    }
  }, [token, resumePath]);

  useEffect(() => {
    // A single attempt on open: sending the same token a second time would be refused (already used).
    if (started.current) return;
    started.current = true;
    void confirm();
  }, [confirm]);

  const next = nextStep(outcome, signedIn, t);
  return (
    <AuthLayout title={t("auth:confirmEmail.title")} testID="confirm-email.screen">
      {outcome.status === "pending" ? <Text testID="confirm-email.pending">{t("mobile:links.confirming")}</Text> : null}
      {outcome.status === "done" ? (
        <Alert testID="confirm-email.status">
          {t(outcome.purpose === "change" ? "auth:confirmEmail.changed" : "auth:confirmEmail.verified")}
        </Alert>
      ) : null}
      {outcome.status === "failed" ? (
        <>
          <Alert testID="confirm-email.error" variant="destructive">
            {outcome.message}
          </Alert>
          {outcome.retry ? (
            <Button testID="confirm-email.retry" title={t("mobile:retry")} variant="neutral" onPress={() => void confirm()} />
          ) : null}
          {/* As on the site page: without a session, how to ask for a new link. */}
          {!signedIn && !outcome.retry ? <Text testID="confirm-email.login-to-resend">{t("auth:confirmEmail.loginToResend")}</Text> : null}
          <VerificationBanner />
        </>
      ) : null}
      {next ? (
        <Button testID="confirm-email.next" title={next.label} fullWidth onPress={() => router.replace(next.href)} />
      ) : null}
    </AuthLayout>
  );
}

/**
 * Suggested next step, as on the site page: the pending invitation, its lists, « Mon compte » after a change,
 * or sign-in.
 */
function nextStep(
  outcome: Outcome,
  signedIn: boolean,
  t: (key: string) => string,
): { href: Href; label: string } | null {
  if (outcome.status === "pending" || (outcome.status === "failed" && outcome.retry)) return null;
  // Sign-up from an invitation: take it up again, as on the site page (010, US1-6).
  const resume = outcome.status === "done" && outcome.suite ? appPathForUrl(outcome.suite) : null;
  const invite = resume?.startsWith("/links/invite/") ? resume : null;
  if (invite) return { href: invite as Href, label: t("auth:confirmEmail.resumeInvite") };
  if (outcome.status === "done" && outcome.purpose === "change" && outcome.ownAccount && signedIn) {
    return { href: "/account", label: t("auth:account.title") };
  }
  return signedIn
    ? { href: "/", label: t("auth:confirmEmail.myLists") }
    : { href: "/login", label: t("auth:confirmEmail.login") };
}
