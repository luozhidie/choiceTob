"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, TrendingUp, Palette, Scissors, History,
  Sparkles, Loader2, AlertCircle, ChevronDown,
  Shirt, Layers, Zap, BarChart3, Search,
} from "lucide-react";

/* ===================== 类型定义 ===================== */
interface TrendItem {
  name: string;
  score: number;        // 0-100 趋势分数
  direction: "up" | "stable" | "down";
}

interface PredictApiResponse {
  color?: TrendItem[];
  fabric?: TrendItem[];
  style?: TrendItem[];
  cut?: TrendItem[];
}

interface HistoryPoint {
  date: string;
  heat: number;         // 0-100 热度
}

interface ProductItem {
  id: string;
  title: string;
  price: number;
  image: string;
  matchSuggestion?: string;
}

/* ===================== 动画变体 ===================== */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: "easeOut" as const },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

/* ===================== 辅助函数 ===================== */
const directionIcon = (d: TrendItem["direction"]) => {
  if (d === "up") return <span className="text-emerald-500 text-xs">🔺 上升</span>;
  if (d === "down") return <span className="text-rose-500 text-xs">🔻 下降</span>;
  return <span className="text-gray-400 text-xs">→ 稳定</span>;
};

// 分数 → 条形图宽度（最大 100%）
const barWidth = (score: number) => `${Math.max(score, 4)}%`;

// 分数颜色
const scoreColor = (score: number) =>
  score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-rose-400";

