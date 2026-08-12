"use client";

import { useEffect, useState, useRef } from "react";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Upload,
  X,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Megaphone,
} from "lucide-react";
import {
  DEFAULT_POPUPS,
  type PopupConfig,
  type PopupPage,
} from "@/lib/popups";

const PAGES: { value: PopupPage; label: string }[] = [
  { value: "buyer", label: "买家首页" },
  { value: "category", label: "分类结果页" },
  { value: "cart", label: "进货车" },
  { value: "my", label: "我的" },
  { value: "all", label: "全部页面" },
];

function newPopup(): PopupConfig {
  return {
    id: `popup_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    page: "buyer",
    is_active: false,
    sort_order: 0,
    hero_image: "",
    brand_label: "品 牌",
    brand_label_color: "#d4b35a",
    top_title: "新客首单 福利大放送",
    subtitle_1: "大牌联合上新",
    subtitle_2: "限时活动",
    brands: [],
    button_text: "立即查看",
    button_link: "/pages/buyer/index",
    bg_color: "#6e1f25",
    button_color: "#d4b35a",
    text_color: "#fff7e0",
  };
}

export default function PopupsAdminPage() {
  const [list, setList] = useState<PopupConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTargetIdRef = useRef<string | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/popups", { credentials: "include" });
      const j = await res.json();
      if (j.error) throw new Error(j.error);
      setList(Array.isArray(j.data) ? j.data : DEFAULT_POPUPS);
    } catch (e: any) {
      showToast("error", e?.message || "加载失败");
      setList(DEFAULT_POPUPS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/popups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(list),
      });
      const j = await res.json();
      if (j.error) throw new Error(j.error);
      setList(j.data || list);
      showToast("success", "保存成功");
    } catch (e: any) {
      showToast("error", e?.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const addOne = () => {
    setList([...list, { ...newPopup(), sort_order: list.length }]);
  };

  const removeOne = (id: string) => {
    if (!confirm("确定删除该弹窗？")) return;
    setList(list.filter((p) => p.id !== id));
  };

  const update = (id: string, patch: Partial<PopupConfig>) => {
    setList(list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const move = (index: number, dir: "up" | "down") => {
    const next = [...list];
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    const reord = next.map((p, i) => ({ ...p, sort_order: i }));
    setList(reord);
  };

  const triggerUpload = (id: string) => {
    uploadTargetIdRef.current = id;
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = uploadTargetIdRef.current;
    if (!file || !id) return;
    setUploadingId(id);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/popups/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const j = await res.json();
      if (j.error) throw new Error(j.error);
      update(id, { hero_image: j.url });
      showToast("success", "图片已上传");
    } catch (err: any) {
      showToast("error", err?.message || "上传失败");
    } finally {
      setUploadingId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addBrand = (id: string) => {
    update(id, { brands: [...(list.find((p) => p.id === id)?.brands || []), ""] });
  };
  const updateBrand = (id: string, idx: number, val: string) => {
    const cur = list.find((p) => p.id === id);
    if (!cur) return;
    const next = [...cur.brands];
    next[idx] = val;
    update(id, { brands: next });
  };
  const removeBrand = (id: string, idx: number) => {
    const cur = list.find((p) => p.id === id);
    if (!cur) return;
    update(id, { brands: cur.brands.filter((_, i) => i !== idx) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const previewing = list.find((p) => p.id === previewId);

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" /> 弹窗管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            配置小程序买家首页 / 分类页 / 进货车 / 我的
            首次进入时弹出的营销弹窗。支持主图、品牌徽标、文案、品牌行、主按钮，按页面分发。关闭后不再弹出。
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={addOne}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" /> 新增弹窗
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            保存全部
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="space-y-4">
        {list.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            暂无弹窗。点击右上「新增弹窗」开始配置。
          </div>
        )}
        {list.map((p, idx) => (
          <div
            key={p.id}
            className={`rounded-2xl border bg-white overflow-hidden ${
              p.is_active ? "border-primary/40 shadow-sm" : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs text-gray-400">
                  #{idx + 1}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    p.is_active
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {p.is_active ? "已启用" : "未启用"}
                </span>
                <span className="text-gray-500">
                  {PAGES.find((x) => x.value === p.page)?.label}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(idx, "up")}
                  disabled={idx === 0}
                  className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30"
                  title="上移"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => move(idx, "down")}
                  disabled={idx === list.length - 1}
                  className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30"
                  title="下移"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setPreviewId(previewId === p.id ? null : p.id)
                  }
                  className="p-1.5 rounded hover:bg-gray-200"
                  title="预览"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeOne(p.id)}
                  className="p-1.5 rounded hover:bg-red-50 text-red-500"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 p-4">
              {/* 左：表单 */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="投放页面">
                    <select
                      value={p.page}
                      onChange={(e) =>
                        update(p.id, { page: e.target.value as PopupPage })
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    >
                      {PAGES.map((pg) => (
                        <option key={pg.value} value={pg.value}>
                          {pg.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="排序">
                    <input
                      type="number"
                      value={p.sort_order}
                      onChange={(e) =>
                        update(p.id, {
                          sort_order: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </Field>
                </div>

                <Field label="顶部标题（弹窗最上方一行）">
                  <input
                    value={p.top_title}
                    onChange={(e) =>
                      update(p.id, { top_title: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    placeholder="如：新客首单4大福利 拿货赚钱快人一步"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="副标题 1（主图下方左）">
                    <input
                      value={p.subtitle_1}
                      onChange={(e) =>
                        update(p.id, { subtitle_1: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </Field>
                  <Field label="副标题 2（主图下方右）">
                    <input
                      value={p.subtitle_2}
                      onChange={(e) =>
                        update(p.id, { subtitle_2: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="品牌徽标文字">
                    <input
                      value={p.brand_label}
                      onChange={(e) =>
                        update(p.id, { brand_label: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </Field>
                  <Field label="徽标颜色">
                    <ColorInput
                      value={p.brand_label_color}
                      onChange={(v) =>
                        update(p.id, { brand_label_color: v })
                      }
                    />
                  </Field>
                </div>

                <Field label="品牌行（多输入框可逐个添加）">
                  <div className="space-y-1.5">
                    {p.brands.map((b, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <input
                          value={b}
                          onChange={(e) => updateBrand(p.id, i, e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                          placeholder="品牌名"
                        />
                        <button
                          onClick={() => removeBrand(p.id, i)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addBrand(p.id)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> 添加品牌
                    </button>
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="按钮文案">
                    <input
                      value={p.button_text}
                      onChange={(e) =>
                        update(p.id, { button_text: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </Field>
                  <Field label="按钮跳转路径">
                    <input
                      value={p.button_link}
                      onChange={(e) =>
                        update(p.id, { button_link: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      placeholder="/pages/xxx/index"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Field label="背景色">
                    <ColorInput
                      value={p.bg_color}
                      onChange={(v) => update(p.id, { bg_color: v })}
                    />
                  </Field>
                  <Field label="按钮色">
                    <ColorInput
                      value={p.button_color}
                      onChange={(v) => update(p.id, { button_color: v })}
                    />
                  </Field>
                  <Field label="文字色">
                    <ColorInput
                      value={p.text_color}
                      onChange={(v) => update(p.id, { text_color: v })}
                    />
                  </Field>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={p.is_active}
                    onChange={(e) =>
                      update(p.id, { is_active: e.target.checked })
                    }
                    className="rounded border-gray-300 text-primary focus:ring-primary/30"
                  />
                  {p.is_active ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                  启用此弹窗（前台首次进入对应页面时自动弹）
                </label>
              </div>

              {/* 右：主图上传 + 预览 */}
              <div className="space-y-3">
                <Field label="主图（建议 9:16 或 3:4 竖图）">
                  <div
                    className="relative aspect-[3/4] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center"
                    style={{
                      background: p.hero_image
                        ? `url(${p.hero_image}) center/cover`
                        : undefined,
                    }}
                  >
                    {p.hero_image ? (
                      <button
                        onClick={() => update(p.id, { hero_image: "" })}
                        className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80"
                        title="移除图片"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="text-center text-gray-400 text-sm">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        点击下方按钮上传
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => triggerUpload(p.id)}
                    disabled={uploadingId === p.id}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-60"
                  >
                    {uploadingId === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {p.hero_image ? "替换图片" : "上传图片"}
                  </button>
                </Field>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 预览弹窗 */}
      {previewing && <PopupPreview cfg={previewing} onClose={() => setPreviewId(null)} />}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-2 rounded-xl shadow-lg text-sm text-white ${
            toast.type === "success" ? "bg-green-600" : "bg-red-500"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-gray-200 cursor-pointer bg-transparent"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
      />
    </div>
  );
}

// 弹窗预览（仅管理员侧展示用）
function PopupPreview({ cfg, onClose }: { cfg: PopupConfig; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl overflow-hidden w-full max-w-[360px] shadow-2xl"
        style={{ background: cfg.bg_color, color: cfg.text_color }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50"
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-4 pt-4 pb-2 text-center font-semibold text-sm">
          {cfg.top_title}
        </div>

        <div className="relative aspect-[3/4] mx-3 my-2 rounded-xl overflow-hidden bg-black/20">
          {cfg.hero_image ? (
            <img
              src={cfg.hero_image}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50 text-sm">
              暂无主图
            </div>
          )}
          {cfg.brand_label && (
            <div
              className="absolute top-3 left-3 px-2 py-1 text-xs font-medium rounded bg-black/30 backdrop-blur-sm"
              style={{ color: cfg.brand_label_color }}
            >
              {cfg.brand_label}
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3 text-right">
            {cfg.subtitle_1 && (
              <div className="text-sm font-medium drop-shadow">
                {cfg.subtitle_1}
              </div>
            )}
            {cfg.subtitle_2 && (
              <div className="text-base font-bold drop-shadow mt-0.5">
                {cfg.subtitle_2}
              </div>
            )}
          </div>
        </div>

        {cfg.brands.length > 0 && (
          <div className="px-4 py-2 flex items-center justify-center gap-3 flex-wrap text-xs opacity-90">
            {cfg.brands.map((b, i) => (
              <span key={i}>
                {b}
                {i < cfg.brands.length - 1 ? "" : ""}
              </span>
            ))}
          </div>
        )}

        {cfg.button_text && (
          <div className="px-4 pb-5 pt-2 flex justify-center">
            <div
              className="px-6 py-2.5 rounded-full text-sm font-semibold shadow"
              style={{ background: cfg.button_color, color: cfg.bg_color }}
            >
              {cfg.button_text}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
