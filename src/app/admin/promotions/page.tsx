"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, Megaphone, Save, Trash2, Edit3, Plus,
  ArrowRight, Image as ImageIcon, Link, Tag,
} from "lucide-react";
import ImeInput from "@/components/ImeInput";

/* ========== 类型定义 ========== */
interface Promotion {
  id: string;
  title: string;
  description: string;
  promo_type: string;
  discount_rate: number | null;
  start_date: string;
  end_date: string;
  status: string;
  banner_image_url: string | null;
  link_url: string | null;
  sort_order?: number;
}

const PROMO_TYPES = [
  { value: "flash_sale", label: "限时秒杀", color: "from-red-500 to-pink-500" },
  { value: "new_user", label: "新品/新客", color: "from-amber-500 to-orange-500" },
  { value: "invite", label: "邀请有礼", color: "from-green-500 to-teal-500" },
  { value: "seasonal", label: "季节/节日", color: "from-purple-500 to-indigo-500" },
  { value: "clearance", label: "清仓特惠", color: "from-gray-500 to-gray-400" },
  { value: "vip_exclusive", label: "VIP专享", color: "from-rose-500 to-pink-500" },
  { value: "brand_collab", label: "品牌联名", color: "from-cyan-500 to-blue-500" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "进行中", color: "bg-green-100 text-green-700" },
  { value: "scheduled", label: "待开始", color: "bg-blue-100 text-blue-700" },
  { value: "ended", label: "已结束", color: "bg-gray-400 text-white" },
  { value: "draft", label: "草稿", color: "bg-gray-200 text-gray-600" },
];

/* ========== Supabase 客户端（带 service_role 的 API 路由） ========== */
const API_BASE = "/api/admin/promotions";

