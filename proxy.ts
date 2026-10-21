import { NextResponse, type NextRequest } from "next/server";
import { isLocale, localeCookie } from "@/src/i18n/config";
import { contentSecurityPolicy } from "@/src/server/content-security";

function cspHeaders(request: NextRequest) {
  const policy = contentSecurityPolicy({ dev: process.env.NODE_ENV === "development" });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", policy.nonce);
  requestHeaders.set("Content-Security-Policy", policy.value);
  return { requestHeaders, value: policy.value };
}

/** `?lang=en|fr` pose le cookie de langue puis retire la query (liens de liste partageables). */
export function proxy(request: NextRequest) {
  const { requestHeaders, value } = cspHeaders(request);
  const lang = request.nextUrl.searchParams.get("lang");

  if (!isLocale(lang)) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Content-Security-Policy", value);
    return response;
  }

  const url = request.nextUrl.clone();
  url.searchParams.delete("lang");
  const response = NextResponse.redirect(url);
  response.cookies.set(localeCookie, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
  response.headers.set("Content-Security-Policy", value);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
