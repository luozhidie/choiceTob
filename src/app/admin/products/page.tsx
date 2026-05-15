"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  ShoppingBag,
  Package,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  price: number;
  original_price: number | null;
  category: string | null;
  is_published: boolean;
  stock: number;
  created_at: string;
}

const categoryMap: Record<string, string> = {
  accessory: "配饰",
  clothing: "服装",
  tool: "工具",
  book: "书籍",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    cover_image: "",
    price: "",
    original_price: "",
    category: "",
    stock: "0",
    tags: "",
    is_published: false,
  });

  const supabase = createClient();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from("products").select("*").order("sort_order", { ascending: true });
    if (filterCategory) query = query.eq("category", filterCategory);
    const { data, error } = await query;
    if (!error && data) setProducts(data as Product[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [filterCategory]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      cover_image: "",
      price: "",
      original_price: "",
      category: "",
      stock: "0",
      tags: "",
      is_published: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price) {
      alert("请填写商品标题和价格");
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      cover_image: form.cover_image.trim() || null,
      price: parseInt(form.price) * 100,
      original_price: form.original_price ? parseInt(form.original_price) * 100 : null,
      category: form.category || null,
      stock: parseInt(form.stock) || 0,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
      is_published: form.is_published,
    };

    if (editingProduct) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingProduct.id);
      if (error) showToast("error", "更新失败：" + error.message);
      else { showToast("success", "商品已更新"); setShowForm(false); setEditingProduct(null); resetForm(); fetchProducts(); }
    } else {
      const { error } = await supabase.from("products").insert([payload]);
      if (error) showToast("error", "创建失败：" + error.message);
      else { showToast("success", "商品已创建"); setShowForm(false); resetForm(); fetchProducts(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此商品？")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) showToast("error", "删除失败");
    else { showToast("success", "已删除"); fetchProducts(); }
  };

  const handleTogglePublish = async (product: Product) => {
    const { error } = await supabase.from("products").update({ is_published: !product.is_published }).eq("id", product.id);
    if (error) showToast("error", "操作失败");
    else { showToast("success", product.is_published ? "已下架" : "已发布"); fetchProducts(); }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      title: product.title,
      description: product.description || "",
      cover_image: product.cover_image || "",
      price: (product.price / 100).toString(),
      original_price: product.original_price ? (product.original_price / 100).toString() : "",
      category: product.category || "",
      stock: product.stock.toString(),
      tags: product.tags?.join(", ") || "",
      is_published: product.is_published,
    });
    setShowForm(true);
  };

  const filteredProducts = products.filter((p) => {
    if (!searchTerm) return true;
    return p.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AnimatePrescence>
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
      </AnimatePrescence>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">商品管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理店铺商品，支持上下架</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); resetForm(); setShowForm(true); }}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl"
        >
          <Plus className="w-4 h-4" />
          新建商品
        </button>
      </div>

      {/* Search & Filter */}
      <div className="max-w-7xl mx-auto mb-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索商品标题..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors ${showFilters ? "border-primary text-primary bg-primary/5" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            <Filter className="w-4 h-4" />
            筛选
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>
        {showFilters && (
          <div className="flex gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部分类</option>
              <option value="accessory">配饰</option>
              <option value="clothing">服装</option>
              <option value="tool">工具</option>
              <option value="book">书籍</option>
            </select>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "全部商品", value: products.length, color: "bg-primary/10 text-primary" },
          { label: "已发布", value: products.filter((p) => p.is_published).length, color: "bg-green-50 text-green-600" },
          { label: "草稿", value: products.filter((p) => !p.is_published).length, color: "bg-gray-100 text-gray-500" },
          { label: "缺货", value: products.filter((p) => p.stock === 0).length, color: "bg-red-50 text-red-500" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs opacity-70 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <p className="mt-3 text-sm">加载中...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            {searchTerm || filterCategory ? "没有匹配的商品" : "暂无商品，点击上方按钮创建"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">商品</th>
                  <th className="px-5 py-3 font-medium">分类</th>
                  <th className="px-5 py-3 font-medium">价格</th>
                  <th className="px-5 py-3 font-medium">库存</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          {product.cover_image ? (
                            <img src={product.cover_image} alt="" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-primary/50" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 line-clamp-1">{product.title}</div>
                          {product.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{product.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {product.category ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          <Package className="w-3 h-3" />
                          {categoryMap[product.category] || product.category}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-accent">{formatPrice(product.price)}</div>
                      {product.original_price && product.original_price > product.price && (
                        <div className="text-xs text-gray-400 line-through">{formatPrice(product.original_price)}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                        {product.stock > 0 ? `库存 ${product.stock}` : "缺货"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleTogglePublish(product)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${product.is_published ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
                      >
                        {product.is_published ? "已发布" : "草稿"}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/shop/${product.id}`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                          title="预览"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors" title="编辑">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="删除">
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-primary mb-6">{editingProduct ? "编辑商品" : "新建商品"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品标题 *</label>
                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="商品标题" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">价格（元）*</label>
                  <input type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="如 99" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">原价（元）</label>
                  <input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="原价" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">未分类</option>
                    <option value="accessory">配饰</option>
                    <option value="clothing">服装</option>
                    <option value="tool">工具</option>
                    <option value="book">书籍</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">库存</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">封面图URL</label>
                <input type="text" value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品描述</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" placeholder="简短描述..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标签（逗号分隔）</label>
                <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="如：新品,热销,推荐" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_published" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4 text-accent rounded focus:ring-accent" />
                <label htmlFor="is_published" className="text-sm text-gray-700">立即发布</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingProduct(null); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">取消</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90">{editingProduct ? "保存修改" : "创建商品"}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
