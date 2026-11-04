import { NextResponse } from "next/server";
import { withLocale } from "@/src/i18n/locale-path";
import { actionContext } from "@/src/server/action-context";
import { exportFileName } from "@/src/domain/export-file";
import { exportOwnAccount } from "@/src/server/commands/account";
import { isRateLimitError } from "@/src/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Same document as `GET /api/v1/me/export`, with the site's session cookie. */
export async function GET() {
  const ctx = await actionContext();
  const back = (path: string) => NextResponse.redirect(new URL(withLocale(ctx.locale, path), ctx.origin), 303);
  let result: Awaited<ReturnType<typeof exportOwnAccount>>;
  try {
    result = await exportOwnAccount(ctx);
  } catch (error) {
    if (isRateLimitError(error)) return back("/compte?x=rateLimited#donnees");
    throw error;
  }
  if (!result.ok) return back(result.error === "unauthorized" ? "/connexion" : `/compte?x=${result.error}#donnees`);
  return NextResponse.json(result.data, {
    headers: {
      "cache-control": "private, no-store",
      "content-disposition": `attachment; filename="${exportFileName(result.data.exportedAt, ctx.locale)}"`,
    },
  });
}
