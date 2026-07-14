import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { DiscoverApp } from "@/components/DiscoverApp";
import { SiteFooter } from "@/components/SiteFooter";
import { alternates, getDict } from "@/lib/i18n";

const t = getDict("en");

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  alternates: { ...alternates("home"), canonical: "/en" },
  openGraph: { title: t.meta.title, description: t.meta.ogDescription, type: "website" },
};

export default function Home() {
  return (
    <>
      <SiteHeader locale="en" page="home" />
      <DiscoverApp locale="en" />
      <SiteFooter locale="en" />
    </>
  );
}
