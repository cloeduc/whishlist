import { stripHtmlForLlm } from "./fetch-page";
import { mergeHints, resolveTypeId, type ProductHints } from "./product-from-url";

function parseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  try {
    const value = JSON.parse(candidate);
    if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        const value = JSON.parse(candidate.slice(start, end + 1));
        if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function hintsFromLlmJson(
  value: Record<string, unknown>,
  types: { id: string; label: string }[],
): Partial<ProductHints> {
  const typeLabel =
    typeof value.typeLabel === "string"
      ? value.typeLabel
      : typeof value.type === "string"
        ? value.type
        : null;
  return {
    name: typeof value.name === "string" ? value.name : null,
    price: value.price === null || value.price === undefined ? null : String(value.price),
    imageUrl: typeof value.imageUrl === "string" ? value.imageUrl : null,
    typeId: resolveTypeId(types, typeLabel),
  };
}

function buildPrompt(
  pageUrl: string,
  html: string,
  hints: ProductHints,
  types: { id: string; label: string }[],
): string {
  const labels = types.map((type) => type.label);
  return `Tu extrais les infos produit d'une page e-commerce pour une wishlist.
URL: ${pageUrl}
Indices déjà trouvés (peuvent être incomplets ou faux):
${JSON.stringify({ name: hints.name, price: hints.price, imageUrl: hints.imageUrl })}

Types / catégories disponibles (tu DOIS choisir exactement un de ces labels pour typeLabel) :
${JSON.stringify(labels)}

Texte de la page (tronqué):
${stripHtmlForLlm(html)}

Réponds UNIQUEMENT en JSON compact avec exactement ces clés:
{"name": string|null, "price": string|null, "imageUrl": string|null, "typeLabel": string|null}
- name: nom court du produit (pas le titre SEO du site)
- price: montant numérique en euros, point décimal (ex "29.99"), sans symbole
- imageUrl: URL absolue http(s) de la meilleure image produit, ou null
- typeLabel: EXACTEMENT un des labels de la liste ci-dessus (même orthographe), celui qui colle le mieux au produit. Si vraiment aucun ne va, utilise "Divers" s'il existe, sinon null.
Si une info est introuvable, mets null.`;
}

async function callGemini(apiKey: string, prompt: string): Promise<Record<string, unknown> | null> {
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  return parseJsonObject(text);
}

async function callOpenAi(apiKey: string, prompt: string): Promise<Record<string, unknown> | null> {
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Tu réponds uniquement en JSON valide." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  return parseJsonObject(text);
}

export function llmConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim());
}

export async function refineProductWithLlm(
  pageUrl: string,
  html: string,
  hints: ProductHints,
  types: { id: string; label: string }[] = [],
): Promise<ProductHints> {
  const gemini = process.env.GEMINI_API_KEY?.trim();
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (!gemini && !openai) return hints;
  const prompt = buildPrompt(pageUrl, html, hints, types);
  try {
    const raw = gemini ? await callGemini(gemini, prompt) : await callOpenAi(openai!, prompt);
    if (!raw) return hints;
    return mergeHints(hints, hintsFromLlmJson(raw, types));
  } catch {
    return hints;
  }
}
