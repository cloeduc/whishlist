import { clearSharedPayloads, getSharedPayloads, type SharePayload } from "expo-sharing";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

const key = (payloads: readonly SharePayload[]) => JSON.stringify(payloads.map((p) => [p.shareType, p.mimeType, p.value]));

/**
 * Contents shared to the app, read as is (`getSharedPayloads`, synchronous, no network).
 *
 * Not `useIncomingShare` from expo-sharing: it also calls `getResolvedSharedPayloadsAsync`, which opens the shared
 * address from the device (a request to the shop, with the person's IP) each time the app returns to the foreground.
 * The app does not need it: « Remplir depuis le lien » goes through the server. Read again on mount and each time the
 * app returns to the foreground (a new share while the screen is already open).
 */
export function useSharedPayloads(): { payloads: SharePayload[]; clear: () => void } {
  const [payloads, setPayloads] = useState<SharePayload[]>(read);

  useEffect(() => {
    const refresh = () => {
      const next = read();
      setPayloads((current) => (key(current) === key(next) ? current : next));
    };
    refresh();
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") refresh();
    });
    return () => subscription.remove();
  }, []);

  const clear = useCallback(() => {
    try {
      clearSharedPayloads();
    } catch {
      // Nothing to clear, or module missing: the share is no longer shown anyway.
    }
    setPayloads([]);
  }, []);

  return { payloads, clear };
}

function read(): SharePayload[] {
  try {
    return getSharedPayloads();
  } catch {
    return [];
  }
}
