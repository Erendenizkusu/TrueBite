import type { NextConfig } from "next";

const config: NextConfig = {
  // @truebite/shared TS kaynağı yayınlar; Next derlesin.
  transpilePackages: ["@truebite/shared"],
};

export default config;
