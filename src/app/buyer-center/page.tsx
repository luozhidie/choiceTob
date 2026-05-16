"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  FileText,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PaywallModal } from "@/components/PaywallModal";
import { motion } from "framer-motion";

interface RechargeTier {
  id: string;
  amount: number;
  discount: number;
  return_rate: number;
  is_active: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  company_name: string | null;
  balance: number;
  discount: number;
  return_rate: number;
  total_recharged: number;
}

interface Order {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_price: number;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function BuyerCenterPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tiers, setTiers] = useState<RechargeTier[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedTier, setSelectedTier] = useState<RechargeTier | null>(null);
  const [activeTab, setActiveTab] = useState<"recharge" | "orders">("recharge");

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/admin/login");
      return;
    }
    fetchProfile(user.id);
    fetchTiers();
    fetchOrders(user.id);
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("buyer_user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      // 没有 profile，创建一个
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("buyer_user_profiles").insert({
        id: userId,
        email: userData.user?.email || "",
        balance: 0,
        discount: 1.00,
        return_rate: 0,
      });
      fetchProfile(userId);
      return;
    }
    setProfile(data as UserProfile);
    setLoading(false);
  };

  const fetchTiers = async () => {
    const { data } = await supabase
      .from("buyer_recharge_tiers")
      .select("*")
      .eq("is_active", true)
      .order("amount", { ascending: true });
    if (data) setTiers(data as RechargeTier[]);
  };

  const fetchOrders = async (userId: string) => {
    const { data } = await supabase
      .from("buyer_orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setOrders(data as Order[]);
  };

  const handleRecharge = (tier: RechargeTier) => {
    setSelectedTier(tier);
    setShowPaywall(true);
  };

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;
  const formatDiscount = (d: number) => `${(d * 10).toFixed(1)}折`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <p className="text-muted-foreground text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">买手中心</h1>
          </div>
          <p className="text-white/80 text-sm md:text-base">
            企业管理专属账号，享充值折扣与退换保障
          </p>
        </div>
      </section>

      {/* User Info Cards */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {/* Balance */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">账户余额</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                ¥{((profile?.balance || 0) / 100).toFixed(0)}
              </div>
              {profile?.company_name && (
                <div className="text-xs text-muted-foreground mt-1">{profile.company_name}</div>
              )}
            </div>

            {/* Discount */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">拿货折扣</span>
              </div>
              <div className="text-2xl font-bold text-accent">
                {profile?.discount ? formatDiscount(profile.discount) : "未充值"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                退换比例 {((profile?.return_rate || 0) * 100).toFixed(0)}%
              </div>
            </div>

            {/* Total Recharged */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">累计充值</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                ¥{((profile?.total_recharged || 0) / 100).toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {profile?.email}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("recharge")}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "recharge"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              充值档位
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "orders"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              采购订单
              {orders.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {orders.length}
                </span>
              )}
            </button>
          </div>

          {/* Recharge Tab */}
          {activeTab === "recharge" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {tiers.map((tier) => {
                const isCurrent =
                  (profile?.total_recharged ?? 0) >= tier.amount &&
                  (profile?.discount ?? 1) === tier.discount;
                return (
                  <div
                    key={tier.id}
                    className={`relative bg-white rounded-2xl shadow-sm border-2 overflow-hidden hover:shadow-md transition-all ${
                      isCurrent ? "border-accent" : "border-transparent"
                    }`}
                  >
                    {isCurrent && (
                      <div className="bg-accent text-white text-center text-xs font-bold py-1">
                        当前档位
                      </div>
                    )}
                    <div className="p-6">
                      <div className="text-center mb-6">
                        <div className="text-3xl font-bold text-primary mb-1">
                          ¥{(tier.amount / 10000).toFixed(0)}万
                        </div>
                        <div className="text-xs text-muted-foreground">充值金额</div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">拿货折扣</span>
                          <span className="text-lg font-bold text-accent">
                            {formatDiscount(tier.discount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">退换比例</span>
                          <span className="text-lg font-bold text-green-600">
                            {(tier.return_rate * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRecharge(tier)}
                        disabled={isCurrent}
                        className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                          isCurrent
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-primary text-white hover:bg-primary/90"
                        }`}
                      >
                        {isCurrent ? "当前使用" : "立即充值"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl">
                  <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">暂无采购订单</p>
                  <Link
                    href="/buyer"
                    className="inline-block mt-4 text-sm text-primary hover:text-accent font-medium"
                  >
                    去选品 →
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs text-muted-foreground uppercase tracking-wider">
                        <th className="px-5 py-3">订单号</th>
                        <th className="px-5 py-3">商品</th>
                        <th className="px-5 py-3">数量</th>
                        <th className="px-5 py-3">单价</th>
                        <th className="px-5 py-3">折扣价</th>
                        <th className="px-5 py-3">合计</th>
                        <th className="px-5 py-3">状态</th>
                        <th className="px-5 py-3">日期</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/50">
                          <td className="px-5 py-3 font-mono text-xs text-gray-500">
                            {order.id.slice(0, 8)}
                          </td>
                          <td className="px-5 py-3 text-primary font-medium">
                            <Link href={`/buyer/${order.product_id}`}>
                              {order.product_id.slice(0, 8)}...
                            </Link>
                          </td>
                          <td className="px-5 py-3">{order.quantity}</td>
                          <td className="px-5 py-3 text-gray-400 line-through">
                            {formatPrice(order.unit_price)}
                          </td>
                          <td className="px-5 py-3 font-medium text-accent">
                            {formatPrice(order.discount_price)}
                          </td>
                          <td className="px-5 py-3 font-bold text-primary">
                            {formatPrice(order.total_amount)}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              order.status === "completed" ? "bg-green-50 text-green-600" :
                              order.status === "paid" ? "bg-blue-50 text-blue-600" :
                              order.status === "shipped" ? "bg-amber-50 text-amber-600" :
                              "bg-gray-100 text-gray-500"
                            }`}>
                              {order.status === "pending" ? "待付款" :
                               order.status === "paid" ? "已付款" :
                               order.status === "shipped" ? "已发货" :
                               order.status === "completed" ? "已完成" : order.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("zh-CN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* Paywall Modal */}
      {showPaywall && selectedTier && (
        <PaywallModal
          isOpen={showPaywall}
          type="product"
          title={`充值 ¥${(selectedTier.amount / 10000).toFixed(0)}万`}
          description={`${formatDiscount(selectedTier.discount)}拿货 · 退换${(selectedTier.return_rate * 100).toFixed(0)}% · 联系客服完成充值`}
          onClose={() => { setShowPaywall(false); setSelectedTier(null); }}
        />
      )}
    </div>
  );
}
