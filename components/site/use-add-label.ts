"use client";

import { useState, useTransition } from "react";
import type { LabelView } from "@/src/server/api/views";
import { manageLabelAction } from "@/src/server/actions";

type AddOp = { kind: "type" | "person"; op: "add"; wishlistId: string; label: string };

/**
 * Adds a category or a « qui » through the settings' action (same rules, same refusals), for the settings
 * chips and the idea form (023). `add` ignores an empty name: callers keep their « Ajouter » disabled then.
 * `error` is the refusal's code (to translate with the `errors` namespace).
 */
export function useAddLabel(wishlistId: string, kind: "type" | "person", options: { beforeSend?: (op: AddOp) => void } = {}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function add(name: string, onAdded?: (created: LabelView | null) => void) {
    const label = name.trim();
    if (!label || pending) return;
    const op: AddOp = { kind, op: "add", wishlistId, label };
    setError(null);
    startTransition(async () => {
      options.beforeSend?.(op);
      const result = await manageLabelAction(op);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onAdded?.(result.label);
    });
  }

  return { add, pending, error, clearError: () => setError(null) };
}
