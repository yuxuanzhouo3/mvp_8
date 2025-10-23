/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 优化SSR配置，防止hydration问题
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
  // 确保构建时的严格模式
  reactStrictMode: true,
  // 优化编译输出
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

export default nextConfig
