/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone only for Docker self-hosted — Vercel handles its own output
  ...(process.env.DOCKER_BUILD === '1' ? { output: 'standalone' } : {}),
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000",
  },
};

module.exports = nextConfig;
