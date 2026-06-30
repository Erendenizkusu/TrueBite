import Anthropic from "@anthropic-ai/sdk";
import { HIGHLIGHT_TAGS, highlightsSchema, type HighlightTag } from "@truebite/shared";

export const HIGHLIGHTS_MODEL = "claude-haiku-4-5";

const SYSTEM = `Sen restoran yorumlarını analiz eden bir asistansın. Verilen yorumlarda en sık ve
en olumlu şekilde tekrar eden özellikleri belirle. SADECE izin verilen etiket listesinden, gerçekten
yorumlarda desteklenen en fazla 4 etiketi, en sık geçenden başlayarak seç. Bir özellik yorumlarda
yer almıyorsa o etiketi EKLEME — uydurma. Yorum yetersizse boş liste dön.`;

// Structured output ham JSON şeması (SDK zod-helper'ına bağlı kalmadan; sürüm-bağımsız).
const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    features: {
      type: "array",
      items: { type: "string", enum: [...HIGHLIGHT_TAGS] },
    },
  },
  required: ["features"],
  additionalProperties: false,
} as const;

/**
 * Yorumlardan öne çıkan özellik etiketlerini çıkarır (Claude Haiku 4.5 + structured output).
 * Kontrollü sözlükten (enum) seçtirir; çıktı kendi zod şemamızla doğrulanır.
 */
export async function extractHighlights(reviews: string[], apiKey: string): Promise<HighlightTag[]> {
  if (reviews.length === 0) return [];

  const client = new Anthropic({ apiKey });
  const joined = reviews.map((r, i) => `Yorum ${i + 1}: ${r}`).join("\n\n");

  const res = await client.messages.create({
    model: HIGHLIGHTS_MODEL,
    max_tokens: 200,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Şu yorumları analiz et ve öne çıkan özellikleri seç:\n\n${joined}`,
      },
    ],
    output_config: {
      format: { type: "json_schema", name: "highlights", schema: OUTPUT_SCHEMA },
    },
  } as Anthropic.MessageCreateParamsNonStreaming);

  const textBlock = res.content.find((b) => b.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "{}";

  const parsed = highlightsSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) return [];
  return parsed.data.features.slice(0, 4);
}
