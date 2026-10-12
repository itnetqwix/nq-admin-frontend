/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const { withSentryConfig } = require('@sentry/nextjs/config')

/** @type {import('next').NextConfig} */

const nextConfig = {
  trailingSlash: true,
  reactStrictMode: false,
  eslint: {
    // Materialize template has many lint warnings; don't block security dep trains.
    ignoreDuringBuilds: true
  },
  // The older CMS pages were duplicates of the main Banners and Tips pages. Keep their addresses
  // working (bookmarks, old links) by sending them to the canonical ones.
  async redirects() {
    return [
      { source: '/apps/cms/banners', destination: '/apps/banners', permanent: true },
      { source: '/apps/cms/tips', destination: '/apps/tips', permanent: true }
    ]
  },
  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      apexcharts: path.resolve(__dirname, './node_modules/apexcharts-clevision')
    }

    return config
  }
}

module.exports = withSentryConfig(nextConfig, {
  org: 'netqwix',
  project: 'admin-portal',
  // Source maps upload only when SENTRY_AUTH_TOKEN is set (CI); local builds skip it.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  telemetry: false
})
