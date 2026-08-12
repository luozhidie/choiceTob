"use client";

import { useEffect, useState } from "react";
import {
  Plus, Edit3, Trash2, Save, X, Upload, Loader2, Store, Star,
} from "lucide-react";

interface Market { id: string; name: string; }
interface Stall {
  id: string;
  market_id?: string | null;
  name: string;
  avatar?: string | null;
  intro?: string | null;
  market_floor?: string | null;
  tags?: string[] | null;
  rating?: number;
  fan_count?: number;
  reorder_rate?: number;
  delivery_rate?: number;
  product_ids?: string[] | null;
  recommend_reason?: string | null;
  is_published: boolean;
  sort_order: number;
  markets?: { name: string } | null;
}

/* 商品选择器（复用 blocks 页面逻辑，来源 /api/admin/products-data） */
function ProductPicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedIds = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/admin/products-data?limit=200", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => { if (json.success && json.data) setProducts(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = products.filter(
    (p) => !selectedIds.includes(p.id) && (p.title || p.name || "").toLowerCase().includes(search.toLowerCase())
  );
  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  const toggle = (id: string) => {
    const next = selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id];
    onChange(next.join(","));
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {selectedProducts.length > 0 && (
        <div className="p-2 bg-gray-50 flex flex-wrap gap-2 min-h-[44px]">
          {selectedProducts.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-md text-xs">
              {p.name || p.title || "商品"}
              <button type="button" onClick={() => toggle(p.id)} className="text-gray-400 hover:text-red-500 ml-1">×</button>
            </span>
          ))}
        </div>
      )}
      {!open ? (
        <button type="button" onClick={() => setOpen(true)}
          className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          {selectedIds.length > 0 ? `已选 ${selectedIds.length} 件，点击继续添加` : "点击选择关联商品"}
        </button>
      ) : (
        <div className="border-t border-gray-200">
          <div className="px-3 pt-2">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索商品名称..." autoFocus
              className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:border-primary outline-none mb-2" />
          </div>
          <div className="max-h-[220px] overflow-y-auto px-3 pb-2 space-y-1">
            {loading ? (
              <div className="py-6 text-center text-xs text-gray-400">加载中…</div>
            ) : filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">没有更多可选商品</div>
            ) : (
              filtered.slice(0, 40).map((p) => (
                <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={false} onChange={() => toggle(p.id)} />
                  {p.image_url || p.cover_image ? (
                    <img src={p.image_url || p.cover_image} alt="" className="w-7 h-7 rounded object-cover" />
                  ) : null}
                  <span className="text-sm text-gray-700 truncate">{p.name || p.title || "商品"}</span>
                </label>
              ))
            )}
            <button type="button" onClick={() => setOpen(false)}
              className="w-full mt-1 py-1.5 text-xs text-gray-400 hover:text-gray-600">收起</button>
          </div>
        </div>
      )}
    </div>
  );
}

const EMPTY = {
  market_id: "",
  name: "",
  avatar: "",
  intro: "",
  market_floor: "",
  tags: "",
  rating: 5,
  fan_count: 0,
  reorder_rate: 0,
  delivery_rate: 0,
  product_ids: "",
  recommend_reason: "",
  is_published: false,
  sort_order: 0,
};

