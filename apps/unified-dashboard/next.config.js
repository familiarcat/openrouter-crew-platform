/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  output: 'standalone',
  // Ensure shared packages are transpiled
  transpilePackages: ['@openrouter-crew/shared-ui-components', '@openrouter-crew/shared-schemas'],
  webpack: (config) => {
    config.resolve.alias['react'] = path.dirname(require.resolve('react/package.json'));
    config.resolve.alias['react-dom'] = path.dirname(require.resolve('react-dom/package.json'));
    return config;
  },
};

module.exports = nextConfig;