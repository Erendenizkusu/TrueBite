/**
 * RealScore birim + golden (drift) testleri.
 *
 * Sıfır bağımlılıkla çalışır: Node yerel TypeScript desteği + node:test.
 *   node --test src/realScore.test.ts
 *
 * Golden testler, TS implementasyonunun SQL `nearby_places` ile aynı sonucu ürettiğini
 * doğrular. Aynı KADIKOY_EXPECTED değerleri SQL kabul testinde de beklenir (drift kalkanı).
 */

import test from "node:test";
import assert from "node:assert/strict";

import { computeRegionStats, realScore, rankByRealScore, round3 } from "./realScore.ts";
import {
  KADIKOY_PLACES,
  KADIKOY_EXPECTED,
  KADIKOY_EXPECTED_ORDER,
} from "./fixtures/kadikoy.ts";

test("computeRegionStats — yorum-ağırlıklı C ve m (SQL ile eşleşir)", () => {
  const s = computeRegionStats(KADIKOY_PLACES);
  assert.equal(round3(s.cMean), 4.227); // C = Σ(R·v)/Σ(v) (ağırlıklı)
  assert.equal(round3(s.mConf), 1381.7); // m = düz ortalama yorum sayısı
});

test("yorum-ağırlıklı C: az-yorumlu yüksek puan prior'ı yukarı çekemez", () => {
  // Düz ortalama C = 4.8 olurdu; ağırlıklı C, 1000-yorumlu 4.6'ya yakın kalır.
  const s = computeRegionStats([
    { rating: 4.6, userRatingsTotal: 1000 },
    { rating: 5.0, userRatingsTotal: 10 },
  ]);
  assert.equal(round3(s.cMean), 4.604);
  assert.equal(round3(s.mConf), 505);
});

test("golden RealScore değerleri — SQL sözleşmesiyle birebir", () => {
  const s = computeRegionStats(KADIKOY_PLACES);
  for (const p of KADIKOY_PLACES) {
    assert.equal(round3(realScore(p, s)), KADIKOY_EXPECTED[p.id], p.name);
  }
});

test("sıralama — Köklü (4.6/4500) #1, Şişirilmiş (5.0/5) dibe iner", () => {
  const ranked = rankByRealScore(KADIKOY_PLACES);
  assert.deepEqual(
    ranked.map((r) => r.place.id),
    KADIKOY_EXPECTED_ORDER,
  );
  assert.equal(ranked[0]?.place.id, "demo_koklu");

  // Düz ortalamada #1 olması gereken 5.0 mekan, RealScore ile çok geriye düşer.
  const villainRank = ranked.findIndex((r) => r.place.id === "demo_sisirilmis");
  assert.ok(villainRank >= 5, `Şişirilmiş geriye düşmeli, indeks: ${villainRank}`);
});

// Aşağıdaki üç test SAF Bayesyen tabanı (güven terimsiz) doğrular → trustWeight=0.
test("puanı olmayan mekan (rating=null) tamamen prior C'ye çöker (β=0)", () => {
  const s = { cMean: 4.0, mConf: 100 };
  assert.equal(realScore({ rating: null, userRatingsTotal: 50 }, s, 0), 4.0);
});

test("az yorumlu yüksek puan, C'ye doğru çekilir (shrink; β=0)", () => {
  const s = { cMean: 4.0, mConf: 1000 };
  const score = realScore({ rating: 5.0, userRatingsTotal: 5 }, s, 0);
  assert.ok(score > 4.0 && score < 4.02, `beklenen ~4.0, alınan ${score}`);
});

test("çok yorumlu mekanda ham puan R baskınlaşır (β=0)", () => {
  const s = { cMean: 4.0, mConf: 1000 };
  const score = realScore({ rating: 4.6, userRatingsTotal: 100000 }, s, 0);
  assert.ok(score > 4.59, `R baskın olmalı, alınan ${score}`);
});

test("güven terimi: bölge-altı puanlı ama ÇOK yorumlu kanıtlanmış marka öne çıkar", () => {
  // Gerçek Rotterdam döner senaryosu (ekran görüntüsünden geri hesaplandı): C=4.10, m=306.
  const s = { cMean: 4.1, mConf: 306 };
  const proven = { rating: 4.2, userRatingsTotal: 1300 }; // Konya Lezzet tipi
  const shiny = { rating: 4.7, userRatingsTotal: 181 }; // az-yorumlu yüksek puan

  // SAF Bayesyen'de (β=0) parlak-ama-az-yorumlu öndedir (bölge-altı 4.2 asla öne geçemez):
  assert.ok(realScore(shiny, s, 0) > realScore(proven, s, 0));
  // Güven terimiyle (β=0.25) kanıtlanmış marka öne geçer:
  assert.ok(
    realScore(proven, s) > realScore(shiny, s),
    "kanıtlanmış (4.2/1300) parlak-az-yorumluyu (4.7/181) geçmeli",
  );
});

test("güven terimi skoru [0,5] dışına taşırmaz (clamp)", () => {
  const s = { cMean: 4.9, mConf: 50 };
  const score = realScore({ rating: 5.0, userRatingsTotal: 500000 }, s);
  assert.ok(score <= 5, `clamp: skor ≤ 5 olmalı, alınan ${score}`);
});

test("boş/puansız bölge — NaN ve nulls-last", () => {
  const places = [{ rating: null, userRatingsTotal: 0 }];
  const s = computeRegionStats(places);
  assert.ok(Number.isNaN(s.cMean));
  const ranked = rankByRealScore(places);
  assert.ok(Number.isNaN(ranked[0]?.realScore));
});
