/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // No longer need better-sqlite3 since we migrated to Supabase
    // serverComponentsExternalPackages: ['better-sqlite3'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Force dynamic rendering - SQLite doesn't work in static generation
  output: 'standalone',
};

export default nextConfig;
