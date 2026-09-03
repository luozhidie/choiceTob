"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, DollarSign, Package, AlertTriangle } from "lucide-react";

// 默认值（与 src/lib/price-config.ts 兜底一致）
type WholesaleTier = { name: string; amountFen: number; discount: number; returnRate: number };
const DEFAULT_TIERS: Record<string, WholesaleTier> = {
  wholesale_6k: { name: "会员·首充6000", amountFen: 600000, discount: 0.28, returnRate: 0 },
  wholesale_5w: { name: "充值会员·5万", amountFen: 5000000, discount: 0.28, returnRate: 0.05 },
  wholesale_10w: { name: "充值会员·10万", amountFen: 10000000, discount: 0.28, returnRate: 0.10 },
  wholesale_30w: { name: "充值会员·30万", amountFen: 30000000, discount: 0.26, returnRate: 0.20 },
};
const DEFAULT_VIRTUAL: Record<string, number> = {
  tryon_first_9_9: 990,
  tryon_normal_99: 9900,
  tryon_normal_299: 29900,
  tryon_pro_998: 99800,
  tryon_test_cent: 100,
  daily_looks_monthly: 99900,
  daily_looks_yearly: 999900,
  articles_monthly: 13800,
  articles_yearly: 138000,
};
const PRODUCT_LABELS: Record<string, string> = {
  tryon_first_9_9: "试衣 · 首单9.9",
  tryon_normal_99: "试衣 · 标准99",
  tryon_normal_299: "试衣 · 高级299",
  tryon_pro_998: "虚拟试衣会员 · 998",
  tryon_test_cent: "链路测试 0.01",
  daily_looks_monthly: "每日搭配 · 月999",
  daily_looks_yearly: "每日搭配 · 年9980",
  articles_monthly: "时尚资讯 · 月138",
  articles_yearly: "时尚资讯 · 年1380",
};

function yuan(fen: number) {
  return (fen / 100).toFixed(2).replace(/\.00$/, "");
}

