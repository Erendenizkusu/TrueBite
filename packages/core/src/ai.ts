import OpenAI from "openai";
import { HIGHLIGHT_TAGS, highlightsSchema, type HighlightTag } from "@truebite/shared";

export const HIGHLIGHTS_MODEL = "gpt-4o-mini";

const SYSTEM = `Sen restoran yorumlarını analiz eden bir asistansın. Verilen yorumlarda en sık ve
en olumlu şekilde tekrar eden özellikleri belirle. SADECE izin verilen etiket listesinden, gerçekten
yorumlarda desteklenen en fazla 4 etiketi, en sık geçenden başlayarak seç. Bir özellik yorumlarda
yer almıyorsa o etiketi EKLEME — uydurma. Yorum yetersizse boş liste dön.`;

// Structured output ham JSON şeması (kontrollü sözlükten enum ile seçtirilir).
// OpenAI "strict" json_schema modu: additionalProperties:false + tüm alanlar required olmalı.
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
 * Yorumlardan öne çıkan özellik etiketlerini çıkarır (OpenAI gpt-4o-mini + Structured Outputs).
 * Kontrollü sözlükten (enum) seçtirir; çıktı ayrıca kendi zod şemamızla doğrulanır (çift kalkan).
 * Not: gpt-4o-mini yüksek hacim + basit çıkarım için ucuz ($0.15/$0.60 per MTok) — mekan başına
 * ~$0.0002; Google maliyetinin yanında yok hükmünde (bkz [[monetization-cost-rule]]).
 */
export async function extractHighlights(reviews: string[], apiKey: string): Promise<HighlightTag[]> {
  if (reviews.length === 0) return [];

  const client = new OpenAI({ apiKey });
  const joined = reviews.map((r, i) => `Yorum ${i + 1}: ${r}`).join("\n\n");

  const res = await client.chat.completions.create({
    model: HIGHLIGHTS_MODEL,
    max_tokens: 200,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Şu yorumları analiz et ve öne çıkan özellikleri seç:\n\n${joined}` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "highlights", strict: true, schema: OUTPUT_SCHEMA },
    },
  });

  const raw = res.choices[0]?.message?.content ?? "{}";

  const parsed = highlightsSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) return [];
  return parsed.data.features.slice(0, 4);
}

const FIT_SYSTEM = `Sen bir mekânın belirli bir yemek kategorisinde ne kadar iyi olduğunu, yalnızca
müşteri yorumlarına bakarak değerlendiren bir asistansın. Sana bir kategori (örn. "Döner") ve o
mekâna ait yorumlar verilir. Yorumlarda o KATEGORİNİN ürününün ne sıklıkta ve ne kadar olumlu
övüldüğüne bak. Mekân o kategoriyle ünlüyse ve ürünü övülüyorsa yüksek; mekân başka şeylerle
(başka yemekler, kahvaltı, tatlı, ambiyans) ünlüyse ve o kategori pek anılmıyorsa düşük puan ver.
0.0 = kategoriyle alakasız/kötü, 1.0 = tam o kategorinin ustası. Yorum yetersizse 0.7 (nötr) ver.`;

const FIT_SCHEMA = {
  type: "object",
  properties: {
    fit: { type: "number", description: "0.0 ile 1.0 arası kategori-uyum skoru" },
  },
  required: ["fit"],
  additionalProperties: false,
} as const;

/**
 * Bir mekânın belirli kategoride "özellikle iyi mi" skorunu (0..1) yorumlardan çıkarır
 * (OpenAI gpt-4o-mini). Döner listesindeki genel Türk restoranlarını (asıl işi döner
 * olmayan) aşağı çekmek için RealScore'la harmanlanır. Yorum yoksa çağrılmaz (nötr kabul).
 */
export async function scoreCategoryFit(
  reviews: string[],
  categoryLabel: string,
  apiKey: string,
): Promise<number> {
  if (reviews.length === 0) return 0.7; // nötr — bilgi yok, cezalandırma

  const client = new OpenAI({ apiKey });
  const joined = reviews.map((r, i) => `Yorum ${i + 1}: ${r}`).join("\n\n");

  const res = await client.chat.completions.create({
    model: HIGHLIGHTS_MODEL,
    max_tokens: 60,
    messages: [
      { role: "system", content: FIT_SYSTEM },
      {
        role: "user",
        content: `Kategori: ${categoryLabel}\n\nBu mekânın yorumları:\n\n${joined}\n\nBu mekân ÖZELLİKLE "${categoryLabel}" kategorisinde ne kadar iyi?`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "category_fit", strict: true, schema: FIT_SCHEMA },
    },
  });

  const raw = res.choices[0]?.message?.content ?? "{}";
  try {
    const fit = Number(JSON.parse(raw).fit);
    if (!Number.isFinite(fit)) return 0.7;
    return Math.min(1, Math.max(0, fit)); // [0,1] kelepçe
  } catch {
    return 0.7;
  }
}
