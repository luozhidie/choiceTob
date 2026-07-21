"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, RotateCcw } from "lucide-react";
import { DEFAULT_CATEGORY_CONFIG, type Config } from "@/lib/category-filters";

const CATEGORIES = Object.keys(DEFAULT_CATEGORY_CONFIG);

function pretty(json: any) {
  return JSON.stringify(json, null, 2);
}

export default function CategoryFiltersPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [cfg, setCfg] = useState<Config>(DEFAULT_CATEGORY_CONFIG);
  const [active, setActive] = useState<string>(CATEGORIES[0]);
  const [text, setText] = useState<string>(pretty(DEFAULT_CATEGORY_CONFIG[CATEGORIES[0]]));
  const [errorPos, setErrorPos] = useState<string>("");

  useEffect(() => {
    fetch("/api/admin/category-filters", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) {
          const merged: Config = { ...DEFAULT_CATEGORY_CONFIG, ...j.data };
          setCfg(merged);
          setText(pretty(merged[active]));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setText(pretty(cfg[active] || DEFAULT_CATEGORY_CONFIG[active]));
    setErrorPos("");
  }, [active, cfg]);

  const parse = (): { ok: true; data: Config } | { ok: false; err: string } => {
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object") return { ok: false, err: "配置必须是对象" };
      return { ok: true, data: { ...cfg, [active]: parsed } };
    } catch (e: any) {
      return { ok: false, err: e.message || "JSON 格式错误" };
    }
  };

  const save = async () => {
    const parsed = parse();
    if (!parsed.ok) {
      setToast({ type: "error", msg: parsed.err });
      setErrorPos(parsed.err);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/category-filters", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const j = await res.json();
      if (j.error) throw new Error(j.error);
      setCfg(parsed.data);
      setToast({ type: "success", msg: `${active} 筛选项已保存` });
      setErrorPos("");
    } catch (e: any) {
      setToast({ type: "error", msg: e.message || "保存失败" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2500);
    }
  };

  const reset = () => {
    if (confirm(`确定把「${active}」重置为默认配置？当前修改会丢失。`)) {
      const next = { ...cfg, [active]: DEFAULT_CATEGORY_CONFIG[active] };
      setCfg(next);
      setText(pretty(next[active]));
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
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">分类筛选项管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            按品类自定义小程序分类结果页的三行筛选、全部筛选抽屉、尺码/面料弹窗。配置为 JSON 格式，保存后即时生效。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4" /> 重置默认
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存
          </button>
        </div>
      </div>

      <div className="flex gap-5">
        {/* 品类列表 */}
        <div className="w-44 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <div className="text-xs text-gray-400 mb-2 px-2">选择品类</div>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition ${
                active === cat
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 编辑器 */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">{active} 配置</h2>
            {errorPos && <span className="text-xs text-red-500">{errorPos}</span>}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            className="w-full h-[60vh] font-mono text-sm p-4 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <p>字段说明：</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li><b>sorts</b>：顶部第一行排序项（综合/销量/上新/批发价）</li>
              <li><b>quickFilters</b>：第二行快捷筛选，type 可选 toggle（开关）或 popup（弹窗），popup 需配 options</li>
              <li><b>subCategories</b>：第三行品类货品面料分类小图标签</li>
              <li><b>filterPanel.sections</b>：点击「筛选」后抽屉里的全部筛选项，type 默认 tags，价格区间用 price</li>
            </ul>
          </div>
        </div>
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
