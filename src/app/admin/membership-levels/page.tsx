"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Percent, RefreshCw, Crown, Star } from "lucide-react";

interface MembershipLevel {
  id?: string;
  level_key: string;
  level_name: string;
  type: "price" | "deposit";
  threshold_amount: number | null;  // 分
  discount_rate: number;
  return_rate: number;
  price_fen: number | null;       // 分
  duration_days: number;
  benefits: any[];
  is_active: boolean;
  sort_order: number;
}

export default function MembershipLevelsAdminPage() {
  const [levels, setLevels] = useState<MembershipLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<MembershipLevel | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  async function loadLevels() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/membership-levels", { credentials: "include" });
      const json = await res.json();
      if (json.data) setLevels(json.data);
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadLevels(); }, []);

  function openAdd() {
    setEditing({
      level_key: "",
      level_name: "",
      type: "deposit",
      threshold_amount: null,
      discount_rate: 0.28,
      return_rate: 0.05,
      price_fen: null,
      duration_days: 365,
      benefits: [],
      is_active: true,
      sort_order: levels.length,
    });
    setShowModal(true);
  }

  function openEdit(l: MembershipLevel) {
    setEditing({ ...l, benefits: l.benefits || [] });
    setShowModal(true);
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.level_key || !editing.level_name) {
      showToast("error", "请填写等级标识和名称");
      return;
    }
    setSaving(true);
    try {
      const method = editing.id ? "PUT" : "POST";
      const body = editing.id ? { id: editing.id, ...editing } : editing;
      const res = await fetch("/api/admin/membership-levels", {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "保存失败");

      showToast("success", editing.id ? "修改成功" : "新增成功");
      setShowModal(false);
      setEditing(null);
      loadLevels();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除此会员等级？")) return;
    try {
      const res = await fetch(`/api/admin/membership-levels?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "删除成功");
        loadLevels();
      }
    } catch (e: any) {
      showToast("error", e.message);
    }
  }

  async function toggleActive(l: MembershipLevel) {
    try {
      const res = await fetch("/api/admin/membership-levels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: l.id, is_active: !l.is_active }),
      });
      if (res.ok) loadLevels();
    } catch (e: any) {
      showToast("error", e.message);
    }
  }

  // 格式：分 → 元显示
  function fmtFen(fen: number | null | undefined): string {
    if (fen == null) return "-";
    return (fen / 100).toFixed(0);
  }

  return (
    <div className="min-h-screen">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">会员等级配置</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理「直接开通」和「拿货升级」两种会员获取方式
          </p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-1">
          <Plus className="w-4 h-4" /> 新增等级
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {levels.map((l) => (
            <div key={l.id} className={`bg-white rounded-2xl border p-5 shadow-sm ${l.is_active ? "" : "opacity-50"}`}>
              {/* 头部 */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full mb-1 ${l.type === "price" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                    {l.type === "price" ? "直接开通" : "拿货升级"}
                  </span>
                  <h3 className="font-bold text-primary text-lg">{l.level_name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{l.level_key}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(l)} className="p-1.5 text-gray-400 hover:text-accent rounded-lg hover:bg-gray-50">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(l.id!)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 核心权益 */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <Percent className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-600">折扣：</span>
                  <span className="font-bold text-orange-500">{(l.discount_rate * 10).toFixed(1)}折</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">退换：</span>
                  <span className="font-bold text-green-500">{(l.return_rate * 100).toFixed(0)}%</span>
                </div>
                {l.type === "deposit" && l.threshold_amount && (
                  <div className="flex items-center gap-2 text-sm">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className="text-gray-600">拿货阈值：</span>
                    <span className="font-bold text-amber-500">¥{fmtFen(l.threshold_amount)}{(l.threshold_amount / 100) >= 10000 ? "万" : ""}</span>
                  </div>
                )}
                {l.type === "price" && l.price_fen && (
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-600">开通价格：</span>
                    <span className="font-bold text-purple-500">¥{fmtFen(l.price_fen)}</span>
                  </div>
                )}
              </div>

              {/* 权益列表 */}
              {l.benefits && l.benefits.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-1">权益列表：</p>
                  <div className="flex flex-wrap gap-1">
                    {l.benefits.map((b: any, i: number) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{b.title}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 底部操作 */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">有效期{l.duration_days}天</span>
                <button
                  onClick={() => toggleActive(l)}
                  className={`text-xs px-3 py-1 rounded-full ${l.is_active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}
                >
                  {l.is_active ? "已启用" : "已停用"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 编辑弹窗 */}
      {showModal && editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-primary mb-4">{editing.id ? "编辑等级" : "新增等级"}</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">等级标识 *</label>
                  <input
                    value={editing.level_key}
                    onChange={e => setEditing({ ...editing, level_key: e.target.value })}
                    placeholder="如：deposit_5w"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">等级名称 *</label>
                  <input
                    value={editing.level_name}
                    onChange={e => setEditing({ ...editing, level_name: e.target.value })}
                    placeholder="如：拿货会员5万"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开通方式</label>
                  <select
                    value={editing.type}
                    onChange={e => setEditing({ ...editing, type: e.target.value as "price" | "deposit" })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="deposit">拿货升级</option>
                    <option value="price">直接开通</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">有效期（天）</label>
                  <input
                    type="number"
                    value={editing.duration_days}
                    onChange={e => setEditing({ ...editing, duration_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">折扣率（如0.28=2.8折）</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editing.discount_rate}
                    onChange={e => setEditing({ ...editing, discount_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">退换比例（如0.05=5%）</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editing.return_rate}
                    onChange={e => setEditing({ ...editing, return_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              {editing.type === "deposit" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">拿货阈值（元）</label>
                  <input
                    type="number"
                    value={editing.threshold_amount ? Math.round(editing.threshold_amount / 100) : ""}
                    onChange={e => setEditing({ ...editing, threshold_amount: Number(e.target.value) * 100 })}
                    placeholder="如：5000（表示5000元）"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              )}

              {editing.type === "price" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开通价格（元）</label>
                  <input
                    type="number"
                    value={editing.price_fen ? Math.round(editing.price_fen / 100) : ""}
                    onChange={e => setEditing({ ...editing, price_fen: Number(e.target.value) * 100 })}
                    placeholder="如：99"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editing.is_active}
                  onChange={e => setEditing({ ...editing, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">启用此等级</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="flex-1 px-4 py-2 border rounded-xl text-sm">取消</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
