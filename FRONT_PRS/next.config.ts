import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',  // Requerido para Docker
};

export default nextConfig;