/* ===================== 页面组件 ===================== */
export default function TrendPredictPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // 登录检查
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/trend-predict");
        return;
      }
      setChecking(false);
    };
    checkAuth();
  }, []);

  /* ---- 预测控制 ---- */
  const [keyword, setKeyword] = useState("连衣裙");
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState("");
  const [predictData, setPredictData] = useState<PredictApiResponse | null>(null);

  /* ---- Tab 状态 ---- */
  type TabKey = "color" | "fabric" | "style" | "history";
  const [activeTab, setActiveTab] = useState<TabKey>("color");

  /* ---- 历史查询 ---- */
  const [attrType, setAttrType] = useState("color");
  const [attrValue, setAttrValue] = useState("黑色");
  const [historyDays, setHistoryDays] = useState(90);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);

  /* ---- 爆款搭配 ---- */
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionError, setCollectionError] = useState("");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  /* ===================== API：趋势预测 ===================== */
  const handlePredict = useCallback(async () => {
    if (!keyword.trim()) return;
    setPredictLoading(true);
    setPredictError("");
    setPredictData(null);

    try {
      const res = await fetch("/api/trend/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });

      if (!res.ok) {
        const msg = res.status === 404
          ? "预测接口暂未配置，请在后台配置 AI 趋势预测服务"
          : `请求失败（${res.status}）`;
        setPredictError(msg);
        return;
      }

      const json = await res.json();
      // 兼容 { data: {...} } 或直接返回 {...}
      const data: PredictApiResponse = json.data ?? json;
      setPredictData(data);
    } catch {
      setPredictError("网络异常，请稍后重试");
    } finally {
      setPredictLoading(false);
    }
  }, [keyword]);

  /* ===================== API：历史爆款查询 ===================== */
  const handleHistorySearch = useCallback(async () => {
    if (!attrValue.trim()) return;
    setHistoryLoading(true);
    setHistoryError("");
    setHistoryData([]);

    try {
      const params = new URLSearchParams({
        attr_type: attrType,
        attr_value: attrValue.trim(),
        days: String(historyDays),
      });
      const res = await fetch(`/api/trend/history-detail?${params.toString()}`);

      if (!res.ok) {
        const msg = res.status === 404
          ? "历史查询接口暂未配置，请在后台配置趋势历史服务"
          : `请求失败（${res.status}）`;
        setHistoryError(msg);
        return;
      }

      const json = await res.json();
      // 兼容 { data: [...] } 或直接 [...]
      const list: HistoryPoint[] = json.data ?? json;
      setHistoryData(list);
    } catch {
      setHistoryError("网络异常，请稍后重试");
    } finally {
      setHistoryLoading(false);
    }
  }, [attrType, attrValue, historyDays]);

  /* ===================== API：生成爆款搭配 ===================== */
  const handleGenerateCollection = useCallback(async () => {
    setCollectionLoading(true);
    setCollectionError("");
    setProducts([]);

    try {
      const res = await fetch("/api/trend/generate-collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() || "连衣裙", useAI: true }),
      });

      if (!res.ok) {
        const msg = res.status === 404
          ? "搭配生成接口暂未配置，请在后台配置爆款搭配服务"
          : `请求失败（${res.status}）`;
        setCollectionError(msg);
        return;
      }

      const json = await res.json();
      const list: ProductItem[] = json.data ?? json.products ?? json;
      setProducts(list);
    } catch {
      setCollectionError("网络异常，请稍后重试");
    } finally {
      setCollectionLoading(false);
    }
  }, [keyword]);

  /* ===================== 登录检查 ===================== */
  if (checking) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)] mx-auto mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">正在检查登录状态...</p>
        </div>
      </div>
    );
  }

  /* ===================== 渲染 ===================== */
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ====== 顶部导航区 ====== */}
      <nav className="bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-30 backdrop-blur-md bg-[var(--surface)]/90">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            首页
          </Link>
          <span className="text-[var(--border)]">/</span>
          <span className="text-sm font-semibold text-[var(--primary)]">爆款预测中心</span>
        </div>
      </nav>

      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-[var(--primary)] text-white">
        {/* 装饰圆 */}
        <div className="absolute top-0 right-0 w-[420px] h-[420px] rounded-full bg-[var(--accent)]/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[260px] h-[260px] rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-[var(--accent)] text-sm font-medium backdrop-blur-sm border border-white/10 mb-4">
              <TrendingUp className="w-4 h-4" /> AI 驱动的趋势分析
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              爆款预测中心
            </h1>
            <p className="mt-3 text-white/75 text-lg leading-relaxed">
              AI 驱动的趋势分析与商品企划，提前洞察色彩、面料、款式趋势，抢占爆款先机
            </p>
          </motion.div>
        </div>
      </section>

      {/* ====== 预测控制面板 ====== */}
      <section className="relative z-10 -mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="bg-[var(--surface)] rounded-2xl shadow-[var(--shadow-lg)] border border-[var(--border)] p-6 sm:p-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              {/* 关键词输入 */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">
                  <Search className="w-4 h-4 inline-block mr-1 -mt-0.5 text-[var(--accent)]" />
                  预测关键词
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="输入品类关键词，如：连衣裙、卫衣、西装..."
                  className="w-full px-4 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] text-[var(--foreground)]"
                />
              </div>

              {/* 时间范围 */}
              <div>
                <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">
                  <BarChart3 className="w-4 h-4 inline-block mr-1 -mt-0.5 text-[var(--accent)]" />
                  预测周期
                </label>
                <div className="flex gap-2">
                  {([7, 30, 90] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDays(d)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                        days === d
                          ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-md shadow-[var(--accent)]/20"
                          : "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--accent)]/40"
                      }`}
                    >
                      {d}天
                    </button>
                  ))}
                </div>
              </div>

              {/* 预测按钮 */}
              <div className="self-end">
                <button
                  type="button"
                  disabled={predictLoading || !keyword.trim()}
                  onClick={handlePredict}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--accent)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--accent)]/20 whitespace-nowrap"
                >
                  {predictLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> 预测中...</>
                  ) : (
                    <><Zap className="w-4 h-4" /> 开始预测</>
                  )}
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {predictError && (
              <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {predictError}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ====== 预测结果展示区（Tab） ====== */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Tab 栏 */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-6">
            {([
              { key: "color" as const, label: "色彩趋势", icon: Palette },
              { key: "fabric" as const, label: "面料趋势", icon: Layers },
              { key: "style" as const, label: "款式/剪裁", icon: Scissors },
              { key: "history" as const, label: "历史爆款查询", icon: History },
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === key
                    ? "bg-[var(--primary)] text-white shadow-md"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* -------- Tab 1：色彩趋势 -------- */}
          <AnimatePresence mode="wait">
            {activeTab === "color" && (
              <motion.div
                key="color"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
              >
                {predictLoading ? (
                  <LoadingState message="正在分析色彩趋势..." />
                ) : !predictData ? (
                  <EmptyState message="请先输入关键词并点击「开始预测」" />
                ) : !predictData.color || predictData.color.length === 0 ? (
                  <EmptyState message="暂无色彩趋势数据，请尝试其他关键词" />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 条形图 */}
                    <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                      <h3 className="text-base font-bold text-[var(--primary)] mb-5 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-[var(--accent)]" />
                        Top 10 色彩趋势
                      </h3>
                      <div className="space-y-3">
                        {predictData.color.slice(0, 10).map((item, i) => (
                          <div key={item.name} className="flex items-center gap-3">
                            <span className="text-xs text-[var(--muted-foreground)] w-5 text-right shrink-0">{i + 1}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-[var(--foreground)]">{item.name}</span>
                                <span className="text-xs text-[var(--muted-foreground)] ml-2">{item.score}分</span>
                              </div>
                              <div className="w-full h-2.5 bg-[var(--muted)] rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full rounded-full ${scoreColor(item.score)}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: barWidth(item.score) }}
                                  transition={{ duration: 0.6, delay: i * 0.05 }}
                                />
                              </div>
                            </div>
                            <span className="shrink-0 w-[60px] text-right">{directionIcon(item.direction)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 色彩卡片 */}
                    <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                      <h3 className="text-base font-bold text-[var(--primary)] mb-5">色彩详情</h3>
                      <motion.div
                        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                        variants={stagger}
                        initial="hidden"
                        animate="visible"
                      >
                        {predictData.color.slice(0, 10).map((item, i) => (
                          <motion.div
                            key={item.name}
                            variants={fadeUp}
                            custom={i}
                            className="p-3 rounded-xl border border-[var(--border)] hover:border-[var(--accent)]/40 hover:shadow-sm transition-all cursor-default"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-[var(--primary)]">{item.name}</span>
                              {directionIcon(item.direction)}
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded-lg border border-[var(--border)]"
                                style={{ backgroundColor: item.name }}
                              />
                              <span className="text-xs text-[var(--muted-foreground)]">趋势分数 {item.score}</span>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* -------- Tab 2：面料趋势 -------- */}
            {activeTab === "fabric" && (
              <motion.div
                key="fabric"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
              >
                {predictLoading ? (
                  <LoadingState message="正在分析面料趋势..." />
                ) : !predictData ? (
                  <EmptyState message="请先输入关键词并点击「开始预测」" />
                ) : !predictData.fabric || predictData.fabric.length === 0 ? (
                  <EmptyState message="暂无面料趋势数据，请尝试其他关键词" />
                ) : (
                  <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                    <h3 className="text-base font-bold text-[var(--primary)] mb-5 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[var(--accent)]" />
                      Top 10 面料趋势
                    </h3>
                    <div className="space-y-3">
                      {predictData.fabric.slice(0, 10).map((item, i) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <span className="text-xs text-[var(--muted-foreground)] w-5 text-right shrink-0">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-[var(--foreground)]">{item.name}</span>
                              <span className="text-xs text-[var(--muted-foreground)] ml-2">{item.score}分</span>
                            </div>
                            <div className="w-full h-2.5 bg-[var(--muted)] rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${scoreColor(item.score)}`}
                                initial={{ width: 0 }}
                                animate={{ width: barWidth(item.score) }}
                                transition={{ duration: 0.6, delay: i * 0.05 }}
                              />
                            </div>
                          </div>
                          <span className="shrink-0 w-[60px] text-right">{directionIcon(item.direction)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* -------- Tab 3：款式/剪裁 -------- */}
            {activeTab === "style" && (
              <motion.div
                key="style"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
              >
                {predictLoading ? (
                  <LoadingState message="正在分析款式与剪裁趋势..." />
                ) : !predictData ? (
                  <EmptyState message="请先输入关键词并点击「开始预测」" />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 款式 Top10 */}
                    <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                      <h3 className="text-base font-bold text-[var(--primary)] mb-5 flex items-center gap-2">
                        <Shirt className="w-4 h-4 text-[var(--accent)]" />
                        Top 10 款式趋势
                      </h3>
                      {!predictData.style || predictData.style.length === 0 ? (
                        <p className="text-sm text-[var(--muted-foreground)] py-8 text-center">暂无款式数据</p>
                      ) : (
                        <div className="space-y-3">
                          {predictData.style.slice(0, 10).map((item, i) => (
                            <div key={item.name} className="flex items-center gap-3">
                              <span className="text-xs text-[var(--muted-foreground)] w-5 text-right shrink-0">{i + 1}</span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-[var(--foreground)]">{item.name}</span>
                                  <span className="text-xs text-[var(--muted-foreground)] ml-2">{item.score}分</span>
                                </div>
                                <div className="w-full h-2.5 bg-[var(--muted)] rounded-full overflow-hidden">
                                  <motion.div
                                    className={`h-full rounded-full ${scoreColor(item.score)}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: barWidth(item.score) }}
                                    transition={{ duration: 0.6, delay: i * 0.05 }}
                                  />
                                </div>
                              </div>
                              <span className="shrink-0 w-[60px] text-right">{directionIcon(item.direction)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 剪裁 Top10 */}
                    <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                      <h3 className="text-base font-bold text-[var(--primary)] mb-5 flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-[var(--accent)]" />
                        Top 10 剪裁趋势
                      </h3>
                      {!predictData.cut || predictData.cut.length === 0 ? (
                        <p className="text-sm text-[var(--muted-foreground)] py-8 text-center">暂无剪裁数据</p>
                      ) : (
                        <div className="space-y-3">
                          {predictData.cut.slice(0, 10).map((item, i) => (
                            <div key={item.name} className="flex items-center gap-3">
                              <span className="text-xs text-[var(--muted-foreground)] w-5 text-right shrink-0">{i + 1}</span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-[var(--foreground)]">{item.name}</span>
                                  <span className="text-xs text-[var(--muted-foreground)] ml-2">{item.score}分</span>
                                </div>
                                <div className="w-full h-2.5 bg-[var(--muted)] rounded-full overflow-hidden">
                                  <motion.div
                                    className={`h-full rounded-full ${scoreColor(item.score)}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: barWidth(item.score) }}
                                    transition={{ duration: 0.6, delay: i * 0.05 }}
                                  />
                                </div>
                              </div>
                              <span className="shrink-0 w-[60px] text-right">{directionIcon(item.direction)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* -------- Tab 4：历史爆款查询 -------- */}
            {activeTab === "history" && (
              <motion.div
                key="history"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
              >
                {/* 查询表单 */}
                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6 mb-6">
                  <h3 className="text-base font-bold text-[var(--primary)] mb-4">历史爆款查询</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="w-full sm:w-40">
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">属性类型</label>
                      <select
                        value={attrType}
                        onChange={(e) => setAttrType(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                      >
                        <option value="color">色彩</option>
                        <option value="fabric">面料</option>
                        <option value="style">款式</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">属性值</label>
                      <input
                        type="text"
                        value={attrValue}
                        onChange={(e) => setAttrValue(e.target.value)}
                        placeholder="如：黑色、真丝、V领"
                        className="w-full px-4 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                      />
                    </div>
                    <div className="w-full sm:w-32">
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">时间范围</label>
                      <select
                        value={historyDays}
                        onChange={(e) => setHistoryDays(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                      >
                        <option value={30}>近30天</option>
                        <option value={60}>近60天</option>
                        <option value={90}>近90天</option>
                      </select>
                    </div>
                    <div className="self-end">
                      <button
                        type="button"
                        disabled={historyLoading || !attrValue.trim()}
                        onClick={handleHistorySearch}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {historyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        查询
                      </button>
                    </div>
                  </div>

                  {historyError && (
                    <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-200">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {historyError}
                    </div>
                  )}
                </div>

                {/* 查询结果 */}
                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <h3 className="text-base font-bold text-[var(--primary)] mb-5">
                    「{attrValue || "…"}」热度时间线
                  </h3>

                  {historyLoading ? (
                    <LoadingState message="正在查询历史数据..." />
                  ) : historyData.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)] py-8 text-center">暂无历史数据，请调整查询条件</p>
                  ) : (
                    <div className="space-y-1">
                      {historyData.map((point, i) => (
                        <motion.div
                          key={point.date}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.02 }}
                          className="flex items-center gap-4 py-2 px-3 rounded-lg hover:bg-[var(--muted)] transition-colors"
                        >
                          <span className="text-xs text-[var(--muted-foreground)] w-24 shrink-0">{point.date}</span>
                          <div className="flex-1 h-2.5 bg-[var(--muted)] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${point.heat >= 80 ? "bg-emerald-500" : point.heat >= 50 ? "bg-amber-400" : "bg-rose-400"}`}
                              style={{ width: `${Math.max(point.heat, 4)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-[var(--foreground)] w-12 text-right shrink-0">{point.heat}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ====== 爆款单品 + 搭配区 ====== */}
      <section className="py-6 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6 sm:p-8"
          >
            {/* 标题 + 按钮 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--primary)] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                  爆款单品 + AI 搭配建议
                </h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">基于趋势预测结果，生成爆款单品及搭配方案</p>
              </div>
              <button
                type="button"
                disabled={collectionLoading}
                onClick={handleGenerateCollection}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--accent)]/20 whitespace-nowrap"
              >
                {collectionLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> 生成中...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> 生成爆款搭配</>
                )}
              </button>
            </div>

            {collectionError && (
              <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {collectionError}
              </div>
            )}

            {/* 单品列表 */}
            {products.length === 0 && !collectionLoading ? (
              <div className="text-center py-12">
                <Sparkles className="w-10 h-10 text-[var(--border)] mx-auto mb-3" />
                <p className="text-sm text-[var(--muted-foreground)]">点击「生成爆款搭配」获取 AI 推荐的爆款单品</p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                variants={stagger}
                initial="hidden"
                animate="visible"
              >
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    variants={fadeUp}
                    custom={i}
                    className="group bg-[var(--muted)] rounded-2xl overflow-hidden border border-[var(--border)] hover:border-[var(--accent)]/40 hover:shadow-md transition-all duration-300"
                  >
                    {/* 商品图片 */}
                    <div className="relative aspect-[3/4] bg-[var(--border)] overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Shirt className="w-12 h-12 text-[var(--muted-foreground)]/40" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 rounded-lg bg-white/90 text-[var(--accent)] text-xs font-bold shadow-sm">
                          ¥{product.price}
                        </span>
                      </div>
                    </div>

                    {/* 商品信息 */}
                    <div className="p-4">
                      <h4 className="text-sm font-bold text-[var(--primary)] line-clamp-2">{product.title}</h4>

                      {/* 展开搭配建议 */}
                      {product.matchSuggestion && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedProductId(expandedProductId === product.id ? null : product.id)
                            }
                            className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                          >
                            搭配建议 <ChevronDown className={`w-3 h-3 transition-transform ${expandedProductId === product.id ? "rotate-180" : ""}`} />
                          </button>
                          <AnimatePresence>
                            {expandedProductId === product.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-2 p-3 bg-white rounded-xl text-xs text-[var(--muted-foreground)] leading-relaxed border border-[var(--border)]">
                                  {product.matchSuggestion}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

/* ===================== 复用子组件 ===================== */

/** 加载占位 */
function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)] mr-3" />
      <span className="text-[var(--muted-foreground)] text-sm">{message}</span>
    </div>
  );
}

/** 空状态 */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <TrendingUp className="w-12 h-12 text-[var(--border)] mx-auto mb-3" />
      <p className="text-sm text-[var(--muted-foreground)]">{message}</p>
    </div>
  );
}
