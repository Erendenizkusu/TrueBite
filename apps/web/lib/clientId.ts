/**
 * Anonim cihaz kimliği (maliyet güvenliği kotasının temeli — RELEASE.md § A).
 * localStorage'da kalıcı bir uuid tutar; her tarayıcı = bir "kullanıcı" → günlük kota
 * IP yerine cihaz bazında sayılır (paylaşımlı IP'de adil). Sunucuda X-Client-Id başlığıyla gider.
 */
const KEY = "truebite_cid";

export function getClientId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // localStorage kapalıysa (gizli mod vb.) oturumluk kimlik yeterli.
    return "no-storage";
  }
}
