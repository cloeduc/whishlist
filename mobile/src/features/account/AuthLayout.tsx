import type { ReactNode } from "react";
import { View } from "react-native";

import { tokens } from "@/theme/tokens";
import { BrandHeader } from "@/ui/BrandHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Screen } from "@/ui/Screen";

import { LegalLinks } from "./LegalLinks";

/**
 * Signed-out screens (`02-connexion.png`, `03-inscription.png`): site header, a form card,
 * then the links to the legal notice and the privacy page (FR-002).
 */
export function AuthLayout({
  title,
  description,
  children,
  below,
  testID,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  /** Below the card (« Créer un compte » button). */
  below?: ReactNode;
  testID?: string;
}) {
  return (
    <Screen testID={testID}>
      <BrandHeader />
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      {/* Centered, like the « Créer un compte » link below the site card. */}
      {below ? <View style={{ flexDirection: "row", justifyContent: "center", gap: tokens.space[3] }}>{below}</View> : null}
      <LegalLinks />
    </Screen>
  );
}
