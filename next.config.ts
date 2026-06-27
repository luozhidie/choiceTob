import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
};

export default nextConfig;
