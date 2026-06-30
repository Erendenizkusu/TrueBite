/**
 * geohash testleri — sıfır bağımlılık (Node yerel TS + node:test).
 *   node --test src/geohash.test.ts
 */

import test from "node:test";
import assert from "node:assert/strict";

import { encodeGeohash, cellId, radiusBucket } from "./geohash.ts";

test("encodeGeohash — bilinen referans değeri (Wikipedia)", () => {
  // 57.64911, 10.40744 → u4pruydqqvj
  assert.equal(encodeGeohash(57.64911, 10.40744, 11), "u4pruydqqvj");
});

test("encodeGeohash — deterministik", () => {
  assert.equal(encodeGeohash(40.99, 29.03, 7), encodeGeohash(40.99, 29.03, 7));
});

test("geohash iç içe geçer — düşük precision, yüksek precision'ın ön ekidir", () => {
  const lo = encodeGeohash(40.99, 29.03, 5);
  const hi = encodeGeohash(40.99, 29.03, 8);
  assert.equal(hi.slice(0, 5), lo);
});

test("cellId — çok yakın iki nokta aynı hücreye düşer (precision 6)", () => {
  // ~birkaç metre fark
  assert.equal(cellId(40.9900, 29.0300, 6), cellId(40.99005, 29.03005, 6));
});

test("radiusBucket — yukarı yuvarlar", () => {
  assert.equal(radiusBucket(1500, 500), 3);
  assert.equal(radiusBucket(1501, 500), 4);
  assert.equal(radiusBucket(1500), 3); // varsayılan bucket 500
});

test("geçersiz koordinat reddedilir", () => {
  assert.throws(() => encodeGeohash(91, 0));
  assert.throws(() => encodeGeohash(0, 181));
});
