"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Download,
  Link2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ExternalLink,
  Copy,
  Package,
  Upload,
  Sparkles,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GrabbedImage {
  url: string;
  filename: string;
  size?: number;
  status: "pending" | "downloading" | "success" | "error";
  error?: string;
  storedUrl?: string; // 上传到存储后的URL
}

export default function ImageGrabberPage() {
  const supabase = createClient();

  const [inputText, setInputText] = useState("");
  const [images, setImages] = useState<GrabbedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [products, setProducts] = useState<{ id: string; title: string }[]>([]);
  const [mode, setMode] = useState<"url" | "batch">("url"); // url: 单链接模式, batch: 批量链接模式

  // 加载商品列表
  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, title")
        .eq("is_active", true)
        .limit(100);
      if (data) setProducts(data);
    };
    loadProducts();
  }, [supabase]);

  // 从文本中提取所有图片URL
  const extractImageUrls = (text: string): string[] => {
    // 匹配 http(s) 图片链接
    const urlRegex = /https?:\/\/[^\s<>""'\]\)]+/gi;
    const matches = text.match(urlRegex) || [];
    
    return matches.filter((url) => {
      const lower = url.toLowerCase();
      // 必须是图片格式
      return (
        /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(lower) ||
        lower.includes("qpic.cn") ||
        lower.includes("alicdn") ||
        lower.includes("mmbiz") ||
        lower.includes("oss-")
      );
    });
  };

  // 使用 Puppeteer 抓取（新API）
  const handlePuppeteerGrab = async (url: string) => {
    const response = await fetch("/api/image-grabber/puppeteer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    return await response.json();
  };

  // 开始抓取
  const handleGrab = async () => {
    if (!inputText.trim()) {
      showToast("error", "请输入图片链接");
      return;
    }

    setIsProcessing(true);

    try {
      let imageUrls: string[] = [];

      if (mode === "batch") {
        // 批量模式：从文本中提取所有图片URL
        imageUrls = extractImageUrls(inputText);
        
        if (imageUrls.length === 0) {
          // 也可能是商品页面链接，尝试用 Puppeteer 抓取
          const pageUrls = inputText
            .split(/[\n\r]+/)
            .map((line) => line.trim())
            .filter((line) => line.startsWith("http"));
          
          if (pageUrls.length > 0) {
            showToast("success", `检测到 ${pageUrls.length} 个页面链接，正在使用浏览器抓取...`);
            
            for (const pageUrl of pageUrls) {
              try {
                const result = await handlePuppeteerGrab(pageUrl);
                if (result.images && result.images.length > 0) {
                  imageUrls.push(...result.images);
                }
              } catch (err) {
                console.error(`抓取失败: ${pageUrl}`, err);
              }
            }
          }
        }
      } else {
        // 单链接模式
        const url = inputText.trim();
        
        // 判断是否是直接图片链接
        if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
          imageUrls = [url];
        } else {
          // 使用 Puppeteer 抓取页面图片
          showToast("success", "正在使用浏览器抓取图片，请稍候...");
          const result = await handlePuppeteerGrab(url);
          
          if (result.error) {
            throw new Error(result.error);
          }
          
          if (result.images && result.images.length > 0) {
            imageUrls = result.images;
          }
        }
      }

      if (imageUrls.length === 0) {
        showToast("error", "未找到任何图片，请确认链接正确或直接粘贴图片地址");
        setIsProcessing(false);
        return;
      }

      // 去重
      imageUrls = [...new Set(imageUrls)];

      // 初始化图片状态
      const initialImages: GrabbedImage[] = imageUrls.map((url, index) => ({
        url,
        filename: `img_${Date.now()}_${index + 1}.jpg`,
        status: "pending",
      }));

      setImages(initialImages);
      showToast("success", `找到 ${imageUrls.length} 张图片，开始下载...`);

      // 逐个下载图片
      for (let i = 0; i < initialImages.length; i++) {
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === i ? { ...img, status: "downloading" } : img
          )
        );

        try {
          // 调用API下载并上传到存储
          const response = await fetch("/api/image-grabber/download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl: initialImages[i].url,
              filename: initialImages[i].filename,
              productId: selectedProductId || undefined,
            }),
          });

          const result = await response.json();

          if (result.success) {
            setImages((prev) =>
              prev.map((img, idx) =>
                idx === i
                  ? {
                      ...img,
                      status: "success",
                      storedUrl: result.storedUrl || img.url,
                      size: result.size,
                    }
                  : img
              )
            );
          } else {
            throw new Error(result.error || "下载失败");
          }
        } catch (error: any) {
          setImages((prev) =>
            prev.map((img, idx) =>
              idx === i
                ? { ...img, status: "error", error: error.message }
                : img
            )
          );
        }
      }

      showToast("success", `成功处理 ${imageUrls.length} 张图片`);
    } catch (error: any) {
      showToast("error", error.message || "抓取失败");
    } finally {
      setIsProcessing(false);
    }
  };

  // 删除某张图片
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 清空所有
  const clearAll = () => {
    setImages([]);
    setInputText("");
  };

  // 复制URL
  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast("success", "已复制图片链接");
  };

  // 批量复制成功图片的链接
  const copyAllUrls = () => {
    const urls = images
      .filter((img) => img.status === "success")
      .map((img) => img.storedUrl || img.url)
      .join("\n");
    
    if (urls) {
      navigator.clipboard.writeText(urls);
      showToast("success", "已复制所有图片链接");
    }
  };

  // 显示提示
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Download className="w-7 h-7 text-primary" />
            图片抓取工具
          </h1>
          <p className="text-gray-500 mt-2">
            支持多种方式获取商品图片，快速上传到商品库
          </p>
        </div>

        {/* 模式切换 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode("url")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "url"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Link2 className="w-4 h-4 inline-block mr-1 -mt-0.5" />
              单链接抓取
            </button>
            <button
              onClick={() => setMode("batch")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "batch"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Globe className="w-4 h-4 inline-block mr-1 -mt-0.5" />
              批量粘贴链接
            </button>
          </div>

          {/* 输入区域 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mode === "url" ? (
                <>
                  <Link2 className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                  输入图片或商品页面链接
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                  批量粘贴图片链接（每行一个）
                </>
              )}
            </label>
            {mode === "url" ? (
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="支持：直接图片链接、淘宝/1688/微信文章等..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleGrab()}
              />
            ) : (
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`请粘贴图片链接，每行一个：\nhttps://example.com/image1.jpg\nhttps://example.com/image2.jpg\n\n也支持粘贴商品页面链接，系统会自动抓取页面中的所有图片`}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none h-32 resize-y font-mono text-sm"
              />
            )}
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                关联商品（可选）
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none bg-white"
              >
                <option value="">不关联</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
                <option value="new">创建新商品</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleGrab}
              disabled={isProcessing || !inputText.trim()}
              className="px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  抓取中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  开始抓取
                </>
              )}
            </button>

            {images.length > 0 && (
              <button
                onClick={clearAll}
                className="px-4 py-2 text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                清空全部
              </button>
            )}
          </div>
        </div>

        {/* 结果展示 */}
        <AnimatePresence>
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  抓取结果（{images.length} 张）
                </h2>
                {images.some((img) => img.status === "success") && (
                  <button
                    onClick={copyAllUrls}
                    className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    复制全部链接
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group relative rounded-xl overflow-hidden border ${
                      image.status === "success"
                        ? "border-green-200"
                        : image.status === "error"
                        ? "border-red-200"
                        : "border-gray-200"
                    }`}
                  >
                    {/* 图片预览 */}
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {(image.storedUrl || image.url) && image.status === "success" && (
                        <img
                          src={image.storedUrl || image.url}
                          alt={image.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}

                      {/* 状态遮罩 */}
                      {(image.status === "pending" || image.status === "downloading" || image.status === "error") && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          {image.status === "pending" && (
                            <ImageIcon className="w-12 h-12 text-white/60" />
                          )}
                          {image.status === "downloading" && (
                            <Loader2 className="w-12 h-12 text-white animate-spin" />
                          )}
                          {image.status === "error" && (
                            <AlertCircle className="w-12 h-12 text-red-400" />
                          )}
                        </div>
                      )}

                      {/* 操作按钮 */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {image.status === "success" && (
                          <>
                            <button
                              onClick={() => window.open(image.storedUrl || image.url, "_blank")}
                              className="p-1.5 bg-white rounded-lg shadow hover:bg-gray-100 transition-colors"
                              title="查看原图"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => copyUrl(image.storedUrl || image.url)}
                              className="p-1.5 bg-white rounded-lg shadow hover:bg-gray-100 transition-colors"
                              title="复制链接"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => removeImage(index)}
                          className="p-1.5 bg-white rounded-lg shadow hover:bg-red-100 transition-colors text-gray-600 hover:text-red-600"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 图片信息 */}
                    <div className="p-3 bg-white">
                      <p className="text-xs text-gray-600 truncate">{image.filename}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span
                          className={`text-[10px] font-medium ${
                            image.status === "success"
                              ? "text-green-600"
                              : image.status === "error"
                              ? "text-red-600"
                              : "text-gray-400"
                          }`}
                        >
                          {image.status === "success" &&
                            `✓ ${(image.size! / 1024).toFixed(1)}KB`}
                          {image.status === "error" && `✗ ${image.error}`}
                          {(image.status === "pending" ||
                            image.status === "downloading") &&
                            "处理中..."}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 批量操作 */}
              {images.some((img) => img.status === "success") && (
                <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                  <button className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    全部导入商品库
                  </button>
                  <button
                    onClick={copyAllUrls}
                    className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    复制全部链接
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 使用说明 */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-3">💡 使用说明</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li><strong>方式1（推荐）</strong>：右键商品图片 → 复制图片地址 → 粘贴到此处</li>
            <li><strong>方式2</strong>：批量粘贴多张图片链接，每行一个，一次性下载</li>
            <li><strong>方式3</strong>：粘贴商品页面链接（淘宝/1688/微信等），自动抓取页面中的所有图片</li>
            <li>• 抓取后可自动关联到指定商品</li>
            <li>• 注意：请确保图片来源合法合规，避免侵权风险</li>
          </ul>
        </div>

        {/* Toast提示 */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 ${
                toast.type === "success"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
