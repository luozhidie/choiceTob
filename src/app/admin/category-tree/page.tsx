"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Save, Loader2, RotateCcw, X, Code2, LayoutList,
} from "lucide-react";
import {
  DEFAULT_CATEGORY_TREE,
  type CategoryTreeConfig,
  type TreeLevel,
} from "@/lib/category-tree";

/* ── 可增删的标签编辑器：支持一次粘贴多个（逗号/换行分隔） ── */
function TagEditor({
  values, onChange, placeholder = "输入后回车添加，可粘贴多个用逗号分隔",
}: { values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState("");
  const add = () => {
    const parts = input.split(/[,，\n\t]/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...values];
    parts.forEach((p) => { if (!next.includes(p)) next.push(p); });
    onChange(next);
    setInput("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v, i) => (
          <span key={`${v}-${i}`} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-700">
            {v}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {values.length === 0 && <span className="text-xs text-gray-300">暂无选项</span>}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button onClick={add} className="px-3 py-2 rounded-lg bg-gray-800 text-white text-xs shrink-0">添加</button>
      </div>
      {values.length > 0 && (
        <button onClick={() => onChange([])} className="mt-1.5 text-[11px] text-gray-400 hover:text-red-500">清空全部</button>
      )}
    </div>
  );
}

function Collapse({
  title, desc, children, defaultOpen = false, badge,
}: { title: string; desc?: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-3 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-4 py-3.5 text-left">
        {open ? <span className="text-gray-400 shrink-0">▾</span> : <span className="text-gray-400 shrink-0">▸</span>}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            {title}
            {badge && <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-normal">{badge}</span>}
          </div>
          {desc && <div className="text-[11px] text-gray-400 mt-0.5">{desc}</div>}
        </div>
      </button>
      {open && <div className="px-4 pb-4 border-t border-gray-50 pt-3">{children}</div>}
    </div>
  );
}

export default function CategoryTreePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [cfg, setCfg] = useState<CategoryTreeConfig>(DEFAULT_CATEGORY_TREE);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");

  const categories = useMemo(
    () => (getLevel(cfg, "category")?.values) || [],
    [cfg]
  );

  useEffect(() => {
    fetch("/api/admin/category-tree", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.success && j.data) setCfg(j.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { if (jsonMode) setJsonText(JSON.stringify(cfg, null, 2)); }, [cfg, jsonMode]);

  const flash = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  };

  const getLevel = (c: CategoryTreeConfig, key: string): TreeLevel | undefined =>
    c.levels.find((l) => l.key === key);

  // 更新某层（market/vibe/category）的 values
  const setLevelValues = (key: string, values: string[]) =>
    setCfg((c) => ({
      ...c,
      levels: c.levels.map((l) => (l.key === key ? { ...l, values } : l)),
    }));

  // 更新风格层（按性别）
  const setStyleGender = (gender: "女" | "男", values: string[]) =>
    setCfg((c) => ({
      ...c,
      levels: c.levels.map((l) =>
        l.key === "style" ? { ...l, genders: { ...(l.genders || { 女: [], 男: [] }), [gender]: values } } : l
      ),
    }));

  // 更新明细层（按品类）
  const setSubcat = (category: string, values: string[]) =>
    setCfg((c) => ({
      ...c,
      levels: c.levels.map((l) =>
        l.key === "subcategory"
          ? { ...l, valuesByParent: { ...(l.valuesByParent || {}), [category]: values } }
          : l
      ),
    }));

  const save = async (payload?: CategoryTreeConfig) => {
    const body = payload || cfg;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/category-tree", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (j.error) throw new Error(j.error);
      flash("success", "已保存，前端 30 秒内生效");
    } catch (e: any) {
      flash("error", e.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const styleLevel = getLevel(cfg, "style");
  const subLevel = getLevel(cfg, "subcategory");

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800">商品分类树管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          配置商品分类的层级（市场 → 风情 → 风格 → 品类 → 明细）。后台上传商品时按这 5 层逐级归类，前端也能按任一层筛选。改完点底部保存，30 秒内生效。
        </p>
      </div>

      <div className="flex items-center justify-end mb-3 px-1">
        <button onClick={() => setJsonMode(!jsonMode)} className="flex items-center gap-1 text-xs text-gray-500">
          {jsonMode ? <LayoutList className="w-3.5 h-3.5" /> : <Code2 className="w-3.5 h-3.5" />}
          {jsonMode ? "回到可视化" : "高级(JSON)"}
        </button>
      </div>

      {jsonMode ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
            className="w-full h-[55vh] font-mono text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none"
          />
          <button
            onClick={() => {
              try {
                const parsed = JSON.parse(jsonText);
                setCfg(parsed);
                setJsonMode(false);
                flash("success", "已应用，记得保存");
              } catch (e: any) { flash("error", "JSON 格式错误：" + e.message); }
            }}
            className="mt-3 px-4 py-2 rounded-xl bg-gray-800 text-white text-sm"
          >
            应用到表单
          </button>
        </div>
      ) : (
        <>
          <Collapse title="第 1 层 · 市场" desc="货源市场，如十三行 / 沙河" badge={`${(getLevel(cfg, "market")?.values || []).length}项`} defaultOpen>
            <TagEditor values={getLevel(cfg, "market")?.values || []} onChange={(v) => setLevelValues("market", v)} />
          </Collapse>

          <Collapse title="第 2 层 · 风情" desc="整体调性，如法式复古 / 街头潮流" badge={`${(getLevel(cfg, "vibe")?.values || []).length}项`} defaultOpen>
            <TagEditor values={getLevel(cfg, "vibe")?.values || []} onChange={(v) => setLevelValues("vibe", v)} />
          </Collapse>

          <Collapse title="第 3 层 · 风格" desc="个人风格型，按女士 / 男士分组" badge={`${(styleLevel?.genders?.女.length || 0) + (styleLevel?.genders?.男.length || 0)}项`} defaultOpen>
            {(["女", "男"] as const).map((g) => (
              <div key={g} className="mb-3">
                <div className="text-xs text-gray-500 mb-1.5 font-medium">{g === "女" ? "女士风格" : "男士风格"}</div>
                <TagEditor
                  values={styleLevel?.genders?.[g] || []}
                  onChange={(v) => setStyleGender(g, v)}
                  placeholder="如：优雅型,少女偏浪漫（可粘贴多个）"
                />
              </div>
            ))}
          </Collapse>

          <Collapse title="第 4 层 · 品类" desc="大类，如 上装 / 下装 / 裙装" badge={`${(getLevel(cfg, "category")?.values || []).length}项`} defaultOpen>
            <TagEditor values={getLevel(cfg, "category")?.values || []} onChange={(v) => setLevelValues("category", v)} />
          </Collapse>

          <Collapse title="第 5 层 · 明细" desc="各品类下的具体款，按品类分组编辑" badge={`${categories.length}个品类`} defaultOpen>
            {categories.map((cat) => (
              <div key={cat} className="mb-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="text-xs text-gray-500 mb-1.5 font-medium">{cat}</div>
                <TagEditor
                  values={subLevel?.valuesByParent?.[cat] || []}
                  onChange={(v) => setSubcat(cat, v)}
                  placeholder={`${cat}下的明细，如：小衫,衬衫（可粘贴多个）`}
                />
              </div>
            ))}
          </Collapse>
        </>
      )}

      {/* 底部固定保存条 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 flex items-center gap-3 z-40">
        <button
          onClick={() => {
            if (!confirm("把整棵分类树重置为系统默认？")) return;
            setCfg(JSON.parse(JSON.stringify(DEFAULT_CATEGORY_TREE)));
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600"
        >
          <RotateCcw className="w-4 h-4" />重置
        </button>
        <button
          onClick={() => save()}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          保存分类树
        </button>
      </div>

      {toast && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl shadow-lg text-sm z-50 ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-500 text-white"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
