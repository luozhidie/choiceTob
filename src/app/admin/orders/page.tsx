"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Clock, XCircle, Truck, Eye, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Order {
  id: string;
  order_no: string;
  product_id: string;
  product_title: string | null;
  product_price: number;
  quantity: number;
  total_amount: number;
  contact: string;
  address: string | null;
  note: string | null;
  status: string;
  payment_method: string | null;
  payment_trade_no: string | null;
  paid_at: string | null;
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const supabase = createClient();

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
    if (activeTab !== "all") {
      query = query.eq("status", activeTab);
    }
    const { data, error } = await query;
    if (!error && data) setOrders(data as Order[]);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [activeTab]);

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status } : null);
    }
  };

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;
  const formatDate = (d: string) => new Date(d).toLocaleString("zh-CN");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" /> 订单管理
        </h1>
        <button onClick={fetchOrders} className="text-sm text-primary hover:underline">刷新</button>
      </div>

      {/* 状态标签 */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 订单列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无订单</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">订单号</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">商品</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">金额</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">联系方式</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">状态</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">时间</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const st = STATUS_MAP[order.status] || { label: order.status, color: "text-gray-600", bg: "bg-gray-50" };
                return (
                  <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs">{order.order_no}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate">{order.product_title || "-"}</td>
                    <td className="px-4 py-3 text-right font-medium text-accent">{formatPrice(order.total_amount)}</td>
                    <td className="px-4 py-3">{order.contact}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${st.bg} ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setSelectedOrder(order)} className="text-primary hover:text-accent">
                        <Eye className="w-4 h-4" />
                      </button>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">订单详情</h3>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">订单号</span><span className="font-mono">{selectedOrder.order_no}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">商品</span><span>{selectedOrder.product_title}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">单价</span><span>{formatPrice(selectedOrder.product_price)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">数量</span><span>{selectedOrder.quantity}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">总金额</span><span className="text-accent font-bold">{formatPrice(selectedOrder.total_amount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">联系方式</span><span>{selectedOrder.contact}</span></div>
                {selectedOrder.address && <div className="flex justify-between"><span className="text-gray-500">地址</span><span>{selectedOrder.address}</span></div>}
                {selectedOrder.note && <div className="flex justify-between"><span className="text-gray-500">备注</span><span>{selectedOrder.note}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">支付方式</span><span>{selectedOrder.payment_method === "wechat" ? "微信" : selectedOrder.payment_method === "alipay" ? "支付宝" : "-"}</span></div>
                {selectedOrder.payment_trade_no && <div className="flex justify-between"><span className="text-gray-500">交易号</span><span className="font-mono text-xs">{selectedOrder.payment_trade_no}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">状态</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[selectedOrder.status]?.bg} ${STATUS_MAP[selectedOrder.status]?.color}`}>
                    {STATUS_MAP[selectedOrder.status]?.label || selectedOrder.status}
                  </span>
                </div>
                {selectedOrder.paid_at && <div className="flex justify-between"><span className="text-gray-500">支付时间</span><span>{formatDate(selectedOrder.paid_at)}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">创建时间</span><span>{formatDate(selectedOrder.created_at)}</span></div>
              </div>

              {/* 操作按钮 */}
              <div className="mt-6 flex gap-3">
                {selectedOrder.status === "paid" && (
                  <button onClick={() => updateStatus(selectedOrder.id, "shipped")}
                    className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 flex items-center justify-center gap-1.5">
                    <Truck className="w-4 h-4" /> 标记发货
                  </button>
                )}
                {selectedOrder.status === "shipped" && (
                  <button onClick={() => updateStatus(selectedOrder.id, "completed")}
                    className="flex-1 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> 标记完成
                  </button>
                )}
                {(selectedOrder.status === "pending" || selectedOrder.status === "paid") && (
                  <button onClick={() => updateStatus(selectedOrder.id, "cancelled")}
                    className="flex-1 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 flex items-center justify-center gap-1.5">
                    <XCircle className="w-4 h-4" /> 取消订单
                  </button>
                )}
                <button onClick={() => setSelectedOrder(null)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200">
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
