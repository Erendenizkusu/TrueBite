import { useState } from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { ScoredPlace } from "@truebite/shared";
import { colors, font } from "@/lib/theme";
import { fmtDistance, fmtReviews, trustLabel, type Tone } from "@/lib/format";
import { fetchHighlights } from "@/lib/api";
import { RealScoreBadge } from "./RealScoreBadge";

const tone: Record<Tone, string> = {
  pine: colors.pine,
  ember: colors.ember,
  stone: colors.stone,
};

export function SpotCard({ place, rank }: { place: ScoredPlace; rank: number }) {
  const lead = rank === 1;
  const trust = trustLabel(place.userRatingsTotal);
  const [open, setOpen] = useState(false);

  // AI öne çıkanları YALNIZCA kart açılınca çek (lazy — maliyet kullanıcı niyetiyle tetiklenir).
  // Sonuç placeId başına cache'li (backend) → ikinci açış AI'a para ödetmez.
  const { data, isFetching } = useQuery({
    queryKey: ["highlights", place.placeId],
    queryFn: () => fetchHighlights(place.placeId),
    enabled: open,
    staleTime: 1000 * 60 * 60,
    retry: false,
  });
  const tags = data?.tags ?? [];

  return (
    <Pressable onPress={() => setOpen((v) => !v)} style={[s.card, lead && s.cardLead]}>
      <View style={s.row}>
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

      {open && (
        <View style={s.panel}>
          <Text style={s.panelLabel}>YORUMLARDAN ÖNE ÇIKANLAR</Text>
          {isFetching ? (
            <Text style={s.panelMuted}>derleniyor…</Text>
          ) : tags.length > 0 ? (
            <View style={s.tags}>
              {tags.map((t) => (
                <View key={t} style={s.tag}>
                  <Text style={s.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={s.panelMuted}>Bu mekân için henüz öne çıkan bir özellik derleyemedik.</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  cardLead: { borderTopColor: "rgba(169,178,126,0.5)" },
  row: { flexDirection: "row", alignItems: "flex-start" },
  rank: { fontFamily: font.monoBold, fontSize: 18, width: 34, paddingTop: 2 },
  name: { fontFamily: font.bold, fontSize: 19, color: colors.ink, letterSpacing: -0.3 },
  meta: { flexDirection: "row", alignItems: "center", marginTop: 6, flexWrap: "wrap" },
  metaText: { fontFamily: font.regular, fontSize: 13, color: colors.stone },
  dot: { color: colors.line, marginHorizontal: 6 },

  panel: {
    marginTop: 14,
    marginLeft: 34,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderStyle: "dashed",
  },
  panelLabel: { fontFamily: font.mono, fontSize: 10, letterSpacing: 1.4, color: colors.stone, marginBottom: 8 },
  panelMuted: { fontFamily: font.regular, fontSize: 13, color: colors.stone },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    borderWidth: 1,
    borderColor: "rgba(169,178,126,0.45)",
    backgroundColor: "rgba(169,178,126,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: { fontFamily: font.semibold, fontSize: 12, color: colors.pine },
});
