import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "商品详情 | 骆芷蝶智选",
  description: "查看商品详情、价格、规格，支持批发价会员和拿货会员优惠。",
};
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
