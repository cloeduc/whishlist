import Constants from "expo-constants";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { ReleaseNotes, useReleaseNotes } from "@/features/whats-new/WhatsNew";
import { BackLink } from "@/ui/BackLink";
import { ContentPage } from "@/ui/ContentPage";
import { ContentSection } from "@/ui/ContentSection";
import { ScreenList } from "@/ui/Screen";
import { compareVersions } from "@/whats-new/policy";
import { RELEASES, releaseKey } from "@/whats-new/releases";

/** « Nouveautés » (022), from « Mon compte »: the news of each version up to the installed one, newest first. */
export default function WhatsNewScreen() {
  const { t } = useTranslation("mobile");
  const notes = useReleaseNotes();
  const installed = Constants.expoConfig?.version ?? null;
  const versions = RELEASES.filter((version) => !installed || compareVersions(version, installed) <= 0).toReversed();
  return (
    <ScreenList
      testID="whats-new.screen"
      header={
        <>
          <BackLink />
          <ContentPage eyebrow={t("whatsNew.screenEyebrow")} title={t("whatsNew.screenTitle")} intro={t("whatsNew.screenIntro")}>
            {null}
          </ContentPage>
        </>
      }
      data={versions}
      keyExtractor={(version) => version}
      renderItem={({ item }) => (
        <View testID={`whats-new.section-${releaseKey(item)}`}>
          <ContentSection title={t("whatsNew.version", { version: item })}>
            <ReleaseNotes sentences={notes(item)} />
          </ContentSection>
        </View>
      )}
    />
  );
}
