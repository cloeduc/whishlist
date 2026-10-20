import { NextResponse, type NextRequest } from "next/server";
import { isLocale, localeCookie } from "@/src/i18n/config";

/** `?lang=en|fr` sets the locale cookie then strips the query (shareable list links). */
export function middleware(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang");
  if (!isLocale(lang)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.searchParams.delete("lang");
  const response = NextResponse.redirect(url);
  response.cookies.set(localeCookie, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
