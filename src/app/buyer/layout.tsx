import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "买手选品 — 精选优质货源 | 骆芷蝶智选",
  description: "骆芷蝶智选买手选品页，精选十三行、沙河等批发市场优质货源，按色彩季型、风格精准匹配，一件起批支持拿货会员。",
  openGraph: {
    title: "买手选品 — 精选优质货源 | 骆芷蝶智选",
    description: "按色彩季型、风格精准选品，支持团购拼单和限时活动",
    url: "https://colour-choice.art/buyer",
  },
};
export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
