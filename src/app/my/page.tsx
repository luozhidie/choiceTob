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
  X, TrendingUp, Star, FileText,
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

// 成长等级阶梯（依据累计拿货金额，参照同行渐进解锁设计）
const TIERS = [
  { key: "normal",   name: "普通会员", min: 0,      emoji: "🌱", gradient: "from-gray-500 to-gray-600",     badge: "V0" },
  { key: "silver",   name: "白银会员", min: 5000,   emoji: "🥈", gradient: "from-sky-400 to-blue-500",    badge: "V1" },
  { key: "gold",     name: "黄金会员", min: 50000,  emoji: "🥇", gradient: "from-amber-400 to-orange-500",  badge: "V2" },
  { key: "platinum", name: "铂金会员", min: 100000, emoji: "💎", gradient: "from-violet-400 to-purple-500",  badge: "V3" },
  { key: "diamond",  name: "钻石会员", min: 300000, emoji: "👑", gradient: "from-rose-400 to-pink-500",    badge: "V4" },
];

// 会员权益（5项横排，同行同款）
const TIER_BENEFITS = [
  { key: "wholesale", icon: Eye,        title: "拿货价查看",   tier: 1, emoji: "💰" },
  { key: "earlyAccess",icon: Sparkles,  title: "新款抢先看",   tier: 2, emoji: "✨" },
  { key: "returnRate", icon: Percent,    title: "退货补贴",     tier: 2, emoji: "🎁" },
  { key: "vipService",  icon: Headphones,title: "专属客服",     tier: 3, emoji: "🎧" },
  { key: "dataReport",  icon: FileText,  title: "经营数据报告", tier: 4, emoji: "📊" },
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
  const [showRules, setShowRules] = useState(false);

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
            {/* ═══ 未认证：金色认证引导卡（同行截图1）════ */}
            {!profile?.store_owner_certified && (
              <div className="bg-gradient-to-br from-yellow-100 via-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 p-0 mb-6 overflow-hidden shadow-md">
                <div className="flex p-6 gap-4">
                  {/* 左侧：未认证提示 */}
                  <div className="w-[35%] flex flex-col items-center justify-center pr-4 border-r-2 border-dborder border-amber-300/50">
                    <p className="text-sm font-bold text-amber-800 tracking-widest">您暂未认证</p>
                    <p className="text-xs text-amber-700 mt-1">仅能</p>
                    <p className="text-base font-bold text-amber-900 mt-0.5">零售价拿货</p>
                  </div>

                  {/* 右侧：认证店主权益 */}
                  <div className="flex-1 flex flex-col items-center pl-2">
                    <div className="flex items-center gap-2 mb-3 self-start">
                      <span className="text-2xl">🛡</span>
                      <span className="text-lg font-bold text-amber-900">认证店主</span>
                    </div>

                    {/* 4个权益图标横排 */}
                    <div className="flex justify-between w-full mb-4">
                      {[
                        { icon: "🏷️", label: "批发价拿货" },
                        { icon: "🔄", label: "无理由退货" },
                        { icon: "🎟️", label: "¥10运费券" },
                        { icon: "⚡", label: "新款抢先看" },
                      ].map((item) => (
                        <div key={item.label} className="flex flex-col items-center gap-1">
                          <div className="w-12 h-12 rounded-full bg-white/60 border border-white/80 flex items-center justify-center text-lg shadow-sm">
                            {item.icon}
                          </div>
                          <span className="text-[11px] font-medium text-amber-800 text-center leading-tight">{item.label}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      href="/certify"
                      className="w-full py-2.5 bg-gradient-to-r from-white/70 to-white/40 border-2 border-amber-800 text-amber-900 font-semibold rounded-full text-center text-sm hover:bg-white/80 transition-colors"
                    >
                      一键认证 解锁权益 →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ 已认证：深色等级卡（同行截图2）════ */}
            {profile?.store_owner_certified && (
              <div className="bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950 rounded-2xl p-6 mb-6 text-white shadow-lg">
                {/* 标题行 */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    {tierInfo.cur.name}
                    <span className="text-xs bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-900 px-2.5 py-0.5 rounded-md font-extrabold shadow-md">
                      {tierInfo.cur.badge || "V1"}
                    </span>
                  </h2>
                  <Link href="/vip" className="text-xs bg-amber-400/15 border border-amber-400/30 text-amber-300 px-3 py-1.5 rounded-full hover:bg-amber-400/25 transition-colors">
                    查看权益
                  </Link>
                </div>

                {/* 进度条 */}
                {tierInfo.next ? (
                  <>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-500" style={{ width: `${tierInfo.progress}%` }} />
                    </div>
                    <p className="text-xs text-white/55 mb-5">
                      当月拿货额 <span className="text-amber-400 font-bold text-sm">¥{Math.round(totalSpentYuan).toLocaleString()}</span> ，还差<span className="text-amber-400 font-bold"> ¥{tierInfo.diff.toLocaleString()}</span> 升级{tierInfo.next.name}
                    </p>
                  </>
                ) : (
                  <p className="text-xs bg-white/10 inline-block px-3 py-1 rounded-full mb-5">🎉 已达最高等级</p>
                )}

                {/* 4个权益图标行（同行截图2）*/}
                <div className="flex justify-around pt-4 border-t border-white/8">
                  {[
                    { icon: "📅", label: "淡季保级" },
                    { icon: "⚡", label: "会员专享" },
                    { icon: "🎧", label: "VIP客服" },
                    { icon: "🚚", label: "包邮特权" },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center gap-1.5">
                      <div className="w-14 h-14 rounded-full bg-white/8 border border-white/15 flex items-center justify-center text-xl">
                        {item.icon}
                      </div>
                      <span className="text-[11px] text-white/55">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 会员权益解锁等级（5列横排 · 同行同款）*/}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" /> 权益解锁等级
              </h2>
              <p className="text-xs text-gray-400 mb-4">成长等级提升自动解锁更多权益</p>

              {/* 5个权益图标横排 */}
              <div className="flex justify-between gap-2">
                {TIER_BENEFITS.map((b) => {
                  const unlocked = tierInfo.idx >= b.tier;
                  const BIcon = b.icon;
                  return (
                    <div key={b.key} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-all ${
                          unlocked
                            ? "bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-lg shadow-amber-200/40"
                            : "bg-gray-100 text-gray-300"
                        }`}
                      >
                        {unlocked ? <BIcon className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <span className={`text-[11px] font-medium text-center leading-tight ${unlocked ? "text-gray-800" : "text-gray-400"}`}>
                        {b.title}
                      </span>
                      <span className={`text-[10px] mt-0.5 ${unlocked ? "text-amber-600" : "text-gray-300"}`}>
                        {unlocked ? "已解锁" : TIERS[b.tier].name.replace("会员", "")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 会员权益领取规则弹窗（同行同款） */}
            {showRules && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRules(false)} />
                <div className="relative bg-white w-full sm:max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-2xl overflow-y-auto animate-in slide-in-from-bottom duration-300">
                  {/* 弹窗头部 */}
                  <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-lg">会员权益领取规则</h3>
                    <button onClick={() => setShowRules(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 规则内容 */}
                  <div className="px-6 py-5 space-y-5 text-sm text-gray-700 leading-relaxed">

                    {/* 一、何时解锁 */}
                    <section>
                      <h4 className="font-bold text-gray-900 mb-2">【什么时候解锁？】</h4>
                      <p className="mb-2">每达到一个成长等级（以累计拿货金额为依据），即可<strong>自动解锁</strong>对应等级的会员权益，无需额外操作。</p>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        <li><strong>白银会员</strong>（累计 ≥ ¥5,000）：解锁「拿货价查看」—— 可查看所有商品批发价与市场价对比。</li>
                        <li><strong>黄金会员</strong>（累计 ≥ ¥50,000）：新增「新款抢先看」「退货补贴5%」—— 每季新品提前7天浏览 + 充值退货额度。</li>
                        <li><strong>铂金会员</strong>（累计 ≥ ¥100,000）：新增「专属客服」「退货补贴10%」—— 1对1微信客服通道 + 更高退换比例。</li>
                        <li><strong>钻石会员</strong>（累计 ≥ ¥300,000）：全部权益解锁 +「经营数据报告」—— 季度经营分析与行业对标报告。</li>
                      </ul>
                    </section>

                    {/* 二、如何领取 */}
                    <section>
                      <h4 className="font-bold text-gray-900 mb-2">【如何领取使用？】</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        <li><strong>拿货价：</strong>升级后自动生效，进入商品详情页或买家选品页即显示批发价。</li>
                        <li><strong>新款抢先看：</strong>在「每日搭配」和「买手选品」页顶部出现「新品抢先」入口。</li>
                        <li><strong>退货补贴：</strong>按充值档位自动计算（充5万→5% / 充10万→10% / 充30万→20%），退货时系统自动抵扣。</li>
                        <li><strong>专属客服：</strong>升级后在「我的」页显示专属客服微信号，可直接微信联系。</li>
                        <li><strong>数据报告：</strong>每季度初自动生成，在「我的 → 经营数据」中查看下载。</li>
                      </ul>
                    </section>

                    {/* 三、认证店主平行赛道 */}
                    <section>
                      <h4 className="font-bold text-gray-900 mb-2">【认证店主 · 平行赛道】</h4>
                      <p className="mb-2">除付费会员外，「认证店主」是一条<strong>完全免费</strong>的平行解锁路径：</p>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                        <p>✅ 通过6道行业知识答题即可认证</p>
                        <p>✅ 认证后立即解锁<strong>全部商品批发价查看权</strong></p>
                        <p>✅ 填写的常拿风格 & 月销售额同步至后台店铺管理</p>
                        <p>✅ 获得全国销售排名估算（基于您填写的月销售额）</p>
                      </div>
                      <p className="mt-2 text-xs text-gray-400">注：认证店主不享受退货补贴、新款抢先看、专属客服等付费会员特权。如需全部权益，建议同时开通付费会员。</p>
                    </section>

                    {/* 四、等级对照表 */}
                    <section>
                      <h4 className="font-bold text-gray-900 mb-2">【等级权益一览】</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-200 px-3 py-2 text-left font-semibold">等级</th>
                              <th className="border border-gray-200 px-3 py-2 text-left font-semibold">门槛(累计)</th>
                              <th className="border border-gray-200 px-3 py-2 text-left font-semibold">解锁权益</th>
                            </tr>
                          </thead>
                          <tbody>
                            {TIERS.slice(1).map((t) => (
                              <tr key={t.key}>
                                <td className="border border-gray-200 px-3 py-2 font-medium">{t.emoji} {t.name}</td>
                                <td className="border border-gray-200 px-3 py-2">≥ ¥{t.min.toLocaleString()}</td>
                                <td className="border border-gray-200 px-3 py-2">
                                  {TIER_BENEFITS.filter(b => b.tier <= TIERS.indexOf(t)).map(b => b.title).join('、') || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    {/* 底部提示 */}
                    <div className="text-center pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        如有疑问请联系客服 · 微信: luozhidie666
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            )}

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
