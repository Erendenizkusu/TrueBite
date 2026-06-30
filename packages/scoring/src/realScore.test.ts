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

test("computeRegionStats — bölge C ve m (SQL ile eşleşir)", () => {
  const s = computeRegionStats(KADIKOY_PLACES);
  assert.equal(round3(s.cMean), 4.27); // C
  assert.equal(round3(s.mConf), 1381.7); // m
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

test("puanı olmayan mekan (rating=null) tamamen prior C'ye çöker", () => {
  const s = { cMean: 4.0, mConf: 100 };
  assert.equal(realScore({ rating: null, userRatingsTotal: 50 }, s), 4.0);
});

test("az yorumlu yüksek puan, C'ye doğru çekilir (shrink)", () => {
  const s = { cMean: 4.0, mConf: 1000 };
  const score = realScore({ rating: 5.0, userRatingsTotal: 5 }, s);
  assert.ok(score > 4.0 && score < 4.02, `beklenen ~4.0, alınan ${score}`);
});

test("çok yorumlu mekanda ham puan R baskınlaşır", () => {
  const s = { cMean: 4.0, mConf: 1000 };
  const score = realScore({ rating: 4.6, userRatingsTotal: 100000 }, s);
  assert.ok(score > 4.59, `R baskın olmalı, alınan ${score}`);
});

test("boş/puansız bölge — NaN ve nulls-last", () => {
  const places = [{ rating: null, userRatingsTotal: 0 }];
  const s = computeRegionStats(places);
  assert.ok(Number.isNaN(s.cMean));
  const ranked = rankByRealScore(places);
  assert.ok(Number.isNaN(ranked[0]?.realScore));
});
