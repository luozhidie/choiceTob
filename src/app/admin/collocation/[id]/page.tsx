"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Package,
  X,
  RefreshCw,
  Check,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  image_url: string | null;
  color_hex: string | null;
  style_conclusion: string | null;
  color_season_code: string | null;
  price: number | null;
}

interface OutfitMatch {
  id: string;
  title: string;
  description: string | null;
  product_ids: string[];
  style_tags: string[] | null;
  season_tags: string[] | null;
  occasion: string | null;
  match_rule_code: string | null;
  match_type: string;
  ai_report: any;
  is_published: boolean;
  created_at: string;
}

export default function OutfitDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [outfit, setOutfit] = useState<OutfitMatch | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [replacingProductId, setReplacingProductId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 编辑表单
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
  });

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. 加载搭配方案
      const { data: outfitData, error: outfitErr } = await supabase
        .from("outfit_matches")
        .select("*")
        .eq("id", id)
        .single();

      if (outfitErr || !outfitData) {
        setMessage({ type: "error", text: "搭配方案不存在" });
        setLoading(false);
        return;
      }

      setOutfit(outfitData);
      setEditForm({
        title: outfitData.title || "",
        description: outfitData.description || "",
      });

      // 2. 加载参与搭配的商品
      if (outfitData.product_ids?.length > 0) {
        const { data: productsData } = await supabase
          .from("products")
          .select("id, title, image_url, color_hex, style_conclusion, color_season_code, price")
          .in("id", outfitData.product_ids);
        setProducts(productsData || []);
      }

      // 3. 加载所有商品（用于替换）
      const { data: allProductsData } = await supabase
        .from("products")
        .select("id, title, image_url, color_hex, style_conclusion, color_season_code, price")
        .eq("is_published", true)
        .limit(100);
      setAllProducts(allProductsData || []);
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  // 保存基本信息
  const handleSave = async () => {
    if (!outfit) return;
    setSaving(true);
    const { error } = await supabase
      .from("outfit_matches")
      .update({
        title: editForm.title,
        description: editForm.description,
      })
      .eq("id", outfit.id);

    if (error) {
      setMessage({ type: "error", text: "保存失败: " + error.message });
    } else {
      setMessage({ type: "success", text: "已保存" });
      setOutfit((prev) => prev ? { ...prev, title: editForm.title, description: editForm.description } : null);
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  // 发布/取消发布
  const handleTogglePublish = async () => {
    if (!outfit) return;
    setPublishing(true);
    const { error } = await supabase
      .from("outfit_matches")
      .update({
        is_published: !outfit.is_published,
        published_at: !outfit.is_published ? new Date().toISOString() : null,
      })
      .eq("id", outfit.id);

    if (error) {
      setMessage({ type: "error", text: "操作失败: " + error.message });
    } else {
      setOutfit((prev) => prev ? { ...prev, is_published: !prev.is_published } : null);
      setMessage({
        type: "success",
        text: outfit.is_published ? "已取消发布" : "已发布到每日搭配灵感",
      });
    }
    setPublishing(false);
    setTimeout(() => setMessage(null), 3000);
  };

  // 移除商品
  const handleRemoveProduct = async (productId: string) => {
    if (!outfit) return;
    const newProductIds = outfit.product_ids.filter((pid) => pid !== productId);
    if (newProductIds.length < 2) {
      setMessage({ type: "error", text: "搭配至少需要2件商品" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const { error } = await supabase
      .from("outfit_matches")
      .update({ product_ids: newProductIds })
      .eq("id", outfit.id);

    if (error) {
      setMessage({ type: "error", text: "移除失败: " + error.message });
    } else {
      setOutfit((prev) => prev ? { ...prev, product_ids: newProductIds } : null);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setMessage({ type: "success", text: "已移除" });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  // 替换商品
  const handleReplaceProduct = async (oldProductId: string, newProductId: string) => {
    if (!outfit) return;
    const newProductIds = outfit.product_ids.map((pid) =>
      pid === oldProductId ? newProductId : pid
    );

    const { error } = await supabase
      .from("outfit_matches")
      .update({ product_ids: newProductIds })
      .eq("id", outfit.id);

    if (error) {
      setMessage({ type: "error", text: "替换失败: " + error.message });
    } else {
      setOutfit((prev) => prev ? { ...prev, product_ids: newProductIds } : null);
      const newProduct = allProducts.find((p) => p.id === newProductId);
      if (newProduct) {
        setProducts((prev) =>
          prev.map((p) => (p.id === oldProductId ? newProduct : p))
        );
      }
      setMessage({ type: "success", text: "已替换" });
    }
    setReplacingProductId(null);
    setTimeout(() => setMessage(null), 3000);
  };

  // 删除搭配方案
  const handleDelete = async () => {
    if (!outfit) return;
    if (!confirm("确定删除这个搭配方案吗？删除后不可恢复。")) return;

    const { error } = await supabase.from("outfit_matches").delete().eq("id", outfit.id);
    if (error) {
      setMessage({ type: "error", text: "删除失败: " + error.message });
    } else {
      router.push("/admin/collocation");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!outfit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-500">搭配方案不存在或已被删除</p>
          <Link href="/admin/collocation" className="text-primary text-sm mt-2 inline-block">
            ← 返回搭配列表
          </Link>
        </div>
      </div>
    );
  }

  const aiReport = outfit.ai_report || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/collocation"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="font-bold text-gray-900 text-sm">搭配方案详情</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    outfit.is_published
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {outfit.is_published ? "已发布" : "草稿"}
                </span>
                <span className="text-[10px] text-gray-400">
                  {outfit.match_type === "auto" ? "AI生成" : "人工创建"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {message && (
              <span
                className={`text-xs px-3 py-1.5 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {message.type === "success" && <Check className="w-3 h-3 inline mr-1" />}
                {message.text}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* 操作按钮栏 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleTogglePublish}
            disabled={publishing}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors ${
              outfit.is_published
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : outfit.is_published ? (
              <>
                <EyeOff className="w-4 h-4" /> 取消发布
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" /> 发布到每日灵感
              </>
            )}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存修改
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-xl bg-red-50 text-red-500 text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5 ml-auto"
          >
            <Trash2 className="w-4 h-4" /> 删除
          </button>
        </div>

        {/* 基本信息编辑 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            方案信息
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">标题</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">描述</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {outfit.style_tags?.map((t) => (
                <span key={t} className="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium">
                  {t}
                </span>
              ))}
              {outfit.season_tags?.map((t) => (
                <span key={t} className="px-2.5 py-1 rounded-full text-xs bg-accent/10 text-accent font-medium">
                  {t}
                </span>
              ))}
              {outfit.occasion && (
                <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                  {outfit.occasion}
                </span>
              )}
              {outfit.match_rule_code && (
                <span className="px-2.5 py-1 rounded-full text-xs bg-indigo-50 text-indigo-600">
                  {outfit.match_rule_code}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AI 报告 */}
        {(aiReport.reasoning || aiReport.styling_tips) && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              AI 搭配报告
            </h2>
            <div className="space-y-3">
              {aiReport.reasoning && (
                <div>
                  <span className="text-xs text-gray-400">搭配理由</span>
                  <p className="text-sm text-gray-700 mt-0.5">{aiReport.reasoning}</p>
                </div>
              )}
              {aiReport.styling_tips && (
                <div>
                  <span className="text-xs text-gray-400">穿搭建议</span>
                  <p className="text-sm text-gray-700 mt-0.5">{aiReport.styling_tips}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 商品组合 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-indigo-500" />
            搭配商品（{products.length}件）
          </h2>

          {products.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">暂无商品</p>
          ) : (
            <div className="space-y-3">
              {products.map((product, index) => (
                <div key={product.id} className="relative">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    {/* 序号 */}
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {index + 1}
                    </div>
                    {/* 图片 */}
                    <div className="w-14 h-14 rounded-lg bg-gray-200 shrink-0 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate">{product.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {product.style_conclusion && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {product.style_conclusion}
                          </span>
                        )}
                        {product.color_season_code && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                            {product.color_season_code}
                          </span>
                        )}
                        {product.price && (
                          <span className="text-[10px] text-gray-400">
                            ¥{product.price}
                          </span>
                        )}
                        {product.color_hex && (
                          <span
                            className="w-3 h-3 rounded-full border border-gray-200 inline-block"
                            style={{ backgroundColor: product.color_hex }}
                            title={product.color_hex}
                          />
                        )}
                      </div>
                    </div>
                    {/* 操作 */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setReplacingProductId(product.id)}
                        className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                        title="替换"
                      >
                        <RefreshCw className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleRemoveProduct(product.id)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="移除"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* 替换选择面板 */}
                  {replacingProductId === product.id && (
                    <div className="mt-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-indigo-700">选择替换商品</span>
                        <button
                          onClick={() => setReplacingProductId(null)}
                          className="text-xs text-indigo-500 hover:text-indigo-700"
                        >
                          取消
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {allProducts
                          .filter((p) => p.id !== product.id && !outfit.product_ids.includes(p.id))
                          .map((p) => (
                            <button
                              key={p.id}
                              onClick={() => handleReplaceProduct(product.id, p.id)}
                              className="flex items-center gap-2 p-2 bg-white rounded-lg border border-indigo-100 hover:border-indigo-300 transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded bg-gray-200 shrink-0 overflow-hidden">
                                {p.image_url ? (
                                  <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-4 h-4 text-gray-300 m-auto" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium text-gray-700 truncate">{p.title}</p>
                                <p className="text-[10px] text-gray-400">
                                  {p.style_conclusion} · {p.color_season_code}
                                </p>
                              </div>
                            </button>
                          ))}
                      </div>
                      {allProducts.filter(
                        (p) => p.id !== product.id && !outfit.product_ids.includes(p.id)
                      ).length === 0 && (
                        <p className="text-xs text-indigo-400 text-center py-3">暂无可替换商品</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
