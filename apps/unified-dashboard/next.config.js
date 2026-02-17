/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Ensure shared packages are transpiled
  transpilePackages: ['@openrouter-crew/shared-ui-components', '@openrouter-crew/shared-schemas'],
};

module.exports = nextConfig;