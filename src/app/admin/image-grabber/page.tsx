"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Trash2, ExternalLink, ImagePlus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface GrabbedImage {
  url: string;
  filename: string;
  size?: number;
  status: "pending" | "downloading" | "success" | "error";
  error?: string;
  storedUrl?: string;
  isLocalFile?: boolean;
}

export default function ImageGrabberPage() {
  const [images, setImages] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<any>(null);
  const fileInputRef = useRef<any>(null);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLocalFilesUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    showToast("success", `正在处理 ${files.length} 张图片...`);

    const validFiles: any[] = [];
    const baseId = Date.now();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type && !file.type.startsWith("image/") && file.type !== "" && !file.type.startsWith("application/octet-stream")) continue;
      const filename = `wechat_${baseId + i}.${file.name.split(".").pop() || "jpg"}`;
      validFiles.push({ file, filename });
    }

    if (validFiles.length === 0) {
      showToast("error", "未找到有效的图片文件");
      setIsProcessing(false);
      return;
    }

    const newImages = validFiles.map(({ file, filename }) => ({
      url: URL.createObjectURL(file),
      filename,
      status: "pending" as const,
      isLocalFile: true,
    }));
    const baseIndex = images.length;
    setImages((prev: any[]) => [...prev, ...newImages]);

    for (let i = 0; i < validFiles.length; i++) {
      const idx = baseIndex + i;
      const { file } = validFiles[i];
      setImages((prev: any[]) => prev.map((img: any, index: number) => index === idx ? { ...img, status: "downloading" as const } : img));

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
            filename: (file.name || `image_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, "_"),
            mimeType: file.type || "image/jpeg",
            dataUrl,
          }),
        });

        const json = await res.json();
        if (!res.ok || json.error) throw new Error(`[API] ${json.error || `HTTP ${res.status}`}`);

        setImages((prev: any[]) => prev.map((img: any, index: number) => index === idx ? {
          ...img, status: "success" as const, storedUrl: json.storedUrl, size: json.size || file.size,
        } : img));
      } catch (error: any) {
        setImages((prev: any[]) => prev.map((img: any, index: number) => index === idx ? { ...img, status: "error" as const, error: String(error.message || error).slice(0, 200) } : img));
      }
    }

    showToast("success", `成功处理 ${validFiles.length} 张图片`);
    setIsProcessing(false);
  };

  const handleFileChange = (e: any) => {
    handleLocalFilesUpload(e.target.files);
    e.target.value = "";
  };

  const handlePaste = useCallback(async (e: any) => {
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
      const dt = new DataTransfer();
      files.forEach((f: File) => dt.items.add(f));
      handleLocalFilesUpload(dt.files);
    }
  }, []);

  const removeImage = (index: number) => { setImages((prev: any[]) => prev.filter((_: any, i: number) => i !== index)); };
  const clearAll = () => { setImages([]); };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div onPaste={handlePaste} className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">图片抓取工具</h1>
          <p className="text-gray-500 mt-2">批量处理供应商朋友圈图片，快速上传到商品库</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="border-2 border-dashed border-blue-300 bg-blue-50/30 rounded-2xl p-10 cursor-pointer hover:border-blue-600 hover:bg-blue-50/50 transition-all mb-4 text-center"
            onClick={() => fileInputRef.current?.click()}>
            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <ImagePlus className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">点击或拖拽图片到这里</p>
                <p className="text-sm text-gray-500 mt-1">支持多选 · 也可直接 Ctrl+V 粘贴截图</p>
              </div>
            </div>
          </div>
        </div>

        {images.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                已处理图片（{images.filter((i: any) => i.status === "success").length}/{images.length}）
              </h2>
              <button onClick={clearAll} className="px-4 py-2 text-sm text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> 清空全部
              </button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image: any, index: number) => (
                <div key={`img-${index}-${Date.now()}`} className="relative rounded-xl overflow-hidden border border-gray-200 bg-white">
                  <div className="aspect-square bg-gray-100 relative">
                    <span className="absolute top-0 left-0 z-10 text-[10px] font-bold text-white bg-blue-500 px-1.5 py-0.5 rounded-br leading-none shadow">{index + 1}</span>
                    <button
                      onClick={(e: any) => { e.stopPropagation(); removeImage(index); }}
                      className="absolute top-1 right-1 z-20 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 active:scale-95 transition-all"
                      title="删除此图片"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    {image.storedUrl || image.url ? (
                      <img src={image.status === "success" ? (image.storedUrl || image.url) : image.url} alt={image.filename} className="w-full h-full object-cover" draggable={false} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">无预览</div>
                    )}
                    {image.status !== "success" && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        {image.status === "pending" && <Loader2 className="w-12 h-12 text-white animate-spin" />}
                        {image.status === "downloading" && <Loader2 className="w-12 h-12 text-white animate-spin" />}
                        {image.status === "error" && <AlertCircle className="w-12 h-12 text-red-400" />}
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-white border-t border-gray-100">
                    <p className="text-[11px] text-gray-500 truncate">{image.filename || `图片${index + 1}`}</p>
                    <p className={`text-[10px] mt-1 ${image.status === "success" ? "text-green-600" : image.status === "error" ? "text-red-600" : "text-gray-400"}`}>
                      {image.status === "success" && `✓ ${((image.size || 0) / 1024).toFixed(1)}KB`}
                      {image.status === "error" && <span>✗ 失败</span>}
                      {(image.status === "pending" || image.status === "downloading") && "..."}
                    </p>
                    <button
                      onClick={(e: any) => { e.stopPropagation(); removeImage(index); }}
                      className="w-full mt-1 py-1.5 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      删除此图片
                    </button>
                  </div>
                </div>
              ))}

              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl overflow-hidden border-2 border-dashed border-blue-300 hover:border-blue-600 bg-blue-50/50 cursor-pointer transition-all flex items-center justify-center min-h-[180px]"
              >
                <div className="text-center p-4">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                    <ImagePlus className="w-7 h-7 text-blue-400" />
                  </div>
                  <span className="text-xs text-blue-500 font-semibold">点击继续添加</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

        {toast && (
          <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
