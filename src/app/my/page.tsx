"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  ShoppingBag,
  Package,
  MapPin,
  Crown,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowRight,
  ChevronRight,
  Loader2,
  LogIn, UserPlus, Sparkles, Smartphone,
  ShieldCheck,
  Award, Gift, Percent, BarChart3, Headphones, Eye, Lock, BadgeCheck,
} from "lucide-react";
import TabBar from "@/components/TabBar";

interface Order {
  id: string;
  order_no: string;
  product_title: string;
  product_image?: string | null;
  total_amount: number;
  status: string;
  payment_method: string;
  shipping_name?: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "待支付", color: "text-amber-600 bg-amber-50", icon: Clock },
  paid: { label: "已付款", color: "text-blue-600 bg-blue-50", icon: CheckCircle2 },
  shipped: { label: "已发货", color: "text-purple-600 bg-purple-50", icon: Truck },
  delivered: { label: "已送达", color: "text-green-600 bg-green-50", icon: CheckCircle2 },
  cancelled: { label: "已取消", color: "text-red-500 bg-red-50", icon: XCircle },
};

// 成长等级阶梯（依据累计拿货金额，与「拿货升级自动会员」逻辑一致）
const TIERS = [
  { key: "normal", name: "普通会员", min: 0, emoji: "🌱", gradient: "from-gray-400 to-gray-500" },
  { key: "silver", name: "白银会员", min: 5000, emoji: "🥈", gradient: "from-slate-300 to-slate-400" },
  { key: "gold", name: "黄金会员", min: 50000, emoji: "🥇", gradient: "from-amber-400 to-yellow-500" },
  { key: "platinum", name: "铂金会员", min: 100000, emoji: "💠", gradient: "from-cyan-400 to-blue-500" },
  { key: "diamond", name: "钻石会员", min: 300000, emoji: "💎", gradient: "from-fuchsia-400 to-purple-500" },
];

