"use client";

import { useState, useEffect, useRef, useCallback } from "react";
// 不再导入 supabase 客户端（Storage SDK 在 Vercel 上有兼容问题）
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
  Smartphone,
  Clipboard,
  ImagePlus,
  GripVertical,
  X,
} from "lucide-react";

interface GrabbedImage {
  url: string;
  filename: string;
  size?: number;
  status: "pending" | "downloading" | "success" | "error";
  error?: string;
  storedUrl?: string;
  isLocalFile?: boolean; // 是否是本地上传的文件
}

export default function ImageGrabberPage() {
  // 不创建 supabase 客户端（避免 Storage SDK 在 Vercel 上的兼容问题）
  // [版本] v20240627-NUKE - 完全移除 Supabase 浏览器端 SDK

  const [inputText, setInputText] = useState("");
  // 图片列表持久化到 sessionStorage（新标签页打开图片后返回不丢失）
  const [images, setImagesRaw] = useState<GrabbedImage[]>(() => {
    try {
      const saved = sessionStorage.getItem("grabber_images");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const setImages = (v: GrabbedImage[] | ((prev: GrabbedImage[]) => GrabbedImage[])) => {
    const next = typeof v === "function" ? v(images) : v;
    setImagesRaw(next);
    try { sessionStorage.setItem("grabber_images", JSON.stringify(next)); } catch {}
  };
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [products, setProducts] = useState<{ id: string; title: string; category?: string; subcategory?: string }[]>([]);
  // 拖拽排序状态
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // 图片预览状态（不再使用Lightbox，改为window.open新开网页）
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<"url" | "batch" | "upload">("upload"); // 新增 upload 模式
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 加载商品列表（用 fetch 代替 supabase 客户端）
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch("/api/admin/products-data?limit=100&active=true", {
          credentials: "include",
        });
        const json = await res.json();
        if (json.data) setProducts(json.data);
      } catch {
        // 静默失败，不影响主功能
      }
    };
    loadProducts();
  }, []);

  // 从文本中提取所有图片URL
  const extractImageUrls = (text: string): string[] => {
    const urlRegex = /https?:\/\/[^\s<>""'\]\)]+/gi;
    const matches = text.match(urlRegex) || [];
    
    return matches.filter((url) => {
      const lower = url.toLowerCase();
      return (
        /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(lower) ||
        lower.includes("qpic.cn") ||
        lower.includes("alicdn") ||
        lower.includes("mmbiz") ||
        lower.includes("oss-")
      );
    });
  };

  // 处理本地文件上传
  const handleLocalFilesUpload = async (files: FileList) => {
    // [DEBUG] 版本标记 - 在浏览器Console中搜索"UPLOAD-VER"确认版本
    console.log("UPLOAD-VER: de6e8931-API-MODE", "文件数:", files.length);

    if (!files || files.length === 0) return;

    setIsProcessing(true);
    showToast("success", `正在处理 ${files.length} 张图片...`);

    // 统一过滤：一次过滤，两个循环共用（避免索引错位）
    const validFiles: Array<{ file: File; filename: string }> = [];
    const baseId = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // 兼容iOS/微信图片file.type为空：空=当图片处理，只拒绝明确的非图片类型
      if (file.type && !file.type.startsWith("image/") && !file.type !== "" && !file.type.startsWith("application/octet-stream")) {
        continue;
      }
      const filename = `wechat_${baseId + i}.${file.name.split(".").pop() || "jpg"}`;
      validFiles.push({ file, filename });
    }

    if (validFiles.length === 0) {
      showToast("error", "未找到有效的图片文件");
      setIsProcessing(false);
      return;
    }

    // 构建预览列表（使用统一过滤后的数组）
    const newImages: GrabbedImage[] = validFiles.map(({ file, filename }) => ({
      url: URL.createObjectURL(file),
      filename,
      status: "pending" as const,
      isLocalFile: true,
    }));

    // 获取当前图片总数（用于定位新增项的索引）
    const baseIndex = images.length;
    setImages((prev) => [...prev, ...newImages]);

    // 逐个上传（走后端API，浏览器直传Storage在Vercel上有兼容问题）
    for (let i = 0; i < validFiles.length; i++) {
      const idx = baseIndex + i;
      const { file } = validFiles[i];

      setImages((prev) =>
        prev.map((img, index) =>
          index === idx ? { ...img, status: "downloading" as const } : img
        )
      );

      try {
        // FileReader 转 Base64 Data URL
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("文件读取失败"));
          reader.readAsDataURL(file);
        });

        // 调用后端API上传（已验证可用）
        const res = await fetch("/api/image-grabber/upload", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: (file.name || `image_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, "_"),
            mimeType: file.type || "image/jpeg",
            dataUrl,
          }),
        });

        const json = await res.json();

        if (!res.ok || json.error) {
          // [DEBUG] 前缀标记确认走的是API路径
          throw new Error(`[API] ${json.error || `HTTP ${res.status}`}`);
        }

        setImages((prev) =>
          prev.map((img, index) =>
            index === idx ? {
              ...img,
              status: "success" as const,
              storedUrl: json.storedUrl,
              size: json.size || file.size,
            } : img
          )
        );
      } catch (error: any) {
        console.error(`[上传失败] ${validFiles[i].filename}:`, error);
        setImages((prev) =>
          prev.map((img, index) =>
            index === idx ? { ...img, status: "error" as const, error: String(error.message || error).slice(0, 200) } : img
          )
        );
      }
    }

    showToast("success", `成功处理 ${validFiles.length} 张图片`);
    setIsProcessing(false);
  };

  // 文件选择变化
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleLocalFilesUpload(e.target.files!);
    e.target.value = ""; // 重置以便重复选择同一文件
  };

  // 剪贴板粘贴事件
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      showToast("success", `检测到 ${files.length} 张剪贴板图片`);
      handleLocalFilesUpload(new DataTransfer().files); // 需要特殊处理
      
      // 直接用 files 创建一个类 FileList 对象
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));
      handleLocalFilesUpload(dt.files);
    }
  }, []);

  // 拖拽事件处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      showToast("success", `检测到 ${e.dataTransfer.files.length} 个拖拽文件`);
      handleLocalFilesUpload(e.dataTransfer.files);
    }
  }, []);

  // 使用 Puppeteer 抓取（新API）
  const handlePuppeteerGrab = async (url: string) => {
    const response = await fetch("/api/image-grabber/puppeteer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    return await response.json();
  };

  // 开始抓取 URL 模式
  const handleGrab = async () => {
    if (!inputText.trim()) {
      showToast("error", "请输入图片链接");
      return;
    }

    setIsProcessing(true);

    try {
      let imageUrls: string[] = [];

      if (mode === "batch") {
        imageUrls = extractImageUrls(inputText);
        
        if (imageUrls.length === 0) {
          const pageUrls = inputText
            .split(/[\n\r]+/)
            .map((line) => line.trim())
            .filter((line) => line.startsWith("http"));
          
          if (pageUrls.length > 0) {
            showToast("success", `检测到 ${pageUrls.length} 个页面链接，正在抓取...`);
            
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
        const url = inputText.trim();
        
        if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
          imageUrls = [url];
        } else {
          showToast("success", "正在使用浏览器抓取图片...");
          const result = await handlePuppeteerGrab(url);
          
          if (result.error) throw new Error(result.error);
          
          if (result.images && result.images.length > 0) {
            imageUrls = result.images;
          }
        }
      }

      if (imageUrls.length === 0) {
        showToast("error", "未找到任何图片");
        setIsProcessing(false);
        return;
      }

      imageUrls = [...new Set(imageUrls)];

      const initialImages: GrabbedImage[] = imageUrls.map((url, index) => ({
        url,
        filename: `img_${Date.now()}_${index + 1}.jpg`,
        status: "pending" as const,
      }));

      setImages((prev) => [...prev, ...initialImages]);
      showToast("success", `找到 ${imageUrls.length} 张图片，开始下载...`);

      const startIndex = images.length;
      for (let i = 0; i < initialImages.length; i++) {
        const idx = startIndex + i;
        setImages((prev) =>
          prev.map((img, index) =>
            index === idx ? { ...img, status: "downloading" } : img
          )
        );

        try {
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
              prev.map((img, index) =>
                index === idx ? {
                  ...img,
                  status: "success" as const,
                  storedUrl: result.storedUrl || img.url,
                  size: result.size,
                } : img
              )
            );
          } else {
            throw new Error(result.error || "下载失败");
          }
        } catch (error: any) {
          setImages((prev) =>
            prev.map((img, index) =>
              index === idx ? { ...img, status: "error" as const, error: error.message } : img
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

  // 全部导入商品库（将已上传的图片关联到选中商品）
  const handleImportAll = async () => {
    const successImages = images.filter((img) => img.status === "success" && img.storedUrl);
    if (successImages.length === 0) {
      showToast("error", "没有可导入的图片");
      return;
    }

    // 检查是否选择了商品
    if (!selectedProductId) {
      showToast("error", "请先在上方选择要关联的商品");
      return;
    }

    setIsProcessing(true);
    try {
      if (selectedProductId === "new") {
        // 创建新商品：跳转到商品管理页创建
        showToast("error", "请先选择已有商品，或前往「商品管理」页面新建");
        setIsProcessing(false);
        return;
      }

      const res = await fetch("/api/admin/products/update-images", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          images: successImages.map(img => ({
            url: img.storedUrl,
            filename: img.filename,
            size: img.size,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      showToast("success", `已导入 ${successImages.length} 张图片到商品`);
    } catch (err: any) {
      showToast("error", `导入失败：${err.message}`);
    }
    setIsProcessing(false);
  };

  // ===== 拖拽排序（移动端：点击第一张选中 → 点击第二张交换 → 可继续操作） =====
  const [sortMode, setSortMode] = useState(false); // 是否进入排序模式
  const [selectedSortIndex, setSelectedSortIndex] = useState<number | null>(null); // 选中的图片

  // 点击图片（排序模式下）
  const handleSortClick = (index: number) => {
    if (!images[index] || images[index].status !== "success") return;
    
    if (selectedSortIndex === null) {
      // 第一次点击：选中这张图片
      setSelectedSortIndex(index);
      showToast("success", `已选中第${index + 1}张，再点目标位置交换`);
    } else if (selectedSortIndex === index) {
      // 点击已选中的图片：取消选中
      setSelectedSortIndex(null);
      showToast("success", "已取消选中");
    } else {
      // 点击另一张图片：交换位置（不退出排序模式，可继续操作）
      const newImages = [...images];
      const [moved] = newImages.splice(selectedSortIndex, 1);
      newImages.splice(index, 0, moved);
      setImages(newImages);
      setSelectedSortIndex(null); // 交换后取消选中，方便继续选择
      showToast("success", `已交换位置`);
    }
  };

  // 点击排序模式按钮
  const toggleSortMode = () => {
    if (sortMode) {
      setSortMode(false);
      setSelectedSortIndex(null);
      showToast("success", "已退出排序模式");
    } else {
      setSortMode(true);
      setSelectedSortIndex(null);
      showToast("success", "排序模式已开启，点击第一张选中，再点第二张交换");
    }
  };

  // 桌面端拖拽（备用）
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!images[index] || images[index].status !== "success") return;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === targetIndex) return;
    const newImages = [...images];
    const [moved] = newImages.splice(dragIndex, 1);
    newImages.splice(targetIndex, 0, moved);
    setImages(newImages);
    setDragIndex(null);
  };
  const handleDragEnd = () => setDragIndex(null);

  // 显示提示
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 全局粘贴监听 */}
      <div 
        onPaste={handlePaste}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="max-w-6xl mx-auto"
      >
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Download className="w-7 h-7 text-primary" />
            图片抓取工具
          </h1>
          <p className="text-gray-500 mt-2">
            批量处理供应商朋友圈图片，快速上传到商品库
          </p>
        </div>

        {/* 功能选择区 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          {/* 模式切换 */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setMode("upload")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "upload"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Smartphone className="w-4 h-4 inline-block mr-1 -mt-0.5" />
              微信图片上传 ⭐推荐
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
          </div>

          {/* 微信图片上传模式 */}
          {mode === "upload" && (
            <div>
              {/* 上传区域 */}
              <div 
                ref={dropZoneRef}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 bg-blue-50/30 rounded-2xl p-10 cursor-pointer hover:border-primary hover:bg-blue-50/60 transition-all mb-4 text-center"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <ImagePlus className="w-8 h-8 text-primary" />
                  </div>
                  
                  <div>
                    <p className="text-lg font-semibold text-gray-800">点击或拖拽图片到这里</p>
                    <p className="text-sm text-gray-500 mt-1">
                      支持多选 · 也可直接 Ctrl+V 粘贴截图
                    </p>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      JPG / PNG / WEBP
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                      单次最多 20 张
                    </span>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                      自动压缩优化
                    </span>
                  </div>
                </div>
              </div>

              {/* 快捷操作提示 */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 flex items-center gap-4">
                <Clipboard className="w-8 h-8 text-green-600 shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold">💡 微信朋友圈图片快速上传流程：</p>
                  <ol className="mt-1 space-y-1 text-xs opacity-90 list-decimal ml-4">
                    <li>在微信长按朋友圈图片 → 保存到相册</li>
                    <li>回到此页面 → 点击上方区域选择图片</li>
                    <li>或者：手机截屏后直接在此页面按 <kbd className="px-1 bg-white rounded border">Ctrl+V</kbd> 粘贴</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* 链接输入模式 */}
          {(mode === "url" || mode === "batch") && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {mode === "url" ? (
                    <><Link2 className="w-4 h-4 inline-block mr-1 -mt-0.5" /> 输入图片或商品页面链接</>
                  ) : (
                    <><Globe className="w-4 h-4 inline-block mr-1 -mt-0.5" /> 批量粘贴图片链接（每行一个）</>
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
                    placeholder={"请粘贴图片链接，每行一个：\nhttps://example.com/image1.jpg\nhttps://example.com/image2.jpg"}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none h-32 resize-y font-mono text-sm"
                  />
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleGrab}
                  disabled={isProcessing || !inputText.trim()}
                  className="px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing ? (<><Loader2 className="w-5 h-5 animate-spin" /> 抓取中...</>) : (<><Sparkles className="w-5 h-5" /> 开始抓取</>)}
                </button>
                {images.length > 0 && (
                  <button onClick={clearAll} className="px-4 py-2 text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1">
                    <Trash2 className="w-4 h-4" /> 清空全部
                  </button>
                )}
              </div>
            </>
          )}

          {/* 关联商品 */}
          <div className="mt-4 pt-4 border-t border-gray-100">
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
                <option key={p.id} value={p.id}>
                  {p.title}{p.category ? ` [${p.category}${p.subcategory ? '/' + p.subcategory : ''}]` : ''}
                </option>
              ))}
              <option value="new">创建新商品</option>
            </select>
          </div>
        </div>

        {/* 结果展示 */}
        {images.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  已处理图片（{images.filter(i => i.status === "success").length}/{images.length}）
                </h2>
                <div className="flex items-center gap-2">
                  {images.some((img) => img.status === "success") && images.length > 1 && (
                    <button
                      onClick={toggleSortMode}
                      className={`text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                        sortMode ? "bg-primary text-white" : "text-primary hover:text-primary/80 hover:bg-primary/5"
                      }`}
                    >
                      <GripVertical className="w-4 h-4" />
                      {sortMode ? "取消排序" : "调整顺序"}
                    </button>
                  )}
                {images.some((img) => img.status === "success") && (
                  <button onClick={copyAllUrls} className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary/5">
                    <Copy className="w-4 h-4" /> 复制全部链接
                  </button>
                )}
                <button onClick={clearAll} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50">
                  <Trash2 className="w-4 h-4" /> 清空
                </button>
              </div>
            </div>

            <div
              className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
              {images.map((image, index) => (
                <div
                  key={`${image.filename}-${index}`}
                  onClick={() => {
                    if (sortMode && image.status === "success") {
                      handleSortClick(index);
                    }
                  }}
                  // 桌面端拖拽
                  draggable={image.status === "success" && !sortMode}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => { e.preventDefault(); handleDrop(e, index); }}
                  className={`relative rounded-xl overflow-hidden border transition-all duration-150 ${
                    image.status === "success"
                      ? sortMode && selectedSortIndex === index
                        ? "border-primary border-2 shadow-md ring-2 ring-primary/30"
                        : sortMode
                        ? "border-dashed border-primary/40 cursor-pointer active:bg-primary/5"
                        : "border-green-200 shadow-sm hover:shadow-md"
                      : image.status === "error" ? "border-red-200" : "border-gray-200"
                  }`}
                >
                  {/* 图片预览 - 不再直接跳转大图 */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {/* 序号标签 */}
                    <div className="absolute top-0 left-0 z-10 flex items-center gap-0 select-none">
                      <span className="text-[10px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-br leading-none shadow">{index + 1}</span>
                    </div>

                    {/* 删除按钮 - 左上角红色大按钮（手机必须够大） */}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                      className="absolute top-1 right-1 z-20 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 active:scale-95 transition-all"
                      title="删除此图片"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    {/* 查看大图按钮 - 右下角小图标 */}
                    {image.status === "success" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(image.storedUrl || image.url, "_blank"); }}
                        className="absolute bottom-1 right-1 z-10 p-1.5 bg-black/50 backdrop-blur-sm rounded-md text-white hover:bg-black/70 transition-colors shadow"
                        title="查看大图"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}

                    {/* 排序模式下选中标记 */}
                    {sortMode && selectedSortIndex === index && (
                      <div className="absolute inset-0 z-10 ring-4 ring-primary/40 pointer-events-none" />
                    )}

                    {(image.storedUrl || image.url) && (
                      <img
                        src={image.status === "success" ? (image.storedUrl || image.url) : image.url}
                        alt={image.filename}
                        className={`w-full h-full object-cover ${sortMode ? "" : "cursor-default"}`}
                        draggable={false}
                      />
                    )}

                    {/* 状态遮罩 */}
                    {(image.status !== "success") && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        {image.status === "pending" && <ImageIcon className="w-12 h-12 text-white/60" />}
                        {image.status === "downloading" && <Loader2 className="w-12 h-12 text-white animate-spin" />}
                        {image.status === "error" && <AlertCircle className="w-12 h-12 text-red-400" />}
                      </div>
                    )}
                  </div>

                  {/* 图片信息 */}
                  <div className="p-2 bg-white">
                    <p className="text-[11px] text-gray-500 truncate">{image.filename}</p>
                    <span className={`text-[10px] font-medium block mt-0.5 ${
                      image.status === "success" ? "text-green-600" :
                      image.status === "error" ? "text-red-600" : "text-gray-400"
                    }`}>
                      {image.status === "success" && `✓ ${(image.size! / 1024).toFixed(1)}KB`}
                      {image.status === "error" && (
                        <span
                          className="text-red-500 text-[10px] leading-tight cursor-help"
                          title={image.error || "上传失败"}
                          onClick={(e) => { e.stopPropagation(); image.error && alert("错误详情: " + image.error); }}
                        >
                          ✗ {image.error ? (image.error.length > 25 ? image.error.slice(0, 22) + "..." : image.error) : "失败"}
                        </span>
                      )}
                      {(image.status === "pending" || image.status === "downloading") && "..."}
                    </span>
                  </div>
                </div>
              ))}

              {/* ➕ 继续添加图片卡片 */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group min-h-[180px]"
              >
                <div className="aspect-square bg-gray-50/80 flex flex-col items-center justify-center gap-2 group-hover:bg-primary/5 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                    <ImagePlus className="w-7 h-7 text-gray-300 group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-primary font-medium transition-colors">继续添加</span>
                </div>
              </div>
            </div>

            {/* 批量操作 */}
            {images.some((img) => img.status === "success") && (
              <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                <button onClick={handleImportAll} disabled={isProcessing || !selectedProductId}
                  className={`px-6 py-2.5 text-sm font-medium rounded-xl flex items-center gap-2 transition-colors ${isProcessing || !selectedProductId ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90'}`}>
                  <Upload className="w-4 h-4" />
                  全部导入商品库
                </button>
                <button onClick={copyAllUrls} className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  复制全部链接
                </button>
              </div>
            )}
          </div>
        )}

        {/* 使用说明 */}
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-3">💡 使用方式一览</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-xl p-4">
              <p className="font-semibold text-blue-800 mb-2"><Smartphone className="w-4 h-4 inline-block mr-1" /> 方式1：微信图片上传（推荐）</p>
              <ul className="space-y-1 text-blue-700 text-xs">
                <li>• 长按保存微信图片到相册</li>
                <li>• 点击上传区选择多张图片</li>
                <li>• 支持拖拽、支持 Ctrl+V 粘贴</li>
                <li>• 直接上传到云端存储</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="font-semibold text-blue-800 mb-2"><Link2 className="w-4 h-4 inline-block mr-1" /> 方式2：批量粘贴链接</p>
              <ul className="space-y-1 text-blue-700 text-xs">
                <li>• 右键复制图片地址</li>
                <li>• 多个链接每行一个粘贴</li>
                <li>• 自动下载并存储</li>
                <li>• 适合已有图片链接的场景</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="font-semibold text-blue-800 mb-2"><Globe className="w-4 h-4 inline-block mr-1" /> 方式3：网页自动抓取</p>
              <ul className="space-y-1 text-blue-700 text-xs">
                <li>• 粘贴淘宝/1688等商品页链接</li>
                <li>• 自动提取页面中的所有图片</li>
                <li>• 适合有商品详情页的来源</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Toast提示 */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 ${
            toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}>
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
// 强制重新部署 - Sat Jun 27 09:08:40 PM CST 2026
