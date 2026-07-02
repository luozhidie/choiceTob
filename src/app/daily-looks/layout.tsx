import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "每日色彩搭配灵感 | 骆芷蝶智选",
  description: "每日精选穿搭灵感，根据个人色彩季型推荐搭配方案。VIP会员专享每日穿搭灵感，解锁更多精彩内容。",
  openGraph: {
    title: "每日色彩搭配灵感 | 骆芷蝶智选",
    description: "根据色彩季型推荐每日穿搭，VIP会员专属解锁更多",
    url: "https://colour-choice.art/daily-looks",
  },
};
export default function DailyLooksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
