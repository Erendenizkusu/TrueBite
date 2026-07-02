import type { NextConfig } from "next";

const config: NextConfig = {
  // @truebite/shared ve @truebite/core TS kaynağı yayınlar; Next derlesin.
  transpilePackages: ["@truebite/shared", "@truebite/core"],
};

export default config;
