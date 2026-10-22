import { redirect } from "next/navigation";
import { getLocale } from "@/src/i18n/server";
import { withLocale } from "@/src/i18n/locale-path";

export const dynamic = "force-dynamic";

/** Ancienne URL — redirige vers Mon compte. */
export default async function ChangerMotDePassePage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; ok?: string }>;
}) {
  const query = await searchParams;
  const params = new URLSearchParams();
  if (query.e) params.set("e", query.e);
  if (query.ok) params.set("ok", query.ok);
  const qs = params.toString();
  const locale = await getLocale();
  redirect(withLocale(locale, qs ? `/compte?${qs}` : "/compte"));
}
