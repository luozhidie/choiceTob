"use client";

import { useEffect, useState } from "react";
import { Save, Image as ImageIcon, Trash2, Loader2 } from "lucide-react";

type PageBg = { color?: string | null; image?: string | null };
type Config = {
  home: PageBg;
  buyer: PageBg;
  cart: PageBg;
  my: PageBg;
};

const PAGES: { key: keyof Config; label: string; desc: string }[] = [
  { key: "home", label: "首页", desc: "顶部色块（含分类标签栏）背景" },
  { key: "buyer", label: "选品", desc: "页面整体底色与背景图" },
  { key: "cart", label: "购物车", desc: "页面整体底色与背景图" },
  { key: "my", label: "我的", desc: "顶部个人信息区背景" },
];

function emptyConfig(): Config {
  return { home: {}, buyer: {}, cart: {}, my: {} };
}

export default function PageBackgroundPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [cfg, setCfg] = useState<Config>(emptyConfig());

  useEffect(() => {
    fetch("/api/admin/page-background", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) setCfg({ ...emptyConfig(), ...j.data });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const setPage = (key: keyof Config, patch: Partial<PageBg>) =>
    setCfg((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const uploadBg = async (page: keyof Config, file: File) => {
    setUploading(page);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("key", "bg_" + page);
      const res = await fetch("/api/admin/site-assets", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const j = await res.json();
      if (j.error) throw new Error(j.error);
      setPage(page, { image: j.url });
      setToast({ type: "success", msg: `${PAGES.find((p) => p.key === page)?.label} 背景图已上传` });
    } catch (e: any) {
      setToast({ type: "error", msg: e.message || "上传失败" });
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/page-background", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const j = await res.json();
      if (j.error) throw new Error(j.error);
      setToast({ type: "success", msg: "页面背景已保存" });
    } catch (e: any) {
      setToast({ type: "error", msg: e.message || "保存失败" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2500);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">页面背景设置</h1>
          <p className="text-sm text-gray-500 mt-1">
            分别设置小程序「首页 / 选品 / 购物车 / 我的」的背景色与背景图。留空则沿用原有默认样式。
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          保存
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PAGES.map((p) => {
          const v = cfg[p.key] || {};
          return (
            <div key={p.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-semibold text-gray-800">{p.label}</h2>
                {v.image && (
                  <button
                    onClick={() => setPage(p.key, { image: null })}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 清除图
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-4">{p.desc}</p>

              {/* 预览 */}
              <div
                className="relative w-full h-28 rounded-xl overflow-hidden border border-gray-100 mb-4 flex items-center justify-center"
                style={
                  v.image
                    ? undefined
                    : { background: v.color || "#faf8f6" }
                }
              >
                {v.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : null}
                <span
                  className="relative text-xs px-2 py-1 rounded bg-black/30 text-white"
                  style={{ mixBlendMode: "normal" }}
                >
                  {v.color || "默认底色"}
                </span>
              </div>

              {/* 颜色 */}
              <div className="flex items-center gap-3 mb-4">
                <label className="text-xs text-gray-500">背景色</label>
                <input
                  type="color"
                  value={v.color || "#faf8f6"}
                  onChange={(e) => setPage(p.key, { color: e.target.value })}
                  className="w-12 h-9 rounded-lg border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={v.color || ""}
                  onChange={(e) => setPage(p.key, { color: e.target.value })}
                  placeholder="#faf8f6"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
                />
              </div>

              {/* 图片上传 */}
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 cursor-pointer hover:bg-gray-50">
                {uploading === p.key ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
                上传背景图
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadBg(p.key, f);
                    e.target.value = "";
                  }}
                />
              </label>
              {v.image && (
                <p className="text-[11px] text-gray-400 mt-2 truncate">{v.image}</p>
              )}
            </div>
          );
        })}
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl shadow-lg text-sm ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-500 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
