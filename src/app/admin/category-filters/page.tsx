"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Save, Loader2, RotateCcw, Plus, X, Trash2, ChevronDown, ChevronRight,
  Code2, LayoutList, Copy,
} from "lucide-react";
import {
  DEFAULT_CATEGORY_CONFIG,
  type Config,
  type CategoryFilterConfig,
  type FilterSection,
  type QuickFilter,
} from "@/lib/category-filters";

/* 新增分区时可一键套用的常用模板，省得一个个敲 */
const SECTION_TEMPLATES: { title: string; key: string; multiple?: boolean; type?: "tags" | "price"; options?: string[] }[] = [
  { title: "价格区间", key: "price_range", type: "price" },
  { title: "近期上新", key: "recent", options: ["今日上新", "近3日上新", "近7日上新"] },
  { title: "色系", key: "color_family", multiple: true, options: ["白色系", "黑色系", "灰色系", "红色系", "橙色系", "黄色系", "绿色系", "蓝色系", "紫色系", "棕色系", "花色系", "拼色", "金属色系", "其他"] },
  { title: "季节", key: "季节", multiple: true, options: ["春", "夏", "秋", "冬"] },
  { title: "版型", key: "版型", options: ["修身", "宽松", "直筒", "A字", "Oversize", "H型", "茧型"] },
  { title: "袖长", key: "袖长", options: ["无袖", "短袖", "五分袖", "七分袖", "长袖"] },
  { title: "领型", key: "领型", options: ["圆领", "V领", "翻领", "高领", "立领", "方领", "一字领"] },
  { title: "图案", key: "图案", multiple: true, options: ["纯色", "条纹", "格纹", "碎花", "卡通", "字母", "波点", "拼色", "动物纹", "植物"] },
  { title: "工艺", key: "工艺", multiple: true, options: ["印花", "绣花", "镂空", "抽褶", "压褶", "系带", "拼接/补丁", "水洗", "毛边", "假两件"] },
  { title: "服务", key: "service", options: ["24H发货", "慢必赔", "批量采购价", "搭配推荐", "实拍视频", "秒杀", "满减", "红包"] },
  { title: "热卖活动", key: "hot_activity", options: ["7日爆款", "档口爆款", "今日特价", "限量补贴"] },
];

const DEFAULT_SORTS = [
  { key: "default", label: "综合" },
  { key: "sales", label: "销量" },
  { key: "newest", label: "上新" },
  { key: "price_asc", label: "批发价" },
];

const DEFAULT_QUICK: QuickFilter[] = [
  { key: "subscribed_stall", label: "订阅的风格", type: "toggle" },
  { key: "is_special", label: "特价", type: "toggle" },
  { key: "in_stock", label: "现货", type: "toggle" },
  { key: "source_brand", label: "源头厂牌", type: "toggle" },
  { key: "bulk_price", label: "批量采购价", type: "toggle" },
  { key: "sizes", label: "尺码", type: "popup", options: ["XS", "S", "M", "L", "XL", "XXL", "均码"] },
  { key: "fabrics", label: "面料", type: "popup", options: ["棉", "麻", "丝", "毛", "化纤", "混纺", "牛仔"] },
];

