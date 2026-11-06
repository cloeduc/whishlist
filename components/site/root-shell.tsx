import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/src/i18n/config";
import { I18nProvider } from "@/src/i18n/client";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

/**
 * The <html>, <body> and page column shared by the root layout and the page shown when that
 * layout fails (`app/global-error.tsx`), so both look the same. No hook: usable on both sides.
 * `end` goes at the end of <body>, outside the column (e.g. the analytics script).
 */
export function RootShell({ locale, children, end }: { locale: Locale; children: ReactNode; end?: ReactNode }) {
  return (
    <html lang={locale} className={cn("overflow-x-clip font-sans", geist.variable)}>
      <body className="overflow-x-clip">
        <I18nProvider locale={locale}>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6">{children}</div>
        </I18nProvider>
        {end}
      </body>
    </html>
  );
}
