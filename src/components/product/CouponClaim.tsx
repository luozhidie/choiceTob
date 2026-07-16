"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface CouponTemplate {
  id: string;
  title: string;
  discount_desc: string | null;
  min_amount: number;
  discount_amount: number;
  coupon_type: string;
  valid_days: number;
  per_user_limit: number;
  total_limit: number;
  claimed_count: number;
}

interface Props {
  templates: CouponTemplate[];
  claimedIds: string[];
  loggedIn: boolean;
  onClaim: (id: string) => Promise<{ ok: boolean; error?: string; already?: boolean }>;
}

export default function CouponClaim({ templates, claimedIds, loggedIn, onClaim }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!templates.length) return null;

  const handle = async (id: string) => {
    if (!loggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (claimedIds.includes(id) || loadingId) return;
    setLoadingId(id);
    setToast(null);
    const res = await onClaim(id);
    setLoadingId(null);
    if (res.ok) {
      setToast("领取成功，已存入卡券包");
    } else if (res.already) {
      setToast("您已领取过该券");
    } else {
      setToast(res.error || "领取失败");
    }
    if (res.ok || res.already) {
      setTimeout(() => setToast(null), 2000);
    } else {
      setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🎟️</span>
        <h2 className="text-base font-bold text-primary">领券中心</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {templates.map((t) => {
          const claimed = claimedIds.includes(t.id);
          const soldOut = t.total_limit > 0 && t.claimed_count >= t.total_limit;
          const disabled = claimed || soldOut || loadingId === t.id;
          return (
            <div
              key={t.id}
              className="relative shrink-0 w-36 rounded-xl overflow-hidden border border-rose-200 bg-rose-50"
            >
              {/* 票券左侧金额 */}
              <div className="px-3 py-2.5 bg-gradient-to-br from-rose-500 to-pink-500 text-white">
                <div className="text-xl font-black leading-none">
                  ¥{(t.discount_amount / 100).toFixed(t.discount_amount % 100 === 0 ? 0 : 2)}
                </div>
                <div className="text-[10px] mt-1 opacity-90 truncate">{t.discount_desc || t.title}</div>
              </div>
              {/* 票券右侧信息 + 按钮 */}
              <div className="px-3 py-2 flex flex-col items-center">
                <div className="text-[11px] text-gray-500 mb-1.5 text-center truncate w-full">
                  {t.min_amount > 0 ? `满${(t.min_amount / 100)}元可用` : "无门槛"}
                </div>
                <button
                  disabled={disabled}
                  onClick={() => handle(t.id)}
                  className={`w-full py-1.5 rounded-full text-xs font-bold transition-colors ${
                    claimed
                      ? "bg-gray-100 text-gray-400"
                      : soldOut
                      ? "bg-gray-100 text-gray-400"
                      : "bg-rose-500 text-white hover:bg-rose-600 active:scale-95"
                  }`}
                >
                  {claimed ? "已领取" : soldOut ? "已抢光" : loadingId === t.id ? "领取中…" : "立即领取"}
                </button>
              </div>
              {/* 虚线分隔 */}
              <div className="absolute left-0 right-0 top-[58px] border-t border-dashed border-rose-200" />
            </div>
          );
        })}
      </div>

      {toast && (
        <div className="mt-2 text-center text-xs text-rose-600 font-medium">{toast}</div>
      )}
      <p className="text-[11px] text-gray-400 mt-2">优惠券领取后存入「我的卡券」，结算时可用</p>
    </section>
  );
}
