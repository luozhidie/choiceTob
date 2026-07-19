"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles, Save, UploadCloud, Layers, Package, TrendingUp, CheckCircle2,
  ChevronDown, ExternalLink, Trash2,
} from "lucide-react";

interface DraftCat {
  category: string;
  code: string;
  target_sku: number;
  retail_min: number; // 元
  retail_max: number;
  wholesale_min: number;
  wholesale_max: number;
  bulk_min: number;
  bulk_max: number;
  wave: string;
  note: string;
}

interface Draft {
  title: string;
  season: string;
  categories: DraftCat[];
  price_bands: any[];
  waves: any[];
}

interface PlanRow {
  id: string;
  title: string;
  season: string;
  status: string;
  categories: any[];
  total_sku: number;
  created_at: string;
  marketing: any;
}

interface ProgressItem {
  category: string;
  code: string;
  target_sku: number;
  uploaded: number;
  progress: number;
  retail_band: number[] | null;
  wholesale_band: number[] | null;
  bulk_band: number[] | null;
  avg_retail: number;
  avg_wholesale: number;
  avg_bulk: number;
  avg_cost: number;
  retail_ok: boolean;
  wholesale_ok: boolean;
  bulk_ok: boolean;
  margin_pct: number | null;
  wave: string;
  note: string;
}

/* —— AI 报告归一化为组货结构（复用 /api/generate-planning 输出）—— */
function parseRangeYuan(range: any): [number, number] | null {
  if (!range) return null;
  const nums = (String(range).match(/(\d+(?:\.\d+)?)/g) || [])
    .map(Number)
    .filter((n) => !isNaN(n));
  if (nums.length >= 2) return [Math.round(nums[0] * 100), Math.round(nums[1] * 100)];
  if (nums.length === 1) return [Math.round(nums[0] * 100), Math.round(nums[0] * 100)];
  return null;
}

function normalizeReport(report: any): Draft {
  const aa = report?.assortmentAdvice || {};
  const catDepth: any[] = Array.isArray(aa.categoryDepth) ? aa.categoryDepth : [];
  const pricePlan: any[] = Array.isArray(report?.pricePlan) ? report.pricePlan : [];
  let overall: [number, number] | null = null;
  pricePlan.forEach((p) => {
    const r = parseRangeYuan(p.range);
    if (r) {
      if (!overall) overall = r;
      else overall = [Math.min(overall[0], r[0]), Math.max(overall[1], r[1])];
    }
  });
  const retailBand = overall || [9900, 39900];
  const wholesaleBand: [number, number] = [
    Math.round(retailBand[0] * 0.5),
    Math.round(retailBand[1] * 0.5),
  ];
  const bulkBand: [number, number] = [
    Math.round(retailBand[0] * 0.45),
    Math.round(retailBand[1] * 0.45),
  ];
  const waves: any[] = Array.isArray(report?.waveCalendar) ? report.waveCalendar : [];
  const categories: DraftCat[] = catDepth
    .map((c, i) => ({
      category: String(c.category || "").trim(),
      code: "AI" + String(i + 1).padStart(2, "0"),
      target_sku: Number(c.skuCount) || 0,
      retail_min: Math.round(retailBand[0] / 100),
      retail_max: Math.round(retailBand[1] / 100),
      wholesale_min: Math.round(wholesaleBand[0] / 100),
      wholesale_max: Math.round(wholesaleBand[1] / 100),
      bulk_min: Math.round(bulkBand[0] / 100),
      bulk_max: Math.round(bulkBand[1] / 100),
      wave: waves.length ? waves[i % waves.length]?.theme || `第${i % waves.length + 1}波` : "",
      note: c.reason || "",
    }))
    .filter((c) => c.category);
  return {
    title: `${report?.season || "全年"}·${report?.brandName || "骆芷蝶智选"}组货方案`,
    season: report?.season || "",
    categories,
    price_bands: pricePlan,
    waves,
  };
}

function emptyDraft(): Draft {
  return { title: "", season: "", categories: [], price_bands: [], waves: [] };
}

