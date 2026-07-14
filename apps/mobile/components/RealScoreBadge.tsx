import { Text, View, StyleSheet } from "react-native";
import type { ScoredPlace } from "@truebite/shared";
import { colors, font } from "@/lib/theme";
import { t } from "@/lib/i18n";
import { trustChip } from "@/lib/format";

/**
 * Müşteri-dostu rozet (web ile aynı): büyük Volicious Puanı + kanıt olarak ham Google
 * puanı + tek net güven etiketi. İç-mekanik (delta/"düzeltildi") GÖSTERİLMEZ.
 *   - çok yorumlu → "✓ güvenilir"   - az yorumlu → "az yorumlu"
 */
export function RealScoreBadge({ place, lead }: { place: ScoredPlace; lead?: boolean }) {
  const strong = place.userRatingsTotal >= 300;

  return (
    <View style={{ alignItems: "flex-end" }}>
      <Text style={[s.score, { color: lead ? colors.ember : colors.ink, fontSize: lead ? 32 : 27 }]}>
        {place.realScore.toFixed(2)}
      </Text>
      <Text style={s.label}>{t.spot.scoreLabel}</Text>
      {place.rating != null && (
        <Text style={s.raw}>Google ★ {place.rating.toFixed(1)}</Text>
      )}
      <View style={[s.chip, { backgroundColor: strong ? colors.sageSoft : colors.emberSoft }]}>
        <Text style={[s.chipText, { color: strong ? colors.sageInk : colors.emberInk }]}>
          {trustChip(place.userRatingsTotal)}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  score: { fontFamily: font.monoBold },
  label: { fontFamily: font.mono, fontSize: 9, letterSpacing: 1.5, color: colors.stone, marginTop: 5 },
  raw: { fontFamily: font.regular, fontSize: 12, color: colors.stone, marginTop: 6 },
  chip: { marginTop: 7, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  chipText: { fontFamily: font.semibold, fontSize: 11 },
});