export default function PriceConfigPage() {
  const [tiers, setTiers] = useState<Record<string, WholesaleTier>>(DEFAULT_TIERS);
  const [virtual, setVirtual] = useState<Record<string, number>>(DEFAULT_VIRTUAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/public/settings?keys=wholesale_tiers,virtual_goods_prices");
        const json = await res.json();
        const d = json.data || {};
        if (d.wholesale_tiers) setTiers({ ...DEFAULT_TIERS, ...d.wholesale_tiers });
        if (d.virtual_goods_prices) setVirtual({ ...DEFAULT_VIRTUAL, ...d.virtual_goods_prices });
      } catch (e) {
        // 读取失败则用默认值
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function saveOne(key: string, value: any) {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "保存失败");
  }

  async function saveAll() {
    setSaving(true);
    try {
      await saveOne("wholesale_tiers", tiers);
      await saveOne("virtual_goods_prices", virtual);
      setToast({ type: "success", message: "价格与折扣已保存，立即生效（前端展示文案请在「会员充值文案」页同步）" });
    } catch (e: any) {
      setToast({ type: "error", message: "保存失败：" + e.message });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  }

  function setTierName(id: string, name: string) {
    setTiers((prev) => ({ ...prev, [id]: { ...prev[id], name } }));
  }
  function setTierAmountYuan(id: string, yuanStr: string) {
    const yuan = Math.max(0, Number(yuanStr) || 0);
    setTiers((prev) => ({ ...prev, [id]: { ...prev[id], amountFen: Math.round(yuan * 100) } }));
  }
  function setTierDiscount(id: string, zheStr: string) {
    const zhe = Math.max(0, Math.min(10, Number(zheStr) || 0));
    setTiers((prev) => ({ ...prev, [id]: { ...prev[id], discount: Math.round(zhe * 100) / 1000 } }));
  }
  function setTierReturnRate(id: string, pctStr: string) {
    const pct = Math.max(0, Math.min(100, Number(pctStr) || 0));
    setTiers((prev) => ({ ...prev, [id]: { ...prev[id], returnRate: Math.round(pct * 100) / 10000 } }));
  }
  function setVirtualYuan(id: string, yuanStr: string) {
    const yuan = Math.max(0, Number(yuanStr) || 0);
    setVirtual((prev) => ({ ...prev, [id]: Math.round(yuan * 100) }));
  }

  if (loading)
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" /> 加载中…
      </div>
    );

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-accent" /> 套餐价格与折扣配置
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          此处为<strong>实际计费金额 / 拿货折扣 / 退换额度</strong>的权威来源，改完保存即生效，无需审核、无需改代码。
        </p>
      </div>

      {toast && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            toast.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* 充值档位 */}
      <section className="bg-white rounded-xl border border-border p-5 mb-5">
        <h2 className="font-bold text-primary mb-1 flex items-center gap-2">
          <Package className="w-4 h-4 text-accent" /> 充值货款档位（金额 / 折扣 / 退换）
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          小程序/网站前端只传档位 ID，金额与折扣一律以这里为准，防止前端篡改。折扣改后影响<strong>新充值</strong>用户，老用户按原档位不变。
        </p>
        <div className="space-y-4">
          {Object.entries(tiers).map(([id, tier]) => (
            <div key={id} className="border border-border rounded-lg p-3">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-gray-400 w-28 shrink-0">{id}</span>
                <input
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  value={tier.name}
                  onChange={(e) => setTierName(id, e.target.value)}
                  placeholder="档位名称"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">充值金额 ¥</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-32 px-2 py-1.5 border border-border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent/40"
                    value={Number((tier.amountFen / 100).toFixed(2))}
                    onChange={(e) => setTierAmountYuan(id, e.target.value)}
                  />
                </label>
                <label className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">折扣</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    className="w-20 px-2 py-1.5 border border-border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent/40"
                    value={Number((tier.discount * 10).toFixed(1))}
                    onChange={(e) => setTierDiscount(id, e.target.value)}
                  />
                  <span className="text-xs text-gray-400">折</span>
                </label>
                <label className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">退换</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    className="w-20 px-2 py-1.5 border border-border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent/40"
                    value={Math.round(tier.returnRate * 100)}
                    onChange={(e) => setTierReturnRate(id, e.target.value)}
                  />
                  <span className="text-xs text-gray-400">%</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 虚拟道具价格 */}
      <section className="bg-white rounded-xl border border-border p-5 mb-5">
        <h2 className="font-bold text-primary mb-1 flex items-center gap-2">
          <Package className="w-4 h-4 text-accent" /> 虚拟道具价格（试衣 / 每日搭配 / 资讯）
        </h2>
        <div className="flex items-start gap-2 mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            此类为微信<strong>虚拟支付</strong>道具。改价后除保存本页，还需到
            <strong>微信 MP 后台 → 虚拟支付 → 道具管理</strong>同步改价并发布，两边价格必须一致，否则支付校验失败。
            小程序端无需重新审核。
          </span>
        </div>
        <div className="space-y-3">
          {Object.entries(virtual).map(([id, fen]) => (
            <div key={id} className="flex items-center gap-3">
              <div className="w-40 shrink-0">
                <div className="text-sm text-gray-700">{PRODUCT_LABELS[id] || id}</div>
                <div className="text-xs text-gray-400">{id}</div>
              </div>
              <div className="flex items-center gap-1 ml-auto shrink-0">
                <span className="text-gray-400 text-sm">¥</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-32 px-3 py-2 border border-border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent/40"
                  value={Number((fen / 100).toFixed(2))}
                  onChange={(e) => setVirtualYuan(id, e.target.value)}
                />
              </div>
              <div className="w-20 text-right text-sm text-primary font-semibold shrink-0">
                {yuan(fen)} 元
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={saveAll}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "保存中…" : "保存配置"}
        </button>
      </div>
    </div>
  );
}
