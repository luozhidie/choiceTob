"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Heart, Search, Send } from "lucide-react";

// 分→元格式化（内联）
const fmt = (p: number) => `¥${(p / 100).toFixed(0)}`;

export default function AdminRedPacketsPage() {
  const [packets, setPackets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    user_id: "",
    title: "",
    amount: 0,        // 分
    packet_type: "general",
    expire_days: 30,
    batch_send: false,
  });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  async function loadPackets() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(keyword && { keyword }),
      });
      const res = await fetch(`/api/admin/red-packets?${params}`, { credentials: "include" });
      const json = await res.json();
      if (json.data) {
        setPackets(json.data);
        setTotalPages(json.totalPages || 1);
      }
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPackets(); }, [page, statusFilter]);
  useEffect(() => { if (!showModal) { setPage(1); loadPackets(); } }, [keyword]);

  function openAdd() {
    setForm({ user_id: "", title: "", amount: 0, packet_type: "general", expire_days: 30, batch_send: false });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title || !form.amount) {
      showToast("error", "请填写标题和金额");
      return;
    }
    setSaving(true);
    try {
      const body: any = {
        title: form.title,
        amount: Number(form.amount),
        packet_type: form.packet_type,
        expire_days: Number(form.expire_days),
      };

      if (form.batch_send) {
        body.batch_send = true;
      } else {
        if (!form.user_id) {
          showToast("error", "请填写用户ID或选择批量发放");
          setSaving(false);
          return;
        }
        body.user_id = form.user_id;
      }

      const res = await fetch("/api/admin/red-packets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "保存失败");

      showToast("success", form.batch_send ? `已批量发放${json.count}个红包` : "发放成功");
      setShowModal(false);
      loadPackets();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除此红包？")) return;
    try {
      const res = await fetch(`/api/admin/red-packets?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "删除成功");
        loadPackets();
      }
    } catch (e: any) {
      showToast("error", e.message);
    }
  }

  const packetTypeLabels: Record<string, string> = {
    general: "通用",
    vip_gift: "VIP赠送",
    festival: "节日活动",
    invite_reward: "邀请奖励",
  };

  return (
    <div className="min-h-screen">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">红包管理</h1>
          <p className="text-sm text-muted-foreground mt-1">发放和管理用户红包</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-1">
          <Plus className="w-4 h-4" /> 发放红包
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && loadPackets()}
            placeholder="搜索红包标题..."
            className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-xl text-sm"
        >
          <option value="all">全部状态</option>
          <option value="unused">未使用</option>
          <option value="used">已使用</option>
          <option value="expired">已过期</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : packets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-muted-foreground">
          <Heart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p>暂无红包记录</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">标题</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">金额</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">类型</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">状态</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">过期日</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">用户</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {packets.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">{p.title}</td>
                  <td className="px-4 py-3 text-sm font-bold text-red-500">¥{fmt(p.amount)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
                      {packetTypeLabels[p.packet_type] || p.packet_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "unused" && <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">未使用</span>}
                    {p.status === "used" && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">已使用</span>}
                    {p.status === "expired" && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500">已过期</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.expire_at || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[120px] truncate">
                    {p.profiles?.full_name || p.profiles?.email || p.user_id?.slice(0, 8) || "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600 text-sm">
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-30">上一页</button>
              <span className="text-sm text-gray-600">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-30">下一页</button>
            </div>
          )}
        </div>
      )}

      {/* 新增弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-primary mb-4">发放红包</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="如：新人见面礼"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金额（元）*</label>
                <input
                  type="number"
                  value={form.amount > 0 ? Math.round(form.amount / 100) : ""}
                  onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) * 100 }))}
                  placeholder="如：5（表示5元）"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">红包类型</label>
                  <select
                    value={form.packet_type}
                    onChange={e => setForm(f => ({ ...f, packet_type: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="general">通用</option>
                    <option value="vip_gift">VIP赠送</option>
                    <option value="festival">节日活动</option>
                    <option value="invite_reward">邀请奖励</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">有效期（天）</label>
                  <input
                    type="number"
                    value={form.expire_days}
                    onChange={e => setForm(f => ({ ...f, expire_days: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="batchSendPkt"
                  checked={form.batch_send}
                  onChange={e => setForm(f => ({ ...f, batch_send: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="batchSendPkt" className="text-sm text-gray-700">批量发放给所有用户</label>
              </div>

              {!form.batch_send && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">用户ID（user_id）</label>
                  <input
                    value={form.user_id}
                    onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                    placeholder="输入用户UUID"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-xl text-sm">取消</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {form.batch_send ? "批量发放" : "发放"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
