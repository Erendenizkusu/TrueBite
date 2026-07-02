/**
 * Anonim cihaz kimliği (maliyet güvenliği kotasının temeli — RELEASE.md § A).
 * Sunucuya X-Client-Id başlığıyla gider; günlük kota IP yerine cihaz bazında sayılır.
 *
 * ⚠️ ŞİMDİLİK BELLEKTE: uygulama açık kaldığı sürece sabit, yeniden başlatınca değişir.
 * TODO: EAS/native build'e geçince expo-secure-store ile KALICI yap. AdMob rewarded ad
 * zaten Expo Go'da çalışmaz → native build'e geçerken bu da kalıcılaştırılacak.
 */
function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cached: string | null = null;

export function getClientId(): string {
  if (!cached) cached = uuid();
  return cached;
}
