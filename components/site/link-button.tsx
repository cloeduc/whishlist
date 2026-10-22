import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { withLocale } from "@/src/i18n/locale-path";
import { getLocale } from "@/src/i18n/server";

type LinkButtonProps = {
  href: string;
  className?: string;
  children: ReactNode;
  target?: string;
  rel?: string;
} & VariantProps<typeof buttonVariants> &
  Pick<ComponentProps<"a">, "aria-current" | "aria-label">;

/** Lien habillé comme un bouton, sans `role="button"`. */
export async function LinkButton({
  href,
  variant,
  size,
  className,
  children,
  target,
  rel,
  ...rest
}: LinkButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a href={href} target={target} rel={rel} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  const locale = await getLocale();
  return (
    <Link href={withLocale(locale, href)} target={target} rel={rel} className={classes} {...rest}>
      {children}
    </Link>
  );
}
