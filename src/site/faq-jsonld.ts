type FaqItem = { q: string; a: string };

/** JSON-LD FAQPage à partir des questions déjà affichées. `<` est échappé. */
export function faqPageJsonLd(items: FaqItem[]): string {
  const mainEntity = items
    .filter((item) => item.q.trim() && item.a.trim())
    .map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    }));
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  }).replaceAll("<", "\\u003c");
}
