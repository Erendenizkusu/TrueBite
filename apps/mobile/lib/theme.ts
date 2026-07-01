// TrueBite mobil tasarım belirteçleri — web ile aynı "Ölçülmüş dürüstlük" (koyu müze) dili.

export const colors = {
  paper: "#17130D", // derin sıcak charcoal — zemin
  surface: "#211C14", // yükseltilmiş yüzey (kart/çip)
  ink: "#ECE4D3", // birincil metin — sıcak krem
  stone: "#A99E88", // ikincil metin — soluk taupe
  line: "#38311F", // koyu sıcak kenarlık/ayraç
  sand: "#2C261B", // iskelet/blok tonu

  // Adaçayı/zeytin — birincil vurgu (CTA, etkileşim, "güvenilir")
  sage: "#A9B27E",
  sageSoft: "#2A3220",
  sageInk: "#C3CD97",

  // Ember/amber — sıcak odak + "az yorumlu" uyarısı
  ember: "#FF6A3D",
  emberSoft: "#3A2418",
  emberInk: "#FFB38F",

  // Geriye dönük uyum (trustLabel "pine" tonu adaçayına eşlenir)
  pine: "#C3CD97",
  pineSoft: "#2A3220",
} as const;

// @expo-google-fonts dışa aktarım adlarıyla birebir eşleşir (useFonts ile yüklenir).
export const font = {
  regular: "HankenGrotesk_400Regular",
  medium: "HankenGrotesk_500Medium",
  semibold: "HankenGrotesk_600SemiBold",
  bold: "HankenGrotesk_700Bold",
  extrabold: "HankenGrotesk_800ExtraBold",
  mono: "JetBrainsMono_500Medium",
  monoBold: "JetBrainsMono_700Bold",
  // Display serif (roman + italik) — yalnızca hero başlığı + bölüm başlıkları
  display: "Fraunces_600SemiBold",
  displayItalic: "Fraunces_500Medium_Italic",
} as const;

export const radius = { pill: 999, card: 18 } as const;
