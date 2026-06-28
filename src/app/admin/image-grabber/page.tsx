"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Trash2, ImagePlus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface GrabbedImage {
  id: string;
  url: string;
  filename: string;
  size?: number;
  status: "pending" | "downloading" | "success" | "error";
  error?: string;
  storedUrl?: string;
  isLocalFile?: boolean;
}

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `img_${Date.now()}_${idCounter}`;
}

export default function ImageGrabberPage() {
  const [images, setImages] = useState<GrabbedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, message });
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  const handleLocalFilesUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    showToast("success", `正在处理 ${files.length} 张图片...`);

    const validFiles: { file: File; filename: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type && !file.type.startsWith("image/") && file.type !== "" && !file.type.startsWith("application/octet-stream")) continue;
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `wechat_${Date.now() + i}.${ext}`;
      validFiles.push({ file, filename });
    }

    if (validFiles.length === 0) {
      showToast("error", "未找到有效的图片文件");
      setIsProcessing(false);
      return;
    }

    const newImages: GrabbedImage[] = validFiles.map(({ file, filename }) => ({
      id: nextId(),
      url: URL.createObjectURL(file),
      filename,
      status: "pending" as const,
      isLocalFile: true,
    }));

    const startIndex = images.length;
    setImages((prev) => [...prev, ...newImages]);

    for (let i = 0; i < validFiles.length; i++) {
      const imgId = newImages[i].id;
      const { file } = validFiles[i];

      setImages((prev) => prev.map((img) => (img.id === imgId ? { ...img, status: "downloading" as const } : img)));

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
        if (!res.ok || json.error) throw new Error(`上传失败: ${json.error || `HTTP ${res.status}`}`);

        setImages((prev) => prev.map((img) => (img.id === imgId ? { ...img, status: "success" as const, storedUrl: json.storedUrl, size: json.size || file.size } : img)));
      } catch (error: any) {
        setImages((prev) => prev.map((img) => (img.id === imgId ? { ...img, status: "error" as const, error: String(error.message || error).slice(0, 200) } : img)));
      }
    }

    showToast("success", `成功处理 ${validFiles.length} 张图片`);
    setIsProcessing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleLocalFilesUpload(e.target.files!);
    e.target.value = "";
  };

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
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
      files.forEach((f) => dt.items.add(f));
      handleLocalFilesUpload(dt.files);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("paste", handlePaste as any);
    return () => document.removeEventListener("paste", handlePaste as any);
  }, [handlePaste]);

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const clearAll = () => {
    setImages([]);
  };

  const successCount = images.filter((i) => i.status === "success").length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">图片抓取工具</h1>
          <p className="text-gray-500 mt-2">批量处理供应商朋友圈图片，快速上传到商品库</p>
        </div>

        {/* 上传区域 */}
        <div
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6"
        >
          <div
            className="border-2 border-dashed border-blue-300 bg-blue-50/30 rounded-2xl p-10 cursor-pointer hover:border-blue-600 hover:bg-blue-50/50 transition-all text-center"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files.length > 0) {
                handleLocalFilesUpload(e.dataTransfer.files);
              }
            }}
          >
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

        {/* 图片网格 */}
        {images.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                已处理图片（{successCount}/{images.length}）
              </h2>
              <button
                onClick={clearAll}
                className="px-4 py-2 text-sm text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> 清空全部
              </button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative rounded-xl overflow-hidden border border-gray-200 bg-white flex flex-col"
                >
                  {/* 图片区域 */}
                  <div className="aspect-square bg-gray-100 relative">
                    {/* 序号角标 */}
                    <span className="absolute top-0 left-0 z-10 text-[10px] font-bold text-white bg-blue-500 px-1.5 py-0.5 rounded-br leading-none shadow">
                      {images.findIndex((i) => i.id === image.id) + 1}
                    </span>

                    {/* 删除按钮（悬浮） */}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeImage(image.id); }}
                      className="absolute top-1 right-1 z-20 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 active:scale-95 transition-all"
                      title="删除此图片"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    {/* 图片预览 */}
                    {image.storedUrl || image.url ? (
                      <img
                        src={image.status === "success" ? (image.storedUrl || image.url) : image.url}
                        alt={image.filename}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">无预览</div>
                    )}

                    {/* 状态遮罩 */}
                    {image.status !== "success" && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        {(image.status === "pending" || image.status === "downloading") && (
                          <Loader2 className="w-12 h-12 text-white animate-spin" />
                        )}
                        {image.status === "error" && (
                          <div className="text-center text-white">
                            <AlertCircle className="w-12 h-12 mx-auto" />
                            <p className="text-xs mt-1">上传失败</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 信息区域 */}
                  <div className="p-2 bg-white border-t border-gray-100 flex-1 flex flex-col">
                    <p className="text-[11px] text-gray-500 truncate" title={image.filename}>
                      {image.filename}
                    </p>
                    <p className={`text-[10px] mt-1 ${image.status === "success" ? "text-green-600" : image.status === "error" ? "text-red-600" : "text-gray-400"}`}>
                      {image.status === "success" && `✓ ${((image.size || 0) / 1024).toFixed(1)}KB`}
                      {image.status === "error" && "✗ 失败"}
                      {(image.status === "pending" || image.status === "downloading") && "处理中..."}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeImage(image.id); }}
                      className="w-full mt-auto py-1.5 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      删除此图片
                    </button>
                  </div>
                </div>
              ))}

              {/* 继续添加按钮 */}
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

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 text-white ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
