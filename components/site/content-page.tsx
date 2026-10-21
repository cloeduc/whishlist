import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ContentPage({
  eyebrow,
  title,
  intro,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("flex flex-col gap-8", className)}>
      <header className="flex max-w-2xl flex-col gap-3">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-main">{eyebrow}</p>
        <h1 className="text-balance text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
        <p className="text-pretty text-lg text-muted-foreground">{intro}</p>
      </header>
      {children}
    </main>
  );
}

export function ContentSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow sm:p-6",
        className,
      )}
    >
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <div className="text-pretty leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}