/* ========== 主组件 ========== */
export default function AdminPromotionsPage() {
  const [list, setList] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 表单状态
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Promotion>>({
    title: "",
    description: "",
    promo_type: "seasonal",
    discount_rate: null,
    start_date: "",
    end_date: "",
    status: "active",
    banner_image_url: null,
    link_url: "",
  });

  /* ---- 数据加载 ---- */
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE);
      const json = await res.json();
      if (json.success && json.data) {
        setList(json.data);
      } else {
        setList([]);
      }
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  /* ---- 表单操作 ---- */
  const openNew = () => {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      promo_type: "seasonal",
      discount_rate: null,
      start_date: "",
      end_date: "",
      status: "active",
      banner_image_url: null,
      link_url: "",
    });
    setShowForm(true);
  };

  const openEdit = (item: Promotion) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      promo_type: item.promo_type,
      discount_rate: item.discount_rate,
      start_date: item.start_date ? item.start_date.substring(0, 10) : "",
      end_date: item.end_date ? item.end_date.substring(0, 10) : "",
      status: item.status,
      banner_image_url: item.banner_image_url,
      link_url: item.link_url || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title?.trim()) { alert("请填写活动标题"); return; }
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description || "",
        promo_type: form.promo_type || "seasonal",
        discount_rate: form.discount_rate || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status || "active",
        banner_image_url: form.banner_image_url || null,
        link_url: form.link_url || null,
      };

      let res: Response;
      if (editingId) {
        res = await fetch(`${API_BASE}/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok || json.error) {
        alert("保存失败：" + (json.error || "未知错误"));
      } else {
        setShowForm(false);
        fetchList();
      }
    } catch (err: any) {
      alert("保存失败：" + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除该营销活动？")) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) alert("删除失败：" + json.error);
      else fetchList();
    } catch (err: any) {
      alert("删除失败：" + err.message);
    }
  };

  const toggleStatus = async (item: Promotion) => {
    const newStatus = item.status === "active" ? "ended" : "active";
    try {
      const res = await fetch(`${API_BASE}/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.error) alert("操作失败：" + json.error);
      else fetchList();
    } catch (err: any) {
      alert("操作失败：" + err.message);
    }
  };

  /* ---- 图片上传 ---- */
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { alert("请选择图片"); return null; }
    if (file.size > 5 * 1024 * 1024) { alert("图片不能超过5MB"); return null; }
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.success) {
        setForm(f => ({ ...f, banner_image_url: json.url }));
        return json.url;
      } else {
        alert("上传失败：" + (json.error || ""));
        return null;
      }
    } catch {
      alert("上传失败");
      return null;
    }
  };

  /* ---- 渲染 ---- */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 标题栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-orange-500" />
            营销活动管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">管理买手选品页的营销活动卡片（最多展示4张）</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />新建活动
        </button>
      </div>

      <div className="p-6">
        {/* 列表 */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : list.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无营销活动</p>
            <p className="text-sm text-gray-400 mt-1">点击右上角「新建活动」开始创建</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((item) => {
              const typeInfo = PROMO_TYPES.find(t => t.value === item.promo_type);
              const statusInfo = STATUS_OPTIONS.find(s => s.value === item.status);
              return (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                  {/* 类型色块 */}
                  <div className={`w-2 self-stretch rounded-full bg-gradient-to-b ${typeInfo?.color || 'from-gray-400 to-gray-300'}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                      {statusInfo && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                      )}
                      {typeInfo && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{typeInfo.label}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{item.description}</p>
                    <div className="flex items-center gap-4 mt-1.5 text-[11px] text-gray-400">
                      {item.discount_rate && <span>折扣：{Math.round(item.discount_rate * 10)}折</span>}
                      {item.start_date && <span>开始：{item.start_date.substring(0, 10)}</span>}
                      {item.end_date && <span>结束：{item.end_date.substring(0, 10)}</span>}
                      {item.link_url && <span className="truncate">链接：{item.link_url}</span>}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleStatus(item)} className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                      item.status === "active"
                        ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}>
                      {item.status === "active" ? "下架" : "发布"}
                    </button>
                    <button onClick={() => openEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="编辑">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 新建/编辑弹窗 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* 弹窗标题 */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-bold text-lg">{editingId ? "编辑活动" : "新建活动"}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* 标题 */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">活动标题 *</label>
                <ImeInput
                  type="text" value={form.title || ""}
                  onChange={val => setForm(f => ({ ...f, title: val }))}
                  placeholder="如：夏季清仓特惠"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">活动描述</label>
                <ImeInput
                  type="text" value={form.description || ""}
                  onChange={val => setForm(f => ({ ...f, description: val }))}
                  placeholder="如：全场2.8折起"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                />
              </div>

              {/* 活动类型 + 状态 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">活动类型</label>
                  <select
                    value={form.promo_type || "seasonal"}
                    onChange={e => setForm(f => ({ ...f, promo_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none bg-white"
                  >
                    {PROMO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">状态</label>
                  <select
                    value={form.status || "active"}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none bg-white"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              {/* 折扣率 */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">折扣率（0.1-1，可选）</label>
                <input
                  type="number" step="0.01" min="0.1" max="1"
                  value={form.discount_rate ?? ""}
                  onChange={e => setForm(f => ({ ...f, discount_rate: e.target.value ? parseFloat(e.target.value) : null }))}
                  placeholder="如：0.28 表示2.8折"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                />
              </div>

              {/* 日期 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                  <input
                    type="date" value={form.start_date || ""}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                  <input
                    type="date" value={form.end_date || ""}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* 跳转链接 */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">跳转链接</label>
                <input
                  type="text" value={form.link_url || ""}
                  onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                  placeholder="如：/promotion/summer 或 https://..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                />
              </div>

              {/* Banner 图片 */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">活动图片（可选）</label>
                <div className="flex items-center gap-3">
                  {form.banner_image_url && (
                    <img src={form.banner_image_url} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                  )}
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file" accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) await handleImageUpload(file);
                      }}
                      className="hidden"
                    />
                    <div className="px-4 py-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors text-center">
                      {form.banner_image_url ? "更换图片" : "点击上传图片"}
                    </div>
                  </label>
                  {form.banner_image_url && (
                    <button
                      onClick={() => setForm(f => ({ ...f, banner_image_url: null }))}
                      className="px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >删除</button>
                  )}
                </div>
              </div>
            </div>

            {/* 底部操作栏 */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >取消</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title?.trim()}
                className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "保存中..." : "保存活动"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
