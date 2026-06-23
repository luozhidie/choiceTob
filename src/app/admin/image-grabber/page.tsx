"use client";

import { useState } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GrabbedImage {
  url: string;
  filename: string;
  size?: number;
  status: "pending" | "downloading" | "success" | "error";
  error?: string;
}

export default function ImageGrabberPage() {
  const supabase = createClient();

  const [inputUrl, setInputUrl] = useState("");
  const [images, setImages] = useState<GrabbedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // 解析URL，提取图片
  const parseUrl = async (url: string): Promise<string[]> => {
    const imageUrls: string[] = [];

    // 判断URL类型
    if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
      // 直接是图片URL
      imageUrls.push(url);
    } else if (url.includes("mp.weixin.qq.com") || url.includes("weixin")) {
      // 微信公众号文章链接
      try {
        // 使用代理或服务端获取文章内容
        const response = await fetch(`/api/image-grabber/fetch?url=${encodeURIComponent(url)}`);
        const data = await response.json();

        if (data.images && data.images.length > 0) {
          imageUrls.push(...data.images);
        }
      } catch (error) {
        console.error("获取微信文章失败:", error);
        throw new Error("无法获取微信文章内容，请检查链接是否正确");
      }
    } else if (url.includes("xiaohongshu.com")) {
      // 小红书链接
      try {
        const response = await fetch(`/api/image-grabber/fetch?url=${encodeURIComponent(url)}`);
        const data = await response.json();

        if (data.images && data.images.length > 0) {
          imageUrls.push(...data.images);
        }
      } catch (error) {
        console.error("获取小红书内容失败:", error);
        throw new Error("无法获取小红书内容");
      }
    } else {
      // 尝试作为普通网页处理
      try {
        const response = await fetch(`/api/image-grabber/fetch?url=${encodeURIComponent(url)}`);
        const data = await response.json();

        if (data.images && data.images.length > 0) {
          imageUrls.push(...data.images);
        }
      } catch (error) {
        throw new Error("无法解析该链接，请输入有效的图片或文章链接");
      }
    }

    return imageUrls;
  };

  // 开始抓取
  const handleGrab = async () => {
    if (!inputUrl.trim()) {
      showToast("error", "请输入要抓取的图片或文章链接");
      return;
    }

    setIsProcessing(true);

    try {
      // 解析URL获取图片列表
      const imageUrls = await parseUrl(inputUrl.trim());

      if (imageUrls.length === 0) {
        showToast("error", "未找到任何图片");
        setIsProcessing(false);
        return;
      }

      // 初始化图片状态
      const initialImages: GrabbedImage[] = imageUrls.map((url, index) => ({
        url,
        filename: `grabbed_${Date.now()}_${index + 1}.jpg`,
        status: "pending",
      }));

      setImages(initialImages);

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
                      url: result.storedUrl || img.url,
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

      showToast("success", `成功抓取 ${imageUrls.length} 张图片`);
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
  };

  // 复制URL
  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast("success", "已复制图片链接");
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
            抓取微信公众号、小红书等平台的图片，快速上传到商品库
          </p>
        </div>

        {/* 输入区域 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Link2 className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                输入图片或文章链接
              </label>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="支持：直接图片链接、微信公众号文章、小红书笔记..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleGrab()}
              />
            </div>

            <div className="w-48">
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
                {/* TODO: 动态加载商品列表 */}
                <option value="new">创建新商品</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleGrab}
              disabled={isProcessing || !inputUrl.trim()}
              className="px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  抓取中...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
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
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                抓取结果（{images.length} 张）
              </h2>

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
                      {image.url && (
                        <img
                          src={image.url}
                          alt={image.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}

                      {/* 状态遮罩 */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        {image.status === "pending" && (
                          <ImageIcon className="w-12 h-12 text-white/60" />
                        )}
                        {image.status === "downloading" && (
                          <Loader2 className="w-12 h-12 text-white animate-spin" />
                        )}
                        {image.status === "success" && (
                          <CheckCircle2 className="w-16 h-16 text-green-400" />
                        )}
                        {image.status === "error" && (
                          <AlertCircle className="w-12 h-12 text-red-400" />
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => window.open(image.url, "_blank")}
                          className="p-1.5 bg-white rounded-lg shadow hover:bg-gray-100 transition-colors"
                          title="查看原图"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => copyUrl(image.url)}
                          className="p-1.5 bg-white rounded-lg shadow hover:bg-gray-100 transition-colors"
                          title="复制链接"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
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
                            "..."}
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
                    onClick={() => {
                      navigator.clipboard.writeText(
                        images
                          .filter((img) => img.status === "success")
                          .map((img) => img.url)
                          .join("\n")
                      );
                      showToast("success", "已复制所有成功图片的链接");
                    }}
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

        {/* 使用提示 */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-3">💡 使用说明</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• 支持抓取微信公众号文章中的所有图片</li>
            <li>• 支持直接粘贴图片URL下载保存</li>
            <li>• 抓取后可自动关联到指定商品</li>
            <li>• 批量导入商品库，提高上架效率</li>
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
