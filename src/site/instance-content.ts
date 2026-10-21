import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Locale } from "@/src/i18n/config";

type ProjectContent = {
  intro?: string;
  portrait?: {
    src: string;
    alt: string;
  };
};

type InstanceContent = {
  supportUrl?: string;
  project?: Partial<Record<Locale, ProjectContent>>;
};

let cached: InstanceContent | null | undefined;

function readInstanceContent(): InstanceContent | null {
  if (cached !== undefined) return cached;

  const filePath =
    process.env.INSTANCE_CONTENT_PATH ??
    path.join(process.cwd(), "data", "instance-content.json");

  if (!existsSync(/*turbopackIgnore: true*/ filePath)) {
    cached = null;
    return cached;
  }

  try {
    cached = JSON.parse(readFileSync(/*turbopackIgnore: true*/ filePath, "utf8")) as InstanceContent;
  } catch (error) {
    console.error(`Invalid instance content file: ${filePath}`, error);
    cached = null;
  }

  return cached;
}

function normalizeHttpUrl(raw: string | undefined | null): string | null {
  const value = raw?.trim();
  return value && value.startsWith("http") ? value : null;
}

export function getProjectInstanceContent(locale: Locale): ProjectContent | null {
  return readInstanceContent()?.project?.[locale] ?? null;
}

/** Lien Stripe / soutien propre a l'instance (hors depot public). */
export function getInstanceSupportUrl(): string | null {
  return normalizeHttpUrl(readInstanceContent()?.supportUrl);
}
