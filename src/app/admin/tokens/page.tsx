"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Copy, Search, Loader2, AlertCircle, CheckCircle2, Network, List, GitBranch } from "lucide-react";

const DOMAINS = ["服装", "金融", "股票", "艺术", "其他"];
const CATEGORIES = ["选品判断", "搭配方案", "客户画像", "销售方法", "行业经验", "其他"];
const LAYERS = ["算力", "数据", "模型", "安全", "应用"];
const LAYER_DESC: Record<string, string> = {
  算力: "生产能力（买服务）",
  数据: "原材料（你攒）",
  模型: "加工能力（调成熟大模型）",
  安全: "可信（合规存证）",
  应用: "商业落地（你的主场）",
};

interface Token {
  id: string;
  domain: string;
  category: string;
  title: string;
  summary: string;
  fields: any;
  prompt: string;
  tags: string[];
  metric: string;
  status: string;
  usage_count: number;
  owner: string;
  created_at: string;
}

const EMPTY_FORM = {
  domain: "服装",
  category: "选品判断",
  layer: "数据",
  title: "",
  summary: "",
  fields: JSON.stringify({
    品类: "女装/连衣裙",
    季节: "春秋",
    客群: "25-35岁职场女性",
    价格带: "99-299",
    风格: "简韩/通勤",
    爆款信号: ["小红书搜索量周环比>30%", "退货率<15%", "复购>2次"],
    风险点: ["尺码偏窄", "面料易皱"],
  }, null, 2),
  prompt: "你是一名资深服装买手。根据以下判断逻辑筛选本周值得上的款：\n- 客群匹配度\n- 价格带在可控毛利内\n- 命中爆款信号则优先\n输出：推荐/观望/放弃 + 理由。",
  tags: "",
  metric: "近30天推荐命中率",
  status: "draft",
  owner: "",
  dependsOn: [] as string[],
  trade: { status: "internal", price: 99, unit: "按次", note: "" },
};

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ domain: "", category: "", layer: "", status: "" });
  const [view, setView] = useState<"list" | "chain" | "relation">("list");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [allTokens, setAllTokens] = useState<Token[]>([]);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const qs = new URLSearchParams();
      if (filters.domain) qs.set("domain", filters.domain);
      if (filters.category) qs.set("category", filters.category);
      if (filters.status) qs.set("status", filters.status);
      const res = await fetch(`/api/admin/tokens?${qs.toString()}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (String(data.error || "").includes("relation") || String(data.error || "").includes("does not exist")) {
          setLoadError("TABLE_MISSING");
        } else {
          setLoadError(data.error || "加载失败");
        }
        setTokens([]);
      } else {
        let list = data.data || [];
        if (filters.layer) list = list.filter((t: Token) => (t.fields?.layer || "") === filters.layer);
        setTokens(list);
      }
    } catch (e: any) {
      setLoadError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  // 加载全部词源（供依赖选择器使用，不受筛选影响）
  const loadAll = async () => {
    try {
      const res = await fetch(`/api/admin/tokens`, { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.ok) setAllTokens(data.data || []);
    } catch { /* 忽略 */ }
  };

  useEffect(() => { load(); loadAll(); /* eslint-disable-next-line */ }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (t: Token) => {
    setEditingId(t.id);
    setForm({
      domain: t.domain,
      category: t.category,
      layer: t.fields?.layer || "数据",
      title: t.title,
      summary: t.summary || "",
      fields: typeof t.fields === "string" ? t.fields : JSON.stringify(t.fields || {}, null, 2),
      prompt: t.prompt || "",
      tags: (t.tags || []).join(", "),
      metric: t.metric || "",
      status: t.status || "draft",
      owner: t.owner || "",
      dependsOn: Array.isArray(t.fields?.depends_on) ? t.fields.depends_on : [],
      trade: {
        status: "internal", price: 99, unit: "按次", note: "",
        ...(t.fields?.trade && typeof t.fields.trade === "object" ? t.fields.trade : {}),
      },
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) { alert("请填写标题"); return; }
    let parsedFields: any = {};
    try {
      parsedFields = form.fields.trim() ? JSON.parse(form.fields) : {};
    } catch {
      alert("结构化字段不是合法 JSON，请检查"); return;
    }
    parsedFields.layer = form.layer;
    // 依赖组合：仅保留仍存在的词源 id
    const validIds = new Set(allTokens.map((t) => t.id));
    parsedFields.depends_on = (form.dependsOn || []).filter((id) => validIds.has(id));
    // 交易信息：价格转数字,缺省兜底
    parsedFields.trade = {
      status: ["internal", "quoted"].includes(form.trade?.status) ? form.trade.status : "internal",
      price: Number(form.trade?.price) || 0,
      unit: form.trade?.unit || "按次",
      note: (form.trade?.note || "").trim(),
    };
    setSaving(true);
    try {
      const payload = {
        domain: form.domain,
        category: form.category,
        title: form.title.trim(),
        summary: form.summary,
        fields: parsedFields,
        prompt: form.prompt,
        tags: form.tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
        metric: form.metric,
        status: form.status,
        owner: form.owner,
      };
      const res = await fetch("/api/admin/tokens", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert("保存失败：" + (data.error || "未知错误"));
      } else {
        setShowForm(false);
        setToast(editingId ? "已更新" : "已创建");
        setTimeout(() => setToast(null), 2000);
        load();
      }
    } catch (e: any) {
      alert("保存异常：" + (e.message || "未知错误"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("确定删除该词源？")) return;
    try {
      const res = await fetch(`/api/admin/tokens?id=${id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.ok) alert("删除失败：" + (data.error || ""));
      else load();
    } catch (e: any) {
      alert("删除异常：" + (e.message || ""));
    }
  };

  const copyPrompt = (t: Token) => {
    navigator.clipboard?.writeText(t.prompt || "").then(() => {
      setToast("提示词已复制");
      setTimeout(() => setToast(null), 2000);
    });
  };

  const buildToken = (o: any) => ({
    domain: o.domain || "服装",
    category: o.category || "行业经验",
    title: o.title,
    summary: o.summary || "",
    fields: {
      ...(o.fields || {}),
      layer: o.layer || "数据",
      trade: {
        status: "quoted",
        price: 99,
        unit: "按次",
        note: "示例价格, 请按你的实际价值修改",
        ...(o.fields?.trade && typeof o.fields.trade === "object" ? o.fields.trade : {}),
      },
    },
    prompt: o.prompt || "",
    tags: o.tags || [],
    metric: o.metric || "",
    status: o.status || "published",
    owner: o.owner || "骆芷蝶",
  });

  const seedDemo = async () => {
    setSaving(true);
    try {
      const demo = buildToken({
        domain: "服装", category: "选品判断", layer: "数据",
        title: "春秋女装连衣裙选品判断",
        summary: "客群匹配 + 价格带可控毛利 + 命中爆款信号则推，否则观望/放弃",
        fields: { 品类: "女装/连衣裙", 季节: "春秋", 客群: "25-35岁职场女性", 价格带: "99-299", 风格: "简韩/通勤", 爆款信号: ["小红书搜索量周环比>30%", "退货率<15%", "复购>2次"], 风险点: ["尺码偏窄", "面料易皱"] },
        prompt: "你是一名资深服装买手。根据以下判断逻辑筛选本周值得上的款：\n- 客群匹配度\n- 价格带在可控毛利内\n- 命中爆款信号则优先\n输出：推荐/观望/放弃 + 理由。",
        tags: ["女装", "连衣裙", "爆款"], metric: "近30天推荐命中率",
      });
      const res = await fetch("/api/admin/tokens", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(demo) });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (String(data.error || "").includes("relation") || String(data.error || "").includes("does not exist")) setLoadError("TABLE_MISSING");
        else alert("示例插入失败：" + (data.error || ""));
      } else {
        setToast("已插入示例词源"); setTimeout(() => setToast(null), 2000); load();
      }
    } catch (e: any) { alert("示例插入异常：" + (e.message || "")); }
    finally { setSaving(false); }
  };

  // 各行业示例：把金融/股票/艺术也做一遍
  const seedCrossIndustry = async () => {
    setSaving(true);
    try {
      const demos = [
        buildToken({ domain: "金融", category: "行业经验", layer: "数据", title: "信贷风控特征词源", summary: "把风控规则拆成可调用的特征单元", fields: { 维度: ["负债收入比", "查询频次", "历史逾期"], 阈值: "负债比<50%", 处置: "超阈值转人工" }, prompt: "你是风控专家，依据以下特征判断申请人的风险等级：\n- 负债收入比\n- 近6月查询频次\n- 历史逾期\n输出：低/中/高风险 + 依据。", tags: ["金融", "风控"], metric: "坏账率下降幅度" }),
        buildToken({ domain: "金融", category: "客户画像", layer: "应用", title: "理财客户分层词源", summary: "按资产与风险偏好把客户分层匹配产品", fields: { 分层: ["保守", "稳健", "进取"], 匹配: "进取→权益类" }, prompt: "你是理财顾问，根据客户资产规模与风险偏好推荐配置：\n输出：客户分层 + 产品匹配建议。", tags: ["金融", "客户"], metric: "配置转化率" }),
        buildToken({ domain: "股票", category: "行业经验", layer: "数据", title: "量价异常信号词源", summary: "把异动信号封装成可组合单元（基于 stock-monitor 数据）", fields: { 信号: ["放量突破", "缩量企稳", "背离"], 周期: "日线" }, prompt: "你是量化分析师，识别以下量价异常：\n- 放量突破平台\n- 缩量企稳\n- 量价背离\n输出：信号 + 强度。", tags: ["股票", "量价"], metric: "信号命中率" }),
        buildToken({ domain: "股票", category: "选品判断", layer: "模型", title: "选股因子组合词源", summary: "把选股逻辑拆成可组合的因子单元", fields: { 因子: ["动量", "质量", "低波"], 权重: "动量0.4/质量0.4/低波0.2" }, prompt: "你是选股模型，按因子组合打分：\n- 动量\n- 质量\n- 低波\n输出：综合评分 + 排序。", tags: ["股票", "因子"], metric: "组合超额收益" }),
        buildToken({ domain: "股票", category: "销售方法", layer: "应用", title: "复盘投教话术词源", summary: "把复盘方法封装成可调用投教话术", fields: { 结构: ["今日回顾", "关键决策", "教训"], 风格: "口语化" }, prompt: "你是投教主播，按结构生成复盘口播稿：\n- 今日回顾\n- 关键决策\n- 教训\n输出：口播文案。", tags: ["股票", "投教"], metric: "完播率" }),
        buildToken({ domain: "艺术", category: "行业经验", layer: "数据", title: "艺术品估值特征词源", summary: "把估值逻辑拆成可调用特征", fields: { 维度: ["艺术家地位", "流通记录", "品相"], 权重: "流通记录>品相" }, prompt: "你是艺术顾问，依据特征评估作品价值区间：\n输出：估值区间 + 依据。", tags: ["艺术", "估值"], metric: "成交价偏差率" }),
        buildToken({ domain: "艺术", category: "客户画像", layer: "应用", title: "策展匹配词源", summary: "把藏家画像与作品做匹配", fields: { 匹配: ["风格偏好", "预算", "收藏阶段"] }, prompt: "你是策展人，根据藏家画像推荐作品与展览主题：\n输出：匹配方案。", tags: ["艺术", "策展"], metric: "成交转化率" }),
      ];
      let okCount = 0;
      for (const d of demos) {
        const res = await fetch("/api/admin/tokens", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(d) });
        const data = await res.json();
        if (res.ok && data.ok) okCount++;
      }
      setToast(`已插入 ${okCount} 条跨行业词源`);
      setTimeout(() => setToast(null), 2000);
      load();
    } catch (e: any) { alert("插入异常：" + (e.message || "")); }
    finally { setSaving(false); }
  };

  // 组合编排示例（扇出链路）：选品判断 → 调用「客户画像」+「销售方法」，演示可组合工作流
  const seedComposition = async () => {
    setSaving(true);
    try {
      // 去重：已存在则跳过
      const chk = await fetch("/api/admin/tokens", { credentials: "include" });
      const chkData = await chk.json();
      if (chk.ok && chkData.ok && (chkData.data || []).some((t: Token) => t.title === "连衣裙选品判断（含客户画像+销售方法）")) {
        setToast("组合链路示例已存在"); setTimeout(() => setToast(null), 2000); setSaving(false); return;
      }

      // 1) 客户画像（被调用的子词源）
      const profile = buildToken({
        domain: "服装", category: "客户画像", layer: "应用",
        title: "女装25-35职场女性画像",
        summary: "把目标客群特征封装成可调用画像，供选品判断组合调用",
        fields: { 画像: ["25-35职场女性", "注重性价比", "通勤+约会双场景", "小红书重度用户"], 痛点: ["担心显胖", "怕廉价感"] },
        prompt: "你是用户研究员，依据以下画像判断候选商品是否匹配目标客群：\n- 年龄/身份\n- 场景\n- 痛点\n输出：匹配度 高/中/低 + 依据。",
        tags: ["服装", "客户画像"], metric: "画像命中率",
      });
      const r1 = await fetch("/api/admin/tokens", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(profile) });
      const d1 = await r1.json();
      if (!r1.ok || !d1.ok) { alert("组合示例失败：" + (d1.error || "创建子词源异常")); return; }
      const profileId = d1.data.id;

      // 2) 销售方法（被调用的子词源）
      const sales = buildToken({
        domain: "服装", category: "销售方法", layer: "应用",
        title: "连衣裙朋友圈成交话术",
        summary: "把成交话术封装成可调用销售方法，供选品判断组合调用产出文案",
        fields: { 结构: ["痛点开场", "上身效果", "限时促单"], 风格: "口语化/真实" },
        prompt: "你是销售，基于客户画像与选品结论，生成朋友圈成交话术：\n- 痛点开场\n- 上身效果\n- 限时促单\n输出：话术文案。",
        tags: ["服装", "销售"], metric: "转化率",
      });
      const r2 = await fetch("/api/admin/tokens", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(sales) });
      const d2 = await r2.json();
      if (!r2.ok || !d2.ok) { alert("组合示例失败：" + (d2.error || "创建销售方法异常")); return; }
      const salesId = d2.data.id;

      // 3) 选品判断（主词元，扇出调用上面两条子词元）
      const judge = buildToken({
        domain: "服装", category: "选品判断", layer: "模型",
        title: "连衣裙选品判断（含客户画像+销售方法）",
        summary: "先过客户画像关，再判爆款信号，最后调销售方法产出话术——演示词源组合编排",
        fields: { 品类: "女装/连衣裙", 价格带: "99-299", 爆款信号: ["小红书搜索量周环比>30%", "退货率<15%"], 风险点: ["尺码偏窄", "面料易皱"], depends_on: [profileId, salesId] },
        prompt: "你是资深服装买手。先调用「女装25-35职场女性画像」判断客群匹配度，匹配度低直接放弃；匹配度高再结合爆款信号给推荐/观望/放弃结论；最后调用「连衣裙朋友圈成交话术」产出成交话术。\n输出：结论 + 理由 + 话术。",
        tags: ["女装", "连衣裙", "组合"], metric: "推荐命中率",
      });
      const r3 = await fetch("/api/admin/tokens", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(judge) });
      const d3 = await r3.json();
      if (!r3.ok || !d3.ok) { alert("组合示例失败：" + (d3.error || "创建主词源异常")); return; }

      setToast("已插入组合链路示例（选品判断 → 客户画像 + 销售方法）");
      setTimeout(() => setToast(null), 2000);
      load(); loadAll();
    } catch (e: any) { alert("插入异常：" + (e.message || "")); }
    finally { setSaving(false); }
  };

  const statusLabel = (s: string) => (s === "published" ? "已发布" : "草稿");
  const layerBadge = (layer?: string) => (layer ? <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-xs">{layer}</span> : null);

  // 关系谱：基于全量词源，以 fields.depends_on 为边绘制「谁组合调用谁」的树
  const byIdAll = new Map<string, Token>((allTokens || []).map((t) => [t.id, t]));
  const relationDepended = new Set<string>();
  (allTokens || []).forEach((t) => ((t.fields?.depends_on as string[]) || []).forEach((id: string) => relationDepended.add(id)));
  const relationRoots = (allTokens || []).filter((t) => !relationDepended.has(t.id));
  const renderRelationNode = (t: Token, depth: number, visited: Set<string>) => {
    if (visited.has(t.id)) {
      return (
        <div key={t.id} style={{ marginLeft: depth * 22 }} className="my-1">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-600">⚠ 检测到循环依赖：{t.title}</div>
        </div>
      );
    }
    const nextVisited = new Set(visited); nextVisited.add(t.id);
    const deps = ((t.fields?.depends_on as string[]) || []).filter(Boolean);
    return (
      <div key={t.id} style={{ marginLeft: depth * 22 }} className="my-1">
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2">
          {depth > 0 && <span className="text-purple-400 font-bold">↳</span>}
          <span className="font-medium text-primary flex-1 truncate">{t.title}</span>
          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{t.domain}</span>
          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">{t.category}</span>
          <span className={`px-1.5 py-0.5 rounded text-xs ${t.status === "published" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{t.status === "published" ? "已发布" : "草稿"}</span>
        </div>
        {depth < 6 && deps.map((id) => {
          const c = byIdAll.get(id);
          return c ? renderRelationNode(c, depth + 1, nextVisited) : (
            <div key={id} style={{ marginLeft: (depth + 1) * 22 }} className="my-1 inline-flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-xs text-gray-400">⚠ 依赖的词元已删除（{String(id).slice(0, 8)}…）</div>
          );
        })}
      </div>
    );
  };

  // 产业链视图：按 layer 分组
  const chainTokens = filters.domain ? tokens.filter((t) => t.domain === filters.domain) : tokens;
  const byLayer: Record<string, Token[]> = {};
  for (const l of LAYERS) byLayer[l] = [];
  for (const t of chainTokens) {
    const l = t.fields?.layer || "数据";
    (byLayer[l] || (byLayer[l] = [])).push(t);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">词源资产管理</h1>
          <p className="text-muted-foreground mt-1">把各行业经验封装成可调用、可组合、可计量、可交易的词源（服装/金融/股票/艺术）</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> 新建词源</button>
          <button onClick={seedDemo} className="btn-secondary text-sm">插入示例</button>
          <button onClick={seedCrossIndustry} className="btn-secondary text-sm">插入各行业示例</button>
          <button onClick={seedComposition} className="btn-secondary text-sm flex items-center gap-1"><Network className="w-3.5 h-3.5" /> 插入组合示例</button>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* 筛选 + 视图切换 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <select value={filters.domain} onChange={(e) => { setFilters({ ...filters, domain: e.target.value }); }}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
          <option value="">全部行业</option>
          {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filters.category} onChange={(e) => { setFilters({ ...filters, category: e.target.value }); }}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
          <option value="">全部类型</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.layer} onChange={(e) => { setFilters({ ...filters, layer: e.target.value }); }}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
          <option value="">全部环节</option>
          {LAYERS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); }}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
        </select>
        <button onClick={load} className="btn-secondary text-sm flex items-center gap-2"><Search className="w-4 h-4" /> 查询</button>
        <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 ${view === "list" ? "bg-white shadow text-primary" : "text-gray-500"}`}><List className="w-3.5 h-3.5" /> 列表</button>
          <button onClick={() => setView("chain")} className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 ${view === "chain" ? "bg-white shadow text-primary" : "text-gray-500"}`}><Network className="w-3.5 h-3.5" /> 产业链</button>
          <button onClick={() => setView("relation")} className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 ${view === "relation" ? "bg-white shadow text-primary" : "text-gray-500"}`}><GitBranch className="w-3.5 h-3.5" /> 关系谱</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin inline" /> 加载中…</div>
      ) : loadError === "TABLE_MISSING" ? (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
          <div className="flex items-center gap-2 text-amber-800 font-medium mb-2"><AlertCircle className="w-5 h-5" /> 数据表尚未创建</div>
          <p className="text-sm text-amber-700">请到 Supabase Dashboard → SQL Editor 执行仓库里的 <code className="bg-white px-1 rounded">supabase-tokens.sql</code> 一次，刷新本页即可使用。</p>
        </div>
      ) : loadError ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-red-700 text-sm">{loadError}</div>
      ) : tokens.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-muted-foreground">
          还没有词源，点「新建词源」或「插入示例 / 插入各行业示例」开始。
        </div>
      ) : view === "chain" ? (
        <div className="space-y-4">
          {!filters.domain && <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">提示：上方选一个行业（如服装/股票），产业链视图会按五主题分层展示该行业的词源。</div>}
          {LAYERS.map((l) => (
            <div key={l} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold text-primary">{l}</span>
                <span className="text-xs text-muted-foreground">{LAYER_DESC[l]}</span>
                <span className="text-xs text-gray-400 ml-auto">{byLayer[l]?.length || 0} 条</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(byLayer[l] || []).map((t) => (
                  <div key={t.id} className="flex items-center gap-2 border border-gray-100 rounded-lg px-3 py-2">
                    <span className="text-sm text-primary flex-1 truncate">{t.title}</span>
                    <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">{t.domain}</span>
                    <button onClick={() => copyPrompt(t)} title="复制提示词" className="p-1 text-gray-400 hover:text-accent"><Copy className="w-3.5 h-3.5" /></button>
                    <button onClick={() => openEdit(t)} title="编辑" className="p-1 text-gray-400 hover:text-accent"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(t.id)} title="删除" className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                {(byLayer[l] || []).length === 0 && <div className="text-xs text-gray-400 py-1">（该环节暂无词源）</div>}
              </div>
            </div>
          ))}
        </div>
      ) : view === "relation" ? (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">关系谱：箭头「↳」表示「组合调用」。顶层为不被任何词元依赖的根词源；缩进项为其调用的子词源（可跨行业）。检测到环会标红。</div>
          {relationRoots.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-muted-foreground">还没有调用关系，给某条词元设置「组合调用其它词源」后这里会显示链路。</div>
          ) : (
            relationRoots.map((root) => renderRelationNode(root, 0, new Set()))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-primary">{t.title}</span>
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{t.domain}</span>
                  <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">{t.category}</span>
                  {layerBadge(t.fields?.layer)}
                  <span className={`px-1.5 py-0.5 rounded text-xs ${t.status === "published" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{statusLabel(t.status)}</span>
                  <span className="text-xs text-gray-400">调用 {t.usage_count} 次</span>
                  {t.fields?.trade?.status === "quoted" && (
                    <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-xs">¥{t.fields.trade.price}/{t.fields.trade.unit}</span>
                  )}
                  {Array.isArray(t.fields?.depends_on) && t.fields.depends_on.length > 0 && (() => {
                    const names = (t.fields.depends_on as string[]).map((id) => byIdAll.get(id)?.title).filter(Boolean) as string[];
                    const shown = names.slice(0, 2).join("、");
                    const more = names.length > 2 ? ` 等${names.length}条` : "";
                    return (
                      <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs flex items-center gap-1"><Network className="w-3 h-3" /> 调用：{shown}{more}</span>
                    );
                  })()}
                </div>
                {t.summary && <p className="text-sm text-muted-foreground mt-1">{t.summary}</p>}
                {t.metric && <p className="text-xs text-gray-400 mt-1">计量：{t.metric}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => copyPrompt(t)} title="复制提示词" className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg"><Copy className="w-4 h-4" /></button>
                <button onClick={() => openEdit(t)} title="编辑" className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => remove(t.id)} title="删除" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 表单弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-primary">{editingId ? "编辑词源" : "新建词源"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">行业</label>
                  <select value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">类型</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">产业链环节</label>
                  <select value={form.layer} onChange={(e) => setForm({ ...form, layer: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    {LAYERS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">标题 *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="例如：春秋女装连衣裙选品判断" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">一句话判断逻辑</label>
                <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="例如：客群匹配+价格带可控毛利+命中爆款信号则推" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">结构化字段（JSON，可含 layer 等）</label>
                <textarea value={form.fields} onChange={(e) => setForm({ ...form, fields: e.target.value })}
                  rows={6} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">可调用提示词</label>
                <textarea value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                  rows={5} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">标签（逗号分隔）</label>
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="女装,连衣裙,爆款" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">计量标签</label>
                  <input value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="近30天推荐命中率" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">状态</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <option value="draft">草稿</option>
                    <option value="published">已发布</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">作者/来源</label>
                  <input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="骆芷蝶" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <Network className="w-3.5 h-3.5" /> 组合调用其它词源（可选，可跨行业）
                </label>
                <p className="text-xs text-muted-foreground mb-2">选中的词源会被本条词源在 AI 选品时一并调用，形成可编排工作流。保存后生效。</p>
                <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50 space-y-1">
                  {allTokens.filter((t) => t.id !== editingId).length === 0 && (
                    <div className="text-xs text-gray-400 py-1">暂无可调用的其它词源，先新建几条。</div>
                  )}
                  {allTokens.filter((t) => t.id !== editingId).map((t) => {
                    const checked = (form.dependsOn || []).includes(t.id);
                    return (
                      <label key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white cursor-pointer text-sm">
                        <input type="checkbox" checked={checked} onChange={(e) => {
                          const next = e.target.checked
                            ? [...(form.dependsOn || []), t.id]
                            : (form.dependsOn || []).filter((id) => id !== t.id);
                          setForm({ ...form, dependsOn: next });
                        }} className="accent-purple-600" />
                        <span className="flex-1 truncate">{t.title}</span>
                        <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">{t.domain}</span>
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{t.category}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-medium mb-3 flex items-center gap-1">
                <span>🛒</span> 交易信息（把这条词源摆上货架）
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">上架状态</label>
                  <select value={form.trade?.status || "internal"} onChange={(e) => setForm({ ...form, trade: { ...(form.trade || {}), status: e.target.value as any } })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <option value="internal">仅内部使用</option>
                    <option value="quoted">上架展示，可询价</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">价格（元）</label>
                  <input type="number" min={0} value={form.trade?.price ?? 0} onChange={(e) => setForm({ ...form, trade: { ...(form.trade || {}), price: Number(e.target.value) } })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="99" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">计价单位</label>
                  <select value={form.trade?.unit || "按次"} onChange={(e) => setForm({ ...form, trade: { ...(form.trade || {}), unit: e.target.value } })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <option value="按次">按次</option>
                    <option value="按月">按月</option>
                    <option value="按套">按套</option>
                    <option value="买断">买断</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-muted-foreground mb-1">交易说明（为什么值这个价）</label>
                <input value={form.trade?.note || ""} onChange={(e) => setForm({ ...form, trade: { ...(form.trade || {}), note: e.target.value } })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="例如：接入本词源后，连衣裙选品命中率提升 30%" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-5">
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">取消</button>
              <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} 保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
