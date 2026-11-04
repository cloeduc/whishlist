import { router } from "expo-router";
import { ChevronLeftIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { tokens } from "@/theme/tokens";

import { Button } from "./Button";

/**
 * Back to the previous screen. The site does not need it (the browser handles it):
 * it is a site link, with a chevron, and not the system header.
 */
export function BackLink({ fallback = "/" }: { fallback?: "/" | `/lists/${string}` }) {
  const { t } = useTranslation("mobile");
  return (
    <Button
      title={t("back")}
      variant="link"
      icon={<ChevronLeftIcon size={18} color={tokens.colors.black} />}
      testID="back-link.back"
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
    />
  );
}
