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
} from "lucide-react";

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

export default function MyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "cart">("overview");

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

  if (!user) return null;

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
                  {profile.membership_type === "trial"
                    ? "体验会员"
                    : profile.membership_type === "annual"
                    ? "年度会员"
                    : profile.membership_type === "two_year"
                    ? "两年会员"
                    : profile.membership_type === "three_year"
                    ? "三年会员"
                    : "VIP会员"}
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
            {/* 会员信息卡 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  会员状态
                </h2>
                <Link href="/vip" className="text-sm text-primary hover:text-accent transition-colors flex items-center gap-1">
                  {profile?.membership_type !== "none" && profile?.membership_type ? "续费/升级" : "立即开通"}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {profile?.membership_type && profile.membership_type !== "none" ? (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">💎</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {profile.membership_type === "trial"
                          ? "体验会员"
                          : profile.membership_type === "annual"
                          ? "年度会员"
                          : profile.membership_type === "two_year"
                          ? "两年会员"
                          : profile.membership_type === "three_year"
                          ? "三年会员"
                          : "VIP会员"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">享受专属折扣和批发价查看权限</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-300">
                  <p className="text-sm text-gray-600 text-center">
                    还不是会员？开通后可享受
                    <strong className="text-primary"> ¥19.9起</strong> 的超值权益！
                  </p>
                  <Link href="/vip" className="block mt-3 w-full py-2.5 bg-primary text-white text-sm font-medium rounded-xl text-center hover:bg-primary/90 transition-colors">
                    立即开通
                  </Link>
                </div>
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
    </div>
  );
}
