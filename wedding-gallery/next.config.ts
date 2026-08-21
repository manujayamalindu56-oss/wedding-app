import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // මේකෙන් ESLint වැරදි මඟහරියි
  eslint: {
    ignoreDuringBuilds: true,
  },
  // මේකෙන් TypeScript වැරදි මඟහරියි
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;