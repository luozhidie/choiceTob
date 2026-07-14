"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ShoppingBag, Download, Save, Calculator,
  Trash2, Plus, Layers, Calendar, BarChart3,
  ShoppingCart, Sparkles, FileText, Image,
  Search, Loader2,
} from "lucide-react";
import {
  FEMALE_STYLES, MALE_STYLES, COLOR_SEASONS_PRO,
  getStyleProLabel,
  STYLE_DETAILS, STYLE_LEAN, getStyleCombos, formatStyleCombo,
} from "@/lib/styles";
import { useCategories } from "@/lib/useCategories";
import * as XLSX from "xlsx";

/* ── 12 季型 ─────────────────────────────── */
const SEASON_TYPES = [
  "light_warm", "warm_bright", "clear_warm",
  "light_cool", "soft_cool", "cool_soft",
  "warm_soft", "soft_warm", "deep_warm",
  "clear_cool", "cool_bright", "deep_cool",
];

/* ── 全部风格（行头）──────────────── */
const ALL_STYLES: any[] = [
  ...FEMALE_STYLES.map((s) => ({ ...s, group: "女士" })),
  ...MALE_STYLES.map((s) => ({ ...s, group: "男士" })),
];

/* ── 品类选项（从 useCategories hook 动态读取）── */

/* ── 类型定义 ─────────────────────────────── */
interface StructureItem {
  category: string;
  pct: number;
  sku: number;
  margin: number;
  sales: number;
  season: string;
}

interface WaveItem {
  wave: number;
  date: string;
  pct: number;
  sku: number;
  amount: number;
  categories: string[];
  seasonFocus: string[];
  styleFocus: string[];
  activity: string;
}

// 秋冬上架主题（与商品上传页「上架主题」保持一致）
const AW_THEMES = ["美拉德风", "新中式", "老钱风·静奢", "通勤极简", "新年战袍", "圣诞派对"];

interface AWThemeWave {
  wave: number;
  theme: string;
  date: string;
  pct: number; // 占秋冬总额比例%
  sku: number;
  amount: number;
  categories: string[];
  styleFocus: string[];
  activity: string;
  colorTone: string; // 主色调
}

/* ── AI 企划报告类型 ─────────────────────── */
interface StylePlanItem {
  mainStyle: string;
  subStyle: string;
  styleCombo: string;
  gender: string;
  occasions: string[];
  vibe: string[];
  trafficRatio: string;
  profitRatio: string;
}

interface AIReport {
  brandName: string;
  season: string;
  summary: string;
  colorPlan: { type: string; ratio: string; colors: string[] }[];
  stylePlan: StylePlanItem[];
  productStructure: { type: string; ratio: string; desc: string }[];
  pricePlan: { band: string; range: string; ratio: string; strategy: string }[];
  quartersPlan: { phase: string; items: string[] }[];
  imageKeywords?: {
    colorImages: string[];
    styleImages: string[];
    waveImages: { wave: number; keywords: string[] }[];
  };
}

/* ── Google 图片搜索链接生成 ── */
const googleImageSearchUrl = (keyword: string) =>
  `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(keyword)}`;

