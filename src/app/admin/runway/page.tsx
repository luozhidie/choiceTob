"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, Loader2, RefreshCw, CheckCircle2, Plus, X, Film } from "lucide-react";

const SEASON_PARTS = ["春夏", "夏秋", "秋冬", "冬春", "全年"];
const PRESET_YEARS = ["2026", "2027", "2028"];
const BRANDS = [
  "香奈儿", "迪奥", "古驰", "普拉达", "路易威登", "爱马仕",
  "圣罗兰", "巴黎世家", "芬迪", "思琳", "罗意威", "博柏利",
  "江南布衣", "之禾", "例外",
];

function Chip({ label, color, onRemove }: { label: string; color?: string; onRemove?: () => void }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs mr-1 mb-1"
      style={{ background: color || "#eef2ff", color: color ? "#fff" : "#3730a3" }}
    >
      {label}
      {onRemove && (
        <button type="button" onClick={onRemove} className="ml-1 hover:opacity-70">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

export default function RunwayPage() {
  const supabase = createClient();
  const [seasonPart, setSeasonPart] = useState("春夏");
  const [year, setYear] = useState("2027");
  const season = `${year} ${seasonPart}`;
  const [selected, setSelected] = useState<string[]>(BRANDS);
  const [customBrand, setCustomBrand] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [existing, setExisting] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  const loadExisting = async (s: string) => {
    const { data } = await supabase
      .from("brand_runway_trends")
      .select("brand, dominant_colors, dominant_styles, key_silhouettes, themes, summary, videos, collected_at")
      .eq("season", s)
      .order("collected_at", { ascending: false });
    setExisting(data || []);
  };

  useEffect(() => { loadExisting(season); }, [season]);

  const toggle = (b: string) =>
    setSelected((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  const addCustom = () => {
    const names = customBrand.split(/[，,\s]+/).map((s) => s.trim()).filter(Boolean);
    if (names.length === 0) return;
    setSelected((prev) => Array.from(new Set([...prev, ...names])));
    setCustomBrand("");
  };

  const collect = async () => {
    if (selected.length === 0) { setMsg("请至少选择一个品牌"); return; }
    if (!/^\d{4}$/.test(year)) { setMsg("年份格式不正确（如 2027）"); return; }
    setLoading(true); setMsg(""); setResult(null);
    try {
      const res = await fetch("/api/planning/runway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ season, brands: selected }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg("采集失败：" + (data.error || res.status)); setLoading(false); return; }
      setResult(data);
      setMsg(`✅ 已采集 ${data.brands?.length || 0} 个品牌的 ${season} 发布会趋势`);
      await loadExisting(season);
    } catch (e: any) {
      setMsg("采集失败：" + e.message);
    }
    setLoading(false);
  };

  const brandsToShow = result?.brands || existing;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" /> 一线品牌发布会趋势采集
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          抓取各品牌时装周/发布会信号（主色·风格·廓形·主题·秀场视频），存入数据库并可融入 AI 商品企划。
        </p>
      </div>

      {/* 设置区 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* 季节 + 自定义年份 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">季节</label>
            <div className="flex flex-wrap gap-2">
              {SEASON_PARTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSeasonPart(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    seasonPart === p ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-50 text-gray-600 border-gray-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">年份（自定义）</label>
            <input
              type="text"
              inputMode="numeric"
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
              placeholder="如 2027"
            />
            <div className="flex gap-2 mt-2">
              {PRESET_YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  className={`px-3 py-1 rounded-full text-xs border ${
                    year === y ? "bg-indigo-100 text-indigo-700 border-indigo-300" : "bg-gray-50 text-gray-500 border-gray-200"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400">当前目标季节：<b>{season}</b></p>

        {/* 品牌 + 自定义品牌 */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">采集品牌（默认一线品牌，可取消勾选）</label>
          <div className="flex flex-wrap gap-2">
            {BRANDS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => toggle(b)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selected.includes(b)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={customBrand}
              onChange={(e) => setCustomBrand(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm"
              placeholder="添加自定义品牌（多个用空格/逗号分隔，如：MaxMara MiuMiu）"
            />
            <button
              type="button"
              onClick={addCustom}
              className="px-4 py-2 rounded-xl bg-gray-800 text-white text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> 添加
            </button>
          </div>

          {selected.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-gray-400 mb-1">已选 {selected.length} 个：</div>
              {selected.map((b) => (
                <Chip key={b} label={b} onRemove={() => toggle(b)} />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={collect}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> 采集中（约数十秒，按品牌并行搜索）…</> : <><RefreshCw className="w-4 h-4" /> 采集 {season} 秀场趋势</>}
        </button>
        {msg && <p className="text-sm text-indigo-700">{msg}</p>}
      </div>

      {/* 整体汇总 */}
      {result?.overall && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-3">整体秀场信号（{result.brands?.length} 个品牌汇总）</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500 mb-1">高频主色</div>
              {(result.overall.topColors || []).map((c: string) => <Chip key={c} label={c} />)}
            </div>
            <div>
              <div className="text-gray-500 mb-1">主导风格</div>
              {(result.overall.topStyles || []).map((s: string) => <Chip key={s} label={s} />)}
            </div>
            <div>
              <div className="text-gray-500 mb-1">关键廓形</div>
              {(result.overall.topSilhouettes || []).map((s: string) => <Chip key={s} label={s} />)}
            </div>
          </div>
        </div>
      )}

      {/* 品牌明细 */}
      {brandsToShow && brandsToShow.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-800">
            {result ? "本次采集明细" : `已采集记录（${season}）`}
          </h2>
          {brandsToShow.map((b: any, i: number) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-gray-800">{b.brand}</span>
              </div>
              {b.summary && <p className="text-sm text-gray-600 mb-2">{b.summary}</p>}
              <div className="text-xs text-gray-400 mb-1">主色</div>
              <div className="mb-2">{(b.dominant_colors || []).map((c: string) => <Chip key={c} label={c} />)}</div>
              <div className="text-xs text-gray-400 mb-1">风格</div>
              <div className="mb-2">{(b.dominant_styles || []).map((s: string) => <Chip key={s} label={s} />)}</div>
              <div className="text-xs text-gray-400 mb-1">廓形</div>
              <div className="mb-2">{(b.key_silhouettes || []).map((s: string) => <Chip key={s} label={s} />)}</div>
              <div className="text-xs text-gray-400 mb-1">主题</div>
              <div className="mb-2">{(b.themes || []).map((t: string) => <Chip key={t} label={t} color="#fce7f3" />)}</div>
              {(b.videos && b.videos.length > 0) && (
                <div>
                  <div className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Film className="w-3 h-3" /> 秀场视频</div>
                  <div className="space-y-1">
                    {b.videos.map((v: any, vi: number) => (
                      <a
                        key={vi}
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-indigo-600 hover:underline truncate"
                      >
                        ▶ {v.title} {v.platform ? `（${v.platform}）` : ""}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!brandsToShow?.length && !loading && (
        <p className="text-sm text-gray-400 text-center py-8">
          该季节暂无采集记录，选择品牌后点击「采集」即可。
        </p>
      )}
    </div>
  );
}
