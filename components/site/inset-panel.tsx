import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const insetPanelClasses = "rounded-base border-2 border-border bg-secondary-background p-3 shadow-shadow";

/**
 * One-line box inside a card (an offer, an API key): the card's border, background and shadow,
 * with tighter padding. The layout (flex, gap) is left to the caller.
 */
export function InsetPanel({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(insetPanelClasses, className)} {...props} />;
}

/** Same box, as a list element (`<li>`). */
export function InsetPanelItem({ className, ...props }: ComponentProps<"li">) {
  return <li className={cn(insetPanelClasses, className)} {...props} />;
}
