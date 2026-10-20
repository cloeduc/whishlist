import { redirect } from "next/navigation";

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
  redirect(qs ? `/compte?${qs}` : "/compte");
}
