"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  ShieldCheck, ShieldAlert, TrendingUp, Tag, Package, Truck,
  Store, ArrowRight, ChevronRight, BadgeCheck, Sparkles,
  Layers, RefreshCw, UserCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

/* ==================== 买手成长等级（与 C端「我的」完全一致的双轨模型） ==================== */
const TIERS = [
  { key: "normal",   name: "普通买手",   min: 0,      badge: "L1", discount: "" },
  { key: "level5w",  name: "5万会员",   min: 50000,  badge: "L2", discount: "2.8折" },
  { key: "level10w", name: "10万会员",  min: 100000, badge: "L3", discount: "2.8折" },
  { key: "level30w", name: "30万会员",  min: 300000, badge: "L4", discount: "2.6折" },
];

function getTierInfo(totalSpentYuan: number) {
  let idx = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (totalSpentYuan >= TIERS[i].min) idx = i;
  }
  const cur = TIERS[idx];
  const next = TIERS[idx + 1] || null;
  let progress = 100;
  let diff = 0;
  if (next) {
    const span = next.min - cur.min;
    progress = span > 0 ? Math.min(100, Math.round(((totalSpentYuan - cur.min) / span) * 100)) : 0;
    diff = Math.max(0, next.min - totalSpentYuan);
  }
  return { idx, cur, next, progress, diff };
}

/* 认证店主分级退换额度：5万→5% / 10万→10% / 30万→20% */
function certifiedReturnRate(min: number): number {
  if (min >= 300000) return 0.2;
  if (min >= 100000) return 0.1;
  if (min >= 50000) return 0.05;
  return 0;
}

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "待支付", cls: "bg-amber-100 text-amber-700" },
  paid:      { label: "已付款", cls: "bg-blue-100 text-blue-700" },
  shipped:   { label: "已发货", cls: "bg-purple-100 text-purple-700" },
  delivered: { label: "已送达", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "已取消", cls: "bg-red-100 text-red-700" },
};

const fmtYuan = (cents: number) => `¥${Math.round((cents || 0) / 100).toLocaleString()}`;
const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString("zh-CN") : "");

