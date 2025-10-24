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
  // 确保构建时的严格模式 - 生产环境可能有问题，暂时禁用
  reactStrictMode: false,
  // 优化编译输出 - 保留调试日志用于生产环境调试
  compiler: {
    removeConsole: false, // 保留console.log用于调试
  },
  // ✅ 启用生产环境 source map 以获取详细错误信息（简化版）
  productionBrowserSourceMaps: true,
}

export default nextConfig
