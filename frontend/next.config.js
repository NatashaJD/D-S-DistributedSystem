/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone only for Docker self-hosted; Vercel handles its own output
  ...(process.env.DOCKER_BUILD === '1' ? { output: 'standalone' } : {}),
};

module.exports = nextConfig;
