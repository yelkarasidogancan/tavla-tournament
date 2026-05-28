import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Docker için küçük ve bağımsız build
};

export default nextConfig;
