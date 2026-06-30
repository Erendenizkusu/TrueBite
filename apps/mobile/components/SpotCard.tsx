import { Text, View, StyleSheet } from "react-native";
import type { ScoredPlace } from "@truebite/shared";
import { colors, font } from "@/lib/theme";
import { fmtDistance, fmtReviews, trustLabel, type Tone } from "@/lib/format";
import { RealScoreBadge } from "./RealScoreBadge";

const tone: Record<Tone, string> = {
  pine: colors.pine,
  ember: colors.ember,
  stone: colors.stone,
};

export function SpotCard({ place, rank }: { place: ScoredPlace; rank: number }) {
  const lead = rank === 1;
  const trust = trustLabel(place.userRatingsTotal);

  return (
    <View style={[s.card, lead && s.cardLead]}>
      <Text style={[s.rank, { color: lead ? colors.ember : colors.stone }]}>
        {String(rank).padStart(2, "0")}
      </Text>

      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={s.name} numberOfLines={2}>
          {place.name}
        </Text>
        <View style={s.meta}>
          <Text style={s.metaText}>{fmtDistance(place.distanceM)}</Text>
          <Text style={s.dot}>·</Text>
          <Text style={s.metaText}>{fmtReviews(place.userRatingsTotal)}</Text>
          <Text style={s.dot}>·</Text>
          <Text style={[s.metaText, { color: tone[trust.tone], fontFamily: font.semibold }]}>
            {trust.label}
          </Text>
        </View>
      </View>

      <RealScoreBadge place={place} lead={lead} />
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  cardLead: { borderTopColor: "rgba(21,20,15,0.2)" },
  rank: { fontFamily: font.monoBold, fontSize: 18, width: 34, paddingTop: 2 },
  name: { fontFamily: font.bold, fontSize: 19, color: colors.ink, letterSpacing: -0.3 },
  meta: { flexDirection: "row", alignItems: "center", marginTop: 6, flexWrap: "wrap" },
  metaText: { fontFamily: font.regular, fontSize: 13, color: colors.stone },
  dot: { color: colors.line, marginHorizontal: 6 },
});
