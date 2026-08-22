import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: process.cwd(),
  },
  // 原生模块（@napi-rs/canvas）与含 wasm 的 @imgly 必须作为外部依赖，禁止被打包器内联
  serverExternalPackages: ['@napi-rs/canvas', '@imgly/background-removal', 'sharp'],
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
  // 微信小程序图片代理：把 Supabase 存储域名转发到本站已白名单的 colour-choice.art 域名，
  // 避免小程序需在微信公众平台单独为 Supabase 域名配置 downloadFile 合法域名。
  async rewrites() {
    return [
      {
        source: "/simg/:path*",
        destination: "https://fxeknwkmytzedkhplozn.supabase.co/:path*",
      },
      {
        source: "/sapimg/:path*",
        destination: "https://fxeknwkmytzedkhplozn.supabase.co/:path*",
      },
    ];
  },
  // 词元市场页面：用户常把复数 tokens-market 误打成单数 token-market，做 301 跳转兜底，避免 404
  async redirects() {
    return [
      {
        source: "/token-market",
        destination: "/tokens-market",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