const optStr = (o: any) => (typeof o === "string" ? o : o?.value || o?.label || "");

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
        {open ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
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

export default function CategoryFiltersPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [cfg, setCfg] = useState<Config>(DEFAULT_CATEGORY_CONFIG);
  const [active, setActive] = useState<string>(Object.keys(DEFAULT_CATEGORY_CONFIG)[0]);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");

  const categories = useMemo(() => Object.keys(cfg), [cfg]);
  const cur: CategoryFilterConfig = cfg[active] || {};

  useEffect(() => {
    fetch("/api/admin/category-filters", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) {
          const merged: Config = { ...DEFAULT_CATEGORY_CONFIG, ...j.data };
          setCfg(merged);
          if (!merged[active]) setActive(Object.keys(merged)[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { setJsonText(JSON.stringify(cur, null, 2)); }, [active, jsonMode]);

  const patch = (p: Partial<CategoryFilterConfig>) =>
    setCfg((c) => ({ ...c, [active]: { ...(c[active] || {}), ...p } }));

  const flash = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  };

  const save = async (payload?: Config) => {
    const body = payload || cfg;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/category-filters", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (j.error) throw new Error(j.error);
      flash("success", "已保存，小程序 30 秒内生效");
    } catch (e: any) {
      flash("error", e.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  /* ── 品类增删 ── */
  const addCategory = () => {
    const name = prompt("新品类名称（要和商品的「品类」字段完全一致，例如：连衣裙）");
    if (!name || !name.trim()) return;
    const n = name.trim();
    if (cfg[n]) { flash("error", `「${n}」已存在`); return; }
    const tpl = cfg[active] || DEFAULT_CATEGORY_CONFIG["女装"];
    setCfg({ ...cfg, [n]: JSON.parse(JSON.stringify(tpl)) });
    setActive(n);
    flash("success", `已新增「${n}」，配置复制自「${active}」，改完记得保存`);
  };

  const removeCategory = () => {
    if (categories.length <= 1) { flash("error", "至少保留一个品类"); return; }
    if (!confirm(`删除品类「${active}」的筛选配置？商品数据不受影响。`)) return;
    const next = { ...cfg };
    delete next[active];
    setCfg(next);
    setActive(Object.keys(next)[0]);
  };

  /* ── 快捷筛选 ── */
  const quick = cur.quickFilters || [];
  const setQuick = (q: QuickFilter[]) => patch({ quickFilters: q });
  const updQuick = (i: number, p: Partial<QuickFilter>) =>
    setQuick(quick.map((q, j) => (j === i ? { ...q, ...p } : q)));

  /* ── 抽屉分区 ── */
  const sections = cur.filterPanel?.sections || [];
  const setSections = (s: FilterSection[]) => patch({ filterPanel: { ...(cur.filterPanel || {}), sections: s } });
  const updSection = (i: number, p: Partial<FilterSection>) =>
    setSections(sections.map((s, j) => (j === i ? { ...s, ...p } : s)));

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800">分类筛选项管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          这里配置小程序里「选品页 / 货架 / 专场」的筛选条件。改完点底部保存，30 秒内生效，不用重新上传小程序。
        </p>
      </div>

      {/* 品类切换 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs text-gray-400">选择品类（共 {categories.length} 个）</span>
          <div className="flex gap-2">
            <button onClick={addCategory} className="flex items-center gap-1 text-xs text-primary font-medium">
              <Plus className="w-3.5 h-3.5" />新增品类
            </button>
            <button onClick={removeCategory} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" />删除
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-3 py-2 rounded-xl text-sm transition ${
                active === cat ? "bg-primary text-white font-semibold" : "bg-gray-50 text-gray-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 模式切换 */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-sm font-semibold text-gray-700">正在编辑：{active}</span>
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
                setCfg({ ...cfg, [active]: parsed });
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
          {/* 1. 排序 */}
          <Collapse title="第一行 · 排序" desc="综合 / 销量 / 上新 / 批发价，一般不用改" badge={`${(cur.sorts || DEFAULT_SORTS).length}项`}>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(cur.sorts || DEFAULT_SORTS).map((s) => (
                <span key={s.key} className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">
                  {s.label} <span className="text-gray-300">{s.key}</span>
                </span>
              ))}
            </div>
            <button onClick={() => patch({ sorts: DEFAULT_SORTS })} className="text-xs text-gray-500 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" />恢复默认排序
            </button>
          </Collapse>

          {/* 2. 快捷筛选 */}
          <Collapse title="第二行 · 快捷筛选" desc="商品列表上方那排小圆标签" badge={`${quick.length}项`} defaultOpen>
            {quick.map((q, i) => (
              <div key={i} className="mb-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={q.label}
                    onChange={(e) => updQuick(i, { label: e.target.value })}
                    placeholder="显示名"
                    className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                  <select
                    value={q.type || "toggle"}
                    onChange={(e) => updQuick(i, { type: e.target.value as any })}
                    className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                  >
                    <option value="toggle">开关</option>
                    <option value="popup">弹窗多选</option>
                  </select>
                  <button onClick={() => setQuick(quick.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  value={q.key}
                  onChange={(e) => updQuick(i, { key: e.target.value })}
                  placeholder="字段名 key"
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-500 mb-2"
                />
                {q.type === "popup" && (
                  <TagEditor
                    values={(q.options || []).map(optStr)}
                    onChange={(v) => updQuick(i, { options: v })}
                    placeholder="弹窗里的选项，可粘贴多个用逗号分隔"
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={() => setQuick([...quick, { key: "new_filter", label: "新筛选", type: "toggle" }])}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-dashed border-gray-300 text-xs text-gray-500"
              >
                <Plus className="w-3.5 h-3.5" />加一项
              </button>
              <button
                onClick={() => setQuick(JSON.parse(JSON.stringify(DEFAULT_QUICK)))}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-500"
              >
                <RotateCcw className="w-3.5 h-3.5" />恢复默认7项
              </button>
            </div>
          </Collapse>

          {/* 3. 品类小标签 */}
          <Collapse title="第三行 · 品类标签" desc="再下面一排，点了只看该子品类" badge={`${(cur.subCategories || []).length}项`}>
            <TagEditor
              values={cur.subCategories || []}
              onChange={(v) => patch({ subCategories: v })}
              placeholder="如：上装,下装,裙装（可一次粘贴多个）"
            />
          </Collapse>

          {/* 4. 全部筛选抽屉 */}
          <Collapse title="全部筛选抽屉" desc="点右上角「筛选」弹出的大面板" badge={`${sections.length}个分区`} defaultOpen>
            {sections.map((s, i) => (
              <div key={i} className="mb-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={s.title}
                    onChange={(e) => updSection(i, { title: e.target.value })}
                    placeholder="分区标题"
                    className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium"
                  />
                  <button onClick={() => setSections(sections.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={s.key}
                    onChange={(e) => updSection(i, { key: e.target.value })}
                    placeholder="字段名 key"
                    className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-500"
                  />
                  <select
                    value={s.type === "price" ? "price" : "tags"}
                    onChange={(e) => updSection(i, { type: e.target.value as any })}
                    className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                  >
                    <option value="tags">标签</option>
                    <option value="price">价格区间</option>
                  </select>
                  {s.type !== "price" && (
                    <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                      <input type="checkbox" checked={!!s.multiple} onChange={(e) => updSection(i, { multiple: e.target.checked })} />
                      多选
                    </label>
                  )}
                </div>
                {s.type !== "price" && (
                  <TagEditor values={(s.options || []).map(optStr)} onChange={(v) => updSection(i, { options: v })} />
                )}
              </div>
            ))}

            <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <div className="text-xs text-gray-600 mb-2 font-medium">从模板快速添加分区</div>
              <div className="flex flex-wrap gap-1.5">
                {SECTION_TEMPLATES.filter((t) => !sections.some((s) => s.key === t.key)).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setSections([...sections, JSON.parse(JSON.stringify(t))])}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600"
                  >
                    <Plus className="w-3 h-3" />{t.title}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSections([...sections, { title: "新分区", key: "new_section", options: [] }])}
                className="mt-2 flex items-center gap-1 text-xs text-primary"
              >
                <Plus className="w-3.5 h-3.5" />自定义一个新分区
              </button>
            </div>
          </Collapse>

          {/* 复制到其他品类 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
              <Copy className="w-4 h-4 text-gray-400" />把当前配置复制给别的品类
            </div>
            <p className="text-[11px] text-gray-400 mb-2">配好一个品类后，一键套用到其他品类，不用重复配</p>
            <div className="flex flex-wrap gap-1.5">
              {categories.filter((c) => c !== active).map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    if (!confirm(`把「${active}」的配置覆盖到「${c}」？`)) return;
                    setCfg({ ...cfg, [c]: JSON.parse(JSON.stringify(cur)) });
                    flash("success", `已复制到「${c}」，记得保存`);
                  }}
                  className="px-2.5 py-1.5 bg-gray-50 rounded-lg text-xs text-gray-600"
                >
                  → {c}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 底部固定保存条 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 flex items-center gap-3 z-40">
        <button
          onClick={() => {
            if (!confirm(`把「${active}」重置为系统默认配置？`)) return;
            const d = DEFAULT_CATEGORY_CONFIG[active];
            if (!d) { flash("error", "该品类没有系统默认配置"); return; }
            setCfg({ ...cfg, [active]: JSON.parse(JSON.stringify(d)) });
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
          保存全部品类
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
