export async function fetchPageHtml(
  pageUrl: string,
  timeoutMs = 10_000,
): Promise<{ html: string; finalUrl: string } | null> {
  if (!pageUrl.startsWith("http://") && !pageUrl.startsWith("https://")) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(pageUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "";
    if (type && !type.includes("html") && !type.includes("text/") && !type.includes("xml")) return null;
    const html = (await response.text()).slice(0, 400_000);
    return { html, finalUrl: response.url || pageUrl };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
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
