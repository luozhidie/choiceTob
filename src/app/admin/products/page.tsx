"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
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
  X,
  Upload,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CATEGORIES,
  CATEGORY_MAP,
  SUBCATEGORY_MAP,
  getSubcategories,
  getCategoryPath,
} from "@/lib/categories";

// 秋冬上架主题（写入 tags 带「主题·」前缀，无需改表结构）
const AW_THEMES = ["美拉德风", "新中式", "老钱风·静奢", "通勤极简", "新年战袍", "圣诞派对"];

interface Product {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  images: string[] | null;
  price: number;
  original_price: number | null;
  wholesale_price: number | null;
  category: string | null;
  subcategory: string | null;
  tags: string[] | null;
  is_published: boolean;
  stock: number;
  detail: string | null;
  created_at: string;
  // 属性编码体系扩展字段
  fabric_code?: string[] | null;
  cut_code?: string[] | null;
  pattern_code?: string[] | null;
  color_hex?: string | null;
  color_season_code?: string | null;
  style_conclusion?: string | null;
  sku?: string | null;
  // 商品参数
  material?: string | null;
  sizes?: string | null;
  origin?: string | null;
  care_instructions?: string | null;
  weight?: string | null;
  brand?: string | null;
  // 媒体字段
  video_url?: string | null;
  model_images?: string[] | null;
  size_chart_image?: string | null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  // 批量选择 + 归类
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploadingDetail, setUploadingDetail] = useState(false);
  const [detailCursor, setDetailCursor] = useState(0);
  const [batchCategory, setBatchCategory] = useState("");
  const [batchSubcategory, setBatchSubcategory] = useState("");
  const [batchApplying, setBatchApplying] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const clearSelection = () => setSelectedIds([]);

  const applyBatchCategory = async () => {
    if (selectedIds.length === 0 || !batchCategory) {
      setToast({ type: "error", message: "请先勾选商品并选择分类" });
      return;
    }
    setBatchApplying(true);
    try {
      const res = await fetch("/api/admin/products/batch-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ids: selectedIds,
          data: { category: batchCategory, subcategory: batchSubcategory || null },
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "批量更新失败");
      setProducts((prev) =>
        prev.map((p) =>
          selectedIds.includes(p.id)
            ? { ...p, category: batchCategory, subcategory: batchSubcategory || null }
            : p
        )
      );
      setToast({ type: "success", message: `已将 ${selectedIds.length} 个商品归入「${CATEGORY_MAP[batchCategory] || batchCategory}」` });
      setSelectedIds([]);
      setBatchCategory("");
      setBatchSubcategory("");
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "操作失败" });
    } finally {
      setBatchApplying(false);
    }
  };

  const [form, setForm] = useState({
    title: "",
    description: "",
    cover_image: "",
    images: [] as string[],
    price: "",
    original_price: "",
    wholesale_price: "",
    category: "",
    subcategory: "",
    stock: "0",
    tags: "",
    is_published: false,
    detail: "",
    // 属性编码体系
    sku: "",
    fabric_code: [] as string[],
    cut_code: [] as string[],
    pattern_code: [] as string[],
    color_hex: "",
    color_season_code: "",
    style_conclusion: "",
    // 上架主题
    theme: "",
    // 商品参数
    material: "",
    sizes: "",
    origin: "",
    care_instructions: "",
    weight: "",
    brand: "",
    // 媒体字段
    video_url: "",
    model_images: [] as string[],
    size_chart_image: "",
  });

  const supabase = createClient();

  // 表单中当前主分类的子分类列表
  const formSubcategories = useMemo(
    () => (form.category ? getSubcategories(form.category) : []),
    [form.category]
  );

  // 筛选中当前主分类的子分类列表
  const filterSubcategories = useMemo(
    () => (filterCategory ? getSubcategories(filterCategory) : []),
    [filterCategory]
  );

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set("category", filterCategory);
      if (filterSubcategory) params.set("subcategory", filterSubcategory);
      const res = await fetch(`/api/admin/products-data?${params.toString()}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.success && json.data) {
        setProducts(json.data as Product[]);
      } else {
        setProducts([]);
      }
    } catch {
      setProducts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [filterCategory, filterSubcategory]);

  // 切换筛选主分类时重置子分类
  useEffect(() => {
    setFilterSubcategory("");
  }, [filterCategory]);

  // 表单切换主分类时重置子分类
  const handleFormCategoryChange = (val: string) => {
    setForm((f) => ({ ...f, category: val, subcategory: "" }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      cover_image: "",
      images: [],
      price: "",
      original_price: "",
      wholesale_price: "",
      category: "",
      subcategory: "",
      stock: "0",
      tags: "",
      is_published: false,
      detail: "",
      sku: "",
      fabric_code: [],
      cut_code: [],
      pattern_code: [],
      color_hex: "",
      color_season_code: "",
      style_conclusion: "",
      material: "",
      sizes: "",
      origin: "",
      weight: "",
      care_instructions: "",
      brand: "",
      video_url: "",
      model_images: [] as string[],
      size_chart_image: "",
      theme: "",
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
      images: form.images.length > 0 ? form.images : null,
      price: parseInt(form.price) * 100,
      original_price: form.original_price
        ? parseInt(form.original_price) * 100
        : null,
      wholesale_price: form.wholesale_price
        ? parseInt(form.wholesale_price) * 100
        : null,
      category: form.category || null,
      subcategory: form.subcategory || null,
      stock: parseInt(form.stock) || 0,
      tags: (() => {
        const base = form.tags
          ? form.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [];
        // 去除旧的「主题·」标签，避免编辑时重复累积
        const cleaned = base.filter((t) => !t.startsWith("主题·"));
        if (form.theme) cleaned.push("主题·" + form.theme);
        return cleaned.length > 0 ? cleaned : null;
      })(),
      is_published: form.is_published,
      detail: form.detail.trim() || null,
      // 属性编码体系
      sku: form.sku.trim() || null,
      fabric_code: form.fabric_code.length > 0 ? form.fabric_code : null,
      cut_code: form.cut_code.length > 0 ? form.cut_code : null,
      pattern_code: form.pattern_code.length > 0 ? form.pattern_code : null,
      color_hex: form.color_hex.trim() || null,
      color_season_code: form.color_season_code.trim() || null,
      style_conclusion: form.style_conclusion.trim() || null,
      // 商品参数
      material: form.material.trim() || null,
      sizes: form.sizes.trim() || null,
      origin: form.origin.trim() || null,
      care_instructions: form.care_instructions.trim() || null,
      weight: form.weight.trim() || null,
      brand: form.brand.trim() || null,
      // 媒体字段
      video_url: form.video_url.trim() || null,
      model_images: form.model_images.length > 0 ? form.model_images : null,
      size_chart_image: form.size_chart_image.trim() || null,
    };

    try {
      if (editingProduct) {
        // 编辑：走 update API（service_role 绕过 RLS）
        const res = await fetch("/api/admin/products/update", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingProduct.id, table: "products", data: payload }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        showToast("success", "商品已更新");
      } else {
        // 创建：走 create API（service_role 绕过 RLS）
        const res = await fetch("/api/admin/products/create", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        showToast("success", "商品已创建");
      }
      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      showToast("error", err.message || (editingProduct ? "更新失败" : "创建失败"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此商品？")) return;
    // 改用后端API删除（绕过RLS）
    try {
      const res = await fetch("/api/admin/products/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, table: "products" }),
      });
      const json = await res.json();
      if (json.error) {
        showToast("error", `删除失败：${json.error}`);
      } else {
        showToast("success", "已删除");
        fetchProducts();
      }
    } catch (err: any) {
      showToast("error", `删除失败：${err.message}`);
    }
  };

  const handleTogglePublish = async (product: Product) => {
    // 改用后端API更新（绕过RLS）
    try {
      const res = await fetch("/api/admin/products/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: product.id, table: "products", data: { is_published: !product.is_published } }),
      });
      const json = await res.json();
      if (json.error) {
        showToast("error", `操作失败：${json.error}`);
      } else {
        showToast("success", product.is_published ? "已下架" : "已发布");
        fetchProducts();
      }
    } catch (err: any) {
      showToast("error", `操作失败：${err.message}`);
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      title: product.title,
      description: product.description || "",
      cover_image: product.cover_image || "",
      images: product.images || [],
      price: (product.price / 100).toString(),
      original_price: product.original_price
        ? (product.original_price / 100).toString()
        : "",
      wholesale_price: product.wholesale_price
        ? (product.wholesale_price / 100).toString()
        : "",
      category: product.category || "",
      subcategory: product.subcategory || "",
      stock: product.stock.toString(),
      tags: product.tags?.join(", ") || "",
      is_published: product.is_published,
      detail: product.detail || "",
      sku: product.sku || "",
      fabric_code: product.fabric_code || [],
      cut_code: product.cut_code || [],
      pattern_code: product.pattern_code || [],
      color_hex: product.color_hex || "",
      color_season_code: product.color_season_code || "",
      style_conclusion: product.style_conclusion || "",
      material: product.material || "",
      sizes: product.sizes || "",
      origin: product.origin || "",
      weight: product.weight || "",
      care_instructions: product.care_instructions || "",
      brand: product.brand || "",
      video_url: product.video_url || "",
      model_images: product.model_images || [],
      size_chart_image: product.size_chart_image || "",
      theme: product.tags?.find((t) => t.startsWith("主题·"))?.replace("主题·", "") || "",
    });
    setShowForm(true);
  };

  // 批量图片上传（调用 image-grabber API，走 service_role 绕过 RLS）
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    showToast("success", `正在上传 ${files.length} 张图片...`);

    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) continue; // 跳过超过5MB的

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("文件读取失败"));
          reader.readAsDataURL(file);
        });

        const res = await fetch("/api/image-grabber/upload", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: (file.name || `product_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, "_"),
            mimeType: file.type || "image/jpeg",
            dataUrl,
          }),
        });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);

        setForm(f => ({ ...f, images: [...f.images, json.storedUrl] }));
        successCount++;
      } catch (err: any) {
        console.error(`商品图片[${i}] 上传失败:`, err);
      }
    }

    if (successCount > 0) {
      showToast("success", `成功上传 ${successCount}/${files.length} 张图片`);
    } else {
      showToast("error", "所有图片上传失败");
    }
    setUploading(false);
    e.target.value = "";
  };

  // 商品详情里上传图片：在光标位置插入 <img> 标签（支持多选一次多张）
  const handleDetailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const valid = Array.from(files).filter((f) => f.size <= 5 * 1024 * 1024);
    const oversized = files.length - valid.length;
    if (valid.length === 0) {
      alert("图片不能超过5MB");
      e.target.value = "";
      return;
    }
    setUploadingDetail(true);
    try {
      let inserted = "";
      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("文件读取失败"));
          reader.readAsDataURL(file);
        });

        const res = await fetch("/api/image-grabber/upload", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: (file.name || `detail_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, "_"),
            mimeType: file.type || "image/jpeg",
            dataUrl,
          }),
        });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);

        inserted += `\n<div style="margin:16px 0;">\n  <img src="${json.storedUrl}" style="width:100%;border-radius:8px;" alt="商品详情图" />\n</div>\n`;
      }

      if (inserted) {
        const cursor = detailCursor || 0;
        const before = form.detail.slice(0, cursor);
        const after = form.detail.slice(cursor);
        setForm(f => ({ ...f, detail: before + inserted + after }));
        setDetailCursor(cursor + inserted.length);
      }
      showToast(
        "success",
        `已插入 ${valid.length} 张详情图${oversized ? `，${oversized} 张超过5MB已跳过` : ""}`
      );
    } catch (err: any) {
      console.error("详情图片上传失败:", err);
      showToast("error", "详情图片上传失败：" + err.message);
    } finally {
      setUploadingDetail(false);
      e.target.value = "";
    }
  };

  const removeImage = (idx: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const filteredProducts = products.filter((p) => {
    if (!searchTerm) return true;
    return (
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags?.some((t) =>
        t.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  });

  // 批量选择辅助（依赖 filteredProducts，必须在其之后定义）
  const allVisibleIds = filteredProducts.map((p) => p.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id));
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : [...new Set([...selectedIds, ...allVisibleIds])]);
  };

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;

  // 从 detail HTML 中提取详情图片 URL，用于管理端预览
  const detailImageUrls = useMemo(() => {
    const html = form.detail || "";
    const matches = html.match(/<img[^>]+src=["']([^"']+)["']/g);
    return matches
      ? (matches
          .map((m) => m.match(/src=["']([^"']+)["']/)?.[1])
          .filter(Boolean) as string[])
      : [];
  }, [form.detail]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${
              toast.type === "success" ? "bg-primary" : "bg-red-500"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">商品管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理店铺商品，支持上下架和品类划分
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            resetForm();
            setShowForm(true);
          }}
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
              placeholder="搜索商品标题、描述、标签..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors ${
              showFilters
                ? "border-primary text-primary bg-primary/5"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex gap-3 flex-wrap"
          >
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部分类</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
            {filterCategory && filterSubcategories.length > 0 && (
              <select
                value={filterSubcategory}
                onChange={(e) => setFilterSubcategory(e.target.value)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">全部子分类</option>
                {filterSubcategories.map((sub) => (
                  <option key={sub.key} value={sub.key}>
                    {sub.label}
                  </option>
                ))}
              </select>
            )}
            {(filterCategory || filterSubcategory) && (
              <button
                onClick={() => {
                  setFilterCategory("");
                  setFilterSubcategory("");
                }}
                className="px-3 py-2.5 text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> 清除筛选
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "全部商品",
            value: products.length,
            color: "bg-primary/10 text-primary",
          },
          {
            label: "已发布",
            value: products.filter((p) => p.is_published).length,
            color: "bg-green-50 text-green-600",
          },
          {
            label: "草稿",
            value: products.filter((p) => !p.is_published).length,
            color: "bg-gray-100 text-gray-500",
          },
          {
            label: "缺货",
            value: products.filter((p) => p.stock === 0).length,
            color: "bg-red-50 text-red-500",
          },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs opacity-70 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 品类分布 */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-3 sm:grid-cols-5 gap-3">
        {CATEGORIES.map((cat) => {
          const count = products.filter((p) => p.category === cat.key).length;
          return (
            <button
              key={cat.key}
              onClick={() => {
                setFilterCategory(filterCategory === cat.key ? "" : cat.key);
                setShowFilters(true);
              }}
              className={`p-3 rounded-xl text-center transition-colors ${
                filterCategory === cat.key
                  ? "bg-primary/10 ring-2 ring-primary/30"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              <div className="text-lg font-bold text-primary">{count}</div>
              <div className="text-[11px] text-gray-500">{cat.label}</div>
            </button>
          );
        })}
      </div>

      {/* 批量操作栏 */}
      {selectedIds.length > 0 && (
        <div className="max-w-7xl mx-auto mb-4 p-4 bg-primary/5 border border-primary/20 rounded-2xl flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-primary">
            已选 {selectedIds.length} 个商品
          </span>
          <select
            value={batchCategory}
            onChange={(e) => { setBatchCategory(e.target.value); setBatchSubcategory(""); }}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">选择分类...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>{cat.label}</option>
            ))}
          </select>
          {batchCategory && getSubcategories(batchCategory).length > 0 && (
            <select
              value={batchSubcategory}
              onChange={(e) => setBatchSubcategory(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">不分子类</option>
              {getSubcategories(batchCategory).map((sub) => (
                <option key={sub.key} value={sub.key}>{sub.label}</option>
              ))}
            </select>
          )}
          <button
            onClick={applyBatchCategory}
            disabled={batchApplying || !batchCategory}
            className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {batchApplying && <Loader2 className="w-4 h-4 animate-spin" />}
            应用归类
          </button>
          <button
            onClick={clearSelection}
            className="px-3 py-2 text-sm text-gray-500 hover:text-red-500"
          >
            取消选择
          </button>
        </div>
      )}

      {/* Table */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <p className="mt-3 text-sm">加载中...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            {searchTerm || filterCategory
              ? "没有匹配的商品"
              : "暂无商品，点击上方按钮创建"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-3 py-3 font-medium w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-primary cursor-pointer"
                    />
                  </th>
                  <th className="px-5 py-3 font-medium">商品</th>
                  <th className="px-5 py-3 font-medium">品类</th>
                  <th className="px-5 py-3 font-medium">价格</th>
                  <th className="px-5 py-3 font-medium">批发价</th>
                  <th className="px-5 py-3 font-medium">库存</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50/50 transition-colors ${selectedIds.includes(product.id) ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-3 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="w-4 h-4 accent-primary cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          {product.cover_image ? (
                            <img
                              src={product.cover_image}
                              alt=""
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-primary/50" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 line-clamp-1">
                            {product.title}
                          </div>
                          {product.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        {product.category ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary w-fit">
                            <Package className="w-3 h-3" />
                            {CATEGORY_MAP[product.category] || product.category}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                        {product.subcategory && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent w-fit">
                            {SUBCATEGORY_MAP[product.subcategory] ||
                              product.subcategory}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-accent">
                        {formatPrice(product.price)}
                      </div>
                      {product.original_price &&
                        product.original_price > product.price && (
                          <div className="text-xs text-gray-400 line-through">
                            {formatPrice(product.original_price)}
                          </div>
                        )}
                    </td>
                    <td className="px-5 py-3.5">
                      {product.wholesale_price ? (
                        <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                          {formatPrice(product.wholesale_price)}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs font-medium ${
                          product.stock > 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {product.stock > 0
                          ? `库存 ${product.stock}`
                          : "缺货"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleTogglePublish(product)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          product.is_published
                            ? "bg-green-50 text-green-600 hover:bg-green-100"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
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
                        <button
                          onClick={() => openEdit(product)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                          title="编辑"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold text-primary mb-6">
              {editingProduct ? "编辑商品" : "新建商品"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  商品标题 *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="商品标题"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    零售价（元）*
                  </label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="如 99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    批发价（元）
                  </label>
                  <input
                    type="number"
                    value={form.wholesale_price}
                    onChange={(e) =>
                      setForm({ ...form, wholesale_price: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="价格会员可见"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    原价（元）
                  </label>
                  <input
                    type="number"
                    value={form.original_price}
                    onChange={(e) =>
                      setForm({ ...form, original_price: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="原价"
                  />
                </div>
              </div>

              {/* 品类选择：主分类 + 子分类联动 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    主分类
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => handleFormCategoryChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">未分类</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    子分类
                  </label>
                  <select
                    value={form.subcategory}
                    onChange={(e) =>
                      setForm({ ...form, subcategory: e.target.value })
                    }
                    disabled={!form.category || formSubcategories.length === 0}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {form.category ? "全部子分类" : "先选主分类"}
                    </option>
                    {formSubcategories.map((sub) => (
                      <option key={sub.key} value={sub.key}>
                        {sub.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  库存
                </label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="0"
                />
              </div>
              {/* 封面图 - 支持上传和URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  封面图
                </label>
                <div className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={form.cover_image}
                    onChange={(e) =>
                      setForm({ ...form, cover_image: e.target.value })
                    }
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="https://..."
                  />
                  <label className="shrink-0 w-10 h-10 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : <Upload className="w-4 h-4 text-gray-400" />}
                    <input type="file" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { alert("图片不能超过5MB"); return; }
                      setUploading(true);
                      try {
                        const dataUrl = await new Promise<string>((resolve, reject) => {
                          const reader = new FileReader();
                          reader.onload = () => resolve(reader.result as string);
                          reader.onerror = () => reject(new Error("文件读取失败"));
                          reader.readAsDataURL(file);
                        });
                        const res = await fetch("/api/image-grabber/upload", {
                          method: "POST",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            filename: file.name.replace(/[^a-zA-Z0-9._-]/g, "_"),
                            mimeType: file.type || "image/jpeg",
                            dataUrl,
                          }),
                        });
                        const json = await res.json();
                        if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);
                        setForm(f => ({ ...f, cover_image: json.storedUrl }));
                      } catch (err: any) { console.error(err); alert("上传失败：" + err.message); }
                      setUploading(false);
                      e.target.value = "";
                    }} className="hidden" />
                  </label>
                  {form.cover_image && (
                    <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden">
                      <img src={form.cover_image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* 商品图片上传 - 支持批量多选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  商品图片 <span className="text-xs text-gray-400 font-normal">（支持多选，一次可上传多张）</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(idx)}
                        className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-bl-lg flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className={`w-16 h-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${uploading ? "border-accent bg-accent/10" : "border-gray-300 hover:border-accent hover:bg-accent/5"}`}>
                    {uploading
                      ? <><Loader2 className="w-4 h-4 animate-spin text-accent mb-0.5" /><span className="text-[9px] text-accent">上传中</span></>
                      : <><Upload className="w-4 h-4 text-gray-400 mb-0.5" /><span className="text-[9px] text-gray-400">添加图片</span></>
                    }
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} className="hidden" />
                  </label>
                </div>
              </div>

              {/* 媒体素材：视频 / 模特图 / 尺码表 */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-primary mb-3">媒体素材（视频 / 模特图 / 尺码表）</h4>

                {/* 视频地址 */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">视频地址（URL）</label>
                  <input
                    type="text"
                    value={form.video_url}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="https://...mp4 或 腾讯视频/抖音外链"
                  />
                </div>

                {/* 尺码表图片 */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">尺码表图片</label>
                  <div className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={form.size_chart_image}
                      onChange={(e) => setForm({ ...form, size_chart_image: e.target.value })}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="https://..."
                    />
                    <label className="shrink-0 w-10 h-10 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : <Upload className="w-4 h-4 text-gray-400" />}
                      <input type="file" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { alert("图片不能超过5MB"); return; }
                        setUploading(true);
                        try {
                          const dataUrl = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = () => reject(new Error("文件读取失败"));
                            reader.readAsDataURL(file);
                          });
                          const res = await fetch("/api/image-grabber/upload", {
                            method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ filename: file.name.replace(/[^a-zA-Z0-9._-]/g, "_"), mimeType: file.type || "image/jpeg", dataUrl }),
                          });
                          const json = await res.json();
                          if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);
                          setForm(f => ({ ...f, size_chart_image: json.storedUrl }));
                        } catch (err: any) { alert("上传失败：" + err.message); }
                        setUploading(false); e.target.value = "";
                      }} className="hidden" />
                    </label>
                    {form.size_chart_image && (
                      <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden">
                        <img src={form.size_chart_image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* 模特图（多张） */}
                <div className="mb-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">模特图（可多选）</label>
                  <div className="flex gap-2 flex-wrap">
                    {form.model_images.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setForm(f => ({ ...f, model_images: f.model_images.filter((_, i) => i !== idx) }))}
                          className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-bl-lg flex items-center justify-center">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label className={`w-16 h-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${uploading ? "border-accent bg-accent/10" : "border-gray-300 hover:border-accent hover:bg-accent/5"}`}>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin text-accent mb-0.5" /> : <><Upload className="w-4 h-4 text-gray-400 mb-0.5" /><span className="text-[9px] text-gray-400">添加</span></>}
                      <input type="file" accept="image/*" multiple onChange={async (e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        setUploading(true);
                        try {
                          for (let i = 0; i < files.length; i++) {
                            const file = files[i];
                            if (file.size > 5 * 1024 * 1024) continue;
                            const dataUrl = await new Promise<string>((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onload = () => resolve(reader.result as string);
                              reader.onerror = () => reject(new Error("文件读取失败"));
                              reader.readAsDataURL(file);
                            });
                            const res = await fetch("/api/image-grabber/upload", {
                              method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ filename: file.name.replace(/[^a-zA-Z0-9._-]/g, "_"), mimeType: file.type || "image/jpeg", dataUrl }),
                            });
                            const json = await res.json();
                            if (!res.ok || json.error) continue;
                            setForm(f => ({ ...f, model_images: [...f.model_images, json.storedUrl] }));
                          }
                        } catch (err) { console.error(err); }
                        setUploading(false); e.target.value = "";
                      }} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* 商品描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  商品描述
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="简短描述..."
                />
              </div>

              {/* 商品详情（富文本/长描述） */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    商品详情
                  </label>
                  <label className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary text-white rounded cursor-pointer hover:bg-primary/90">
                    {uploadingDetail ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    <span>{uploadingDetail ? "上传中" : "插入图片"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleDetailImageUpload}
                      disabled={uploadingDetail}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  value={form.detail}
                  onChange={(e) => setForm({ ...form, detail: e.target.value })}
                  onSelect={(e) => setDetailCursor(e.currentTarget.selectionStart)}
                  onClick={(e) => setDetailCursor(e.currentTarget.selectionStart)}
                  rows={5}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="填写商品详细信息、尺码表、材质说明等... 支持点右上角「插入图片」上传详情图（可多选一次多张）"
                />
                {detailImageUrls.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">已插入详情图预览（实际效果以前台商品详情页为准）：</p>
                    <div className="flex gap-2 flex-wrap">
                      {detailImageUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标签（逗号分隔）
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) =>
                    setForm({ ...form, tags: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="如：新品,热销,推荐"
                />
              </div>

              {/* === 属性编码体系 === */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-primary mb-3">属性编码体系</h4>
                <p className="text-xs text-gray-400 mb-3">填写以下属性，系统将自动匹配色彩季型和风格结论，生成搭配方案</p>

                {/* SKU */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">SKU 编码</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="如：SKU-2024-001"
                  />
                </div>

                {/* 颜色HEX */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">商品主色 HEX 值</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={form.color_hex}
                      onChange={(e) => setForm({ ...form, color_hex: e.target.value })}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="如：#F5E6D3"
                    />
                    {form.color_hex && (
                      <div className="w-8 h-8 rounded-lg border border-gray-200 shrink-0" style={{ backgroundColor: form.color_hex }} />
                    )}
                  </div>
                </div>

                {/* 面料编码 */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">面料编码（可多选）</label>
                  <div className="flex flex-wrap gap-2">
                    {["F01-少女型","F02-优雅型","F03-浪漫型","F04-少年型","F05-时尚型","F06-古典型","F07-自然型","F08-戏剧型"].map((f) => {
                      const [code, label] = f.split("-");
                      const checked = form.fabric_code.includes(code);
                      return (
                        <button
                          type="button"
                          key={code}
                          onClick={() => {
                            const next = checked
                              ? form.fabric_code.filter(c => c !== code)
                              : [...form.fabric_code, code];
                            setForm({ ...form, fabric_code: next });
                          }}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            checked
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-white border-gray-200 text-gray-500 hover:border-primary/30"
                          }`}
                        >
                          {code}-{label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 剪裁编码 */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">剪裁编码（可多选）</label>
                  <div className="flex flex-wrap gap-2">
                    {["B01-少女型","B02-优雅型","B03-浪漫型","B04-少年型","B05-时尚型","B06-古典型","B07-自然型","B08-戏剧型"].map((f) => {
                      const [code, label] = f.split("-");
                      const checked = form.cut_code.includes(code);
                      return (
                        <button
                          type="button"
                          key={code}
                          onClick={() => {
                            const next = checked
                              ? form.cut_code.filter(c => c !== code)
                              : [...form.cut_code, code];
                            setForm({ ...form, cut_code: next });
                          }}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            checked
                              ? "bg-accent/10 border-accent text-accent"
                              : "bg-white border-gray-200 text-gray-500 hover:border-accent/30"
                          }`}
                        >
                          {code}-{label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 图案编码 */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">图案编码（可多选）</label>
                  <div className="flex flex-wrap gap-2">
                    {["P01-少女型","P02-优雅型","P03-浪漫型","P04-少年型","P05-时尚型","P06-古典型","P07-自然型","P08-戏剧型"].map((f) => {
                      const [code, label] = f.split("-");
                      const checked = form.pattern_code.includes(code);
                      return (
                        <button
                          type="button"
                          key={code}
                          onClick={() => {
                            const next = checked
                              ? form.pattern_code.filter(c => c !== code)
                              : [...form.pattern_code, code];
                            setForm({ ...form, pattern_code: next });
                          }}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            checked
                              ? "bg-green-50 border-green-400 text-green-700"
                              : "bg-white border-gray-200 text-gray-500 hover:border-green-300"
                          }`}
                        >
                          {code}-{label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 色彩季型编码（手动填，后面接AI自动识别） */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">色彩季型编码（可留空，提交后AI自动识别）</label>
                  <select
                    value={form.color_season_code}
                    onChange={(e) => setForm({ ...form, color_season_code: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">自动识别（推荐）</option>
                    <option value="S01">S01-浅暖</option>
                    <option value="S02">S02-浅冷</option>
                    <option value="S03">S03-深暖</option>
                    <option value="S04">S04-深冷</option>
                    <option value="S05">S05-暖亮</option>
                    <option value="S06">S06-暖柔</option>
                    <option value="S07">S07-冷亮</option>
                    <option value="S08">S08-冷柔</option>
                    <option value="S09">S09-净冷</option>
                    <option value="S10">S10-净暖</option>
                    <option value="S11">S11-柔冷</option>
                    <option value="S12">S12-柔暖</option>
                  </select>
                </div>

                {/* 风格结论（手动填，后面接AI自动识别） */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">风格结论（可留空，提交后AI自动识别）</label>
                  <select
                    value={form.style_conclusion}
                    onChange={(e) => setForm({ ...form, style_conclusion: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">自动识别（推荐）</option>
                    <option value="少女型">少女型</option>
                    <option value="优雅型">优雅型</option>
                    <option value="浪漫型">浪漫型</option>
                    <option value="少年型">少年型</option>
                    <option value="时尚型">时尚型</option>
                    <option value="古典型">古典型</option>
                    <option value="自然型">自然型</option>
                    <option value="戏剧型">戏剧型</option>
                  </select>
                </div>

                {/* 上架主题（秋冬主题，写入 tags 带「主题·」前缀） */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">上架主题（秋冬）</label>
                  <select
                    value={form.theme}
                    onChange={(e) => setForm({ ...form, theme: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">不指定</option>
                    {AW_THEMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">选中的主题会以「主题·xxx」形式写入商品标签，可用于前台主题筛选与秋冬上架规划。</p>
                </div>
              </div>
              {/* === 商品参数 === */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-primary mb-3">商品参数</h4>

                {/* 材质 */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">材质</label>
                  <input
                    type="text"
                    value={form.material}
                    onChange={(e) => setForm({ ...form, material: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="如：真丝、棉麻、聚酯纤维"
                  />
                </div>

                {/* 尺码 */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">尺码表</label>
                  <input
                    type="text"
                    value={form.sizes}
                    onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="如：S/M/L/XL 或 均码"
                  />
                </div>

                {/* 产地 */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">产地</label>
                  <input
                    type="text"
                    value={form.origin}
                    onChange={(e) => setForm({ ...form, origin: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="如：杭州、广州"
                  />
                </div>

                {/* 重量 */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">重量（克）</label>
                  <input
                    type="number"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="如：350"
                  />
                </div>

                {/* 洗涤说明 */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">洗涤说明</label>
                  <textarea
                    value={form.care_instructions}
                    onChange={(e) => setForm({ ...form, care_instructions: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    placeholder="如：手洗、不可漂白、阴凉处晾晒"
                  />
                </div>

                {/* 品牌 */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">品牌</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="如：ZARA、优衣库"
                  />
                </div>
              </div>
              {/* === 商品参数结束 === */}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={form.is_published}
                  onChange={(e) =>
                    setForm({ ...form, is_published: e.target.checked })
                  }
                  className="w-4 h-4 text-accent rounded focus:ring-accent"
                />
                <label
                  htmlFor="is_published"
                  className="text-sm text-gray-700"
                >
                  立即发布
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90"
                >
                  {editingProduct ? "保存修改" : "创建商品"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
