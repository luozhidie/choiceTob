"use client";

import Link from "next/link";
import { MEMBER_TIERS, formatDiscountRate, formatRebateRate } from "@/lib/discount";

interface Props {
  membershipType?: string | null;
  expiresAt?: string | null;
}

// 把 profile.membership_type 映射到展示档位与权益
function resolveTier(key?: string | null) {
  if (!key || key === "none") return null;
  return MEMBER_TIERS.find((t) => t.key === key) || null;
}

function buildBenefits(tier: any): string[] {
  const b: string[] = [];
  if (tier.discount < 1) b.push(`商品享${formatDiscountRate(tier.discount)}`);
  if (tier.rebate > 0) b.push(`下单返${formatRebateRate(tier.rebate)}返利`);
  if (tier.category === "price") b.push("可查看全部商品批发价");
  if (tier.category === "wholesale") b.push("同色同款 3 件起批 · 2.8 折拿货");
  if (tier.category === "mall") b.push("商城服务与资源优惠");
  return b;
}

export default function MembershipCard({ membershipType, expiresAt }: Props) {
  const key = membershipType || "none";
  const tier = resolveTier(key);

  // 非会员 / 未识别档位 → 开通引导
  if (!tier) {
    const special =
      key === "view_price"
        ? { icon: "👁️", label: "价格会员", desc: "已开通，可查看全部商品批发价" }
        : key === "deposit_discount"
        ? { icon: "📦", label: "拿货会员", desc: "已开通，充值即享拿货折扣" }
        : null;

    if (special) {
      return (
        <section className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{special.icon}</span>
            <h2 className="text-base font-bold text-amber-800">您的会员权益</h2>
          </div>
          <p className="text-sm text-amber-700">{special.label} · {special.desc}</p>
          <Link href="/vip" className="inline-block mt-2 text-xs text-amber-700 hover:text-amber-800 font-medium">
            查看全部会员权益 →
          </Link>
        </section>
      );
    }

    // 纯非会员：展示开通引导 + 各档速览
    const showcase = MEMBER_TIERS.filter((t) => t.category === "mall" || t.category === "wholesale");
    return (
      <section className="bg-white border border-gray-100 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">👑</span>
          <h2 className="text-base font-bold text-primary">开通会员 · 享专属折扣</h2>
        </div>
        <div className="space-y-2">
          {showcase.map((t) => (
            <div key={t.key} className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{t.icon} {t.label}</span>
              <span className="text-accent font-semibold">
                {t.discount < 1 ? formatDiscountRate(t.discount) : ""}
                {t.rebate > 0 ? ` +${formatRebateRate(t.rebate)}返利` : ""}
              </span>
            </div>
          ))}
        </div>
        <Link
          href="/vip"
          className="block mt-3 text-center py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-bold"
        >
          查看全部会员权益 →
        </Link>
      </section>
    );
  }

  // 会员：展示自身等级权益
  const benefits = buildBenefits(tier);
  return (
    <section className={`border rounded-2xl p-4 ${tier.color}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{tier.icon}</span>
        <div>
          <h2 className="text-base font-bold">您的会员权益</h2>
          <p className="text-xs opacity-80">当前等级：{tier.label}</p>
        </div>
      </div>
      <ul className="space-y-1.5">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-1.5 text-sm">
            <span className="mt-0.5">✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {expiresAt && (
        <p className="text-xs opacity-70 mt-2">有效期至 {expiresAt.slice(0, 10)}</p>
      )}
      <Link href="/vip" className="inline-block mt-2 text-xs font-medium opacity-90 hover:opacity-100">
        查看全部会员权益 →
      </Link>
    </section>
  );
}