/* ── 关键词搜索链接组件 ── */
function KeywordLink({ keyword, index }: { keyword: string; index?: number }) {
  return (
    <a
      href={googleImageSearchUrl(keyword)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-orange-300 rounded-lg text-xs text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-all shadow-sm"
      title={`点击在 Google 图片搜索「${keyword}」`}
    >
      <Search className="w-3 h-3" />
      {index !== undefined ? `${index + 1}. ` : ""}{keyword}
      <span className="text-orange-400 ml-1">↗</span>
    </a>
  );
}

/* ── 风格矩阵组件：主风格 × 偏风格（组货/陈列/销售参考）── */
function StyleMatrix({ gender }: { gender: "女士" | "男士" }) {
  const styles = gender === "女士" ? FEMALE_STYLES : MALE_STYLES;
  const combos = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    getStyleCombos(gender).forEach((c) => {
      if (!map[c.main]) map[c.main] = {};
      map[c.main][c.lean] = c;
    });
    return map;
  }, [gender]);

  const badge = (common: string) => {
    if (common === "纯风格") return "bg-gray-200 text-gray-600";
    if (common === "常见") return "bg-green-50 text-green-700 ring-1 ring-green-200";
    return "bg-amber-50 text-amber-600 ring-1 ring-amber-200";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 overflow-x-auto">
      <table className="w-full text-xs text-center border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-2 border border-gray-200 min-w-[96px] sticky left-0 bg-gray-50 z-10">主风格 ＼ 偏风格</th>
            {styles.map((s) => (
              <th key={s.value} className="p-2 border border-gray-200 min-w-[78px]">
                <div>{STYLE_DETAILS[s.value as string]?.proLabel}</div>
                <div className="text-gray-400 text-[10px]">{STYLE_DETAILS[s.value as string]?.line || "—"}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {styles.map((row) => (
            <tr key={row.value}>
              <td className="p-2 border border-gray-200 font-semibold bg-gray-50 text-left pl-2 sticky left-0 z-10">
                {STYLE_DETAILS[row.value as string]?.proLabel}
                <div className="text-gray-400 text-[10px] font-normal">{STYLE_DETAILS[row.value as string]?.line || "—"}</div>
              </td>
              {styles.map((col) => {
                const c = combos[row.value]?.[col.value];
                const isDiag = row.value === col.value;
                return (
                  <td key={col.value} className={`p-1 border border-gray-200 align-middle ${isDiag ? "bg-gray-100" : ""}`}>
                    {c ? (
                      <span title={c.combo} className={`inline-block px-2 py-1 rounded-full text-[10px] ${badge(c.common)}`}>
                        {c.common === "纯风格" ? "纯" : c.common}
                      </span>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── 风格特征速查表（组货/陈列/销售落地参考）── */
function StyleDetailTable() {
  const all = [...FEMALE_STYLES, ...MALE_STYLES];
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="p-2 border border-gray-200">主风格</th>
            <th className="p-2 border border-gray-200">线条</th>
            <th className="p-2 border border-gray-200">廓形</th>
            <th className="p-2 border border-gray-200">面料</th>
            <th className="p-2 border border-gray-200">图案</th>
            <th className="p-2 border border-gray-200">适用场合</th>
            <th className="p-2 border border-gray-200">避雷</th>
          </tr>
        </thead>
        <tbody>
          {all.map((s) => {
            const d = STYLE_DETAILS[s.value as string];
            if (!d) return null;
            return (
              <tr key={s.value} className="border-t border-gray-100 align-top">
                <td className="p-2 font-semibold whitespace-nowrap">{d.proLabel}<div className="text-gray-400 text-[10px] font-normal">{d.market}</div></td>
                <td className="p-2 whitespace-nowrap">{d.line || "—"}</td>
                <td className="p-2">{d.silhouette}</td>
                <td className="p-2">{d.fabric}</td>
                <td className="p-2">{d.pattern}</td>
                <td className="p-2">{d.occasion}</td>
                <td className="p-2 text-red-500/80">{d.avoid}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ProductPlanPage() {
  const supabase = createClient();
  const { categories: categoryOptions } = useCategories();
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "manual" | "matrix">("ai");

  // ── AI 生成相关状态 ──────────────────
  const [aiForm, setAiForm] = useState({
    brandName: "",
    season: "2026夏季",
    colorPref: "",
    colorLabel: "",
    marketStyle: "",
    styleLabel: "",
    priceBand: "199-399元",
    targetAge: "25-40岁",
    shopSize: "60-100㎡",
    notes: "",
  });
  const [generating, setGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [aiSource, setAiSource] = useState<string>("");
  const [exportingWord, setExportingWord] = useState(false);
  const [exportingKeywords, setExportingKeywords] = useState(false);

  /* ── 色系选项 ─────────────────────── */
  const COLOR_SEASON_OPTIONS: { value: string; label: string }[] = COLOR_SEASONS_PRO.map((c) => ({
    value: String(c.value),
    label: `${String(c.label)}（${String(c.group)}）`,
  }));

  /* ── 风格选项 ─────────────────────── */
  const STYLE_OPTIONS: { value: string; label: string }[] = [
    ...FEMALE_STYLES.map((s: any) => ({ value: String(s.value), label: `${s.proLabel || s.label}（女士）` })),
    ...MALE_STYLES.map((s: any) => ({ value: String(s.value), label: `${s.proLabel || s.label}（男士）` })),
  ];

  /* ── 专业术语 → value 反查（用于从报告里的风格名取特征）── */
  const proToValue = useMemo(() => {
    const m: Record<string, string> = {};
    for (const [k, v] of Object.entries(STYLE_DETAILS)) m[v.proLabel] = k;
    return m;
  }, []);

  // ── 商品结构规划 ────────────────────────
  const [structure, setStructure] = useState<StructureItem[]>([
    { category: "TX-T恤针织衫", pct: 15, sku: 30, margin: 55, sales: 90000, season: "春夏/秋冬" },
    { category: "DY-大衣", pct: 15, sku: 15, margin: 65, sales: 120000, season: "秋冬" },
    { category: "YR-羽绒服（真毛领）", pct: 12, sku: 12, margin: 60, sales: 108000, season: "秋冬" },
    { category: "KZ-裤装（仔裤/西裤/休闲裤/牛仔外套）", pct: 10, sku: 20, margin: 55, sales: 60000, season: "全年" },
    { category: "LQ-连衣裙", pct: 8, sku: 15, margin: 65, sales: 50000, season: "春夏" },
    { category: "FY-风衣/外套/单西装", pct: 10, sku: 10, margin: 65, sales: 70000, season: "秋冬" },
    { category: "MS-毛衫（上衣/连衣裙）", pct: 8, sku: 15, margin: 60, sales: 48000, season: "秋冬" },
    { category: "MF-棉服", pct: 5, sku: 8, margin: 55, sales: 35000, season: "秋冬" },
    { category: "WY-卫衣", pct: 5, sku: 10, margin: 55, sales: 30000, season: "秋冬" },
    { category: "SZ-梭织上装（小衫/打底衫）", pct: 4, sku: 10, margin: 60, sales: 24000, season: "全年" },
    { category: "MJ-马甲（羊绒/毛呢时尚款）", pct: 3, sku: 8, margin: 60, sales: 20000, season: "秋冬" },
    { category: "TZ-套装（1套1-2件）", pct: 2, sku: 5, margin: 65, sales: 15000, season: "全年" },
    { category: "KL-夹克衫", pct: 2, sku: 5, margin: 60, sales: 12000, season: "秋冬" },
    { category: "BQ-半身裙", pct: 1, sku: 7, margin: 60, sales: 8000, season: "春夏/秋冬" },
  ]);

  // ── 96 格矩阵数据 ────────────────────────
  // matrix[seasonType][styleValue] = { sku, pct, budget }
  const [matrix, setMatrix] = useState<Record<string, any>>(() => {
    const m: Record<string, any> = {};
    SEASON_TYPES.forEach((s) => {
      m[s] = {};
      ALL_STYLES.forEach((st) => {
        m[s][st.value] = { sku: 0, pct: 0, budget: 0 };
      });
    });
    return m;
  });

  // ── 波段计划 ────────────────────────────
  const [waves, setWaves] = useState<WaveItem[]>([
    { wave: 1, date: "2月第1周", pct: 15, sku: 30, amount: 150000, categories: ["春装上衣", "裙装"], seasonFocus: ["春早春", "春中"], styleFocus: ["优雅", "浪漫"], activity: "春季新品发布" },
    { wave: 2, date: "3月第1周", pct: 20, sku: 40, amount: 200000, categories: ["全套春装"], seasonFocus: ["春中", "春末"], styleFocus: ["休闲", "通勤"], activity: "女神节促销" },
    { wave: 3, date: "4月第1周", pct: 25, sku: 50, amount: 250000, categories: ["春夏过渡款"], seasonFocus: ["春末", "初夏"], styleFocus: ["简约", "优雅"], activity: "会员专享日" },
    { wave: 4, date: "5月第1周", pct: 40, sku: 80, amount: 400000, categories: ["夏装全套"], seasonFocus: ["盛夏"], styleFocus: ["运动", "前卫"], activity: "夏季焕新大促" },
  ]);

  // ── 秋冬上架主题波段（每个主题=一波，复用 wave_plan 表的 wave_name/status 字段，无需改表）──
  const [awWaves, setAwWaves] = useState<AWThemeWave[]>([
    { wave: 1, theme: "美拉德风", date: "8月第3周", pct: 15, sku: 45, amount: 225000, categories: ["针织毛衣", "羊毛大衣"], styleFocus: ["自然", "优雅"], activity: "早秋上新", colorTone: "焦糖棕/摩卡" },
    { wave: 2, theme: "新中式", date: "9月第2周", pct: 18, sku: 50, amount: 300000, categories: ["新中式外套", "改良旗袍"], styleFocus: ["优雅", "古典型"], activity: "中秋国风专场", colorTone: "黛蓝/朱红" },
    { wave: 3, theme: "老钱风·静奢", date: "10月第1周", pct: 17, sku: 48, amount: 380000, categories: ["羊毛大衣", "真丝衬衫"], styleFocus: ["古典型", "优雅"], activity: "高端会员私享", colorTone: "燕麦/ camel" },
    { wave: 4, theme: "通勤极简", date: "10月第3周", pct: 18, sku: 52, amount: 260000, categories: ["西装", "直筒裤"], styleFocus: ["少年型", "古典型"], activity: "双十一职场焕新", colorTone: "石墨灰/米白" },
    { wave: 5, theme: "新年战袍", date: "12月第1周", pct: 17, sku: 46, amount: 320000, categories: ["礼服", "红色针织"], styleFocus: ["浪漫", "戏剧型"], activity: "新年战袍预售", colorTone: "正红/金" },
    { wave: 6, theme: "圣诞派对", date: "12月第3周", pct: 15, sku: 40, amount: 240000, categories: ["亮片裙", "派对套装"], styleFocus: ["时尚", "戏剧型"], activity: "圣诞狂欢购", colorTone: "酒红/银" },
  ]);

  /* ── 加载店铺列表 ──────────────────────── */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("stores").select("id, name").order("name");
      setStores(data || []);
      if (data && data.length > 0) setStoreId(data[0].id);
    })();
  }, []);

  /* ── 自动填充 96 格矩阵（基于 VIP 数据）── */
  const autoFillMatrix = async () => {
    if (!storeId) { alert("请先选择店铺"); return; }
    setSaving(true);
    try {
      const { data: members } = await supabase
        .from("vip_customers")
        .select("color_season, main_style")
        .eq("store_id", storeId)
        .eq("is_active", true);

      if (!members || members.length === 0) {
        alert("该店铺暂无 VIP 数据，无法自动填充");
        setSaving(false);
        return;
      }

      const countMap: Record<string, Record<string, number>> = {};
      SEASON_TYPES.forEach((s) => { countMap[s] = {}; ALL_STYLES.forEach((st) => { countMap[s][st.value] = 0; }); });

      let total = 0;
      members.forEach((m: any) => {
        const s = m.color_season;
        const st = m.main_style;
        if (s && st && countMap[s]) {
          countMap[s][st] = (countMap[s][st] || 0) + 1;
          total++;
        }
      });

      const totalSku = structure.reduce((sum, item) => sum + item.sku, 0) || 200;
      const newMatrix = { ...matrix };
      SEASON_TYPES.forEach((s) => {
        ALL_STYLES.forEach((st) => {
          const cnt = countMap[s]?.[st.value] || 0;
          const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
          const sku = Math.round((pct / 100) * totalSku);
          newMatrix[s][st.value] = {
            sku,
            pct,
            budget: Math.round(sku * 150), // 默认采购均价150元/件，可在结构规划中调整
          };
        });
      });
      setMatrix(newMatrix);
      alert("96 格矩阵已根据 VIP 数据自动填充！");
    } catch (e: any) {
      alert("填充失败：" + e.message);
    }
    setSaving(false);
  };

  /* ── 保存到数据库 ──────────────────────── */
  const saveToDB = async () => {
    if (!storeId) return;
    setSaving(true);
    try {
      await supabase.from("product_structure_plan").upsert({
        store_id: storeId,
        season: "全年",
        items: structure,
        total_sku: structure.reduce((s, i) => s + i.sku, 0),
        total_budget: structure.reduce((s, i) => s + i.sales, 0),
      });

      await supabase.from("product_matrix_plan").upsert({
        store_id: storeId,
        season: "全年",
        matrix_data: matrix,
        total_sku: structure.reduce((s, i) => s + i.sku, 0),
      });

      for (const w of waves) {
        await supabase.from("wave_plan").upsert({
          store_id: storeId,
          wave_number: w.wave,
          plan_date: w.date,
          pct: w.pct,
          sku_count: w.sku,
          amount: w.amount,
          core_categories: w.categories,
          season_focus: w.seasonFocus,
          style_focus: w.styleFocus,
          marketing_activity: w.activity,
        });
      }

      // 秋冬上架主题波段：复用 wave_name 存主题名、status='aw' 区分秋冬
      for (const w of awWaves) {
        await supabase.from("wave_plan").upsert({
          store_id: storeId,
          wave_number: w.wave,
          wave_name: w.theme,
          plan_date: w.date,
          pct: w.pct,
          sku_count: w.sku,
          amount: w.amount,
          core_categories: w.categories,
          style_focus: w.styleFocus,
          marketing_activity: w.activity,
          status: "aw",
        });
      }
      alert("保存成功！");
    } catch (e: any) {
      alert("保存失败：" + e.message);
    }
    setSaving(false);
  };

  /* ── 导出 Excel ─────────────────────────── */
  const exportToExcel = async () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Sheet1: 商品结构规划
      const ws1 = XLSX.utils.aoa_to_sheet([
        ["序号", "品类", "占比%", "SKU数", "毛利率%", "目标销售额", "季节分布"],
        ...structure.map((item, i) => [i + 1, item.category, item.pct, item.sku, item.margin, `¥${item.sales.toLocaleString()}`, item.season]),
      ]);
      XLSX.utils.book_append_sheet(wb, ws1, "1.商品结构规划");

      // Sheet2: 96格商品矩阵
      const header2 = ["季型\\风格", ...ALL_STYLES.map((s) => s.proLabel || s.label)];
      const rows2 = SEASON_TYPES.map((s) => {
        const season = COLOR_SEASONS_PRO.find((c) => c.value === s);
        return [
          `${season?.label || s}`,
          ...ALL_STYLES.map((st) => {
            const cell = matrix[s]?.[st.value];
            return `SKU:${cell?.sku || 0}\n占比:${cell?.pct || 0}%\n预算:¥${cell?.budget?.toLocaleString() || 0}`;
          }),
        ];
      });
      const ws2 = XLSX.utils.aoa_to_sheet([header2, ...rows2]);
      XLSX.utils.book_append_sheet(wb, ws2, "2.96格商品矩阵");

      // Sheet3: 上货波段计划
      const ws3 = XLSX.utils.aoa_to_sheet([
        ["波段", "时间", "占比%", "SKU数", "金额", "核心品类", "季型重点", "风格重点", "营销活动"],
        ...waves.map((w) => [w.wave, w.date, w.pct, w.sku, `¥${w.amount.toLocaleString()}`, w.categories.join("、"), w.seasonFocus.join("、"), w.styleFocus.join("、"), w.activity]),
      ]);
      XLSX.utils.book_append_sheet(wb, ws3, "3.上货波段计划");

      // Sheet4: 秋冬上架主题波段
      const ws4 = XLSX.utils.aoa_to_sheet([
        ["主题", "上架时间", "占比%", "SKU数", "金额", "核心品类", "主色调", "风格重点", "营销活动"],
        ...awWaves.map((w) => [w.theme, w.date, w.pct, w.sku, `¥${w.amount.toLocaleString()}`, w.categories.join("、"), w.colorTone, w.styleFocus.join("、"), w.activity]),
      ]);
      XLSX.utils.book_append_sheet(wb, ws4, "4.秋冬上架主题");

      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `商品企划_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      alert("Excel 已导出！");
    } catch (e: any) {
      alert("导出失败：" + e.message);
    }
    setExporting(false);
  };

  /* ── 一键生成采购清单 ─────────────────── */
  const [generatingPO, setGeneratingPO] = useState(false);
  const generateProcurement = async () => {
    if (!storeId) { alert("请先选择店铺"); return; }
    setGeneratingPO(true);
    try {
      const res = await fetch("/api/plan/generate-procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, season: "2026", supplier: "待确认", avgCostPrice: 0 }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); setGeneratingPO(false); return; }
      alert(`✅ ${data.message}\n\n共 ${data.orders?.length || 0} 张采购单\n总计 ${data.totalSku || 0} 件，¥${(data.totalAmount || 0).toLocaleString()}`);
    } catch (e: any) {
      alert("生成失败：" + e.message);
    }
    setGeneratingPO(false);
  };

  /* ── AI 生成企划报告 ─────────────────── */
  const generateAIReport = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...aiForm, storeId: storeId || undefined }),
      });
      const data = await res.json();
      if (data.error) { alert("生成失败：" + data.error); setGenerating(false); return; }
      setAiReport(data.report);
      setAiSource(data.source === "ai" ? "AI 生成" : "示例数据");
    } catch (e: any) { alert("请求失败：" + e.message); }
    setGenerating(false);
  };

  /* ── 导出 Word（含图片关键词超链接）── */
  const exportToWord = async () => {
    if (!aiReport) { alert("请先生成企划报告"); return; }
    setExportingWord(true);
    try {
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType, PageBreak, ExternalHyperlink, ImageRun } = await import("docx");
      const r = aiReport; const SEASON = r.season || "2026夏季"; const BRAND = r.brandName || "企划";
      const h1 = (t: string) => new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 36, font: "Microsoft YaHei" })], spacing: { before: 400, after: 200 } });
      const h2 = (t: string) => new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 28, font: "Microsoft YaHei", color: "1a56db" })], spacing: { before: 300, after: 150 } });
      const body = (t: string) => new Paragraph({ children: [new TextRun({ text: t, size: 22, font: "Microsoft YaHei" })], spacing: { after: 80 } });
      const el = () => new Paragraph({ children: [], spacing: { after: 100 } });

      /* 获取图片 base64（双保险：先试 picsum，失败则用 placehold.co 关键词占位图） */
      async function fetchImageBase64(keyword: string): Promise<{ base64: string; ext: string } | null> {
        const fallbackUrl = `https://placehold.co/400x300/f0f0f0/444444?text=${encodeURIComponent(keyword.slice(0, 24))}`;
        const tryFetch = async (url: string): Promise<{ base64: string; ext: string } | null> => {
          try {
            const res = await fetch(`/api/fetch-image?url=${encodeURIComponent(url)}&format=base64`);
            if (!res.ok) return null;
            const data = await res.json();
            if (!data.base64) return null;
            const ext = data.contentType?.includes("png") ? "png" : "jpg";
            return { base64: data.base64, ext };
          } catch { return null; }
        };
        // 先尝试 picsum（随机风景图，视觉上比纯色占位图好）
        const seed = keyword.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
        const imgUrl = `https://picsum.photos/seed/${seed}/400/300`;
        const result = await tryFetch(imgUrl);
        if (result) return result;
        // fallback：带关键词文字的占位图，确保 Word 里一定有图
        return await tryFetch(fallbackUrl);
      }

      /* 图片块：尝试插入图片+超链接 */
      async function imgBlock(kw: string, label: string): Promise<any[]> {
        const result: any[] = [];
        const img = await fetchImageBase64(kw);
        if (img) {
          const imgData = Uint8Array.from(atob(img.base64), (c) => c.charCodeAt(0));
          result.push(new Paragraph({
            children: [new ImageRun({
              data: imgData,
              type: img.ext === "png" ? "png" as any : "jpg" as any,
              transformation: { width: 360, height: 270 },
            })],
            spacing: { before: 80, after: 40 },
            alignment: AlignmentType.CENTER,
          }));
        }
        result.push(new Paragraph({
          children: [
            new TextRun({ text: `🖼 ${label} — `, bold: true, size: 18, font: "Microsoft YaHei", color: "e74c3c" }),
            new ExternalHyperlink({
              children: [new TextRun({ text: kw, size: 18, font: "Microsoft YaHei", color: "2980b9" })],
              link: googleImageSearchUrl(kw),
            }),
          ],
          spacing: { before: 40, after: 80 },
          alignment: AlignmentType.CENTER,
        }));
        return result;
      }

      const children: any[] = [];
      children.push(el(), el(), el());
      children.push(new Paragraph({ children: [new TextRun({ text: BRAND, bold: true, size: 56, font: "Microsoft YaHei" })], alignment: AlignmentType.CENTER }));
      children.push(new Paragraph({ children: [new TextRun({ text: `${SEASON}商品企划书`, bold: true, size: 40, font: "Microsoft YaHei", color: "666666" })], alignment: AlignmentType.CENTER, spacing: { before: 200 } }));
      children.push(el());
      children.push(new Paragraph({ children: [new PageBreak()] }));

      children.push(h1("一、企划概要")); children.push(body(r.summary || "")); children.push(el());
      if (r.imageKeywords?.styleImages?.length) children.push(...await imgBlock(r.imageKeywords.styleImages[0], "品牌风格形象图"));

      children.push(h1("二、色彩企划方案"));
      r.colorPlan?.forEach((cp) => { children.push(h2(`${cp.type}（${cp.ratio}）`)); children.push(body(`色彩：${(cp.colors || []).join("、")}`)); });
      if (r.imageKeywords?.colorImages?.length) { children.push(el()); children.push(h2("色彩搭配参考图")); for (let ci = 0; ci < r.imageKeywords.colorImages.length; ci++) { children.push(...await imgBlock(r.imageKeywords.colorImages[ci], `色彩参考 ${ci + 1}`)); } }

      children.push(new Paragraph({ children: [new PageBreak()] }));
      children.push(h1("三、风格企划方案"));
      (r.stylePlan || []).forEach((sp, i) => {
        const wd = Object.entries(STYLE_DETAILS).find(([, v]) => v.proLabel === sp.mainStyle)?.[1];
        children.push(h2(`${i + 1}. ${sp.styleCombo}（${sp.gender}）`));
        children.push(body(`主风格：${sp.mainStyle} ｜ 偏风格：${sp.subStyle}`));
        children.push(body(`适用场合：${(sp.occasions || []).join("、")} ｜ 风情：${(sp.vibe || []).join("、")}`));
        children.push(body(`引流占比：${sp.trafficRatio} ｜ 利润占比：${sp.profitRatio}`));
        if (wd) children.push(body(`风格特征：廓形 ${wd.silhouette}；面料 ${wd.fabric}；图案 ${wd.pattern}；适用场合 ${wd.occasion}；避雷 ${wd.avoid}`));
        children.push(el());
      });
      if (r.imageKeywords?.styleImages?.length) { children.push(el()); children.push(h2("风格参考图")); for (let si = 0; si < r.imageKeywords.styleImages.length; si++) { children.push(...await imgBlock(r.imageKeywords.styleImages[si], `风格参考 ${si + 1}`)); } }

      children.push(new Paragraph({ children: [new PageBreak()] }));
      children.push(h1("四、商品结构规划"));
      const structRows = [
        new TableRow({ children: ["类型", "占比", "说明"].map((h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, font: "Microsoft YaHei" })] })], shading: { type: ShadingType.SOLID, color: "1a56db" } })) }),
        ...(r.productStructure || []).map((ps) => new TableRow({ children: [ps.type, ps.ratio, ps.desc].map((v) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: v, size: 20, font: "Microsoft YaHei" })] })] })) })),
      ];
      children.push(new Table({ rows: structRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

      children.push(new Paragraph({ children: [new PageBreak()] }));
      children.push(h1("五、价格带规划"));
      const priceRows = [
        new TableRow({ children: ["价格带", "范围", "占比", "策略"].map((h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, font: "Microsoft YaHei" })] })], shading: { type: ShadingType.SOLID, color: "1a56db" } })) }),
        ...(r.pricePlan || []).map((pp) => new TableRow({ children: [pp.band, pp.range, pp.ratio, pp.strategy].map((v) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: v, size: 20, font: "Microsoft YaHei" })] })] })) })),
      ];
      children.push(new Table({ rows: priceRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

      children.push(new Paragraph({ children: [new PageBreak()] }));
      children.push(h1("六、上货波段计划"));
      for (let qi = 0; qi < (r.quartersPlan || []).length; qi++) {
        const qp = r.quartersPlan![qi];
        children.push(h2(qp.phase));
        (qp.items || []).forEach((item: string, i: number) => children.push(body(`${i + 1}. ${item}`)));
        if (r.imageKeywords?.waveImages?.[qi]) { const wk = r.imageKeywords.waveImages[qi]; children.push(el()); for (const kw of (wk.keywords || [])) { children.push(...await imgBlock(kw, `${qp.phase} 款式参考`)); } }
      }

      children.push(new Paragraph({ children: [new PageBreak()] }));
      children.push(h1("附录：图片搜索关键词清单"));
      children.push(body("以下蓝色关键词均为可点击超链接，按住 Ctrl 点击即可在浏览器中搜索图片。"));
      if (r.imageKeywords) {
        children.push(h2("色彩搭配参考")); (r.imageKeywords.colorImages || []).forEach((kw) => children.push(body(`  🔍 ${kw}`)));
        children.push(h2("风格参考")); (r.imageKeywords.styleImages || []).forEach((kw) => children.push(body(`  🔍 ${kw}`)));
        children.push(h2("波段款式参考")); (r.imageKeywords.waveImages || []).forEach((w) => children.push(body(`  波段${w.wave}：${(w.keywords || []).join(" / ")}`)));
      }

      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${BRAND}_${SEASON}商品企划书.docx`; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { console.error(e); alert("导出Word失败：" + e.message); }
    setExportingWord(false);
  };

  /* ── 导出关键词 CSV ─────────────────── */
  const exportKeywordsCSV = () => {
    if (!aiReport?.imageKeywords) { alert("无关键词"); return; }
    setExportingKeywords(true);
    const rows: string[][] = [["类别", "搜索关键词", "搜索平台"]];
    (aiReport.imageKeywords.colorImages || []).forEach((kw) => rows.push(["色彩搭配", kw, "Google图片"]));
    (aiReport.imageKeywords.styleImages || []).forEach((kw) => rows.push(["风格参考", kw, "Google图片"]));
    (aiReport.imageKeywords.waveImages || []).forEach((w) => (w.keywords || []).forEach((kw) => rows.push([`波段${w.wave}`, kw, "Google图片"])));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const BOM = "\uFEFF"; const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `图片搜索关键词_${aiReport.brandName || "企划"}_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    setExportingKeywords(false);
  };

  /* ═══════════════════════════════════════════
       渲染
       ═══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-8xl mx-auto">

        {/* ── 头部 ────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">商品企划系统</h1>
            <p className="text-sm text-gray-500 mt-1">AI 生成专业企划 · Word 导出含图片关键词 · 96 格商品矩阵</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
            >
              <option value="">选择店铺</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setActiveTab("ai")} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "ai" ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
                <Sparkles className="w-4 h-4" /> AI 企划生成
              </button>
              <button onClick={() => setActiveTab("manual")} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "manual" ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
                <Calculator className="w-4 h-4" /> 手动规划
              </button>
              <button onClick={() => setActiveTab("matrix")} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "matrix" ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
                <Layers className="w-4 h-4" /> 风格矩阵
              </button>
            </div>
            <button onClick={autoFillMatrix} disabled={saving || !storeId} className="px-4 py-2.5 bg-blue-100 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-200 disabled:opacity-50 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              {saving ? "填充中..." : "AI 自动填充矩阵"}
            </button>
            <button onClick={saveToDB} disabled={saving} className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? "保存中..." : "保存到数据库"}
            </button>
            <button onClick={exportToExcel} disabled={exporting} className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2">
              <Download className="w-4 h-4" />
              {exporting ? "导出中..." : "导出 Excel"}
            </button>
            <button onClick={generateProcurement} disabled={generatingPO || !storeId} className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              {generatingPO ? "生成中..." : "一键生成采购清单"}
            </button>
          </div>
        </div>

        {activeTab === "manual" && (<>
        {/* === 1. 商品结构规划 === */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" /> 1. 商品结构规划
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3 text-left">品类</th>
                  <th className="p-3 text-left">占比%</th>
                  <th className="p-3 text-left">SKU数</th>
                  <th className="p-3 text-left">毛利率%</th>
                  <th className="p-3 text-left">目标销售额</th>
                  <th className="p-3 text-left">季节分布</th>
                  <th className="p-3 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {structure.map((item, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="p-3">
                      <select value={item.category} onChange={(e) => { const s = [...structure]; s[i].category = e.target.value; setStructure(s); }} className="px-2 py-1 border border-gray-200 rounded-lg text-sm">
                        {categoryOptions.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="p-3"><input type="number" value={item.pct} onChange={(e) => { const s = [...structure]; s[i].pct = +e.target.value; setStructure(s); }} className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="number" value={item.sku} onChange={(e) => { const s = [...structure]; s[i].sku = +e.target.value; setStructure(s); }} className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="number" value={item.margin} onChange={(e) => { const s = [...structure]; s[i].margin = +e.target.value; setStructure(s); }} className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="number" value={item.sales} onChange={(e) => { const s = [...structure]; s[i].sales = +e.target.value; setStructure(s); }} className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="text" value={item.season} onChange={(e) => { const s = [...structure]; s[i].season = e.target.value; setStructure(s); }} className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3">
                      <button onClick={() => { const s = [...structure]; s.splice(i, 1); setStructure(s); }} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-blue-50 font-semibold">
                <tr>
                  <td className="p-3">合计</td>
                  <td className="p-3">{structure.reduce((s, i) => s + i.pct, 0)}%</td>
                  <td className="p-3">{structure.reduce((s, i) => s + i.sku, 0)}</td>
                  <td className="p-3">—</td>
                  <td className="p-3">¥{structure.reduce((s, i) => s + i.sales, 0).toLocaleString()}</td>
                  <td className="p-3">—</td>
                  <td className="p-3">
                    <button onClick={() => setStructure([...structure, { category: "配饰", pct: 0, sku: 0, margin: 0, sales: 0, season: "全年" }])} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs">
                      <Plus className="w-3 h-3" /> 添加
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* === 2. 96 格商品矩阵 === */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" /> 2. 96 格商品矩阵（季型 × 风格）
          </h2>
          <p className="text-xs text-gray-400 mb-3">点击「AI 自动填充矩阵」根据 VIP 数据自动生成，也可手动调整每个单元格的 SKU 数和预算</p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 border border-gray-200 min-w-[80px]">季型 \ 风格</th>
                  {ALL_STYLES.map((s) => (
                    <th key={s.value} className="p-2 border border-gray-200 min-w-[90px] text-xs">
                      <div>{s.proLabel || s.label}</div>
                      <div className="text-gray-400">({s.group})</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SEASON_TYPES.map((season) => {
                  const seasonInfo = COLOR_SEASONS_PRO.find((c) => c.value === season);
                  return (
                    <tr key={season}>
                      <td className="p-2 border border-gray-200 font-semibold bg-gray-50 text-left pl-2">
                        {seasonInfo?.label}<br /><span className="text-gray-400 text-xs">{seasonInfo?.group}</span>
                      </td>
                      {ALL_STYLES.map((st) => {
                        const cell = matrix[season]?.[st.value] || { sku: 0, pct: 0, budget: 0 };
                        return (
                          <td key={st.value} className="p-1 border border-gray-200 align-top">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500 text-xs">SKU:</span>
                                <input
                                  type="number"
                                  value={cell.sku}
                                  onChange={(e) => {
                                    const m = { ...matrix };
                                    m[season][st.value] = { ...cell, sku: +e.target.value };
                                    setMatrix(m);
                                  }}
                                  className="w-14 px-1 py-0.5 border border-gray-200 rounded text-xs"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500 text-xs">%:</span>
                                <input
                                  type="number"
                                  value={cell.pct}
                                  onChange={(e) => {
                                    const m = { ...matrix };
                                    m[season][st.value] = { ...cell, pct: +e.target.value };
                                    setMatrix(m);
                                  }}
                                  className="w-12 px-1 py-0.5 border border-gray-200 rounded text-xs"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500 text-xs">¥:</span>
                                <input
                                  type="number"
                                  value={cell.budget}
                                  onChange={(e) => {
                                    const m = { ...matrix };
                                    m[season][st.value] = { ...cell, budget: +e.target.value };
                                    setMatrix(m);
                                  }}
                                  className="w-20 px-1 py-0.5 border border-gray-200 rounded text-xs"
                                />
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* === 3. 上货波段计划 === */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" /> 3. 上货波段计划
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3 text-left">波段</th>
                  <th className="p-3 text-left">时间</th>
                  <th className="p-3 text-left">占比%</th>
                  <th className="p-3 text-left">SKU数</th>
                  <th className="p-3 text-left">金额</th>
                  <th className="p-3 text-left">核心品类</th>
                  <th className="p-3 text-left">季型重点</th>
                  <th className="p-3 text-left">风格重点</th>
                  <th className="p-3 text-left">营销活动</th>
                </tr>
              </thead>
              <tbody>
                {waves.map((w, i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="p-3 font-semibold">第{w.wave}波</td>
                    <td className="p-3"><input type="text" value={w.date} onChange={(e) => { const ws = [...waves]; ws[i].date = e.target.value; setWaves(ws); }} className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="number" value={w.pct} onChange={(e) => { const ws = [...waves]; ws[i].pct = +e.target.value; setWaves(ws); }} className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="number" value={w.sku} onChange={(e) => { const ws = [...waves]; ws[i].sku = +e.target.value; setWaves(ws); }} className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="number" value={w.amount} onChange={(e) => { const ws = [...waves]; ws[i].amount = +e.target.value; setWaves(ws); }} className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="text" value={w.categories.join("、")} onChange={(e) => { const ws = [...waves]; ws[i].categories = e.target.value.split("、"); setWaves(ws); }} className="w-40 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="text" value={w.seasonFocus.join("、")} onChange={(e) => { const ws = [...waves]; ws[i].seasonFocus = e.target.value.split("、"); setWaves(ws); }} className="w-40 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="text" value={w.styleFocus.join("、")} onChange={(e) => { const ws = [...waves]; ws[i].styleFocus = e.target.value.split("、"); setWaves(ws); }} className="w-32 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="text" value={w.activity} onChange={(e) => { const ws = [...waves]; ws[i].activity = e.target.value; setWaves(ws); }} className="w-36 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* === 4. 秋冬上架主题波段 === */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" /> 4. 秋冬上架主题波段
            <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">6 大主题 · 每个主题 = 一波</span>
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 text-amber-800">
                <tr>
                  <th className="p-3 text-left">主题</th>
                  <th className="p-3 text-left">上架时间</th>
                  <th className="p-3 text-left">占比%</th>
                  <th className="p-3 text-left">SKU数</th>
                  <th className="p-3 text-left">金额</th>
                  <th className="p-3 text-left">核心品类</th>
                  <th className="p-3 text-left">主色调</th>
                  <th className="p-3 text-left">风格重点</th>
                  <th className="p-3 text-left">营销活动</th>
                </tr>
              </thead>
              <tbody>
                {awWaves.map((w, i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="p-3">
                      <span className="font-semibold text-amber-700">第{w.wave}波 · {w.theme}</span>
                    </td>
                    <td className="p-3"><input type="text" value={w.date} onChange={(e) => { const ws = [...awWaves]; ws[i].date = e.target.value; setAwWaves(ws); }} className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="number" value={w.pct} onChange={(e) => { const ws = [...awWaves]; ws[i].pct = +e.target.value; setAwWaves(ws); }} className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="number" value={w.sku} onChange={(e) => { const ws = [...awWaves]; ws[i].sku = +e.target.value; setAwWaves(ws); }} className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="number" value={w.amount} onChange={(e) => { const ws = [...awWaves]; ws[i].amount = +e.target.value; setAwWaves(ws); }} className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="text" value={w.categories.join("、")} onChange={(e) => { const ws = [...awWaves]; ws[i].categories = e.target.value.split("、"); setAwWaves(ws); }} className="w-40 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="text" value={w.colorTone} onChange={(e) => { const ws = [...awWaves]; ws[i].colorTone = e.target.value; setAwWaves(ws); }} className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="text" value={w.styleFocus.join("、")} onChange={(e) => { const ws = [...awWaves]; ws[i].styleFocus = e.target.value.split("、"); setAwWaves(ws); }} className="w-32 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="text" value={w.activity} onChange={(e) => { const ws = [...awWaves]; ws[i].activity = e.target.value; setAwWaves(ws); }} className="w-36 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">主题名与商品上传页「上架主题」完全一致，保存后可在 Supabase 的 <code>wave_plan</code> 表以 <code>status='aw'</code> 区分；导出 Excel 含第 4 张表。</p>
        </section>

        {/* ── 使用说明 ────────────────────────── */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-blue-800 mb-2">使用流程</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>选择店铺 → 系统自动加载该店铺 VIP 数据</li>
            <li>点击「AI 自动填充矩阵」→ 根据 VIP 色彩季型 + 风格分布，自动计算 96 格矩阵的 SKU 数和预算</li>
            <li>手动微调 → 在表格里直接调整每个季型×风格组合的 SKU 数和预算</li>
            <li>点击「保存到数据库」→ 持久化到 Supabase</li>
            <li>点击「导出 Excel」→ 下载和 Supalema 模板一样格式的商品企划案，<strong>直接拿去进货</strong></li>
          </ol>
        </div>
        </>)}

        {activeTab === "matrix" && (<>
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" /> 风格矩阵（主风格 × 偏风格）
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              绿=常见组合 ｜ 琥珀=罕见组合（直偏直/曲偏曲，理论存在但现实少）｜ 灰=纯风格（无偏）。
              用法：<strong>主风格定大方向</strong>（决定货盘主力），<strong>偏风格做细化</strong>（组货搭配 / 陈列分区 / 销售话术），不喧宾夺主。
            </p>
            <h3 className="font-semibold text-gray-700 mb-2">女士八大风格（8×8 = 64 组合）</h3>
            <StyleMatrix gender="女士" />
            <h3 className="font-semibold text-gray-700 mt-6 mb-2">男士五大风格（5×5 = 25 组合，不分直曲）</h3>
            <StyleMatrix gender="男士" />
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" /> 风格特征速查（组货 / 陈列 / 销售落地）
            </h2>
            <StyleDetailTable />
            <p className="text-xs text-gray-400 mt-2">说明：以上为形象顾问体系标准特征基线，市场风格映射（通俗名）由运营在风格设置中手动调整，此处不自动对应。</p>
          </section>
        </>)}

        {activeTab === "ai" && (
        <>
          {/* === AI 参数表单 === */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" /> AI 企划参数设置
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">品牌名称</label>
                  <input type="text" value={aiForm.brandName} onChange={(e) => setAiForm({ ...aiForm, brandName: e.target.value })} placeholder="如：优雅女装馆" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">季节</label>
                  <input type="text" list="season-options" value={aiForm.season} onChange={(e) => setAiForm({ ...aiForm, season: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <datalist id="season-options">
                    <option value="2026春季" />
                    <option value="2026夏季" />
                    <option value="2026秋冬" />
                    <option value="2026冬季" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">色彩季型偏好</label>
                  <input type="text" list="color-season-options" value={aiForm.colorLabel} onChange={(e) => {
                    const opt = COLOR_SEASONS_PRO.find((c) => c.label === e.target.value);
                    setAiForm({ ...aiForm, colorPref: opt?.value || "", colorLabel: e.target.value });
                  }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <datalist id="color-season-options">
                    {COLOR_SEASON_OPTIONS.map((o) => <option key={o.value} value={o.label} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">市场风格定位</label>
                  <input type="text" list="style-options" value={aiForm.styleLabel} onChange={(e) => {
                    const opt = STYLE_OPTIONS.find((s) => s.label === e.target.value);
                    setAiForm({ ...aiForm, marketStyle: opt?.value || "", styleLabel: e.target.value });
                  }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <datalist id="style-options">
                    {STYLE_OPTIONS.map((o) => <option key={o.value} value={o.label} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">价格带</label>
                  <input type="text" list="price-options" value={aiForm.priceBand} onChange={(e) => setAiForm({ ...aiForm, priceBand: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <datalist id="price-options">
                    <option value="99-199元" />
                    <option value="199-399元" />
                    <option value="399-699元" />
                    <option value="699-999元" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">目标年龄</label>
                  <input type="text" list="age-options" value={aiForm.targetAge} onChange={(e) => setAiForm({ ...aiForm, targetAge: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <datalist id="age-options">
                    <option value="18-25岁" />
                    <option value="25-35岁" />
                    <option value="25-40岁" />
                    <option value="35-45岁" />
                    <option value="40-55岁" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">店铺面积</label>
                  <input type="text" list="size-options" value={aiForm.shopSize} onChange={(e) => setAiForm({ ...aiForm, shopSize: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <datalist id="size-options">
                    <option value="30-60㎡" />
                    <option value="60-100㎡" />
                    <option value="100-150㎡" />
                    <option value="150-200㎡" />
                  </datalist>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">补充说明（选填）</label>
                  <input type="text" value={aiForm.notes} onChange={(e) => setAiForm({ ...aiForm, notes: e.target.value })} placeholder="如：主打真丝材质、避免过于休闲的款式" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button onClick={generateAIReport} disabled={generating} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2 shadow-lg">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generating ? "AI 生成中..." : "🚀 生成企划报告"}
                </button>
                {aiReport && (
                  <>
                    <button onClick={exportToWord} disabled={exportingWord} className="px-5 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                      {exportingWord ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      {exportingWord ? "导出中..." : "📄 导出 Word"}
                    </button>
                    <button onClick={exportKeywordsCSV} disabled={exportingKeywords} className="px-5 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2">
                      {exportingKeywords ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {exportingKeywords ? "导出中..." : "📥 下载关键词 CSV"}
                    </button>
                  </>
                )}
              </div>
              {aiSource && <p className="mt-3 text-xs text-gray-500">数据来源：{aiSource}</p>}
            </div>
          </section>

          {/* === AI 报告展示 === */}
          {aiReport && (
          <section className="space-y-8">
            {/* 色彩企划 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🎨 色彩企划方案</h3>
              <div className="space-y-4">
                {aiReport.colorPlan?.map((cp, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-blue-700">{cp.type}</span>
                      <span className="text-sm text-gray-500">（{cp.ratio}）</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(cp.colors || []).map((c, j) => (
                        <span key={j} className="px-3 py-1 bg-gray-100 rounded-lg text-sm">{c}</span>
                      ))}
                    </div>
                    {aiReport.imageKeywords?.colorImages?.[i] && (
                      <div className="mt-3">
                        <KeywordLink keyword={aiReport.imageKeywords.colorImages[i]} index={i} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 风格企划 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">✨ 风格企划方案</h3>
              <div className="space-y-6">
                {aiReport.stylePlan?.map((sp, i) => {
                  const d = STYLE_DETAILS[proToValue[sp.mainStyle]];
                  return (
                  <div key={i} className="border border-gray-200 rounded-xl p-4">
                    <h4 className="font-bold text-gray-800 mb-2">{i + 1}. {sp.styleCombo}（{sp.gender}）</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>主风格：<span className="font-semibold text-gray-800">{sp.mainStyle}</span> ｜ 偏风格：<span className="font-semibold text-gray-800">{sp.subStyle}</span></p>
                      <p>适用场合：{(sp.occasions || []).join("、")} ｜ 风情：{(sp.vibe || []).join("、")}</p>
                      <p>引流占比：{sp.trafficRatio} ｜ 利润占比：{sp.profitRatio}</p>
                      {d && (
                        <p className="text-xs text-gray-400 pt-1 border-t border-gray-100 mt-1">
                          廓形：{d.silhouette} ｜ 面料：{d.fabric} ｜ 图案：{d.pattern}
                        </p>
                      )}
                    </div>
                    {aiReport.imageKeywords?.styleImages?.[i] && (
                      <div className="mt-3">
                        <KeywordLink keyword={aiReport.imageKeywords.styleImages[i]} index={i} />
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>

            {/* 商品结构 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📦 商品结构规划</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3 text-left">类型</th>
                    <th className="p-3 text-left">占比</th>
                    <th className="p-3 text-left">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {aiReport.productStructure?.map((ps, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="p-3">{ps.type}</td>
                      <td className="p-3">{ps.ratio}</td>
                      <td className="p-3">{ps.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 价格带 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">💰 价格带规划</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3 text-left">价格带</th>
                    <th className="p-3 text-left">范围</th>
                    <th className="p-3 text-left">占比</th>
                    <th className="p-3 text-left">策略</th>
                  </tr>
                </thead>
                <tbody>
                  {aiReport.pricePlan?.map((pp, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="p-3">{pp.band}</td>
                      <td className="p-3">{pp.range}</td>
                      <td className="p-3">{pp.ratio}</td>
                      <td className="p-3">{pp.strategy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 波段计划 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📅 上货波段计划</h3>
              {aiReport.quartersPlan?.map((qp, i) => (
                <div key={i} className="mb-6 last:mb-0">
                  <h4 className="font-semibold text-gray-700 mb-2">{qp.phase}</h4>
                  <ul className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                    {(qp.items || []).map((item: string, j: number) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                  {aiReport.imageKeywords?.waveImages?.[i] && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {aiReport.imageKeywords.waveImages[i].keywords?.map((kw: string, k: number) => (
                        <KeywordLink key={k} keyword={kw} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
          )}
        </>
        )}

      </div>
    </div>
  );
}

