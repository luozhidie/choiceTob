"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Plus, Trash2, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  cover_image: string | null;
  price: number;
}

export default function NewTestCampaignPage() {
  const [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
    if (typeof document !== "undefined") {
      setSupabase(createClient());
    }
  }, []);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [testDuration, setTestDuration] = useState(7);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // 搜索商品（通过后端API，绕过RLS）
  const searchProducts = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch("/api/admin/testing/search-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setSearchResults(json.products || []);
      if ((json.products || []).length === 0) {
        alert("没有找到相关商品，请尝试其他关键词");
      }
    } catch (error: any) {
      alert("搜索失败: " + error.message);
    } finally {
      setSearching(false);
    }
  };

  // 添加商品到测款
  const addProduct = (product: Product) => {
    if (selectedProducts.find((p) => p.id === product.id)) {
      alert("该商品已添加");
      return;
    }
    if (selectedProducts.length >= 10) {
      alert("最多添加10个商品");
      return;
    }
    setSelectedProducts([...selectedProducts, product]);
    setSearchQuery("");
    setSearchResults([]);
  };

  // 移除商品
  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  // 提交创建
  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("请输入测款任务名称");
      return;
    }
    if (selectedProducts.length < 2) {
      alert("至少添加2个商品进行对比测试");
      return;
    }

    setLoading(true);
    try {
      // 1. 创建测款任务
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + testDuration);

      const { data: campaign, error: campaignError } = await supabase
        .from("product_test_campaigns")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          category: category || null,
          test_duration: testDuration,
          end_date: endDate.toISOString().split("T")[0],
          status: "active",
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // 2. 添加测款商品
      const testItems = selectedProducts.map((product) => ({
        campaign_id: campaign.id,
        product_id: product.id,
        product_title: product.title,
        product_image: product.cover_image,
      }));

      const { error: itemsError } = await supabase
        .from("product_test_items")
        .insert(testItems);

      if (itemsError) throw itemsError;

      alert("测款任务创建成功！");
      
      // 生成分享链接（每个商品一个专属链接，用于发给客户测款）
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const shareLinks = selectedProducts.map((p) => ({
        title: p.title,
        url: `${baseUrl}/shop/${p.id}?utm_campaign=${campaign.id}&utm_source=testing`,
      }));
      
      // 把分享链接存到剪贴板（方便管理员直接粘贴发送）
      const linksText = shareLinks.map((l) => `【${l.title}】\n${l.url}`).join("\n\n");
      navigator.clipboard.writeText(linksText).then(() => {
        alert(`✅ 测款任务创建成功！\n\n分享链接已复制到剪贴板，请直接粘贴发送给客户：\n\n${linksText}`);
      }).catch(() => {
        // 剪贴板失败，弹窗显示链接
        alert(`✅ 测款任务创建成功！\n\n请复制以下链接发给客户测款：\n\n${linksText}`);
      });
      
      router.push(`/admin/testing/${campaign.id}`);
    } catch (error: any) {
      alert("创建失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/testing"
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-primary" />
              创建测款任务
            </h1>
            <p className="text-gray-500 mt-1">选择同类产品进行测试，找出潜力爆款</p>
          </div>
        </div>

        {/* 表单 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">基本信息</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任务名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：夏季连衣裙测款"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述本次测款的目的..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none h-24 resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                测试类目
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="例如：连衣裙"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                测试周期（天）
              </label>
              <select
                value={testDuration}
                onChange={(e) => setTestDuration(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none bg-white"
              >
                <option value={7}>7天（快速测试）</option>
                <option value={14}>14天（标准测试）</option>
                <option value={30}>30天（深度测试）</option>
              </select>
            </div>
          </div>
        </div>

        {/* 添加商品 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            添加测试商品 <span className="text-sm font-normal text-gray-500">（至少2个，最多10个）</span>
          </h2>

          {/* 搜索商品 */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchProducts()}
                placeholder="搜索商品名称..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <button
                onClick={searchProducts}
                disabled={searching}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {searching ? "搜索中..." : "搜索"}
              </button>
            </div>

            {/* 搜索结果 */}
            {searchResults.length > 0 && (
              <div className="mt-3 bg-gray-50 rounded-xl p-3 max-h-48 overflow-y-auto">
                <p className="text-xs text-gray-500 mb-2">搜索结果（点击添加）：</p>
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                  >
                    {product.cover_image && (
                      <img
                        src={product.cover_image}
                        alt={product.title}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                      <p className="text-xs text-gray-500">¥{product.price}</p>
                    </div>
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 已选商品列表 */}
          {selectedProducts.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-gray-500">尚未添加商品</p>
              <p className="text-sm text-gray-400 mt-1">请搜索并添加至少2个同类商品</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
                >
                  <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </span>
                  {product.cover_image && (
                    <img
                      src={product.cover_image}
                      alt={product.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                    <p className="text-xs text-gray-500">¥{product.price}</p>
                  </div>
                  <button
                    onClick={() => removeProduct(product.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 提交按钮 */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/testing"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            取消
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading || selectedProducts.length < 2}
            className="px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <BarChart3 className="w-5 h-5" />
                创建测款任务
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
