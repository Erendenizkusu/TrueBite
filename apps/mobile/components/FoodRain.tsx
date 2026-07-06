import { useEffect, useRef } from "react";
import { Animated, Easing, Dimensions, StyleSheet } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";

const { width: W, height: H } = Dimensions.get("window");

type P = {
  e: string;
  left: number; // ekran genişliği oranı 0..1
  size: number;
  dur: number; // düşüş süresi (ms)
  rot: number; // toplam dönüş (deg)
  op: number;
  sway: number; // yatay salınım (px)
  swaydur: number;
  phase: number; // başlangıç dikey ilerleme 0..1 → ekran ilk karede dolu başlar
};

// Web FoodRain SPREAD_PIECES'ten uyarlandı — koyu-tema üzerinde metin arkasından düşük opaklıkta.
const PIECES: P[] = [
  { e: "🍔", left: 0.1, size: 34, dur: 15000, rot: -280, op: 0.5, sway: 14, swaydur: 5000, phase: 0.1 },
  { e: "🍕", left: 0.26, size: 30, dur: 18000, rot: 300, op: 0.42, sway: 12, swaydur: 6000, phase: 0.45 },
  { e: "☕", left: 0.42, size: 28, dur: 21000, rot: 220, op: 0.38, sway: 10, swaydur: 7000, phase: 0.7 },
  { e: "🥙", left: 0.58, size: 32, dur: 16000, rot: -240, op: 0.46, sway: 13, swaydur: 5400, phase: 0.25 },
  { e: "🍣", left: 0.74, size: 27, dur: 19000, rot: 360, op: 0.4, sway: 11, swaydur: 6400, phase: 0.6 },
  { e: "🍰", left: 0.88, size: 26, dur: 22000, rot: -180, op: 0.36, sway: 9, swaydur: 7600, phase: 0.85 },
  { e: "🍤", left: 0.34, size: 29, dur: 17500, rot: 280, op: 0.44, sway: 12, swaydur: 5800, phase: 0.35 },
  { e: "🍕", left: 0.66, size: 33, dur: 14500, rot: -320, op: 0.48, sway: 15, swaydur: 4900, phase: 0.15 },
  { e: "🍔", left: 0.82, size: 28, dur: 20000, rot: 240, op: 0.4, sway: 10, swaydur: 6800, phase: 0.55 },
  { e: "☕", left: 0.18, size: 26, dur: 23000, rot: -200, op: 0.35, sway: 8, swaydur: 8000, phase: 0.8 },
];

function Piece({ p }: { p: P }) {
  const startY = -p.size + p.phase * (H + p.size);
  const y = useRef(new Animated.Value(startY)).current;
  const sx = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // İlk tur: mevcut (dolu) konumdan dibe; sonra sürekli döngü (tepeden dibe).
    const first = Animated.timing(y, {
      toValue: H,
      duration: p.dur * (1 - p.phase),
      easing: Easing.linear,
      useNativeDriver: true,
    });
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -p.size, duration: 0, useNativeDriver: true }),
        Animated.timing(y, { toValue: H, duration: p.dur, easing: Easing.linear, useNativeDriver: true }),
      ]),
    );
    first.start(({ finished }) => {
      if (finished) loop.start();
    });

    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sx, { toValue: 1, duration: p.swaydur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sx, { toValue: 0, duration: p.swaydur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    swayLoop.start();

    return () => {
      first.stop();
      loop.stop();
      swayLoop.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotate = y.interpolate({
    inputRange: [-p.size, H],
    outputRange: ["0deg", `${p.rot}deg`],
    extrapolate: "clamp",
  });
  const translateX = sx.interpolate({ inputRange: [0, 1], outputRange: [-p.sway, p.sway] });

  return (
    <Animated.Text
      style={{
        position: "absolute",
        left: p.left * W,
        top: 0,
        fontSize: p.size,
        opacity: p.op,
        transform: [{ translateY: y }, { translateX }, { rotate }],
      }}
    >
      {p.e}
    </Animated.Text>
  );
}

/**
 * Dekoratif yiyecek yağmuru + üstte hafif sage parıltı — hero (liste yok) ekranının
 * arka plan katmanı. pointerEvents="none" → dokunuşları engellemez.
 */
export function FoodRain() {
  return (
    <Animated.View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="20%" r="65%">
            <Stop offset="0%" stopColor="#A9B27E" stopOpacity="0.14" />
            <Stop offset="100%" stopColor="#A9B27E" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
      </Svg>
      {PIECES.map((p, i) => (
        <Piece key={i} p={p} />
      ))}
    </Animated.View>
  );
}
