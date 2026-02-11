/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@openrouter-crew/shared-crew-coordination',
    '@openrouter-crew/shared-cost-tracking',
    '@openrouter-crew/shared-schemas',
    '@openrouter-crew/shared-ui-components'
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}

module.exports = nextConfig
