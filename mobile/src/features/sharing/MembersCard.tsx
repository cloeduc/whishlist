import { router } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import type { Schemas } from "@/api/client";
import { leaveList, removeMember } from "@/data/sharing";
import { usePendingCountFor } from "@/data/store";
import { useServerAction } from "@/features/errors";
import { tokens } from "@/theme/tokens";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Text } from "@/ui/Text";

import { withPendingLost } from "./pendingLost";

type Member = Schemas["Member"];

/**
 * « Gérer les membres », as on the site: each member and their role; the owner removes the
 * others (there is one owner per list, so « Retirer » is never on the owner's own line), and
 * anyone leaves. Leaving or being refused goes through the server's rules (`aloneMustDelete`).
 */
export function MembersCard({
  listId,
  role,
  members,
  disabled,
  aloneAction,
}: {
  listId: string;
  role: Schemas["MemberList"]["role"];
  members: Member[];
  disabled: boolean;
  /** Shown under the `aloneMustDelete` refusal: what the person can do instead of leaving (US5). */
  aloneAction?: ReactNode;
}) {
  const { t } = useTranslation(["list", "mobile"]);
  const pending = usePendingCountFor(listId);
  const [toRemove, setToRemove] = useState<Member | null>(null);
  const [leaving, setLeaving] = useState(false);
  // One action at a time for the card: removing someone or leaving.
  const action = useServerAction(useCallback((call: () => Promise<void>) => call(), []));
  const busy = action.busy;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("list:share.members")}</CardTitle>
        <CardDescription>{t("list:share.membersDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {action.error ? (
          <Alert testID="share.members-error" variant="destructive">
            {action.error}
          </Alert>
        ) : null}
        {action.code === "aloneMustDelete" ? aloneAction : null}
        {members.map((member) => (
          <View
            key={member.userId}
            testID={`share.member-${member.userId}`}
            style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: tokens.space[2] }}
          >
            <Text size="sm" style={{ flexShrink: 1 }}>
              {member.displayName || t("list:share.member")}{" "}
              <Text size="sm" color={tokens.colors.mutedForeground}>
                — {member.role === "owner" ? t("list:share.owner") : t("list:share.member")}
              </Text>
            </Text>
            {role === "owner" && member.role !== "owner" ? (
              <Button
                testID={`share.remove-${member.userId}`}
                title={t("list:share.remove")}
                variant="neutral"
                size="sm"
                disabled={disabled || busy}
                onPress={() => setToRemove(member)}
              />
            ) : null}
          </View>
        ))}
        <Button testID="share.leave" title={t("list:share.leave")} variant="neutral" disabled={disabled || busy} onPress={() => setLeaving(true)} />
      </CardContent>
      <ConfirmDialog
        visible={toRemove !== null}
        testID="share.remove-confirm"
        title={t("list:confirm.removeMemberTitle", { name: toRemove?.displayName || t("list:share.member") })}
        body={t("list:confirm.removeMemberBody")}
        confirmLabel={t("list:confirm.removeMemberConfirm")}
        keepLabel={t("list:confirm.removeMemberKeep")}
        onKeep={() => setToRemove(null)}
        onConfirm={() => {
          const member = toRemove;
          setToRemove(null);
          if (member) void action.run(() => removeMember(listId, member.userId));
        }}
      />
      <ConfirmDialog
        visible={leaving}
        testID="share.leave-confirm"
        title={t("list:confirm.leaveTitle")}
        body={withPendingLost(t("list:confirm.leaveBody"), pending, t)}
        confirmLabel={t("list:confirm.leaveConfirm")}
        keepLabel={t("list:confirm.leaveKeep")}
        onKeep={() => setLeaving(false)}
        onConfirm={() => {
          setLeaving(false);
          void action.run(async () => {
            await leaveList(listId);
            router.replace("/");
          });
        }}
      />
    </Card>
  );
}