export default function AssortmentAdmin() {
  const [gen, setGen] = useState({ brandName: "骆芷蝶智选", season: "2026春", priceBand: "199-399元", styleLabel: "", colorLabel: "", targetAge: "25-40岁", notes: "" });
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [draftId, setDraftId] = useState<string | null>(null);
  const [sourceReport, setSourceReport] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [progressOpen, setProgressOpen] = useState<string | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const flash = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3200);
  };

  const loadPlans = () => {
    fetch("/api/admin/assortment", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.success) setPlans(j.data || []); })
      .catch(() => {});
  };
  useEffect(() => { loadPlans(); }, []);

  const deletePlan = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("确定删除该组货方案？关联的专题页、首页横幅和促销活动会一并清理。商品不会被删除。")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/assortment", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      if (!j.success) {
        flash("err", "删除失败：" + (j.error || ""));
        return;
      }
      flash("ok", "已删除方案");
      setPlans((prev) => prev.filter((p) => p.id !== id));
      if (progressOpen === id) setProgressOpen(null);
    } catch (e: any) {
      flash("err", "删除异常：" + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const onGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(gen),
      });
      const j = await res.json();
      if (!j.report) {
        flash("err", "AI 规划生成失败：" + (j.error || "请检查 API Key"));
        return;
      }
      const d = normalizeReport(j.report);
      if (d.categories.length === 0) {
        flash("err", "规划未产出品类结构，请调整参数重试");
        return;
      }
      setDraft(d);
      setDraftId(null);
      setSourceReport(j.report);
    } catch (e: any) {
      flash("err", "生成异常：" + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const updateCat = (idx: number, patch: Partial<DraftCat>) => {
    setDraft((d) => ({
      ...d,
      categories: d.categories.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }));
  };

  const buildPayload = () => ({
    id: draftId || undefined,
    title: draft.title,
    season: draft.season,
    source: draftId ? undefined : "ai",
    status: "planned",
    price_bands: draft.price_bands,
    waves: draft.waves,
    source_report: sourceReport || undefined,
    categories: draft.categories.map((c) => ({
      category: c.category,
      code: c.code,
      target_sku: c.target_sku,
      retail_band: [c.retail_min * 100, c.retail_max * 100],
      wholesale_band: [c.wholesale_min * 100, c.wholesale_max * 100],
      bulk_band: [c.bulk_min * 100, c.bulk_max * 100],
      wave: c.wave,
      note: c.note,
    })),
  });

  const onSaveDraft = async (): Promise<string | null> => {
    if (!draft.title) { flash("err", "请填写方案标题"); return null; }
    if (draft.categories.length === 0) { flash("err", "请先生成或添加品类"); return null; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/assortment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(buildPayload()),
      });
      const j = await res.json();
      if (!j.success) { flash("err", "保存失败：" + (j.error || "")); return null; }
      setDraftId(j.data.id);
      flash("ok", "已保存草稿");
      return j.data.id;
    } catch (e: any) {
      flash("err", "保存异常：" + e.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const onPublish = async () => {
    let id = draftId;
    if (!id) {
      id = await onSaveDraft();
      if (!id) return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/assortment/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      if (!j.success) { flash("err", "写入商城失败：" + (j.error || "")); return; }
      flash("ok", `已写入商城（新增/匹配 ${j.createdCategories} 个品类）`);
      loadPlans();
    } catch (e: any) {
      flash("err", "写入异常：" + e.message);
    } finally {
      setSaving(false);
    }
  };

  const openProgress = (id: string) => {
    if (progressOpen === id) { setProgressOpen(null); setProgress(null); return; }
    setProgressOpen(id);
    setLoadingProgress(true);
    setProgress(null);
    fetch(`/api/public/assortment/${id}/progress`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setProgress(j.data); })
      .catch(() => {})
      .finally(() => setLoadingProgress(false));
  };

  const yuan = (n: number) => (n ? (n / 100).toFixed(2) : "0");

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Layers className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-gray-800">自动组货</h1>
      </div>
      <p className="text-sm text-gray-500 mb-5">AI 生成组货架构（品类+目标SKU+零售/批发/批量价带+波段）→ 一键写入商城分类树 → 照看板上传商品并追踪进度。</p>

      {msg && (
        <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm ${msg.type === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* 生成区 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> AI 生成组货方案</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><label className="block text-xs text-gray-500 mb-1">品牌名</label><input value={gen.brandName} onChange={(e) => setGen({ ...gen, brandName: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">季节</label><input value={gen.season} onChange={(e) => setGen({ ...gen, season: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如 2026春" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">主力价格带</label><input value={gen.priceBand} onChange={(e) => setGen({ ...gen, priceBand: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如 199-399元" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">风格定位</label><input value={gen.styleLabel} onChange={(e) => setGen({ ...gen, styleLabel: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">色系偏好</label><input value={gen.colorLabel} onChange={(e) => setGen({ ...gen, colorLabel: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">目标年龄</label><input value={gen.targetAge} onChange={(e) => setGen({ ...gen, targetAge: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
        </div>
        <div className="mt-3"><label className="block text-xs text-gray-500 mb-1">补充说明</label><textarea value={gen.notes} onChange={(e) => setGen({ ...gen, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
        <button onClick={onGenerate} disabled={generating} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
          {generating ? "生成中…" : "AI 生成组货方案"}
        </button>
      </div>

      {/* 预览编辑 */}
      {draft.categories.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">组货架构预览（可改）</h2>
            <span className="text-xs text-gray-400">共 {draft.categories.length} 品类 · 目标 {draft.categories.reduce((s, c) => s + (c.target_sku || 0), 0)} SKU</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="col-span-2 md:col-span-2"><label className="block text-xs text-gray-500 mb-1">方案标题</label><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">季节</label><input value={draft.season} onChange={(e) => setDraft({ ...draft, season: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <div className="flex items-end"><button onClick={() => setDraft(emptyDraft())} className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">清空</button></div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[920px]">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left p-2">品类</th>
                  <th className="text-left p-2">目标SKU</th>
                  <th className="text-left p-2">零售价带(元)</th>
                  <th className="text-left p-2">批发价带(元)</th>
                  <th className="text-left p-2">批量价带(元)</th>
                  <th className="text-left p-2">波段</th>
                  <th className="text-left p-2">备注</th>
                </tr>
              </thead>
              <tbody>
                {draft.categories.map((c, i) => (
                  <tr key={i} className="border-t border-gray-100 align-top">
                    <td className="p-2"><input value={c.category} onChange={(e) => updateCat(i, { category: e.target.value })} className="w-28 px-2 py-1 border border-gray-200 rounded text-xs" /></td>
                    <td className="p-2"><input type="number" value={c.target_sku} onChange={(e) => updateCat(i, { target_sku: Number(e.target.value) })} className="w-16 px-2 py-1 border border-gray-200 rounded text-xs" /></td>
                    <td className="p-2"><div className="flex items-center gap-1"><input type="number" value={c.retail_min} onChange={(e) => updateCat(i, { retail_min: Number(e.target.value) })} className="w-16 px-2 py-1 border border-gray-200 rounded text-xs" />&nbsp;~&nbsp;<input type="number" value={c.retail_max} onChange={(e) => updateCat(i, { retail_max: Number(e.target.value) })} className="w-16 px-2 py-1 border border-gray-200 rounded text-xs" /></div></td>
                    <td className="p-2"><div className="flex items-center gap-1"><input type="number" value={c.wholesale_min} onChange={(e) => updateCat(i, { wholesale_min: Number(e.target.value) })} className="w-16 px-2 py-1 border border-gray-200 rounded text-xs" />&nbsp;~&nbsp;<input type="number" value={c.wholesale_max} onChange={(e) => updateCat(i, { wholesale_max: Number(e.target.value) })} className="w-16 px-2 py-1 border border-gray-200 rounded text-xs" /></div></td>
                    <td className="p-2"><div className="flex items-center gap-1"><input type="number" value={c.bulk_min} onChange={(e) => updateCat(i, { bulk_min: Number(e.target.value) })} className="w-16 px-2 py-1 border border-gray-200 rounded text-xs" />&nbsp;~&nbsp;<input type="number" value={c.bulk_max} onChange={(e) => updateCat(i, { bulk_max: Number(e.target.value) })} className="w-16 px-2 py-1 border border-gray-200 rounded text-xs" /></div></td>
                    <td className="p-2"><input value={c.wave} onChange={(e) => updateCat(i, { wave: e.target.value })} className="w-20 px-2 py-1 border border-gray-200 rounded text-xs" /></td>
                    <td className="p-2"><input value={c.note} onChange={(e) => updateCat(i, { note: e.target.value })} className="w-28 px-2 py-1 border border-gray-200 rounded text-xs" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={onSaveDraft} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"><Save className="w-4 h-4" /> 保存草稿</button>
            <button onClick={onPublish} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"><UploadCloud className="w-4 h-4" /> 写入商城</button>
            {draftId && <span className="text-xs text-gray-400 self-center">草稿已存（{draftId.slice(0, 8)}）</span>}
          </div>
        </div>
      )}

      {/* 已发布方案 & 进度 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> 组货方案（{plans.length}）</h2>
        {plans.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">暂无方案，先用上方 AI 生成并写入商城</div>
        ) : (
          <div className="space-y-3">
            {plans.map((p) => (
              <div key={p.id} className="border border-gray-100 rounded-lg">
                <div onClick={() => openProgress(p.id)} className="cursor-pointer w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="font-medium text-gray-800">{p.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {p.season || "—"} · 目标 {p.total_sku} SKU · {p.categories?.length || 0} 品类 · {new Date(p.created_at).toLocaleDateString("zh-CN")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.status === "published" ? (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">已发布</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">草稿</span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => deletePlan(p.id, e)}
                      disabled={deletingId === p.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      title="删除方案"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${progressOpen === p.id ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {progressOpen === p.id && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    {p.marketing && p.status === "published" && (
                      <div className="py-4 border-b border-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-500">营销预览</span>
                          <Link href={`/assortment/${p.id}`} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded hover:bg-primary/20">看专题页</Link>
                        </div>
                        <div className="flex gap-3 items-start">
                          <img src={p.marketing.banner_image_url} alt="" className="w-24 h-14 object-cover rounded-lg border border-gray-100 bg-gray-50" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-800 text-sm">{p.marketing.headline}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{p.marketing.subheadline}</div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {p.marketing.selling_points?.slice(0, 3).map((s: string, i: number) => (
                                <span key={i} className="px-1.5 py-0.5 bg-orange-50 text-orange-700 text-[10px] rounded">{s}</span>
                              ))}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1">CTA：{p.marketing.cta}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {loadingProgress ? (
                      <div className="py-6 text-center text-gray-400 text-sm">加载进度…</div>
                    ) : progress ? (
                      <div>
                        <div className="flex items-center gap-3 my-3 text-sm">
                          <span className="text-gray-500">整体完成度</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${progress.overall_progress}%` }}></div>
                          </div>
                          <span className="font-medium text-gray-700">{progress.overall_progress}%</span>
                          <span className="text-xs text-gray-400">（{progress.total_uploaded}/{progress.total_target}）</span>
                        </div>
                        {progress.total_uploaded === 0 && (
                          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">
                            进度需要按品类上传商品后才会更新。点击每个品类右侧的「去上传」添加商品，该品类即会计入进度。
                          </div>
                        )}
                        <div className="space-y-2">
                          {progress.items.map((it: ProgressItem, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 text-sm border border-gray-50 rounded-lg px-3 py-2">
                              <div className="w-24 shrink-0 font-medium text-gray-700 truncate">{it.category}</div>
                              <div className="w-28 shrink-0 text-xs text-gray-500">
                                已传 {it.uploaded}/{it.target_sku}
                                {it.wave ? ` · ${it.wave}` : ""}
                              </div>
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full ${it.progress >= 100 ? "bg-green-500" : "bg-primary"}`} style={{ width: `${it.progress}%` }}></div>
                              </div>
                              <div className="w-10 text-right text-xs text-gray-500">{it.progress}%</div>
                              <div className="w-40 shrink-0 text-xs">
                                <span className="text-gray-400">零售¥{yuan(it.avg_retail)} </span>
                                <span className={it.wholesale_ok ? "text-green-600" : "text-amber-500"}>批¥{yuan(it.avg_wholesale)}</span>
                                {it.margin_pct != null && <span className="text-gray-400"> 毛利{it.margin_pct}%</span>}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Link href={`/admin/products?category=${encodeURIComponent(it.category)}`} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20">去上传</Link>
                                <Link href={`/category/${encodeURIComponent(it.category)}`} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 inline-flex items-center gap-0.5">查看<ExternalLink className="w-3 h-3" /></Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-gray-400 text-sm">无进度数据</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
