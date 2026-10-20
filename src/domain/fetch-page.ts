import { safeHttpGet } from "./safe-http";

export async function fetchPageHtml(
  pageUrl: string,
  timeoutMs = 10_000,
): Promise<{ html: string; finalUrl: string } | null> {
  const result = await safeHttpGet(pageUrl, { timeoutMs });
  if (!result) return null;
  const { response, finalUrl } = result;
  if (!response.ok) return null;
  const type = response.headers.get("content-type") ?? "";
  if (type && !type.includes("html") && !type.includes("text/") && !type.includes("xml")) {
    return null;
  }
  const html = (await response.text()).slice(0, 400_000);
  return { html, finalUrl };
}

export function stripHtmlForLlm(html: string, maxChars = 12_000): string {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return withoutNoise.slice(0, maxChars);
}
