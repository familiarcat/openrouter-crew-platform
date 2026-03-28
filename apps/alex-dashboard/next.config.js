/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@openrouter-crew/shared-schemas',
    '@openrouter-crew/shared-ui-components',
    '@openrouter-crew/shared-crew-coordination'
  ]
}

module.exports = nextConfig
