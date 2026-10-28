import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { tokens } from "@/theme/tokens";

import { Shadow } from "./Shadow";

/** Taille minimale pour un scan à 20–50 cm par un autre téléphone (FR-020, SC-002). */
export const QR_SIZE = 240;

/**
 * QR code noir sur blanc, avec une marge blanche autour (« quiet zone ») pour rester lisible,
 * dans une boîte au style du site.
 */
export function QrCard({ value, accessibilityLabel }: { value: string; accessibilityLabel: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Shadow style={{ padding: tokens.space[2] }}>
        <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} testID="qr-code">
          <QRCode value={value} size={QR_SIZE} color={tokens.colors.black} backgroundColor={tokens.colors.white} quietZone={16} ecl="M" />
        </View>
      </Shadow>
    </View>
  );
}
