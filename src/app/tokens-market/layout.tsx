import type { Metadata } from "next";

const SITE = "https://colour-choice.art";

// 服务端 metadata：让 Google 收录英文版 /tokens-market（hreflang + canonical + OG）
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Luo Zhidie Choice · Token Market — Callable Buying Expertise API",
    template: "%s · Luo Zhidie Choice",
  },
  description:
    "Years of fashion buying expertise packaged as callable tokens (词元). License AI buying-judgment API for cross-border sellers. Pay-per-call, only verdicts returned — your IP stays private.",
  keywords: [
    "token market",
    "buying expertise API",
    "fashion selection AI",
    "cross-border sourcing",
    "选品判断 API",
    "词元市场",
    "服装选品",
  ],
  alternates: {
    canonical: "/tokens-market",
    languages: {
      en: "/tokens-market",
      "zh-Hans": "/tokens-market",
      "x-default": "/tokens-market",
    },
  },
  openGraph: {
    type: "website",
    url: "/tokens-market",
    siteName: "Luo Zhidie Choice",
    title: "Luo Zhidie Choice · Token Market — Callable Buying Expertise API",
    description:
      "License AI buying-judgment tokens via API. Pay-per-call for cross-border sellers. Verdicts only — IP protected.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Luo Zhidie Choice · Token Market",
    description: "Callable buying expertise API for cross-border sellers. Pay-per-call, IP protected.",
  },
  robots: { index: true, follow: true },
};

export default function TokensMarketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
