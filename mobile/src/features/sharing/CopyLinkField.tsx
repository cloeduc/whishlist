import * as Clipboard from "expo-clipboard";
import { CopyIcon } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { tokens } from "@/theme/tokens";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";

/**
 * Read-only link and its small square « copier » button, then « Lien copié. »:
 * `components/site/copy-link-field.tsx` on the site (public link, invite link).
 */
export function CopyLinkField({
  label,
  value,
  copyLabel,
  fieldTestID,
  copyTestID,
  copiedTestID,
}: {
  label: string;
  value: string;
  copyLabel: string;
  fieldTestID: string;
  copyTestID: string;
  copiedTestID: string;
}) {
  const { t } = useTranslation("list");
  // The link copied last: a new link (invite link replaced) hides the message again.
  const [copied, setCopied] = useState<string | null>(null);
  return (
    <>
      <Field label={label}>
        <View style={{ flexDirection: "row", gap: tokens.space[2], alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Input testID={fieldTestID} accessibilityLabel={label} value={value} editable={false} muted selectTextOnFocus />
          </View>
          <Button
            size="icon"
            variant="neutral"
            accessibilityLabel={copyLabel}
            icon={<CopyIcon size={16} color={tokens.colors.black} />}
            onPress={() => {
              void Clipboard.setStringAsync(value).then(() => setCopied(value));
            }}
            testID={copyTestID}
          />
        </View>
      </Field>
      {copied === value ? <Alert testID={copiedTestID}>{t("share.copied")}</Alert> : null}
    </>
  );
}
