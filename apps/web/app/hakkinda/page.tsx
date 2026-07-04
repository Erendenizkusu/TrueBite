import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hakkında — Volicious nasıl çalışır?",
  description:
    "Volicious, sahte ve şişirilmiş puanları eleyip binlerce yorumu ağırlıklandırarak konumundaki gerçekten en iyi mekanları gösterir. Nasıl çalıştığını anlattık.",
};

// AdSense onayı + kullanıcı güveni için içerik sayfası. Formül/iç-mekanik GÖSTERİLMEZ
// (web-homepage-direction): yalnızca değer anlatılır, müşteri-dostu dille.
export default function HakkindaPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
      <Link href="/" className="font-mono text-xs uppercase tracking-[0.18em] text-sage hover:underline">
        ← Volicious
      </Link>

      <h1 className="mt-6 font-display text-3xl font-semibold tracking-[-0.01em] sm:text-4xl">
        Sahte yorum yok, sadece en iyi mekanlar
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-stone">
        Volicious, konumuna en yakın <strong className="text-ink">gerçekten</strong> en iyi mekanları
        bulmanı sağlayan bir keşif aracıdır. Bir tıkla, çevrendeki en popüler ve dürüst puanlı yerleri
        önüne getirir — reklam kokan listeler ya da şişirilmiş beş yıldızlar değil.
      </p>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-ink/90">
        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">Çözdüğümüz problem</h2>
          <p className="mt-3 text-stone">
            Çoğu harita uygulamasında puanlar <strong className="text-ink">düz ortalamadır</strong>.
            Bu yüzden daha yeni açılmış, topu topu 5 yorumla 5.0 almış bir mekan; yıllardır hizmet
            veren, 4.000 yorumla 4.6 almış köklü bir mekanın önüne geçebilir. Oysa hangisinin
            gerçekten iyi olduğunu ikinci mekanın binlerce deneyimi anlatır. Bu çarpıklık, yanlış
            yere gitmene yol açar.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">Nasıl yardımcı oluyoruz</h2>
          <p className="mt-3 text-stone">
            Volicious, bir mekanın puanını <strong className="text-ink">yorum sayısına göre
            ağırlıklandırır</strong>. Az sayıda yoruma dayanan şişirilmiş puanlar temkinle
            değerlendirilir; binlerce gerçek deneyimle desteklenen puanlar öne çıkar. Böylece
            listenin tepesinde <strong className="text-ink">güvenebileceğin</strong> yerler kalır.
            Sana bir formül ya da karmaşık grafik göstermeyiz — sadece sonucu: nereye gitmen
            gerektiğini.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">Yorumlardan öne çıkanlar</h2>
          <p className="mt-3 text-stone">
            Bir mekana dokunduğunda, gerçek yorumlardan derlenmiş kısa özet etiketleri görürsün
            (örneğin lezzet, temizlik, servis hızı, personel). Yüzlerce satır yorumu okumadan, bir
            yerin neyde iyi olduğunu saniyeler içinde anlarsın.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">Gizliliğe saygılı</h2>
          <p className="mt-3 text-stone">
            Hesap oluşturmana gerek yok; adını, e-postanı toplamayız. Konumunu yalnızca sen
            &quot;listele&quot;ye bastığında, yakınındaki mekanları bulmak için kullanırız. Detaylar{" "}
            <Link href="/gizlilik" className="text-sage underline-offset-2 hover:underline">
              Gizlilik Politikası
            </Link>{" "}
            sayfasında.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">Nasıl kullanılır</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-stone">
            <li>Ana sayfada bir kategori seç (örneğin kahvaltı, kebap, kafe).</li>
            <li>&quot;Konumumdaki en popülerleri listele&quot; butonuna dokun.</li>
            <li>Çevrendeki en iyi mekanlar, dürüst puanlarıyla sıralı karşında.</li>
          </ol>
        </section>
      </div>

      <div className="mt-12 border-t border-line pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-paper transition hover:-translate-y-0.5"
        >
          Hadi keşfe başla →
        </Link>
      </div>
    </main>
  );
}
