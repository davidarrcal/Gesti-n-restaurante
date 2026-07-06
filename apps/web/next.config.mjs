/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const api = process.env.API_URL ?? "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${api}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;