export default function StallsAdmin() {
  const [list, setList] = useState<Stall[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/stalls", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/markets", { credentials: "include" }).then((r) => r.json()),
    ]).then(([s, m]) => {
      if (s.success) setList(s.data || []);
      if (m.success) setMarkets(m.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY });
    setShowForm(true);
  };

  const openEdit = (s: Stall) => {
    setEditingId(s.id);
    setForm({
      market_id: s.market_id || "",
      name: s.name || "",
      avatar: s.avatar || "",
      intro: s.intro || "",
      market_floor: s.market_floor || "",
      tags: (s.tags || []).join("，"),
      rating: s.rating ?? 5,
      fan_count: s.fan_count || 0,
      reorder_rate: s.reorder_rate || 0,
      delivery_rate: s.delivery_rate || 0,
      product_ids: (s.product_ids || []).join(","),
      recommend_reason: s.recommend_reason || "",
      is_published: s.is_published,
      sort_order: s.sort_order || 0,
    });
    setShowForm(true);
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "stalls");
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const j = await res.json();
      if (j.url) setForm((f: any) => ({ ...f, avatar: j.url }));
      else alert("上传失败：" + (j.error || ""));
    } catch (e: any) { alert("上传失败：" + e.message); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.name) { alert("请填写档口名称"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/stalls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: editingId || undefined, ...form }),
      });
      const j = await res.json();
      if (j.success) { setShowForm(false); load(); }
      else alert("保存失败：" + (j.error || ""));
    } catch (e: any) { alert("保存失败：" + e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("确认删除该档口？")) return;
    try {
      const res = await fetch("/api/admin/common/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, table: "peer_stalls" }),
      });
      const j = await res.json();
      if (j.success) load();
      else alert("删除失败：" + (j.error || ""));
    } catch (e: any) { alert("删除失败：" + e.message); }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" /> 同行档口管理
        </h1>
        {!showForm && (
          <button onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90">
            <Plus className="w-4 h-4" /> 新增档口
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">{editingId ? "编辑档口" : "新增档口"}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">所属市场 *</label>
              <select value={form.market_id}
                onChange={(e) => setForm({ ...form, market_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none bg-white">
                <option value="">未选择市场</option>
                {markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">档口名称 *</label>
              <input value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如：XX服饰 / 韩潮严选"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">档口头像</label>
              <div className="flex items-center gap-2">
                {form.avatar && <img src={form.avatar} alt="" className="w-12 h-12 rounded-full object-cover border" />}
                <input value={form.avatar}
                  onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                  placeholder="图片 URL（或上传）"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none" />
                <label className="relative cursor-pointer px-2 py-2 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-gray-200">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">楼层</label>
              <input value={form.market_floor}
                onChange={(e) => setForm({ ...form, market_floor: e.target.value })}
                placeholder="如：1楼 / 2楼A区"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">评分（0-5）</label>
              <input type="number" step="0.1" min="0" max="5" value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">粉丝数</label>
              <input type="number" value={form.fan_count}
                onChange={(e) => setForm({ ...form, fan_count: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">返单率（%）</label>
              <input type="number" step="0.01" value={form.reorder_rate}
                onChange={(e) => setForm({ ...form, reorder_rate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">发货率（%）</label>
              <input type="number" step="0.01" value={form.delivery_rate}
                onChange={(e) => setForm({ ...form, delivery_rate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">标签（逗号分隔）</label>
              <input value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="如：严选品牌，韩版，大码"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">排序</label>
              <input type="number" value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })} id="stall-pub" />
              <label htmlFor="stall-pub" className="text-sm text-gray-600">发布（勾选后前端可见）</label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">档口简介</label>
              <textarea value={form.intro} rows={3}
                onChange={(e) => setForm({ ...form, intro: e.target.value })}
                placeholder="档口定位、主营风格、拿货政策…"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">推荐理由</label>
              <textarea value={form.recommend_reason} rows={2}
                onChange={(e) => setForm({ ...form, recommend_reason: e.target.value })}
                placeholder="为什么推荐这个档口（显示在卡片上）"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">关联商品</label>
              <ProductPicker value={form.product_ids} onChange={(v) => setForm({ ...form, product_ids: v })} />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">取消</button>
            <button onClick={save} disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 保存
            </button>
          </div>
        </div>
      )}

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">加载中…</div>
      ) : list.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">暂无档口，点击右上角新增</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-3">头像</th>
                <th className="text-left px-4 py-3">档口</th>
                <th className="text-left px-4 py-3">市场</th>
                <th className="text-left px-4 py-3">评分</th>
                <th className="text-left px-4 py-3">粉丝</th>
                <th className="text-left px-4 py-3">返单</th>
                <th className="text-left px-4 py-3">状态</th>
                <th className="text-right px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    {s.avatar
                      ? <img src={s.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                      : <span className="w-9 h-9 rounded-full bg-gray-100 inline-block" />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{s.name}</div>
                    {(s.tags && s.tags.length > 0) && (
                      <div className="text-xs text-gray-400 mt-0.5">{(s.tags as string[]).join("，")}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.markets?.name || "-"}</td>
                  <td className="px-4 py-3 text-gray-600 flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {s.rating ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.fan_count || 0}</td>
                  <td className="px-4 py-3 text-gray-600">{s.reorder_rate || 0}%</td>
                  <td className="px-4 py-3">
                    {s.is_published
                      ? <span className="text-green-600 text-xs">已发布</span>
                      : <span className="text-gray-400 text-xs">草稿</span>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-800 mr-3">
                      <Edit3 className="w-4 h-4 inline" /> 编辑
                    </button>
                    <button onClick={() => remove(s.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4 inline" /> 删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
