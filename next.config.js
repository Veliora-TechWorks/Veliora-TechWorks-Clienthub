/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "veliora-tech-works-clienthub.vercel.app",
      ],
    },
  },
  images: {
    domains: ["avatars.githubusercontent.com", "lh3.googleusercontent.com"],
    formats: ["image/webp", "image/avif"],
  },
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Connection", value: "keep-alive" },
          { key: "Keep-Alive", value: "timeout=30" },
        ],
      },
    ]
  },
}

module.exports = nextConfig
