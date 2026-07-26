import type { MetadataRoute } from "next";

/** robots.txt — her şeye izin ver + sitemap konumunu bildir. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://volicious.app/sitemap.xml",
    host: "https://volicious.app",
  };
}
