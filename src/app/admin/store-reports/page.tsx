"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Loader2, Plus, X, Save, Trash2, TrendingUp, TrendingDown,
  DollarSign, Users, ShoppingCart, Target, Package, Calendar,
  BarChart3, ChevronDown, ChevronUp, RefreshCw, Store, FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StoreReport {
  id: string;
  store_name: string;
  report_date: string;
  daily_sales: number;
  customer_count: number;
  avg_transaction: number;
  conversion_rate: number;
  top_categories: string[];
  inventory_value: number;
  employee_count: number;
  notes: string | null;
  created_at: string;
}

export default function AdminStoreReportsPage() {
  const [reports, setReports] = useState<StoreReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterStore, setFilterStore] = useState("");
  const [sortBy, setSortBy] = useState<"report_date" | "daily_sales">("report_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [formData, setFormData] = useState({
    store_name: "",
    report_date: new Date().toISOString().slice(0, 10),
    daily_sales: "",
    customer_count: "",
    avg_transaction: "",
    conversion_rate: "",
    top_categories: "",
    inventory_value: "",
    employee_count: "",
    notes: "",
  });

  const supabase = createClient();
  const router = useRouter();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase.from("store_reports").select("*");
      if (filterStore) {
        query = query.eq("store_name", filterStore);
      }
      query = query.order(sortBy, { ascending: sortDir === "asc" });
      const { data, error } = await query;
      if (error) throw error;
      setReports((data || []) as StoreReport[]);
    } catch (err: any) {
      showToast("error", "加载失败：" + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [filterStore, sortBy, sortDir]);

  // 获取所有门店名称列表用于筛选
  const storeNames = [...new Set(reports.map((r) => r.store_name))];

  const handleSubmit = async () => {
    if (!formData.store_name.trim()) {
      showToast("error", "请输入门店名称");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        store_name: formData.store_name.trim(),
        report_date: formData.report_date,
        daily_sales: parseFloat(formData.daily_sales) || 0,
        customer_count: parseInt(formData.customer_count) || 0,
        avg_transaction: parseFloat(formData.avg_transaction) || 0,
        conversion_rate: parseFloat(formData.conversion_rate) || 0,
        top_categories: formData.top_categories
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        inventory_value: parseFloat(formData.inventory_value) || 0,
        employee_count: parseInt(formData.employee_count) || 0,
        notes: formData.notes || null,
      };

      const { error } = await supabase.from("store_reports").insert([payload]);
      if (error) throw error;
      showToast("success", "数据上报成功");
      setShowForm(false);
      setFormData({
        store_name: "",
        report_date: new Date().toISOString().slice(0, 10),
        daily_sales: "",
        customer_count: "",
        avg_transaction: "",
        conversion_rate: "",
        top_categories: "",
        inventory_value: "",
        employee_count: "",
        notes: "",
      });
      fetchReports();
    } catch (err: any) {
      showToast("error", "保存失败：" + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此条数据？")) return;
    try {
      const { error } = await supabase.from("store_reports").delete().eq("id", id);
      if (error) throw error;
      showToast("success", "已删除");
      fetchReports();
    } catch (err: any) {
      showToast("error", "删除失败：" + err.message);
    }
  };

  // 汇总统计
  const totalSales = reports.reduce((sum, r) => sum + (r.daily_sales || 0), 0);
  const totalCustomers = reports.reduce((sum, r) => sum + (r.customer_count || 0), 0);
  const avgTransactionAll =
    reports.length > 0
      ? reports.reduce((sum, r) => sum + (r.avg_transaction || 0), 0) / reports.length
      : 0;
  const avgConversion =
    reports.length > 0
      ? reports.reduce((sum, r) => sum + (r.conversion_rate || 0), 0) / reports.length
      : 0;

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-primary" : "bg-red-500"}`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">门店经营数据</h1>
          <p className="text-sm text-muted-foreground mt-1">上报门店销售数据，分析经营表现</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "取消" : "上报数据"}
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "累计销售额", value: `¥${totalSales.toLocaleString()}`, icon: DollarSign, color: "text-green-600 bg-green-50" },
          { label: "总客流", value: totalCustomers.toLocaleString(), icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "平均客单价", value: `¥${avgTransactionAll.toFixed(0)}`, icon: ShoppingCart, color: "text-purple-600 bg-purple-50" },
          { label: "平均转化率", value: `${avgConversion.toFixed(1)}%`, icon: Target, color: "text-amber-600 bg-amber-50" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${card.color}`}>
              <card.icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-black text-primary">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {/* 数据上报表单 */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6"
        >
          <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            上报门店经营数据
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">门店名称 *</label>
              <input
                type="text"
                value={formData.store_name}
                onChange={(e) => setFormData((f) => ({ ...f, store_name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="如：骆芷蝶佛山店"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">日期</label>
              <input
                type="date"
                value={formData.report_date}
                onChange={(e) => setFormData((f) => ({ ...f, report_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">日销售额 (元)</label>
              <input
                type="number"
                value={formData.daily_sales}
                onChange={(e) => setFormData((f) => ({ ...f, daily_sales: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">客流量 (人)</label>
              <input
                type="number"
                value={formData.customer_count}
                onChange={(e) => setFormData((f) => ({ ...f, customer_count: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">客单价 (元)</label>
              <input
                type="number"
                value={formData.avg_transaction}
                onChange={(e) => setFormData((f) => ({ ...f, avg_transaction: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">转化率 (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.conversion_rate}
                onChange={(e) => setFormData((f) => ({ ...f, conversion_rate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">库存金额 (元)</label>
              <input
                type="number"
                value={formData.inventory_value}
                onChange={(e) => setFormData((f) => ({ ...f, inventory_value: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">员工人数</label>
              <input
                type="number"
                value={formData.employee_count}
                onChange={(e) => setFormData((f) => ({ ...f, employee_count: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">热销品类（逗号分隔）</label>
              <input
                type="text"
                value={formData.top_categories}
                onChange={(e) => setFormData((f) => ({ ...f, top_categories: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="连衣裙,衬衫,西装外套"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">备注</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="天气、活动、特殊事项..."
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "保存中..." : "提交数据"}
            </button>
          </div>
        </motion.div>
      )}

      {/* 筛选 + 排序 */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={filterStore}
          onChange={(e) => setFilterStore(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">全部门店</option>
          {storeNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <button
          onClick={() => {
            if (sortBy === "report_date") setSortDir(sortDir === "desc" ? "asc" : "desc");
            else { setSortBy("report_date"); setSortDir("desc"); }
          }}
          className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
            sortBy === "report_date" ? "bg-primary/5 text-primary border-primary/20" : "text-gray-500 border-gray-200"
          }`}
        >
          日期 {sortBy === "report_date" && (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
        </button>
        <button
          onClick={() => {
            if (sortBy === "daily_sales") setSortDir(sortDir === "desc" ? "asc" : "desc");
            else { setSortBy("daily_sales"); setSortDir("desc"); }
          }}
          className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
            sortBy === "daily_sales" ? "bg-primary/5 text-primary border-primary/20" : "text-gray-500 border-gray-200"
          }`}
        >
          销售额 {sortBy === "daily_sales" && (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
        </button>
      </div>

      {/* 数据表格 */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-muted-foreground text-sm">
          暂无门店经营数据，点击「上报数据」开始
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">门店</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">日期</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">销售额</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">客流</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">客单价</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">转化率</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">热销品类</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-primary/50" />
                        <span className="text-sm font-semibold text-primary">{r.store_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(r.report_date).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-bold ${r.daily_sales > 0 ? "text-green-600" : "text-gray-400"}`}>
                        ¥{r.daily_sales.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {r.customer_count || "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {r.avg_transaction ? `¥${r.avg_transaction.toFixed(0)}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${r.conversion_rate > 0 ? "text-primary" : "text-gray-400"}`}>
                        {r.conversion_rate > 0 ? `${r.conversion_rate}%` : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.top_categories?.slice(0, 3).map((cat) => (
                          <span key={cat} className="px-1.5 py-0.5 bg-primary/5 text-primary text-[10px] rounded">
                            {cat}
                          </span>
                        ))}
                        {r.top_categories?.length > 3 && (
                          <span className="text-[10px] text-gray-400">+{r.top_categories.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
