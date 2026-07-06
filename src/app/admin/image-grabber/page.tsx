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

// 1688 商品提取脚本（浏览器控制台版）— 点击 skipped 卡片的「复制脚本」按钮使用
const EXTRACT_1688_SCRIPT = `(function extract1688(){
  var r={platform:"1688",title:"",price:"",originalPrice:"",description:"",supplier:"",specs:[],skuOptions:{},images:[]};
  try{var e=document.querySelector(".d-title")||document.querySelector("h1")||document.querySelector('[itemprop="name"]')||document.querySelector(".offer-title");if(e)r.title=e.innerText.trim()}catch(e){}
  try{var p=document.querySelector(".price-text")||document.querySelector(".price")||document.querySelector('[itemprop="price"]');if(p)r.price=p.innerText.replace(/[^\\d.]/g,"").trim()}catch(e){}
  try{
    var s=new Set();
    document.querySelectorAll(".tab-content img,.detail-gallery-turn img,.main-img img,[id*='thumb'] img,[class*='gallery'] img,[class*='swiper'] img").forEach(function(img){
      var src=img.src||img.dataset.src||"";if(src&&src.includes("http")){src=src.replace(/_\\d+x\\d+\\.jpg/,".jpg");s.add(src.split("?")[0])}
    });
    document.querySelectorAll("img").forEach(function(img){
      var src=img.src||img.dataset.src||"";if(src&&/\\.(jpg|jpeg|png|webp)/i.test(src)&&!src.includes("icon")&&!src.includes("logo")&&(img.naturalWidth>100))s.add(src.split("?")[0])
    });
    r.images=[...s].slice(0,20);
  }catch(e){}
  try{
    document.querySelectorAll(".obj-content table tr,.mod-detail-property tr,.property-table tr").forEach(function(tr){
      var t=tr.querySelectorAll("td,th");if(t.length>=2){var k=t[0].innerText.trim().replace(/[:：\\s]/g,""),v=t[1].innerText.trim();if(k&&v)r.specs.push(k+":"+v)}
    });
    document.querySelectorAll("[class*='sku'] [class*='value'],.obj-sku li").forEach(function(el){
      var val=el.innerText.trim();if(val&&val.length<30)r.specs.push(val)
    });
  }catch(e){}
  try{var d=document.querySelector("[itemprop='description']")||document.querySelector(".desc-content");if(d)r.description=d.innerText.trim().slice(0,200)}catch(e){}
  var o={...r,imageCount:r.images.length,exportTime:new Date().toISOString(),url:location.href};
  var j=JSON.stringify(o,null,2);
  if(navigator.clipboard)navigator.clipboard.writeText(j).then(function(){console.log("%c✅ 已复制！粘贴到导入框即可","color:green;font-weight:bold;")});
  console.log("%c📦 1688 提取完成："+r.title+" | ¥"+r.price+" | "+r.images.length+"张图","color:blue;font-size:14px;");
  return o;
})();`;

