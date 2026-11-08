type Translate = (key: string, vars: { count: number }) => string;

/** Confirmation text, plus the unsent changes of the list that leaving or deleting it would lose (017). */
export function withPendingLost(body: string, pending: number, t: Translate): string {
  return pending > 0 ? `${body}\n\n${t("mobile:sharing.pendingLost", { count: pending })}` : body;
}
