import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: process.cwd(),
  },
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  env: {
    WECHAT_MCHID: "1114330239",
    WECHAT_APIV2_KEY: "QqQq77137992Qq77137992Qq77137992",
    WECHAT_MINI_APPID: "wxe0ffec0a398de8b7",
    WECHAT_MP_APPID: "wxe0ffec0a398de8b7",
    WECHAT_NOTIFY_URL: "https://colour-choice.art/api/wechat-pay/notify",
  },
  // 反向代理：把三个独立 Vercel 项目经主站域名内嵌，绕过国内对 *.vercel.app 的封锁。
  // 各子项目已配置 basePath（/svc/xxx），资源与 API 自动带前缀，代理路径一致。
  async rewrites() {
    return [
      { source: "/svc/collectible", destination: "https://web3-collectible-luozhidies-projects.vercel.app/svc/collectible" },
      { source: "/svc/collectible/:path*", destination: "https://web3-collectible-luozhidies-projects.vercel.app/svc/collectible/:path*" },
      { source: "/svc/trace", destination: "https://chain-trace-smoky.vercel.app/svc/trace" },
      { source: "/svc/trace/:path*", destination: "https://chain-trace-smoky.vercel.app/svc/trace/:path*" },
      { source: "/svc/tryon", destination: "https://embodied-ai-eight.vercel.app/svc/tryon" },
      { source: "/svc/tryon/:path*", destination: "https://embodied-ai-eight.vercel.app/svc/tryon/:path*" },
    ];
  },
};

export default nextConfig;
