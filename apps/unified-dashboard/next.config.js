/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: [
    "@openrouter-crew/shared-ui-components",
    "@openrouter-crew/crew-api-client",
    "@openrouter-crew/shared-schemas",
    "@openrouter-crew/shared-cost-tracking",
    "@openrouter-crew/shared-crew-coordination"
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;