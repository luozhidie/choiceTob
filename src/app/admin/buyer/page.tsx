"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {  } from "next/navigation";
import { STYLE_KEY_MAP, FEMALE_STYLES, MALE_STYLES, COLOR_SEASON_PRO_MAP, COLOR_SEASONS_PRO, getColorSeasonLabel, getStyleProLabel, getColorSeasonProLabel } from "@/lib/styles";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  X,
  Eye,
  EyeOff,
  Loader2,
  Search,
  Package,
} from "lucide-react";
import { CATEGORY_MAP, SUBCATEGORY_MAP } from "@/lib/categories";

interface BuyerProduct {
  id: string;
  title?: string;
  name?: string;
  description?: string | null;
  cover_image?: string | null;
  image_url?: string;
  price: number;
  original_price?: number | null;
  cost_price?: number | null;
  supplier?: string | null;
  category?: string | null;
  subcategory?: string | null;
  color_season?: string | null;
  style_type?: string | null;
  stock?: number;
  tags?: string[] | null;
  is_published: boolean;
  created_at: string;
}

const STYLE_MAP = STYLE_KEY_MAP;

const COLOR_MAP = COLOR_SEASON_PRO_MAP;
const COLOR_SEASONS = COLOR_SEASONS_PRO;

export default function AdminBuyerPage() {
  const [products, setProducts] = useState<BuyerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BuyerProduct | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    color_season: "",
    style_type: "",
    price: "",
    original_price: "",
    cost_price: "",
    supplier: "",
    stock: "0",
    tags: "",
    image_url: "",
    is_published: false,
  });
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  useEffect(() => { 
fetchProducts(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title:"", description:"", category:"", subcategory:"", color_season:"", style_type:"", price:"", original_price:"", cost_price:"", supplier:"", stock:"0", tags:"", image_url:"", is_published:false });
    setShowModal(true);
  };
  const openEdit = (p: BuyerProduct) => {
    setEditing(p);
    setForm({
      title: p.title || p.name || "",
      description: p.description || "",
      category: p.category || "",
      subcategory: p.subcategory || "",
      color_season: p.color_season || "",
      style_type: p.style_type || "",
      price: ((p.price || 0) / 100).toString(),
      original_price: p.original_price ? (p.original_price / 100).toString() : "",
      cost_price: p.cost_price ? (p.cost_price / 100).toString() : "",
      supplier: p.supplier || "",
      stock: (p.stock || 0).toString(),
      tags: p.tags?.join(", ") || "",
      image_url: p.cover_image || p.image_url || "",
      is_published: p.is_published,
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const fileName = `${Math.random()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("buyer-images").upload(fileName, file);
    if (error) { alert("上传失败：" + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("buyer-images").getPublicUrl(fileName);
    setForm(f => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      title: form.title || null,
      description: form.description || null,
      category: form.category || null,
      subcategory: form.subcategory || null,
      color_season: form.color_season || null,
      style_type: form.style_type || null,
      price: form.price ? parseInt(form.price) * 100 : 0,
      original_price: form.original_price ? parseInt(form.original_price) * 100 : null,
      cost_price: form.cost_price ? parseInt(form.cost_price) * 100 : null,
      supplier: form.supplier || null,
      stock: parseInt(form.stock) || 0,
      tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : null,
      cover_image: form.image_url || null,
      image_url: form.image_url || null,
      is_published: form.is_published,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("buyer_products").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("buyer_products").insert([payload]));
    }
    if (error) { alert("保存失败：" + error.message); return; }
    setShowModal(false); setEditing(null); fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除？")) return;
    const { error } = await supabase.from("buyer_products").delete().eq("id", id);
    if (error) alert("删除失败：" + error.message); else fetchProducts();
  };
  const togglePublish = async (p: BuyerProduct) => {
    const { error } = await supabase.from("buyer_products").update({ is_published: !p.is_published }).eq("id", p.id);
    if (error) alert("操作失败：" + error.message); else fetchProducts();
  };

  const getName = (p: BuyerProduct) => p.title || p.name || "未命名";
  const getImage = (p: BuyerProduct) => p.cover_image || p.image_url || null;

  const filtered = products.filter(p => {
    if (!search.trim()) return true;
    const kw = search.toLowerCase();
    return getName(p).toLowerCase().includes(kw) || (p.description || "").toLowerCase().includes(kw);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">买手选品管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理B端采购商品，支持品类/风格/色彩划分</p>
        </div>
        <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl">
          <Plus className="w-4 h-4" /> 新增选品
        </button>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索选品名称..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "全部", value: products.length, color: "bg-primary/10 text-primary" },
          { label: "已发布", value: products.filter(p => p.is_published).length, color: "bg-green-50 text-green-600" },
          { label: "草稿", value: products.filter(p => !p.is_published).length, color: "bg-gray-100 text-gray-500" },
          { label: "缺货", value: products.filter(p => !p.stock).length, color: "bg-red-50 text-red-500" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs opacity-70 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">暂无选品，点击上方按钮新增</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3">图片</th>
                  <th className="px-5 py-3">名称</th>
                  <th className="px-5 py-3">品类</th>
                  <th className="px-5 py-3">风格</th>
                  <th className="px-5 py-3">色彩</th>
                  <th className="px-5 py-3">售价</th>
                  <th className="px-5 py-3">供货价</th>
                  <th className="px-5 py-3">库存</th>
                  <th className="px-5 py-3">状态</th>
                  <th className="px-5 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      {getImage(p) ? (
                        <img src={getImage(p)!} alt="" className="w-10 h-10 object-cover rounded-lg" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 font-medium text-primary max-w-[160px] truncate">{getName(p)}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-0.5">
                        {p.category && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary w-fit">{CATEGORY_MAP[p.category] || p.category}</span>}
                        {p.subcategory && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent w-fit">{SUBCATEGORY_MAP[p.subcategory] || p.subcategory}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{p.style_type ? getStyleProLabel(p.style_type) || p.style_type : "—"}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{p.color_season ? getColorSeasonProLabel(p.color_season) || p.color_season : "—"}</td>
                    <td className="px-5 py-3 font-medium text-accent">¥{(p.price / 100).toFixed(0)}</td>
                    <td className="px-5 py-3">
                      {p.cost_price ? (
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">¥{(p.cost_price / 100).toFixed(0)}</span>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium ${p.stock ? "text-green-600" : "text-red-500"}`}>
                        {p.stock ? ` ${p.stock}` : "缺货"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => togglePublish(p)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${p.is_published ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                        {p.is_published ? <><Eye className="w-3 h-3" />已发布</> : <><EyeOff className="w-3 h-3" />草稿</>}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">{editing ? "编辑选品" : "新增选品"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="选品名称" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">主分类</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <option value="">未分类</option>
                    <option value="clothing">服装</option>
                    <option value="accessory">配饰</option>
                    <option value="color_tools">色彩工具</option>
                    <option value="book">书籍资料</option>
                    <option value="pro_tool">专业工具</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">子分类</label>
                  <input value={form.subcategory} onChange={e => setForm(f => ({ ...f, subcategory: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="如：dress / scarf" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">色彩季型</label>
                  <select value={form.color_season} onChange={e => setForm(f => ({ ...f, color_season: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <option value="">全部色彩季型</option>
                    {["春", "夏", "秋", "冬"].map(group => (
                      <optgroup key={group} label={`${group}季型`}>
                        {COLOR_SEASONS_PRO.filter(c => c.group === group).map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">风格类型</label>
                  <select value={form.style_type} onChange={e => setForm(f => ({ ...f, style_type: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <option value="">未设置</option>
                      <optgroup label="── 女士八大风格 ──">
                      {FEMALE_STYLES.map(s => <option key={s.value} value={s.value}>{s.proLabel}</option>)}
                    </optgroup>
                    <optgroup label="── 男士五大风格 ──">
                      {MALE_STYLES.map(s => <option key={s.value} value={s.value}>{s.proLabel}</option>)}
                    </optgroup>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">售价（元）*</label>
                  <input required type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="如：298" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">原价（元）</label>
                  <input type="number" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="划线价" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">供货价（元）<span className="text-amber-500 ml-1 text-xs">VIP可见</span></label>
                  <input type="number" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm" placeholder="成本价" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">供应商</label>
                  <input type="text" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="如：广州某某服饰" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">库存</label>
                <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选品图片</label>
                {form.image_url ? (
                  <div className="relative inline-block">
                    <img src={form.image_url} alt="" className="w-32 h-32 object-cover rounded-lg" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, image_url: "" }))} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">{uploading ? "上传中..." : "上传图片"}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                  </label>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_published" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} className="w-4 h-4 text-accent rounded" />
                <label htmlFor="is_published" className="text-sm text-gray-700">立即发布</label>
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">取消</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90">{editing ? "保存修改" : "新增选品"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
