import type { GroupGiftTotals } from "../domain/group-gift";
import { formatPrice } from "../domain/price";

type Translate = (key: string, options?: Record<string, unknown>) => string;

/**
 * « 2 participants · il reste 20 € » (028): the line every page shows for a group gift.
 * `t` is the `public` namespace; `priceLocale` an Intl locale.
 */
export function groupGiftSummaryText(t: Translate, totals: GroupGiftTotals, priceLocale: string): string {
  const parts = [t("groupGift.participants", { count: totals.participantCount })];
  if (totals.goalReached) parts.push(t("groupGift.goalReached"));
  else if (totals.remainingCents !== null) {
    parts.push(t("groupGift.remaining", { amount: formatPrice(totals.remainingCents, priceLocale) }));
  } else if (totals.totalCents > 0) {
    parts.push(t("groupGift.total", { amount: formatPrice(totals.totalCents, priceLocale) }));
  }
  return parts.join(" · ");
}
