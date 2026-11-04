import { CameraView } from "expo-camera";
import { useRef } from "react";

import { tokens } from "@/theme/tokens";
import { Shadow } from "@/ui/Shadow";

/** Delay before reading the same code again: the camera sends it several times per second. */
const SAME_CODE_DELAY_MS = 2000;

/**
 * Square viewfinder that reads QR codes only (012, US4), in a box styled like the site, like `QrCard`.
 * The camera permission is requested by the screen before showing the viewfinder.
 */
export function QrScanner({ onScanned, testID }: { onScanned: (data: string) => void; testID?: string }) {
  const last = useRef<{ data: string; at: number } | null>(null);
  return (
    <Shadow style={{ overflow: "hidden" }}>
      <CameraView
        testID={testID}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => {
          const now = Date.now();
          if (last.current?.data === data && now - last.current.at < SAME_CODE_DELAY_MS) return;
          last.current = { data, at: now };
          onScanned(data);
        }}
        style={{ width: "100%", aspectRatio: 1, borderRadius: tokens.radius }}
      />
    </Shadow>
  );
}
