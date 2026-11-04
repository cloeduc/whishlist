import { useTranslation } from "react-i18next";

import { BackLink } from "@/ui/BackLink";
import { ContentPage } from "@/ui/ContentPage";
import { CollapsibleContentSection, ContentText } from "@/ui/ContentSection";
import { ScreenList } from "@/ui/Screen";

import licenses from "@/legal/licenses.json";

type License = (typeof licenses)[number];

function LicenseRow({ entry }: { entry: License }) {
  return (
    <CollapsibleContentSection
      title={entry.name}
      summary={<ContentText>{`${entry.version} · ${entry.license}`}</ContentText>}
    >
      {entry.text ? <ContentText>{entry.text}</ContentText> : null}
    </CollapsibleContentSection>
  );
}

/** Open source licenses of the app (FR-041), read from the generated file: works offline. */
export default function Licenses() {
  const { t } = useTranslation("mobile");
  return (
    <ScreenList
      testID="legal-licenses.screen"
      header={
        <>
          <BackLink />
          <ContentPage eyebrow={t("legal.licensesEyebrow")} title={t("legal.licensesTitle")} intro={t("legal.licensesIntro")}>
            {null}
          </ContentPage>
        </>
      }
      data={licenses}
      keyExtractor={(entry) => `${entry.name}@${entry.version}`}
      renderItem={({ item }) => <LicenseRow entry={item} />}
    />
  );
}
