import type { NextConfig } from "next";

// Vercel-only topoloji: web + backend (@truebite/core) tek Next.js uygulaması (bkz. DEPLOY.md).
const config: NextConfig = {
  // @truebite/shared ve @truebite/core TS kaynağı yayınlar; Next derlesin.
  transpilePackages: ["@truebite/shared", "@truebite/core"],
};

export default config;