export default function ImageGrabberPage() {
  // 不创建 supabase 客户端（避免 Storage SDK 在 Vercel 上的兼容问题）
  // [版本] v20240627-NUKE - 完全移除 Supabase 浏览器端 SDK

  const [inputText, setInputText] = useState("");
  // 图片列表（不用 sessionStorage 避免序列化导致渲染异常）
  const [images, setImages] = useState<GrabbedImage[]>([]);
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
  // 商品参数（抓取时提取）
  const [productInfo, setProductInfo] = useState<Record<string, any> | null>(null);
  // 商品导入结果
  const [importResults, setImportResults] = useState<Array<{
    url: string; platform: string | null;
    status: "success" | "error" | "skipped";
    productId?: string; title?: string; price?: string;
    imageCount?: number; message?: string;
  }>>([]);

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

      // 检测输入中是否有动态页面链接（1688/淘宝/微信小程序）
      const dynamicSitePatterns = [/1688\.com\/offer\//, /taobao\.com/, /tmall\.com/, /#小程序\/|#微信小程序\/]/];
      const hasDynamicLinks = dynamicSitePatterns.some(p => p.test(inputText));

      if (hasDynamicLinks) {
        setProductInfo({
          title: "⚠️ 检测到动态页面链接",
          description: "1688/淘宝等网站的详情页是JS动态加载，服务端无法直接抓取图片",
          specs: [
            "① 浏览器打开商品页，右键图片 → 复制图片地址",
            "② 或长按图片保存到手机相册后上传",
            "③ 切换到「批量粘贴链接」模式粘贴图片URL（.jpg结尾）",
            "④ 图片地址格式如：https://xxx.alicdn.com/img.jpg",
          ],
        });
        showToast("error", "检测到动态页面链接，请使用图片URL而非商品页链接");
        setIsProcessing(false);
        return;
      }

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
          showToast("success", "正在抓取页面内容...");
          const result = await handlePuppeteerGrab(url);
          
          // 微信小程序链接特殊提示
          if (result.isMiniprogram) {
            showToast("error", result.error);
            setIsProcessing(false);
            return;
          }
          
          // 动态页面特殊提示（如1688）
          if (result.isDynamicSite) {
            showToast("error", "该页面需要手动操作，请看下方提示");
            // 显示一个持久的提示信息
            setProductInfo({
              title: "⚠️ 该网站无法自动抓取",
              description: result.error || "",
              specs: ["1. 在浏览器打开商品页", "2. 右键图片 → 复制图片地址", "3. 切换到「批量粘贴链接」模式", "4. 粘贴图片URL后点开始抓取"],
            });
            setIsProcessing(false);
            return;
          }

          if (!result.success && result.error) throw new Error(result.error);
          
          if (result.images && result.images.length > 0) {
            imageUrls = result.images;
          }
          
          // 保存商品参数
          if (result.productInfo) {
            setProductInfo(result.productInfo);
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

  // 商品导入（调用 /api/admin/products/create?action=import）
  const handleImport = async () => {
    if (!inputText.trim()) {
      showToast("error", "请输入商品页链接");
      return;
    }

    setIsProcessing(true);
    setImportResults([]);

    try {
      const urls = inputText
        .split(/[\n\r]+/)
        .map(l => l.trim())
        .filter(l => l.startsWith("http"));

      if (urls.length === 0) {
        showToast("error", "没有有效的URL");
        setIsProcessing(false);
        return;
      }

      showToast("success", `正在导入 ${urls.length} 个商品...`);

      const res = await fetch("/api/admin/products/create?action=import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ urls }),
      });

      const json = await res.json();
      setImportResults(json.results || []);

      const okCount = json.success ?? (json.results || []).filter((r: any) => r.status === "success").length;
      const skipCount = json.skipped ?? (json.results || []).filter((r: any) => r.status === "skipped").length;
      const errCount = (json.results || []).filter((r: any) => r.status === "error").length;
      if (okCount > 0) showToast("success", `成功导入 ${okCount} 个商品到「待分类」`);
      if (skipCount > 0) showToast("error", `${skipCount} 个动态站点已跳过，请看下方说明`);
      if (errCount > 0) showToast("error", `${errCount} 个导入失败`);
    } catch (err: any) {
      showToast("error", err.message || "导入失败");
    } finally {
      setIsProcessing(false);
    }
  };

  // 清空所有
  const clearAll = () => {
    setImages([]);
    setInputText("");
    setProductInfo(null);
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
  const handleCardDragStart = (e: React.DragEvent, index: number) => {
    if (!images[index] || images[index].status !== "success") return;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleCardDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleCardDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === targetIndex) return;
    const newImages = [...images];
    const [moved] = newImages.splice(dragIndex, 1);
    newImages.splice(targetIndex, 0, moved);
    setImages(newImages);
    setDragIndex(null);
  };
  const handleCardDragEnd = () => setDragIndex(null);

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
            <button
              onClick={() => setMode("import")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "import"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Package className="w-4 h-4 inline-block mr-1 -mt-0.5" />
              商品导入
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

          {/* 商品导入模式 */}
          {mode === "import" && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                  粘贴商品页链接（每行一个，支持1688/淘宝/拼多多/京东/抖音）
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={"粘贴商品页链接，每行一个：\nhttps://detail.1688.com/offer/xxxx.html\nhttps://item.taobao.com/xxxx.htm\n..."}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none h-40 resize-y font-mono text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleImport}
                  disabled={isProcessing || !inputText.trim()}
                  className="px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> 导入中...</>
                  ) : (
                    <><Package className="w-5 h-5" /> 开始导入</>
                  )}
                </button>
                {images.length > 0 && (
                  <button onClick={clearAll} className="px-4 py-2 text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1">
                    <Trash2 className="w-4 h-4" /> 清空
                  </button>
                )}
              </div>
            </>
          )}

          {/* 导入结果展示 */}
          {importResults.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                导入结果（{importResults.filter(r => r.status === "success").length} 成功 / {importResults.filter(r => r.status === "skipped").length} 跳过 / {importResults.filter(r => r.status === "error").length} 失败）
              </div>
              {importResults.map((r, i) => (
                <div key={i} className={`p-4 rounded-xl border ${
                  r.status === "success" ? "bg-green-50 border-green-100"
                  : r.status === "skipped" ? "bg-yellow-50 border-yellow-100"
                  : "bg-red-50 border-red-100"
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.title || r.url}</p>
                      <p className="text-xs text-gray-400 break-all mt-0.5">{r.url}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                      r.status === "success" ? "bg-green-100 text-green-700"
                      : r.status === "skipped" ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                    }`}>
                      {r.status === "success" ? "✓ 成功" : r.status === "skipped" ? "↷ 跳过" : "✗ 失败"}
                    </span>
                  </div>

                  {r.status === "success" && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="text-red-600 font-bold">{r.price ? `¥${r.price}` : "价格未知"}</span>
                      {r.imageCount !== undefined && <span className="ml-3">图片 {r.imageCount} 张</span>}
                      <span className="ml-3 px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">待分类</span>
                      {r.productId && <span className="ml-2 text-gray-400">ID: {r.productId.slice(0,8)}</span>}
                    </div>
                  )}

                  {r.specs && r.specs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.specs.map((s: string, j: number) => (
                        <span key={j} className="inline-block bg-white px-2 py-0.5 rounded border border-gray-200 text-xs text-gray-600">{s}</span>
                      ))}
                    </div>
                  )}

                  {(r.status === "skipped" || r.status === "error") && r.message && (
                    <p className="mt-2 text-xs text-gray-600 leading-relaxed">{r.message}</p>
                  )}

                  {/* 1688/淘宝等动态站点：提供专用提取脚本 */}
                  {r.status === "skipped" && /1688|taobao|tmall/i.test(r.url) && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs font-semibold text-blue-800 mb-2">🔧 快速方案：使用 1688 提取脚本</p>
                      <ol className="text-xs text-blue-700 space-y-1 mb-2 list-decimal list-inside">
                        <li>浏览器打开该 1688 商品页</li>
                        <li>按 F12 → Console 控制台</li>
                        <li>粘贴脚本回车 → 自动复制数据到剪贴板</li>
                        <li>回到这里清空输入框，粘贴 JSON 数据 → 开始导入</li>
                      </ol>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(EXTRACT_1688_SCRIPT);
                          showToast("success", "✅ 脚本已复制！去 1688 页面 F12 粘贴执行");
                        }}
                        className="w-full mt-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        📋 一键复制提取脚本
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
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

          {/* 抓取到的商品参数 */}
          {productInfo && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-primary" />
                  商品参数
                </h3>
                <button onClick={() => setProductInfo(null)} className="text-xs text-gray-400 hover:text-gray-600">✕ 清除</button>
              </div>

              {productInfo.title && (
                <p className="text-base font-semibold text-gray-900 mb-2">{productInfo.title}</p>
              )}

              {(productInfo.price || productInfo.originalPrice) && (
                <div className="flex items-center gap-4 mb-2">
                  {productInfo.price && (
                    <span className="text-red-600 font-bold text-lg">¥{productInfo.price}</span>
                  )}
                  {productInfo.originalPrice && (
                    <span className="text-gray-400 text-sm line-through">¥{productInfo.originalPrice}</span>
                  )}
                </div>
              )}

              {productInfo.specs && productInfo.specs.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {productInfo.specs.map((spec: string, i: number) => (
                    <span key={i} className="inline-block bg-white px-2 py-1 rounded-md text-xs border border-gray-200 text-gray-700">{spec}</span>
                  ))}
                </div>
              )}

              {(productInfo.shipFrom || productInfo.stock) && (
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                  {productInfo.shipFrom && <span>发货地：{productInfo.shipFrom}</span>}
                  {productInfo.stock && <span>库存：{productInfo.stock}</span>}
                </div>
              )}

              {productInfo.description && !productInfo.title && (
                <p className="text-sm text-gray-600 mt-1">{productInfo.description}</p>
              )}
            </div>
          )}
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
                  onDragStart={(e) => handleCardDragStart(e, index)}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => { e.preventDefault(); handleCardDrop(e, index); }}
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

                  {/* 删除按钮 */}
                  <div className="p-2 border-t border-gray-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                      className="w-full py-1.5 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      删除此图片
                    </button>
                  </div>
                </div>
              ))}

              {/* ➕ 继续添加图片 */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl overflow-hidden border-2 border-dashed border-blue-300 hover:border-primary hover:bg-blue-50/50 transition-all cursor-pointer group"
              >
                <div className="aspect-square bg-gray-50/80 flex flex-col items-center justify-center gap-2 group-hover:bg-primary/5 transition-colors p-4">
                  <div className="w-14 h-14 rounded-full bg-blue-100 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <ImagePlus className="w-7 h-7 text-blue-400 group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-xs text-blue-500 group-hover:text-primary font-semibold transition-colors">点击继续添加</span>
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
