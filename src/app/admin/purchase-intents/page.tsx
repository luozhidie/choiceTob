"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Clock, XCircle, Truck, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PurchaseIntent {
  id: string;
  product_id: string;
  product_title: string;
  product_price: number;
  quantity: number;
  contact: string;
  note: string | null;
  status: string;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "待联系", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  contacted: { label: "已联系", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  confirmed: { label: "已确认", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  cancelled: { label: "已取消", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

export default function PurchaseIntentsPage() {
  const [intents, setIntents] = useState<PurchaseIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIntent, setSelectedIntent] = useState<PurchaseIntent | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const supabase = createClient();

  useEffect(() => { fetchIntents(); }, [statusFilter]);

  const fetchIntents = async () => {
    setLoading(true);
    let query = supabase
      .from("purchase_intents")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (statusFilter) query = query.eq("status", statusFilter);
    
    const { data, error } = await query;
    if (!error && data) setIntents(data as PurchaseIntent[]);
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("purchase_intents")
      .update({ status: newStatus })
      .eq("id", id);
    
    if (!error) {
      fetchIntents();
      if (selectedIntent?.id === id) {
        setSelectedIntent({ ...selectedIntent, status: newStatus });
      }
    }
  };

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;
  const formatTime = (t: string) => new Date(t).toLocaleString("zh-CN");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">采购意向管理</h1>
            <p className="text-sm text-gray-500 mt-1">查看和处理客户提交的采购意向</p>
          </div>
          <Link href="/admin/dashboard" className="text-sm text-primary hover:underline">
            返回仪表盘 →
          </Link>
        </div>

        {/* 状态筛选 */}
        <div className="flex gap-2 mb-6">
          {[
            { value: "", label: "全部" },
            { value: "pending", label: "待联系" },
            { value: "contacted", label: "已联系" },
            { value: "confirmed", label: "已确认" },
            { value: "cancelled", label: "已取消" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 列表 */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : intents.length === 0 ? (
          <div className="text-center py-12 text-gray-400">暂无采购意向</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">商品</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">数量</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">联系方式</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">状态</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">时间</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {intents.map((intent) => (
                  <tr key={intent.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-gray-900">{intent.product_title}</div>
                      <div className="text-xs text-gray-500">{formatPrice(intent.product_price)} × {intent.quantity}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{intent.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{intent.contact}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${STATUS_MAP[intent.status]?.bg || "bg-gray-100"} ${STATUS_MAP[intent.status]?.color || "text-gray-700"}`}>
                        {STATUS_MAP[intent.status]?.label || intent.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatTime(intent.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setSelectedIntent(intent); setShowDetail(true); }}
                        className="text-sm text-primary hover:underline"
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {showDetail && selectedIntent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowDetail(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">采购意向详情</h3>
              <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">商品</div>
                <div className="font-medium text-gray-900">{selectedIntent.product_title}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">单价</div>
                  <div className="font-medium">{formatPrice(selectedIntent.product_price)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">数量</div>
                  <div className="font-medium">{selectedIntent.quantity}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">联系方式</div>
                <div className="font-medium text-gray-900">{selectedIntent.contact}</div>
              </div>
              {selectedIntent.note && (
                <div>
                  <div className="text-sm text-gray-500">备注</div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{selectedIntent.note}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500">提交时间</div>
                <div className="text-sm text-gray-700">{formatTime(selectedIntent.created_at)}</div>
              </div>

              {/* 状态操作 */}
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500 mb-3">修改状态</div>
                <div className="flex gap-2">
                  {[
                    { status: "pending", label: "待联系", color: "bg-yellow-100 text-yellow-700" },
                    { status: "contacted", label: "已联系", color: "bg-blue-100 text-blue-700" },
                    { status: "confirmed", label: "已确认", color: "bg-green-100 text-green-700" },
                    { status: "cancelled", label: "已取消", color: "bg-red-100 text-red-700" },
                  ].map((s) => (
                    <button
                      key={s.status}
                      onClick={() => handleUpdateStatus(selectedIntent.id, s.status)}
                      disabled={selectedIntent.status === s.status}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedIntent.status === s.status
                          ? `${s.color} opacity-50 cursor-not-allowed`
                          : `${s.color} hover:opacity-80`
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
