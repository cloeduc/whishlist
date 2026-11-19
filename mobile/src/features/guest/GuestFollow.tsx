import { router, type Href } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useSession } from "@/auth/session";
import { followList, unfollowList } from "@/data/subscriptions";
import { useServerAction } from "@/features/errors";
import { translateError } from "@/i18n";
import { useOnline } from "@/network";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { NetworkNote } from "@/ui/NetworkNote";

/**
 * « Suivre cette liste » / « Ne plus suivre » of a list view (012), like the button of the site public
 * page: only with an account, never for a member of the list. Unfollowing asks for confirmation
 * and does not touch reservations. With `canRename`, a followed list also offers « Renommer » (024).
 */
export function GuestFollow({
  readToken,
  subscribed,
  isMember = false,
  canRename = false,
  onChanged,
}: {
  readToken: string;
  subscribed: boolean;
  isMember?: boolean;
  /** The list could be read: its names can be changed. */
  canRename?: boolean;
  onChanged: () => void;
}) {
  const { t } = useTranslation("public");
  const session = useSession();
  const online = useOnline();
  const [confirming, setConfirming] = useState(false);
  // Server refusal returned as a result (not as an exception): its translated code.
  const [refused, setRefused] = useState<string | null>(null);
  const toggle = useServerAction(async () => {
    setRefused(null);
    const result = subscribed
      ? await unfollowList(readToken)
      : await followList({ urlOrToken: readToken, readToken });
    if (!result.ok) {
      setRefused(translateError(result.error));
      return;
    }
    onChanged();
  });
  const error = refused ?? toggle.error;

  if (session.status !== "signedIn" || isMember) return null;
  return (
    <>
      {subscribed && canRename ? (
        <Button
          testID="guest.rename"
          title={t("subscription.rename")}
          variant="neutral"
          disabled={!online}
          onPress={() => router.push(`/guest/${readToken}/names` as Href)}
        />
      ) : null}
      {subscribed ? (
        <Button
          testID="guest.unfollow"
          title={t("subscription.unfollow")}
          variant="neutral"
          disabled={!online || toggle.busy}
          onPress={() => setConfirming(true)}
        />
      ) : (
        <Button
          testID="guest.follow"
          title={t("subscription.follow")}
          disabled={!online || toggle.busy}
          onPress={() => void toggle.run()}
        />
      )}
      {subscribed ? <NetworkNote /> : null}
      {error ? (
        <Alert testID="guest.follow-error" variant="destructive">
          {error}
        </Alert>
      ) : null}
      <ConfirmDialog
        visible={confirming}
        title={t("subscription.unfollowTitle")}
        body={t("subscription.unfollowBody")}
        confirmLabel={t("subscription.unfollowConfirm")}
        keepLabel={t("subscription.unfollowKeep")}
        destructive
        onConfirm={() => {
          setConfirming(false);
          void toggle.run();
        }}
        onKeep={() => setConfirming(false)}
        testID="guest.unfollow-confirm"
      />
    </>
  );
}
