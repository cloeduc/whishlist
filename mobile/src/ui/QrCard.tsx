import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { tokens } from "@/theme/tokens";

import { Shadow } from "./Shadow";

/** Minimum size for a scan at 20–50 cm by another phone (FR-020, SC-002). */
export const QR_SIZE = 240;

/**
 * Black on white QR code, with a white margin around it (« quiet zone ») to stay readable,
 * in a box in the site's style.
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
