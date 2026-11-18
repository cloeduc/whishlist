import { useCallback, useEffect, useState } from "react";

import { ApiError, type Schemas } from "@/api/client";
import { errorText } from "@/features/errors";

import { readGroupGift } from "./api";

export type GroupGiftState =
  | { status: "loading" }
  | { status: "locked"; title: string }
  | { status: "ready"; gift: Schemas["GroupGift"] }
  | { status: "missing" }
  | { status: "failed"; message: string };

/**
 * A group gift opened by its link (028), read again on open and by `reload`. No offline copy:
 * participating always goes through the server, like reserving.
 */
export function useGroupGift(token: string): {
  state: GroupGiftState;
  reload: () => void;
  replace: (gift: Schemas["GroupGift"]) => void;
} {
  const [state, setState] = useState<GroupGiftState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const gift = await readGroupGift(token);
        if (active) setState({ status: "ready", gift });
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiError && error.code === "readPasswordRequired") {
          setState({ status: "locked", title: error.title ?? "" });
        } else if (error instanceof ApiError && error.status === 404) setState({ status: "missing" });
        else setState({ status: "failed", message: errorText(error) });
      }
    })();
    return () => {
      active = false;
    };
  }, [token, attempt]);
  const reload = useCallback(() => setAttempt((count) => count + 1), []);
  const replace = useCallback((gift: Schemas["GroupGift"]) => setState({ status: "ready", gift }), []);
  return { state, reload, replace };
}
