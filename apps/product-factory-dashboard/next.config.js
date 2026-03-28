/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@openrouter-crew/crew-core',
    '@openrouter-crew/shared-ui-components',
    '@openrouter-crew/shared-schemas',
    '@openrouter-crew/cost-tracking'
  ],
  // Fixes monorepo root detection warning and ensures correct file tracing
  outputFileTracingRoot: path.join(__dirname, '../../..'),
};

module.exports = nextConfig;
