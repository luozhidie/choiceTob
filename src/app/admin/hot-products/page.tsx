"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Upload, X, ImageIcon,
} from "lucide-react";

interface HotProduct {
  id: string;
  name: string;
  description: string | null;
  details: string | null;
  price: number;
  original_price: number | null;
  tags: string[];
  images: string[];
  category: string | null;
  season: string | null;
  is_published: boolean;
  is_members_only: boolean;
  sort_order: number;
  created_at: string;
}

const SEASONS = ["春夏", "秋冬", "四季"];
const CATEGORIES = ["连衣裙", "上衣", "裤装", "外套", "套装", "配饰"];

export default function HotProductsAdmin() {
  const supabase = createClient();
  const [products, setProducts] = useState<HotProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    details: "",
    price: "",
    original_price: "",
    tags: "",
    category: "",
    season: "",
    is_published: true,
    is_members_only: true,
    sort_order: "0",
    images: [] as string[],
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hot_products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (!error && data) setProducts(data as HotProduct[]);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      name: "", description: "", details: "", price: "", original_price: "",
      tags: "", category: "", season: "", is_published: true, is_members_only: true,
      sort_order: "0", images: [],
    });
    setEditingId(null);
  };

  const openEdit = (product: HotProduct) => {
    setForm({
      name: product.name,
      description: product.description || "",
      details: product.details || "",
      price: String(product.price / 100),
      original_price: product.original_price ? String(product.original_price / 100) : "",
      tags: product.tags?.join(", ") || "",
      category: product.category || "",
      season: product.season || "",
      is_published: product.is_published,
      is_members_only: product.is_members_only,
      sort_order: String(product.sort_order),
      images: product.images || [],
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.price.trim()) {
      alert("请填写商品名称和价格");
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      details: form.details.trim() || null,
      price: Math.round(parseFloat(form.price) * 100),
      original_price: form.original_price ? Math.round(parseFloat(form.original_price) * 100) : null,
      tags: form.tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
      images: form.images,
      category: form.category || null,
      season: form.season || null,
      is_published: form.is_published,
      is_members_only: form.is_members_only,
      sort_order: parseInt(form.sort_order) || 0,
    };

    if (editingId) {
      const { error } = await supabase.from("hot_products").update(payload).eq("id", editingId);
      if (error) { alert("更新失败：" + error.message); return; }
    } else {
      const { error } = await supabase.from("hot_products").insert([payload]);
      if (error) { alert("创建失败：" + error.message); return; }
    }

    resetForm();
    setShowForm(false);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除该商品？")) return;
    const res = await fetch("/api/admin/common/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, table: "hot_products" }),
    });
    const json = await res.json();
    if (json.error) alert("删除失败：" + json.error);
    else fetchProducts();
  };

  const handleTogglePublish = async (product: HotProduct) => {
    const { error } = await supabase.from("hot_products").update({ is_published: !product.is_published }).eq("id", product.id);
    if (!error) fetchProducts();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("hot-product-images")
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) {
        console.error("上传失败:", uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage.from("hot-product-images").getPublicUrl(fileName);
      if (urlData?.publicUrl) {
        setForm((prev) => ({ ...prev, images: [...prev.images, urlData.publicUrl] }));
      }
    }
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">爆款样衣管理</h1>
            <p className="text-sm text-gray-500 mt-1">上传和管理前台展示的爆款样衣商品</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> 新增商品
          </button>
        </div>

        {/* 表单弹窗 */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
            <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">{editingId ? "编辑商品" : "新增商品"}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">商品名称 *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="如：法式碎花连衣裙" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">价格（元）*</label>
                    <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="如：299" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">原价（元）</label>
                    <input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="如：599" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">分类</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm">
                      <option value="">请选择</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">季节</label>
                    <select value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm">
                      <option value="">请选择</option>
                      {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">标签（用逗号分隔）</label>
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="如：爆款, 显瘦, 通勤" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">简短描述</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="卡片展示用的简短描述" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">商品详情</label>
                  <textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="详细的商品信息、面料、尺码等" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">排序</label>
                    <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="数字越小越靠前" />
                  </div>
                  <div className="flex items-center gap-4 pt-6">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
                      立即发布
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.is_members_only} onChange={(e) => setForm({ ...form, is_members_only: e.target.checked })} />
                      会员专属
                    </label>
                  </div>
                </div>

                {/* 图片上传 */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">商品图片</label>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {form.images.map((url, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(idx)} className="absolute top-0.5 right-0.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-accent hover:text-accent transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {uploading ? "上传中..." : "上传图片"}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={handleSubmit} className="flex-1 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent/90 transition-colors">
                    {editingId ? "保存修改" : "创建商品"}
                  </button>
                  <button onClick={() => setShowForm(false)} className="px-5 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">暂无商品，点击右上角新增</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">商品</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">分类</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">价格</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">状态</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-gray-300 m-auto" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-800">{product.name}</div>
                          <div className="text-xs text-gray-400">{product.tags?.join(" ")}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.category || "—"}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">¥{(product.price / 100).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleTogglePublish(product)} className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {product.is_published ? "已发布" : "草稿"}
                        </button>
                        {product.is_members_only && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">会员</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(product)} className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
