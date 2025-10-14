/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['payload'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig