"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Image as ImageIcon, Loader2 } from "lucide-react";

export default function StylingRequestPage() {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) setImages((prev) => [...prev, data.url]);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    const list = JSON.parse(localStorage.getItem("styling_requests") || "[]");
    list.unshift({ id: Date.now(), content, images, date: new Date().toLocaleString() });
    localStorage.setItem("styling_requests", JSON.stringify(list));
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#f5f3f0]">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center sticky top-0 z-10">
        <Link href="/courses" className="text-gray-600 hover:text-[#2d1b2e] flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> 返回
        </Link>
        <h1 className="flex-1 text-center font-bold text-[#2d1b2e]">搭配任务</h1>
        <div className="w-10" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
        {submitted ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
            <p className="text-5xl mb-4">✅</p>
            <h2 className="text-xl font-bold text-[#2d1b2e]">提交成功</h2>
            <p className="text-gray-500 mt-2 text-sm">您的搭配需求已收到，搭配师将尽快为您回复。</p>
            <Link href="/courses" className="inline-block mt-6 px-6 py-2.5 bg-[#2d1b2e] text-white rounded-full text-sm font-semibold">
              返回课程中心
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#2d1b2e] mb-2">上传参考照片</label>
              <div className="grid grid-cols-4 gap-3">
                {images.map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-gray-100 overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#C9A24B] transition">
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin text-gray-400" /> : <ImageIcon className="w-6 h-6 text-gray-400" />}
                  <span className="text-xs text-gray-400 mt-1">上传</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#2d1b2e] mb-2">穿搭需求</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请描述您的穿搭场景、偏好、困惑等..."
                maxLength={1000}
                rows={6}
                className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#eee5df] rounded-xl text-sm focus:outline-none focus:border-[#C9A24B] resize-none"
              />
              <p className="text-right text-xs text-gray-400 mt-1">{content.length}/1000</p>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-[#2d1b2e] text-white rounded-full py-3.5 font-bold text-base hover:opacity-95 transition"
            >
              提交需求
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
