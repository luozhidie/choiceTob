"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Copy, Search, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const DOMAINS = ["服装", "金融", "股票", "艺术", "其他"];
const CATEGORIES = ["选品判断", "搭配方案", "客户画像", "销售方法", "行业经验", "其他"];

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
};

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ domain: "", category: "", status: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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
        // 表可能尚未创建（42P01）
        if (String(data.error || "").includes("relation") || String(data.error || "").includes("does not exist")) {
          setLoadError("TABLE_MISSING");
        } else {
          setLoadError(data.error || "加载失败");
        }
        setTokens([]);
      } else {
        setTokens(data.data || []);
      }
    } catch (e: any) {
      setLoadError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const seedDemo = async () => {
    setSaving(true);
    try {
      const demo = {
        domain: "服装",
        category: "选品判断",
        title: "春秋女装连衣裙选品判断",
        summary: "客群匹配 + 价格带可控毛利 + 命中爆款信号则推，否则观望/放弃",
        fields: {
          品类: "女装/连衣裙",
          季节: "春秋",
          客群: "25-35岁职场女性",
          价格带: "99-299",
          风格: "简韩/通勤",
          爆款信号: ["小红书搜索量周环比>30%", "退货率<15%", "复购>2次"],
          风险点: ["尺码偏窄", "面料易皱"],
        },
        prompt: "你是一名资深服装买手。根据以下判断逻辑筛选本周值得上的款：\n- 客群匹配度\n- 价格带在可控毛利内\n- 命中爆款信号则优先\n输出：推荐/观望/放弃 + 理由。",
        tags: ["女装", "连衣裙", "爆款"],
        metric: "近30天推荐命中率",
        status: "published",
        owner: "骆芷蝶",
      };
      const res = await fetch("/api/admin/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(demo),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (String(data.error || "").includes("relation") || String(data.error || "").includes("does not exist")) {
          setLoadError("TABLE_MISSING");
        } else {
          alert("示例插入失败：" + (data.error || ""));
        }
      } else {
        setToast("已插入示例词元");
        setTimeout(() => setToast(null), 2000);
        load();
      }
    } catch (e: any) {
      alert("示例插入异常：" + (e.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (t: Token) => {
    setEditingId(t.id);
    setForm({
      domain: t.domain,
      category: t.category,
      title: t.title,
      summary: t.summary || "",
      fields: typeof t.fields === "string" ? t.fields : JSON.stringify(t.fields || {}, null, 2),
      prompt: t.prompt || "",
      tags: (t.tags || []).join(", "),
      metric: t.metric || "",
      status: t.status || "draft",
      owner: t.owner || "",
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
    if (!confirm("确定删除该词元？")) return;
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

  const statusLabel = (s: string) => (s === "published" ? "已发布" : "草稿");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">选品判断词元</h1>
          <p className="text-muted-foreground mt-1">把行业经验封装成可调用、可组合、可计量、可交易的词元资产（跨行业：服装/金融/股票/艺术）</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> 新建词元
        </button>
        <button onClick={seedDemo} className="btn-secondary text-sm">插入示例</button>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* 筛选 */}
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
        <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); }}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
        </select>
        <button onClick={load} className="btn-secondary text-sm flex items-center gap-2">
          <Search className="w-4 h-4" /> 查询
        </button>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin inline" /> 加载中…</div>
      ) : loadError === "TABLE_MISSING" ? (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
          <div className="flex items-center gap-2 text-amber-800 font-medium mb-2"><AlertCircle className="w-5 h-5" /> 数据表尚未创建</div>
          <p className="text-sm text-amber-700">
            请到 Supabase Dashboard → SQL Editor 执行仓库里的 <code className="bg-white px-1 rounded">supabase-tokens.sql</code> 一次，刷新本页即可使用。
          </p>
        </div>
      ) : loadError ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-red-700 text-sm">{loadError}</div>
      ) : tokens.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-muted-foreground">
          还没有词元，点右上角「新建词元」开始封装你的第一条行业经验。
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
                  <span className={`px-1.5 py-0.5 rounded text-xs ${t.status === "published" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{statusLabel(t.status)}</span>
                  <span className="text-xs text-gray-400">调用 {t.usage_count} 次</span>
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
              <h3 className="font-semibold text-primary">{editingId ? "编辑词元" : "新建词元"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
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
                <label className="block text-sm font-medium mb-1">结构化字段（JSON）</label>
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
