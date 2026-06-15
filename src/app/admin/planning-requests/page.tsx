"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Eye, Loader2, CheckCircle2,
  FileText, Upload, X, Trash2, Filter, Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PlanningRequest {
  id: string;
  user_id: string | null;
  store_name: string | null;
  store_type: string;
  store_scale: string;
  style_preference: string;
  season: string | null;
  budget_range: string | null;
  contact: string | null;
  problems: string | null;
  notes: string | null;
  status: "pending" | "paid" | "processing" | "completed";
  paid_amount: number;
  report_url: string | null;
  created_at: string;
  updated_at: string;
}

const STORE_TYPE_MAP: Record<string, string> = {
  women: "女装店",
  men: "男装店",
  children: "童装店",
  multi: "集合店",
  boutique: "买手店",
  online: "线上店铺",
};

const STORE_SCALE_MAP: Record<string, string> = {
  small: "小型店（30-50㎡）",
  medium: "中型店（50-100㎡）",
  large: "大型店（100-200㎡）",
  flagship: "旗舰店（200㎡+）",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending: { label: "待处理", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  paid: { label: "已支付", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-400" },
  processing: { label: "处理中", color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-400" },
  completed: { label: "已完成", color: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
};

export default function AdminPlanningRequestsPage() {
  const [requests, setRequests] = useState<PlanningRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<PlanningRequest | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/admin/login");
    };
    check();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    let query = supabase
      .from("planning_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (filterStatus) query = query.eq("status", filterStatus);
    const { data, error } = await query;
    if (!error && data) setRequests(data as PlanningRequest[]);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [filterStatus]);

  const filtered = requests.filter((r) => {
    if (!searchTerm) return true;
    const kw = searchTerm.toLowerCase();
    return (
      (r.store_name || "").toLowerCase().includes(kw) ||
      (r.contact || "").toLowerCase().includes(kw) ||
      r.store_type.toLowerCase().includes(kw)
    );
  });

  const openDetail = (req: PlanningRequest) => {
    setSelectedRequest(req);
    setShowDetail(true);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedRequest(null);
    fetchRequests();
  };

  const updateStatus = async (id: string, status: PlanningRequest["status"]) => {
    setSaving(true);
    const { error } = await supabase
      .from("planning_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) showToast("error", "更新失败：" + error.message);
    else {
      showToast("success", "状态已更新");
      fetchRequests();
      if (selectedRequest) setSelectedRequest({ ...selectedRequest, status });
    }
    setSaving(false);
  };

  const handleUploadReport = async (req: PlanningRequest, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { showToast("error", "文件不能超过20MB"); return; }
    setUploading(true);
    try {
      const fileName = `reports/${req.id}_${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("reports").upload(fileName, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("reports").getPublicUrl(fileName);
      const { error: dbErr } = await supabase
        .from("planning_requests")
        .update({ report_url: urlData.publicUrl, status: "completed", updated_at: new Date().toISOString() })
        .eq("id", req.id);
      if (dbErr) throw dbErr;
      showToast("success", "报告已上传，状态已标记完成");
      fetchRequests();
      if (selectedRequest) setSelectedRequest({ ...selectedRequest, report_url: urlData.publicUrl, status: "completed" });
    } catch (err: any) {
      showToast("error", "上传失败：" + (err.message || "未知错误"));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此需求？此操作不可恢复。")) return;
    try {
      // 直接调用服务端API（service role 完全绕过RLS）
      const res = await fetch(`/api/admin/delete-planning-request?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "API删除失败");
      showToast("success", "已删除");
      fetchRequests();
    } catch (err: any) {
      showToast("error", "删除失败：" + (err.message || "未知错误"));
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    processing: requests.filter((r) => r.status === "processing").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
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

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">企划需求处理</h1>
          <p className="text-sm text-muted-foreground mt-1">查看、处理用户提交的企划需求，上传报告</p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "全部需求", value: stats.total, color: "bg-primary/10 text-primary" },
          { label: "待处理", value: stats.pending, color: "bg-amber-50 text-amber-700" },
          { label: "处理中", value: stats.processing, color: "bg-purple-50 text-purple-700" },
          { label: "已完成", value: stats.completed, color: "bg-green-50 text-green-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs opacity-70 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索门店名/联系方式..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="paid">已支付</option>
          <option value="processing">处理中</option>
          <option value="completed">已完成</option>
        </select>
        {(filterStatus || searchTerm) && (
          <button
            onClick={() => { setFilterStatus(""); setSearchTerm(""); }}
            className="text-xs text-accent hover:underline"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
            <p className="text-muted-foreground text-sm">加载中...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            {searchTerm || filterStatus ? "没有匹配的需求" : "暂无企划需求"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">门店/联系方式</th>
                  <th className="px-5 py-3 font-medium">店铺类型</th>
                  <th className="px-5 py-3 font-medium">体量</th>
                  <th className="px-5 py-3 font-medium">风格偏好</th>
                  <th className="px-5 py-3 font-medium">预算</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium">报告</th>
                  <th className="px-5 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-900 text-sm">{req.store_name || "未填写"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{req.contact || "无联系方式"}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{new Date(req.created_at).toLocaleDateString("zh-CN")}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-700">
                      {STORE_TYPE_MAP[req.store_type] || req.store_type}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-700">
                      {STORE_SCALE_MAP[req.store_scale] || req.store_scale}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-700 max-w-[120px] truncate">
                      {req.style_preference}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-700">
                      {req.budget_range || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[req.status].color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[req.status].dot}`} />
                        {STATUS_CONFIG[req.status].label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {req.report_url ? (
                        <a href={req.report_url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline inline-flex items-center gap-1">
                          <FileText className="w-3 h-3" />查看报告
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">未上传</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetail(req)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeDetail} />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-primary">需求详情</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(selectedRequest.created_at).toLocaleString("zh-CN")}
                </p>
              </div>
              <button onClick={closeDetail} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {(["pending", "paid", "processing", "completed"] as const).map((s) => (
                  <button
                    key={s}
                    disabled={saving}
                    onClick={() => updateStatus(selectedRequest.id, s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selectedRequest.status === s
                        ? STATUS_CONFIG[s].color.replace("bg-", "ring-2 ring-offset-1 ")
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "门店名称", value: selectedRequest.store_name || "未填写" },
                  { label: "店铺类型", value: STORE_TYPE_MAP[selectedRequest.store_type] || selectedRequest.store_type },
                  { label: "店铺体量", value: STORE_SCALE_MAP[selectedRequest.store_scale] || selectedRequest.store_scale },
                  { label: "风格偏好", value: selectedRequest.style_preference },
                  { label: "季节", value: selectedRequest.season || "未指定" },
                  { label: "预算区间", value: selectedRequest.budget_range || "未指定" },
                  { label: "联系方式", value: selectedRequest.contact || "未填写" },
                  { label: "已付金额", value: selectedRequest.paid_amount ? `¥${(selectedRequest.paid_amount / 100).toFixed(0)}` : "¥0" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <div className="text-sm font-medium text-gray-900 mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Problems */}
              {selectedRequest.problems && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">遇到的问题</div>
                  <div className="text-sm text-gray-700 bg-amber-50 rounded-lg p-3 border border-amber-100">
                    {selectedRequest.problems}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedRequest.notes && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">备注</div>
                  <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                    {selectedRequest.notes}
                  </div>
                </div>
              )}

              {/* Report upload */}
              <div>
                <div className="text-xs text-muted-foreground mb-2">企划报告</div>
                {selectedRequest.report_url ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <FileText className="w-5 h-5 text-green-600" />
                    <a href={selectedRequest.report_url} target="_blank" rel="noreferrer" className="text-sm text-green-700 hover:underline font-medium">
                      查看已上传的报告
                    </a>
                    <label className="ml-auto text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                      重新上传
                      <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={(e) => handleUploadReport(selectedRequest, e)} disabled={uploading} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
                    {uploading ? (
                      <div className="flex items-center gap-2 text-accent">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">上传中...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">点击上传企划报告（PDF/Word/PPT）</span>
                      </>
                    )}
                    <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={(e) => handleUploadReport(selectedRequest, e)} disabled={uploading} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
