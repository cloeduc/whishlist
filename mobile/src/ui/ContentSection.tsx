import type { ReactNode } from "react";
import { View } from "react-native";

import { tokens } from "@/theme/tokens";

import { AccordionChevron, AccordionContent, AccordionTrigger, useAccordion } from "./Accordion";
import { Shadow } from "./Shadow";
import { Text } from "./Text";

const boxStyle = { backgroundColor: tokens.colors.white, padding: tokens.space[5], gap: tokens.space[3] };

/** Section of `components/site/content-page.tsx`: white card with border and shadow, title, grey text. */
export function ContentSection({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Shadow style={boxStyle}>
      <Text size="2xl" weight="heading" accessibilityRole="header">
        {title}
      </Text>
      {children ? <View style={{ gap: tokens.space[3] }}>{children}</View> : null}
    </Shadow>
  );
}

/**
 * Collapsible section (licenses): the title and `summary` stay visible, the title is pressed to
 * expand `children` with the `./Accordion` animation. `children` is mounted only when expanded (long text).
 */
export function CollapsibleContentSection({
  title,
  summary,
  children,
  testID,
}: {
  title: string;
  summary?: ReactNode;
  children: ReactNode;
  testID?: string;
}) {
  const { expanded, shown, toggle, progress } = useAccordion();
  return (
    <Shadow style={boxStyle}>
      <AccordionTrigger
        expanded={expanded}
        onPress={toggle}
        testID={testID ? `${testID}-toggle` : undefined}
        style={{ flexDirection: "row", alignItems: "center", gap: tokens.space[3] }}
      >
        <Text size="2xl" weight="heading" accessibilityRole="header" style={{ flexShrink: 1 }}>
          {title}
        </Text>
        <AccordionChevron progress={progress} testID={testID ? `${testID}-chevron` : undefined} />
      </AccordionTrigger>
      {summary ? <View style={{ gap: tokens.space[3] }}>{summary}</View> : null}
      <AccordionContent
        expanded={expanded}
        progress={progress}
        mounted={shown}
        testID={testID ? `${testID}-content` : undefined}
        style={{ gap: tokens.space[3] }}
      >
        {children}
      </AccordionContent>
    </Shadow>
  );
}

/** Paragraph of a section: grey, wide line height (`leading-7`). */
export function ContentText({ children }: { children: ReactNode }) {
  return (
    <Text color={tokens.colors.mutedForeground} style={{ lineHeight: tokens.lineHeight.relaxed }}>
      {children}
    </Text>
  );
}
