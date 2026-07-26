import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuidePage } from "@/components/guide/GuidePage";
import { loadGuide } from "@/lib/server/guideData";

// ISR (bkz. TR karşılığı) — build'de Google çağrısı yok, ziyaret başına DB cache.
export const revalidate = 86400;

type Params = { params: Promise<{ city: string; category: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { city, category } = await params;
  const data = await loadGuide("en", city, category);
  if (!data) return {};
  return {
    title: data.meta.title,
    description: data.meta.description,
    alternates: {
      canonical: data.meta.canonical,
      languages: { tr: data.meta.languages.tr, en: data.meta.languages.en, "x-default": data.meta.languages.tr },
    },
    openGraph: { title: data.meta.title, description: data.meta.description, type: "article" },
  };
}

export default async function CityCategoryPageEn({ params }: Params) {
  const { city, category } = await params;
  const data = await loadGuide("en", city, category);
  if (!data) notFound();

  return (
    <GuidePage
      locale="en"
      city={data.city}
      places={data.places}
      content={data.content}
      altHref={data.altHref}
      homeHref={data.homeHref}
      aboutHref={data.aboutHref}
      ctaHref={data.ctaHref}
      otherCategories={data.otherCategories}
      otherCities={data.otherCities}
    />
  );
}
