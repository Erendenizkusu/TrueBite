/**
 * Görsel format yardımcıları testi — saf, sıfır bağımlılık (Node yerel TS + node:test).
 *   node --test lib/format.test.ts
 */

import test from "node:test";
import assert from "node:assert/strict";

import { trustLabel, fmtDistance, fmtReviews, correction } from "./format.ts";

test("trustLabel — yorum eşikleri", () => {
  assert.equal(trustLabel(4500).label, "köklü");
  assert.equal(trustLabel(600).label, "güvenilir");
  assert.equal(trustLabel(60).label, "yeni sayılır");
  assert.equal(trustLabel(5).label, "az yorumlu");
  assert.equal(trustLabel(5).tone, "ember");
});

test("fmtDistance — m / km", () => {
  assert.equal(fmtDistance(120), "120 m");
  assert.equal(fmtDistance(2000), "2.0 km");
});

test("fmtReviews — binlik kısaltma (B)", () => {
  assert.equal(fmtReviews(4500), "4.5 B yorum");
  assert.equal(fmtReviews(150), "150 yorum");
});

test("correction — düzeltme yönü", () => {
  // Şişirilmiş: 5.0 → 4.27 = aşağı çekildi
  const sisirilmis = { rating: 5.0, realScore: 4.27 } as any;
  assert.ok(correction(sisirilmis)! < -0.5);
  // Puanı yok → null
  assert.equal(correction({ rating: null, realScore: 4.0 } as any), null);
});
