"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Star, CheckCircle, XCircle, AlertCircle, Plus, Edit2, Trash2, Search,
} from "lucide-react";

interface EvaluationItem {
  id?: string;
  store_id: string;
  sku_code: string;
  product_name: string;
  supplier: string;
  design_score: number;
  quality_score: number;
  price_score: number;
  wearability_score: number;
  scarcity_score: number;
  total_score: number;
  decision: string;
  trial_start: string;
  trial_end: string;
  trial_result: string;
}

const DECISION_OPTIONS = ["优先采购", "可考虑", "暂不采购", "淘汰"];
const TRIAL_RESULT_OPTIONS = ["达标", "不达标", "待评估"];

function calcTotal(d: number, q: number, p: number, w: number, s: number) {
  return d + q + p + w + s;
}

function calcDecision(total: number) {
  if (total >= 85) return "优先采购";
  if (total >= 70) return "可考虑";
  if (total >= 50) return "暂不采购";
  return "淘汰";
}

const emptyForm = {
  sku_code: "",
  product_name: "",
  supplier: "",
  design_score: "0",
  quality_score: "0",
  price_score: "0",
  wearability_score: "0",
  scarcity_score: "0",
  trial_start: "",
  trial_end: "",
  trial_result: "待评估",
};

export default function ProductEvaluationPage() {
  const supabase = createClient();
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [items, setItems] = useState<EvaluationItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterDecision, setFilterDecision] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EvaluationItem | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  /* ── 加载店铺 ───────────────────── */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("stores").select("id, name").order("name");
      setStores(data || []);
      if (data?.[0]) setStoreId(data[0].id);
    })();
  }, []);

  /* ── 加载评估数据 ───────────────────── */
  const loadData = async () => {
    if (!storeId) return;
    const { data } = await supabase
      .from("product_evaluation")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    setItems(data || []);
  };

  useEffect(() => { loadData(); }, [storeId]);

  /* ── 实时计算总分和决策 ─────────────── */
  const formTotal = calcTotal(
    +form.design_score || 0,
    +form.quality_score || 0,
    +form.price_score || 0,
    +form.wearability_score || 0,
    +form.scarcity_score || 0
  );
  const formDecision = calcDecision(formTotal);

  /* ── 保存 ───────────────── */
  const saveItem = async () => {
    if (!storeId) return;
    if (!form.sku_code || !form.product_name) {
      alert("款号和品名为必填项");
      return;
    }

    const total = formTotal;
    const decision = formDecision;

    const payload = {
      store_id: storeId,
      sku_code: form.sku_code,
      product_name: form.product_name,
      supplier: form.supplier,
      design_score: +form.design_score || 0,
      quality_score: +form.quality_score || 0,
      price_score: +form.price_score || 0,
      wearability_score: +form.wearability_score || 0,
      scarcity_score: +form.scarcity_score || 0,
      total_score: total,
      decision,
      trial_start: form.trial_start || null,
      trial_end: form.trial_end || null,
      trial_result: form.trial_result,
    };

    if (editing?.id) {
      const { error } = await supabase.from("product_evaluation").update(payload).eq("id", editing.id);
      if (error) { alert("更新失败：" + error.message); return; }
    } else {
      const { error } = await supabase.from("product_evaluation").insert(payload);
      if (error) { alert("新增失败：" + error.message); return; }
    }
    setShowForm(false);
    setEditing(null);
    setForm({ ...emptyForm });
    loadData();
  };

  /* ── 删除 ───────────────── */
  const deleteItem = async (id: string) => {
    if (!confirm("确定删除这条评估记录？")) return;
    await supabase.from("product_evaluation").delete().eq("id", id);
    loadData();
  };

  /* ── 筛选 ───────────────── */
  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.sku_code.toLowerCase().includes(search.toLowerCase()) ||
      item.product_name.toLowerCase().includes(search.toLowerCase());
    const matchDecision = filterDecision === "all" || item.decision === filterDecision;
    return matchSearch && matchDecision;
  });

  /* ── 统计 ───────────────── */
  const stats = {
    total: items.length,
    priority: items.filter(i => i.decision === "优先采购").length,
    consider: items.filter(i => i.decision === "可考虑").length,
    eliminate: items.filter(i => i.decision === "淘汰").length,
  };

  /* ── 决策标签样式 ───────────────── */
  const decisionBadge = (decision: string) => {
    const map: Record<string, string> = {
      "优先采购": "bg-green-100 text-green-700",
      "可考虑": "bg-blue-100 text-blue-700",
      "暂不采购": "bg-yellow-100 text-yellow-700",
      "淘汰": "bg-red-100 text-red-700",
    };
    return map[decision] || "bg-gray-100 text-gray-700";
  };

  const trialBadge = (result: string) => {
    const map: Record<string, string> = {
      "达标": "text-green-600",
      "不达标": "text-red-600",
      "待评估": "text-gray-500",
    };
    return map[result] || "text-gray-500";
  };

  /* ═════════════════════════════════════
       渲染
       ═════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* ── 头部 ───────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">选品评估</h1>
            <p className="text-sm text-gray-500 mt-1">五维评分 · 智能决策建议 · 试销追踪</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={storeId} onChange={e => setStoreId(e.target.value)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm">
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={() => { setForm({ ...emptyForm }); setEditing(null); setShowForm(true); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-4 h-4" /> 新增评估
            </button>
          </div>
        </div>

        {/* ── 统计卡片 ───────────────── */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-xs text-gray-500">总评估数</div>
          </div>
          <div className="bg-green-50 rounded-2xl border border-green-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.priority}</div>
            <div className="text-xs text-green-500">优先采购</div>
          </div>
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.consider}</div>
            <div className="text-xs text-blue-500">可考虑</div>
          </div>
          <div className="bg-red-50 rounded-2xl border border-red-200 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.eliminate}</div>
            <div className="text-xs text-red-500">淘汰</div>
          </div>
        </div>

        {/* ── 筛选栏 ───────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索款号或品名..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <select value={filterDecision} onChange={e => setFilterDecision(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="all">全部决策</option>
            {DECISION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* ── 新增/编辑弹窗 ──────────────── */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold mb-4">{editing ? "编辑" : "新增"}选品评估</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">款号 *</label>
                    <input type="text" value={form.sku_code} onChange={e => setForm({ ...form, sku_code: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="SP2026-001" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">品名 *</label>
                    <input type="text" value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="真丝连衣裙" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">供应商</label>
                  <input type="text" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="供应商名称" />
                </div>

                {/* 五维评分 */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" /> 五维评分
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">设计感 (0-30)</label>
                      <input type="number" min={0} max={30} value={form.design_score} onChange={e => setForm({ ...form, design_score: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">品质 (0-25)</label>
                      <input type="number" min={0} max={25} value={form.quality_score} onChange={e => setForm({ ...form, quality_score: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">价格竞争力 (0-20)</label>
                      <input type="number" min={0} max={20} value={form.price_score} onChange={e => setForm({ ...form, price_score: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">实穿性 (0-15)</label>
                      <input type="number" min={0} max={15} value={form.wearability_score} onChange={e => setForm({ ...form, wearability_score: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">稀缺性 (0-10)</label>
                      <input type="number" min={0} max={10} value={form.scarcity_score} onChange={e => setForm({ ...form, scarcity_score: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div className="flex flex-col justify-end">
                      <div className="text-xs text-gray-500">自动计算</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-blue-600">{formTotal}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${decisionBadge(formDecision)}`}>{formDecision}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 试销信息 */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">试销开始</label>
                    <input type="date" value={form.trial_start} onChange={e => setForm({ ...form, trial_start: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">试销结束</label>
                    <input type="date" value={form.trial_end} onChange={e => setForm({ ...form, trial_end: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">试销结果</label>
                    <select value={form.trial_result} onChange={e => setForm({ ...form, trial_result: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      {TRIAL_RESULT_OPTIONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={saveItem} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">保存</button>
                  <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 py-2.5 bg-gray-200 rounded-xl text-sm">取消</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 数据表格 ───────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3 text-left">款号</th>
                <th className="p-3 text-left">品名</th>
                <th className="p-3 text-left">供应商</th>
                <th className="p-3 text-center">设计</th>
                <th className="p-3 text-center">品质</th>
                <th className="p-3 text-center">价格</th>
                <th className="p-3 text-center">实穿</th>
                <th className="p-3 text-center">稀缺</th>
                <th className="p-3 text-center">总分</th>
                <th className="p-3 text-center">决策</th>
                <th className="p-3 text-center">试销结果</th>
                <th className="p-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{item.sku_code}</td>
                  <td className="p-3 font-semibold">{item.product_name}</td>
                  <td className="p-3 text-gray-500 text-xs">{item.supplier || "—"}</td>
                  <td className="p-3 text-center">{item.design_score}</td>
                  <td className="p-3 text-center">{item.quality_score}</td>
                  <td className="p-3 text-center">{item.price_score}</td>
                  <td className="p-3 text-center">{item.wearability_score}</td>
                  <td className="p-3 text-center">{item.scarcity_score}</td>
                  <td className="p-3 text-center font-bold text-blue-600">{item.total_score}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${decisionBadge(item.decision)}`}>
                      {item.decision === "优先采购" && <CheckCircle className="w-3 h-3 inline mr-0.5" />}
                      {item.decision === "暂不采购" && <AlertCircle className="w-3 h-3 inline mr-0.5" />}
                      {item.decision === "淘汰" && <XCircle className="w-3 h-3 inline mr-0.5" />}
                      {item.decision === "可考虑" && <Star className="w-3 h-3 inline mr-0.5" />}
                      {item.decision}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-xs ${trialBadge(item.trial_result)}`}>
                      {item.trial_result || "—"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        setForm({
                          sku_code: item.sku_code,
                          product_name: item.product_name,
                          supplier: item.supplier || "",
                          design_score: String(item.design_score),
                          quality_score: String(item.quality_score),
                          price_score: String(item.price_score),
                          wearability_score: String(item.wearability_score),
                          scarcity_score: String(item.scarcity_score),
                          trial_start: item.trial_start || "",
                          trial_end: item.trial_end || "",
                          trial_result: item.trial_result || "待评估",
                        });
                        setEditing(item);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 mr-3 text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 inline" /> 编辑
                    </button>
                    <button onClick={() => deleteItem(item.id!)} className="text-red-500 hover:text-red-700 text-xs">
                      <Trash2 className="w-3.5 h-3.5 inline" /> 删除
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr><td colSpan={12} className="p-8 text-center text-gray-400">暂无评估数据，点击「新增评估」开始</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── 评分说明 ──────────────── */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-bold text-blue-800 mb-2">五维评分体系</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li><Star className="w-3 h-3 inline" /> <strong>设计感 (0-30)：</strong>款式原创性、视觉冲击力</li>
              <li><Star className="w-3 h-3 inline" /> <strong>品质 (0-25)：</strong>面料、做工、细节</li>
              <li><Star className="w-3 h-3 inline" /> <strong>价格竞争力 (0-20)：</strong>同品质下价格优势</li>
              <li><Star className="w-3 h-3 inline" /> <strong>实穿性 (0-15)：</strong>日常可搭配场景数</li>
              <li><Star className="w-3 h-3 inline" /> <strong>稀缺性 (0-10)：</strong>市场同款稀缺程度</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h3 className="font-bold text-green-800 mb-2">决策建议规则</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li><CheckCircle className="w-3 h-3 inline" /> <strong>优先采购：</strong>总分 ≥ 85</li>
              <li><Star className="w-3 h-3 inline" /> <strong>可考虑：</strong>总分 70-84</li>
              <li><AlertCircle className="w-3 h-3 inline" /> <strong>暂不采购：</strong>总分 50-69</li>
              <li><XCircle className="w-3 h-3 inline" /> <strong>淘汰：</strong>总分 &lt; 50</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
