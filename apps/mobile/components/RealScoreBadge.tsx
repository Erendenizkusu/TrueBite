import { Text, View, StyleSheet } from "react-native";
import type { ScoredPlace } from "@truebite/shared";
import { colors, font } from "@/lib/theme";
import { correction } from "@/lib/format";

/** İmza bileşen: RealScore (monospace) + ham puanın nasıl düzeltildiği. */
export function RealScoreBadge({ place, lead }: { place: ScoredPlace; lead?: boolean }) {
  const delta = correction(place); // negatif = aşağı çekildi (şişme elendi)
  const shrunk = delta != null && delta <= -0.08;
  const verified = delta != null && Math.abs(delta) < 0.08;

  return (
    <View style={{ alignItems: "flex-end" }}>
      <Text style={[s.score, { color: lead ? colors.ember : colors.ink, fontSize: lead ? 34 : 28 }]}>
        {place.realScore.toFixed(2)}
      </Text>
      <Text style={s.label}>REALSCORE</Text>
      <Text style={s.raw}>
        {place.rating != null ? `Google ★ ${place.rating.toFixed(1)}` : "puanlanmamış"}
      </Text>
      {delta != null && (
        <View style={[s.chip, { backgroundColor: shrunk ? colors.emberSoft : colors.pineSoft }]}>
          <Text style={[s.chipText, { color: shrunk ? colors.ember : colors.pine }]}>
            {shrunk
              ? `↓ ${delta.toFixed(2)} düzeltildi`
              : verified
                ? "≈ doğrulandı"
                : `↑ ${delta.toFixed(2)}`}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  score: { fontFamily: font.monoBold },
  label: { fontFamily: font.mono, fontSize: 9, letterSpacing: 1.5, color: colors.stone, marginTop: 4 },
  raw: { fontFamily: font.regular, fontSize: 12, color: colors.stone, marginTop: 6 },
  chip: { marginTop: 6, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  chipText: { fontFamily: font.monoBold, fontSize: 11 },
});
