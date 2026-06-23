"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Clock, XCircle, Truck, Eye, ShoppingBag, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BuyerOrder {
  id: string;
  product_id: string;
  product_title: string | null;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  discount_price: number;
  total_amount: number;
  status: string;
  shipping_address: string | null;
  shipping_name: string | null;
  shipping_phone: string | null;
  note: string | null;
  payment_method: string | null;
  member_level: string | null;
  discount_rate: number | null;
  rebate_rate: number | null;
  rebate_amount: number | null;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "待支付", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  paid: { label: "已支付", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  shipped: { label: "已发货", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  completed: { label: "已完成", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  cancelled: { label: "已取消", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  refunded: { label: "已退款", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
};

const TABS = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待支付" },
  { key: "paid", label: "已支付" },
  { key: "shipped", label: "已发货" },
  { key: "completed", label: "已完成" },
  { key: "cancelled", label: "已取消" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<BuyerOrder | null>(null);

  const supabase = createClient();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("buyer_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (activeTab !== "all") {
        query = query.eq("status", activeTab);
      }

      const { data, error } = await query;

      if (!error && data) {
        setOrders(data as BuyerOrder[]);
      } else if (error) {
        console.error("获取订单失败:", error.message);
      }
    } catch (err) {
      console.error("获取订单异常:", err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [activeTab]);

  // 更新订单状态
  const updateStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("buyer_orders")
        .update({ status })
        .eq("id", orderId);

      if (!error) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      console.error("更新状态失败:", err);
    }
  };

  // 删除订单
  const deleteOrder = async (orderId: string) => {
    if (!confirm("确定要删除此订单吗？")) return;
    try {
      const { error } = await supabase
        .from("buyer_orders")
        .delete()
        .eq("id", orderId);

      if (!error) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        if (selectedOrder?.id === orderId) setSelectedOrder(null);
      }
    } catch (err) {
      console.error("删除失败:", err);
    }
  };

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(2)}`;
  const formatDate = (d: string) => new Date(d).toLocaleString("zh-CN");

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-accent" /> 买手订单管理
        </h1>
        <button onClick={fetchOrders} className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium">
          🔄 刷新
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "全部订单", count: orders.length, color: "bg-gray-50 text-gray-700" },
          { label: "待支付", count: orders.filter(o => o.status === 'pending').length, color: "bg-yellow-50 text-yellow-700" },
          { label: "已支付", count: orders.filter(o => o.status === 'paid').length, color: "bg-green-50 text-green-700" },
          { label: "已完成", count: orders.filter(o => o.status === 'completed').length, color: "bg-emerald-50 text-emerald-700" },
        ].map(stat => (
          <div key={stat.label} className={`${stat.color} rounded-xl p-4`}>
            <div className="text-xs opacity-70">{stat.label}</div>
            <div className="text-2xl font-bold mt-1">{stat.count}</div>
          </div>
        ))}
      </div>

      {/* 状态标签 */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key ? "bg-primary text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {tab.label}
            {tab.key !== "all" && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] bg-white/30">
                {orders.filter(o => tab.key === "all" ? true : o.status === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 订单列表 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-gray-400">加载中...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">暂无{activeTab !== 'all' ? TABS.find(t => t.key === activeTab)?.label : ''}订单</p>
          <p className="text-gray-300 text-sm mt-1">客户下单后会在这里显示</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">商品</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">金额</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">买家</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">状态</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">时间</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(order => {
                const st = STATUS_MAP[order.status] || { label: order.status, color: "text-gray-600", bg: "bg-gray-50" };
                return (
                  <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {order.product_image ? (
                          <img src={order.product_image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                        <div className="max-w-[180px]">
                          <div className="font-medium truncate">{order.product_title || "未知商品"}</div>
                          <div className="text-xs text-gray-400">×{order.quantity}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold text-accent">{formatPrice(order.total_amount)}</div>
                      {order.discount_rate && order.discount_rate > 0 && (
                        <div className="text-[10px] text-green-600">折扣{(order.discount_rate * 100).toFixed(0)}%</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{order.shipping_name || "-"}</div>
                      <div className="text-xs text-gray-400">{order.shipping_phone || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${st.bg} ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setSelectedOrder(order)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="查看详情">
                          <Eye className="w-4 h-4" />
                        </button>
                        {(order.status === 'pending' || order.status === 'cancelled') && (
                          <button onClick={() => deleteOrder(order.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="删除订单">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 订单详情弹窗 */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6"
              onClick={e => e.stopPropagation()}>
              {/* 弹窗头部 */}
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold">📦 订单详情</h3>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{selectedOrder.id.slice(0, 12)}...</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  ✕
                </button>
              </div>

              {/* 商品信息 */}
              <div className="space-y-4 mb-6">
                <div className="flex gap-4 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl">
                  {selectedOrder.product_image ? (
                    <img src={selectedOrder.product_image} alt="" className="w-20 h-20 rounded-lg object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-bold text-base mb-1">{selectedOrder.product_title || "未知商品"}</div>
                    <div className="text-sm text-gray-500">数量：{selectedOrder.quantity}</div>
                    <div className="text-sm text-gray-500">单价：{formatPrice(selectedOrder.unit_price)}</div>
                    {selectedOrder.discount_price !== selectedOrder.unit_price && selectedOrder.discount_price > 0 && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        折后价：{formatPrice(selectedOrder.discount_price)}
                      </div>
                    )}
                  </div>
                </div>

                {/* 金额信息 */}
                <div className="bg-accent/5 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">商品总额</span>
                    <span>{formatPrice((selectedOrder.unit_price || 0) * selectedOrder.quantity)}</span>
                  </div>
                  {selectedOrder.discount_rate && selectedOrder.discount_rate > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>会员折扣 ({(selectedOrder.discount_rate * 100).toFixed(0)}%)</span>
                      <span>-{formatPrice(((selectedOrder.unit_price || 0) - selectedOrder.discount_price) * selectedOrder.quantity)}</span>
                    </div>
                  )}
                  <div className="border-t border-accent/20 pt-2 flex justify-between font-bold">
                    <span>实付金额</span>
                    <span className="text-lg text-accent">{formatPrice(selectedOrder.total_amount)}</span>
                  </div>
                </div>

                {/* 买家信息 */}
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-primary mb-2">👤 买家信息</div>
                  <div className="flex justify-between"><span className="text-gray-500">姓名</span><span>{selectedOrder.shipping_name || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">电话</span><span>{selectedOrder.shipping_phone || "-"}</span></div>
                  {selectedOrder.shipping_address && (
                    <div className="flex justify-between"><span className="text-gray-500">地址</span><span className="max-w-[250px] text-right">{selectedOrder.shipping_address}</span></div>
                  )}

                  {/* 会员信息 */}
                  {selectedOrder.member_level && selectedOrder.member_level !== 'none' && (
                    <>
                      <div className="font-medium text-primary mt-3 mb-2">🏆 会员信息</div>
                      <div className="flex justify-between"><span className="text-gray-500">等级</span><span className="font-medium">{selectedOrder.member_level}</span></div>
                      {selectedOrder.rebate_rate && (
                        <div className="flex justify-between"><span className="text-gray-500">返利比例</span><span className="text-accent">{(selectedOrder.rebate_rate * 100).toFixed(1)}%</span></div>
                      )}
                      {selectedOrder.rebate_amount && (
                        <div className="flex justify-between"><span className="text-gray-500">返利金额</span><span className="text-green-600">+{formatPrice(selectedOrder.rebate_amount)}</span></div>
                      )}
                    </>
                  )}
                </div>

                {/* 支付与状态 */}
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-primary mb-2">💳 支付信息</div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">支付方式</span>
                    <span className="font-medium">
                      {selectedOrder.payment_method === 'wechat_pay' ? '💚 微信支付' :
                       selectedOrder.payment_method === 'wechat' ? '微信' :
                       selectedOrder.payment_method === 'alipay' ? '支付宝' :
                       selectedOrder.payment_method || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between"><span className="text-gray-500">状态</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_MAP[selectedOrder.status]?.bg} ${STATUS_MAP[selectedOrder.status]?.color}`}>{STATUS_MAP[selectedOrder.status]?.label || selectedOrder.status}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">创建时间</span><span className="text-xs">{formatDate(selectedOrder.created_at)}</span></div>
                </div>

                {/* 备注 */}
                {selectedOrder.note && (
                  <div className="bg-yellow-50 rounded-xl p-3 text-sm">
                    <div className="font-medium text-yellow-800 mb-1">📝 备注</div>
                    <p className="text-yellow-700 whitespace-pre-wrap">{selectedOrder.note}</p>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                {selectedOrder.status === "paid" && (
                  <button onClick={() => updateStatus(selectedOrder.id, "shipped")}
                    className="py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-1.5">
                    <Truck className="w-4 h-4" /> 标记发货
                  </button>
                )}
                {selectedOrder.status === "shipped" && (
                  <button onClick={() => updateStatus(selectedOrder.id, "completed")}
                    className="py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> 标记完成
                  </button>
                )}
                {(selectedOrder.status === "pending" || selectedOrder.status === "paid") && (
                  <button onClick={() => updateStatus(selectedOrder.id, "cancelled")}
                    className="py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 flex items-center justify-center gap-1.5">
                    <XCircle className="w-4 h-4" /> 取消订单
                  </button>
                )}
                <button onClick={() => setSelectedOrder(null)}
                  className="py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200">
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
