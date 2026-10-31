import { useEffect, useState } from "react";

import { api, NetworkError, ok } from "@/api/client";
import { getSnapshot, putSnapshot } from "@/offline/snapshot";

// `analytics` manque dans une copie gardée avant 1.2.0.
export type Capabilities = { apiVersion: string; enrich: boolean; mail: boolean; analytics?: boolean };
const CAPABILITIES = "capabilities";

/** Services optionnels du serveur ; la dernière réponse connue sert hors ligne. */
export function useCapabilities(): Capabilities | null {
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  useEffect(() => {
    let active = true;
    void (async () => {
      const cached = await getSnapshot<Capabilities>(CAPABILITIES);
      if (active && cached) setCapabilities(cached.body);
      try {
        const fresh = await ok(api.GET("/capabilities"));
        await putSnapshot(CAPABILITIES, fresh);
        if (active) setCapabilities(fresh);
      } catch (error) {
        if (!(error instanceof NetworkError)) throw error;
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  return capabilities;
}
