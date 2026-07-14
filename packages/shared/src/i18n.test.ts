import { test } from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, categoryByKey } from "./categories.ts";
import { HIGHLIGHT_TAGS } from "./highlights.ts";
import {
  categoryCtaNoun,
  categoryLabel,
  fmtDistance,
  fmtReviews,
  highlightLabel,
  normalizeLocale,
  trustChip,
  trustLabel,
} from "./i18n.ts";

test("normalizeLocale: bölge ekini düşürür, bilinmeyeni varsayılana indirger", () => {
  assert.equal(normalizeLocale("en-US"), "en");
  assert.equal(normalizeLocale("tr-TR"), "tr");
  assert.equal(normalizeLocale("EN"), "en");
  assert.equal(normalizeLocale("de"), "tr"); // desteklenmeyen → varsayılan
  assert.equal(normalizeLocale(null), "tr");
  assert.equal(normalizeLocale(undefined), "tr");
});

test("her kategorinin İngilizce karşılığı var (sözlükte eksik anahtar yok)", () => {
  for (const cat of CATEGORIES) {
    // Kategori EN sözlüğünde YOKSA hem label hem ctaNoun Türkçe'ye geri düşer. ctaNoun her
    // kategoride iki dilde farklıdır → farklı olması girdinin var olduğunu kanıtlar.
    // (label'a bakamayız: "Pizza"/"Sushi"/"Burger" iki dilde de aynı yazılır — meşru.)
    assert.notEqual(
      categoryCtaNoun(cat, "en"),
      cat.ctaNoun,
      `${cat.key}: EN sözlüğünde girdi yok (Türkçe'ye düştü)`,
    );
    assert.ok(categoryLabel(cat, "en").length > 0);
  }
  assert.equal(categoryLabel(categoryByKey("coffee"), "tr"), "Kahve");
  assert.equal(categoryLabel(categoryByKey("coffee"), "en"), "Coffee");
  assert.equal(categoryCtaNoun(categoryByKey("doner"), "en"), "doner places");
});

test("her AI etiketinin İngilizce karşılığı var — DB anahtarları Türkçe kalır", () => {
  for (const tag of HIGHLIGHT_TAGS) {
    const en = highlightLabel(tag, "en");
    assert.notEqual(en, tag, `${tag}: EN karşılığı yok`);
    assert.equal(highlightLabel(tag, "tr"), tag, "TR gösterimi anahtarın kendisidir");
  }
  assert.equal(highlightLabel("Hızlı Servis", "en"), "Fast Service");
  // Bilinmeyen etiket (DB'de eski bir değer olabilir) çökmemeli, olduğu gibi geçmeli.
  assert.equal(highlightLabel("Bilinmeyen", "en"), "Bilinmeyen");
});

test("fmtReviews: binlik kısaltması ve tekil/çoğul dile göre", () => {
  assert.equal(fmtReviews(1, "en"), "1 review");
  assert.equal(fmtReviews(42, "en"), "42 reviews");
  assert.equal(fmtReviews(4200, "en"), "4.2k reviews");
  assert.equal(fmtReviews(2000, "en"), "2k reviews"); // .0 kırpılır
  assert.equal(fmtReviews(42, "tr"), "42 yorum");
  assert.equal(fmtReviews(4200, "tr"), "4.2 B yorum");
});

test("fmtDistance: eşik 950 m — altında metre, üstünde km", () => {
  assert.equal(fmtDistance(400, "en"), "400 m");
  assert.equal(fmtDistance(1500, "en"), "1.5 km");
  assert.equal(fmtDistance(1500, "tr"), "1.5 km");
});

test("trustLabel/trustChip: eşikler dilden bağımsız, metin dile bağlı", () => {
  assert.deepEqual(trustLabel(1200, "en"), { label: "established", tone: "pine" });
  assert.deepEqual(trustLabel(1200, "tr"), { label: "köklü", tone: "pine" });
  assert.equal(trustLabel(500, "en").tone, "pine");
  assert.equal(trustLabel(100, "en").tone, "stone");
  assert.equal(trustLabel(10, "en").tone, "ember");

  // Rozet eşiği 300 yorum (RealScoreBadge ile aynı).
  assert.equal(trustChip(300, "en"), "✓ trusted");
  assert.equal(trustChip(299, "en"), "few reviews");
  assert.equal(trustChip(300, "tr"), "✓ güvenilir");
  assert.equal(trustChip(299, "tr"), "az yorumlu");
});
