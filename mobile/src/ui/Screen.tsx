import type { ReactNode } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { useTheme } from "@/theme/ListTheme";
import { tokens } from "@/theme/tokens";

/**
 * Fond du site (ou du thème de liste), marges latérales 16, défilement.
 * `onRefresh` active « tirer pour rafraîchir » (FR-017).
 */
export function Screen({
  children,
  header,
  onRefresh,
  refreshing = false,
  edges = ["top", "left", "right"],
}: {
  children: ReactNode;
  /** Bloc fixe au-dessus du contenu (bandeau hors ligne). */
  header?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  edges?: Edge[];
}) {
  const palette = useTheme();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: palette.background }}>
      {header ? <View style={{ paddingHorizontal: tokens.space[4], paddingTop: tokens.space[2] }}>{header}</View> : null}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        // Le clavier numérique (prix) n'a pas de touche « OK » sur iOS : faire défiler le ferme.
        keyboardDismissMode="on-drag"
        // Le contenu défile au-dessus du clavier : le bouton d'envoi reste atteignable.
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{
          padding: tokens.space[4],
          // Place pour l'ombre décalée des derniers blocs.
          paddingBottom: tokens.space[6] + tokens.shadowOffset,
          gap: tokens.space[6],
        }}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.main} colors={[palette.main]} /> : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