export default function BuyerWorkbenchPage() {
  const router = useRouter();
  const { user, profile, loading, isCertifiedStoreOwner, canViewWholesale, isDepositMember } = useAuth();
  const supabase = createClient();

  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/buyer/workbench");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("buyer_orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        setOrders(data || []);
      } catch (e) {
        console.error("[买手工作台] 订单加载失败", e);
      } finally {
        setOrdersLoading(false);
      }
    })();
  }, [user?.id, supabase]);

  const totalSpentYuan = useMemo(
    () => Math.round(orders.reduce((s, o) => s + (o.total_amount || 0), 0) / 100),
    [orders]
  );
  const tierInfo = getTierInfo(totalSpentYuan);
  const certReturn = certifiedReturnRate(tierInfo.cur.min);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-white">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-accent/5 to-white">
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-16">
        {/* 头部 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7"
        >
          <div className="flex items-center gap-2 text-primary/70 text-xs font-medium tracking-wide">
            <Store className="w-4 h-4" /> 骆芷蝶智选 · 批发供货 B端
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mt-1 flex items-center gap-2">
            买手工作台
            <Sparkles className="w-5 h-5 text-accent" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            认证、等级、批发价与退换额度，一屏掌握你的拿货权益
          </p>
        </motion.div>

        {/* 三张核心卡 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* 认证状态 */}
          <div className={`rounded-2xl p-5 border ${isCertifiedStoreOwner ? "bg-green-50/60 border-green-200" : "bg-amber-50/60 border-amber-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              {isCertifiedStoreOwner ? (
                <ShieldCheck className="w-5 h-5 text-green-600" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              )}
              <span className="text-sm font-semibold text-primary">店主认证</span>
            </div>
            {isCertifiedStoreOwner ? (
              <>
                <div className="text-lg font-bold text-green-700 flex items-center gap-1.5">
                  <BadgeCheck className="w-5 h-5" /> 已认证店主
                </div>
                <p className="text-xs text-green-700/80 mt-1">
                  风格定位：{profile?.certified_style || "未填写"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  认证时间：{fmtDate(profile?.certified_at)}
                </p>
                <p className="text-xs text-green-700/90 mt-2 font-medium">
                  已解锁批发价 + 分级退换额度
                </p>
              </>
            ) : (
              <>
                <div className="text-lg font-bold text-amber-700">未认证</div>
                <p className="text-xs text-amber-700/80 mt-1">
                  免费认证即解锁批发价与分级退换额度
                </p>
                <Link
                  href="/certify"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white bg-accent px-3 py-2 rounded-lg hover:brightness-110 transition"
                >
                  立即认证 <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* 成长等级 */}
          <div className="rounded-2xl p-5 border border-primary/15 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">买手成长等级</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shrink-0">
                {tierInfo.cur.badge}
              </div>
              <div>
                <div className="font-bold text-primary">{tierInfo.cur.name}</div>
                <div className="text-xs text-muted-foreground">
                  累计拿货 <span className="text-accent font-semibold">{fmtYuan(totalSpentYuan * 100)}</span>
                </div>
              </div>
            </div>
            {tierInfo.next ? (
              <div className="mt-3">
                <div className="h-2 rounded-full bg-primary/10 overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${tierInfo.progress}%` }} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  再拿货 <span className="text-accent font-semibold">{fmtYuan(tierInfo.diff * 100)}</span> 升级
                  <span className="text-primary font-semibold"> {tierInfo.next.name}</span>
                  {tierInfo.next.discount && `（${tierInfo.next.discount}）`}
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-3">已达最高等级</p>
            )}
          </div>

          {/* 批发价 & 退换额度 */}
          <div className="rounded-2xl p-5 border border-accent/30 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-accent" />
              <span className="text-sm font-semibold text-primary">批发价 / 退换</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">批发价</span>
              {canViewWholesale ? (
                <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">已开启</span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-semibold">未开启</span>
              )}
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">退换额度</span>
              <span className="text-accent font-bold text-sm">
                {isDepositMember
                  ? `${((profile?.deposit_return_rate || 0) * 100).toFixed(0)}%`
                  : certReturn > 0
                  ? `${(certReturn * 100).toFixed(0)}%`
                  : "—"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              {isDepositMember
                ? "充值会员退换额度（按充值档位）"
                : certReturn > 0
                ? "认证店主分级退换（按累计拿货）"
                : "认证或开通价格会员后享受退换额度"}
            </p>
          </div>
        </div>

        {/* 快捷入口 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Link
            href="/buyer"
            className="flex flex-col items-center gap-1.5 py-4 rounded-xl bg-primary text-white hover:brightness-110 transition"
          >
            <Layers className="w-5 h-5" />
            <span className="text-xs font-medium">选品拿货</span>
          </Link>
          <Link
            href="/buyer-center"
            className="flex flex-col items-center gap-1.5 py-4 rounded-xl bg-white border border-primary/15 text-primary hover:bg-primary/5 transition"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs font-medium">充值中心</span>
          </Link>
          <Link
            href="/certify"
            className="flex flex-col items-center gap-1.5 py-4 rounded-xl bg-white border border-primary/15 text-primary hover:bg-primary/5 transition"
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-medium">店主认证</span>
          </Link>
          <Link
            href="/tryon/profile"
            className="flex flex-col items-center gap-1.5 py-4 rounded-xl bg-white border border-primary/15 text-primary hover:bg-primary/5 transition"
          >
            <UserCircle2 className="w-5 h-5" />
            <span className="text-xs font-medium">形象管理</span>
          </Link>
        </div>

        {/* 我的订单 */}
        <div className="rounded-2xl border border-primary/10 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-primary/10">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <span className="font-semibold text-primary">我的拿货订单</span>
            </div>
            <Link href="/buyer" className="text-xs text-accent font-medium flex items-center">
              去选品 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {ordersLoading ? (
            <div className="p-8 flex justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center">
              <Package className="w-12 h-12 mx-auto text-primary/20 mb-2" />
              <p className="text-sm text-muted-foreground">还没有拿货订单</p>
              <Link
                href="/buyer"
                className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-white bg-accent px-4 py-2 rounded-lg hover:brightness-110 transition"
              >
                去选品拿货 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-primary/5">
              {orders.map((o) => {
                const st = ORDER_STATUS[o.status] || { label: o.status, cls: "bg-gray-100 text-gray-600" };
                return (
                  <li key={o.id} className="flex items-center gap-3 px-5 py-3.5">
                    {o.product_image ? (
                      <img src={o.product_image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-primary/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{o.product_title || "拿货订单"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {fmtDate(o.created_at)}
                        {o.quantity ? ` · ${o.quantity}件` : ""}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-accent">{fmtYuan(o.total_amount)}</div>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-6">
          累计拿货额自动升级 · 连续 6 个月不拿货将降级
        </p>
      </div>
    </div>
  );
}