// 会员权益（按解锁等级排列，tier 为 TIERS 下标）
const TIER_BENEFITS = [
  { key: "return5", icon: Percent, title: "退货补贴5%", tier: 2, desc: "黄金解锁" },
  { key: "early", icon: Eye, title: "新款抢先看", tier: 2, desc: "黄金解锁" },
  { key: "return10", icon: Gift, title: "退货补贴10%", tier: 3, desc: "铂金解锁" },
  { key: "vipService", icon: Headphones, title: "专属客服", tier: 3, desc: "铂金解锁" },
  { key: "return20", icon: Award, title: "退货补贴20%", tier: 4, desc: "钻石解锁" },
  { key: "report", icon: BarChart3, title: "数据报告", tier: 4, desc: "钻石解锁" },
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

export default function MyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "cart">("overview");

  // 成长等级：依据累计拿货金额计算（与「拿货升级自动会员」逻辑一致）
  const totalSpentYuan = Math.round(orders.reduce((s, o) => s + (o.total_amount || 0), 0) / 100);
  const tierInfo = getTierInfo(totalSpentYuan);

  useEffect(() => {
    initUser();
  }, []);

  const initUser = async () => {
    try {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!u) {
        router.push("/login?redirect=/my");
        return;
      }
      setUser(u);

      // 获取profile
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.id).single();
      setProfile(p || {});

      // 获取订单
      await fetchOrders(u.id);
    } catch (error) {
      console.error("[初始化用户中心失败]", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (userId: string) => {
    try {
      // 查询 buyer_orders 表
      const { data: buyerOrders } = await supabase
        .from("buyer_orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (buyerOrders && buyerOrders.length > 0) {
        setOrders(buyerOrders as Order[]);
        return;
      }

      // 兼容：查询 orders 表
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (ordersData) {
        setOrders(ordersData as Order[]);
      }
    } catch (error) {
      console.error("[获取订单失败]", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 🔑 未登录时显示登录引导页（类似1688）
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-accent/5 to-white">
        <div className="max-w-md mx-auto px-4 pt-20 pb-24">
          {/* 头像区域 */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-lg">
              <UserPlus className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Hi，欢迎来到骆芷蝶智选</h1>
            <p className="text-gray-500 text-sm">登录后享受会员价 · 查看订单 · 管理账户</p>
          </div>

          {/* 登录按钮 */}
          <Link
            href="/login?redirect=/my"
            className="w-full flex items-center justify-center gap-3 py-4 bg-accent text-white text-lg font-bold rounded-2xl hover:bg-accent/90 active:scale-[0.98] transition-all shadow-lg shadow-accent/30 mb-4"
          >
            <LogIn className="w-6 h-6" />
            登录此账号
          </Link>

          {/* 其他登录方式 */}
          <p className="text-center text-sm text-gray-400 mb-6">其他方式</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <Link
              href="/login?redirect=/my&mode=phone"
              className="flex flex-col items-center gap-2 py-4 bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xs font-medium text-gray-600">手机号</span>
            </Link>
            <Link
              href="/login?redirect=/my&mode=password"
              className="flex flex-col items-center gap-2 py-4 bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-xs font-medium text-gray-600">密码</span>
            </Link>
            <Link
              href="/register?redirect=/my"
              className="flex flex-col items-center gap-2 py-4 bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-xs font-medium text-gray-600">注册</span>
            </Link>
          </div>

          {/* 功能介绍 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-accent" /> 登录后可享受
            </h3>
            <div className="space-y-3">
              {[
                { icon: Package, title: "查看批发价", desc: "会员专属供货价格" },
                { icon: ShoppingBag, title: "快捷下单", desc: "一键下单，微信支付" },
                { icon: Truck, title: "订单追踪", desc: "实时查看物流状态" },
                { icon: Crown, title: "会员权益", desc: "积分返现、专属折扣" },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 底部提示 */}
          <p className="text-center text-xs text-gray-400 mt-6">
            登录即表示同意《用户协议》和《隐私政策》
          </p>
        </div>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-gradient-to-br from-primary to-accent text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-6">
            {/* 头像 */}
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold backdrop-blur-sm border-2 border-white/30">
              {profile?.nickname?.[0] || user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile?.nickname || profile?.full_name || "用户"}</h1>
              <p className="text-white/80 text-sm mt-1">{user.email}</p>
              {profile?.membership_type && profile.membership_type !== "none" && (
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-xs font-medium">
                  <Crown className="w-3.5 h-3.5" />
                  {profile.membership_type === "view_price"
                    ? "价格会员"
                    : profile.membership_type === "basic"
                    ? "基础VIP"
                    : profile.membership_type === "pro"
                    ? "进阶VIP"
                    : profile.membership_type === "premium"
                    ? "高阶VIP"
                    : profile.membership_type === "wholesale"
                    ? "拿货会员"
                    : "VIP会员"}
                </div>
              )}
              {profile?.store_owner_certified && (
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-400/25 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> 认证店主
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="max-w-4xl mx-auto px-4 -mt-6 pb-12">
        {/* 快捷入口卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6 grid grid-cols-3 gap-4">
          <Link href="/checkout/cart" className="group flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-primary/5 transition-colors">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-gray-700">购物车</span>
          </Link>

          <button
            onClick={() => setActiveTab("orders")}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${
              activeTab === "orders" ? "bg-green-50" : "hover:bg-gray-50"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                activeTab === "orders"
                  ? "bg-green-100 text-green-600"
                  : "bg-green-50 text-green-600 hover:bg-green-100"
              }`}
            >
              <Package className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-gray-700">我的订单</span>
            {orders.length > 0 && (
              <span className="text-xs text-red-500 font-medium">{orders.length}笔</span>
            )}
          </button>

          <Link href="/vip" className="group flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-purple-50 transition-colors">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Crown className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-gray-700">会员服务</span>
          </Link>
        </div>

        {/* Tab内容区 */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">购买订单</h2>
              <button onClick={() => setActiveTab("overview")} className="text-sm text-gray-500 hover:text-primary transition-colors">
                返回概览
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="py-16 text-center">
                <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">暂无订单记录</p>
                <Link href="/buyer" className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors">
                  去选购商品
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/checkout?order=${order.id}`)}>
                      <div className="flex gap-4">
                        {/* 商品图片 */}
                        <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                          {order.product_image ? (
                            <img src={order.product_image} alt={order.product_title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* 商品信息 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 line-clamp-2">{order.product_title}</h3>
                          <p className="text-xs text-gray-500 mt-1">订单号：{order.order_no || order.id.slice(0, 12)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(order.created_at).toLocaleDateString("zh-CN")}
                          </p>
                        </div>

                        {/* 右侧信息 */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-primary">¥{(order.total_amount / 100).toFixed(0)}</p>
                          <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "overview" && (
          <>
            {/* 成长等级卡 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className={`rounded-2xl bg-gradient-to-r ${tierInfo.cur.gradient} p-5 text-white mb-5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{tierInfo.cur.emoji}</span>
                    <div>
                      <p className="text-xs opacity-90">当前成长等级</p>
                      <p className="text-xl font-bold">{tierInfo.cur.name}</p>
                    </div>
                  </div>
                  <Link
                    href="/vip"
                    className="text-xs bg-white/25 px-3 py-1.5 rounded-full backdrop-blur-sm whitespace-nowrap"
                  >
                    升级特权
                  </Link>
                </div>
                {tierInfo.next ? (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs opacity-90 mb-1">
                      <span>距 {tierInfo.next.name} 还差</span>
                      <span>¥{tierInfo.diff.toLocaleString()}（累计拿货 ¥{Math.round(totalSpentYuan).toLocaleString()}）</span>
                    </div>
                    <div className="h-2 bg-white/25 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${tierInfo.progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-xs bg-white/20 inline-block px-3 py-1 rounded-full">🎉 已达最高等级</p>
                )}
              </div>

              {/* 等级阶梯 */}
              <div className="flex items-center justify-between">
                {TIERS.map((t, i) => (
                  <div key={t.key} className="flex-1 flex flex-col items-center relative">
                    {i < TIERS.length - 1 && (
                      <div
                        className={`absolute top-4 left-1/2 w-full h-0.5 ${
                          i < tierInfo.idx ? "bg-primary" : "bg-gray-200"
                        }`}
                      />
                    )}
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        i <= tierInfo.idx ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {i < tierInfo.idx ? "✓" : i + 1}
                    </div>
                    <span
                      className={`mt-1.5 text-[10px] ${
                        i === tierInfo.idx ? "text-primary font-bold" : "text-gray-400"
                      }`}
                    >
                      {t.name.replace("会员", "")}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 text-center mt-3">
                成长等级依据累计拿货金额自动解锁 · 查看
                <Link href="/vip" className="text-primary"> 权益规则</Link>
              </p>
            </div>

            {/* 会员权益网格（升级自动解锁） */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" /> 会员权益
                <span className="text-xs font-normal text-gray-400">升级自动解锁</span>
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {TIER_BENEFITS.map((b) => {
                  const unlocked = tierInfo.idx >= b.tier;
                  const BIcon = b.icon;
                  return (
                    <div
                      key={b.key}
                      className={`flex flex-col items-center text-center p-3 rounded-xl border ${
                        unlocked ? "border-primary/30 bg-primary/5" : "border-gray-100 bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center mb-2 ${
                          unlocked ? "bg-primary text-white" : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {unlocked ? <BIcon className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <span className={`text-xs font-medium ${unlocked ? "text-gray-800" : "text-gray-400"}`}>
                        {b.title}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        {unlocked ? "已解锁" : TIERS[b.tier].name.replace("会员", "") + "解锁"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 认证店主（平行赛道 · 免费） */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-accent" /> 认证店主
                  <span className="text-xs font-normal text-gray-400">平行赛道 · 免费</span>
                </h2>
                {profile?.store_owner_certified && (
                  <span className="text-xs bg-green-100 text-green-600 px-2.5 py-1 rounded-full">已认证</span>
                )}
              </div>
              {profile?.store_owner_certified ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-green-600" />
                    已通过认证 · 享全部商品批发价查看 + 全国销售排名
                  </p>
                  {profile?.certified_style && (
                    <p className="text-xs text-gray-500 mt-2">常拿风格：{profile.certified_style}</p>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-3">
                    免费通过行业知识答题，解锁全部商品批发价查看权限（与会员等级平行，不冲突）
                  </p>
                  <Link
                    href="/certify"
                    className="block w-full py-2.5 bg-accent text-white text-sm font-medium rounded-xl text-center hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" /> 免费认证看价
                  </Link>
                </>
              )}
            </div>

            {/* 常用功能 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">常用功能</h2>
              <div className="space-y-3">
                <Link href="/buyer" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    <span className="text-gray-700">继续选购</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                </Link>

                <Link href="/members" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <span className="text-gray-700">会员功能中心</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition-colors" />
                </Link>

                <Link href="/contact" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-red-500" />
                    <span className="text-gray-700">联系客服</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
      <TabBar />
    </div>
  );
}
