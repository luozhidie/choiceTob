import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // 强制所有页面动态渲染，禁用所有缓存
  output: "standalone",
  // 强制刷新浏览器缓存（改版本号就重新部署）
  generateEtags: false,
  headers: async () => [
    {
      source: "/admin/image-grabber",
      headers: [
        { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
        { key: "Pragma", value: "no-cache" },
        { key: "Expires", value: "0" },
      ],
    },
    {
      source: "/api/admin/image-grabber/:path*",
      headers: [
        { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
      ],
    },
  ],
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
  // 微信支付环境变量（构建时注入）
  env: {
    WECHAT_MCHID: "1114330239",
    WECHAT_APIV2_KEY: "QqQq77137992Qq77137992Qq77137992",
    WECHAT_MINI_APPID: "wxe0ffec0a398de8b7",
    WECHAT_MP_APPID: "wxe0ffec0a398de8b7",
    WECHAT_NOTIFY_URL: "https://colour-choice.art/api/wechat-pay/notify",
  },
};

export default nextConfig;
