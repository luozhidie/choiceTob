"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Package, Plus, Trash2, Edit2, AlertTriangle,
  TrendingDown, TrendingUp, Minus, Search,
} from "lucide-react";

interface InventoryItem {
  id?: string;
  store_id: string;
  sku_code: string;
  product_name: string;
  category: string;
  color: string;
  size: string;
  stock_in_qty: number;
  current_stock: number;
  sales_qty: number;
  sell_through_pct?: number;
  turnover_days?: number;
  status: "normal" | "low_stock" | "out_of_stock" | "overstock";
  restock_advice?: string;
}

const CATEGORY_OPTIONS = ["上装", "下装", "连衣裙", "外套", "配饰"];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "均码"];

export default function InventoryPage() {
  const supabase = createClient();
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);

  // 表单
  const [form, setForm] = useState({
    sku_code: "",
    product_name: "",
    category: "上装",
    color: "",
    size: "M",
    stock_in_qty: "",
    current_stock: "",
    sales_qty: "",
    restock_advice: "",
  });

  /* ── 加载店铺 ───────────────────── */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("stores").select("id, name").order("name");
      setStores(data || []);
      if (data?.[0]) setStoreId(data[0].id);
    })();
  }, []);

  /* ── 加载库存 ───────────────────── */
  const loadInventory = async () => {
    if (!storeId) return;
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    
    // 自动计算售罄率和周转天数
    const processed = (data || []).map((item: any) => {
      const sellThrough = item.stock_in_qty > 0 
        ? (item.sales_qty / item.stock_in_qty) 
        : 0;
      const turnover = item.sales_qty > 0 
        ? Math.round(item.current_stock / (item.sales_qty / 30)) 
        : 999;
      
      let status: InventoryItem["status"] = "normal";
      let advice = "";
      
      if (item.current_stock === 0) {
        status = "out_of_stock";
        advice = "❌ 已断货，紧急补货";
      } else if (sellThrough > 0.8 && item.current_stock < 10) {
        status = "low_stock";
        advice = "⚠️ 热销款，建议补货";
      } else if (turnover > 60 && item.current_stock > 50) {
        status = "overstock";
        advice = "📦 滞销款，考虑促销或退货";
      } else {
        advice = "✅ 库存正常";
      }

      return {
        ...item,
        sell_through_pct: sellThrough,
        turnover_days: turnover,
        status,
        restock_advice: advice,
      };
    });

    setItems(processed);
  };

  useEffect(() => { loadInventory(); }, [storeId]);

  /* ── 保存 ───────────────── */
  const saveItem = async () => {
    if (!storeId) return;
    const payload = {
      store_id: storeId,
      sku_code: form.sku_code,
      product_name: form.product_name,
      category: form.category,
      color: form.color,
      size: form.size,
      stock_in_qty: +form.stock_in_qty || 0,
      current_stock: +form.current_stock || 0,
      sales_qty: +form.sales_qty || 0,
      status: "normal",
    };

    if (editing?.id) {
      await supabase.from("inventory").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("inventory").insert(payload);
    }
    setShowForm(false); setEditing(null);
    resetForm();
    loadInventory();
  };

  /* ── 删除 ───────────────── */
  const deleteItem = async (id: string) => {
    if (!confirm("确定删除这条库存记录？")) return;
    await supabase.from("inventory").delete().eq("id", id);
    loadInventory();
  };

  /* ── 重置表单 ──────────────── */
  const resetForm = () => {
    setForm({
      sku_code: "",
      product_name: "",
      category: "上装",
      color: "",
      size: "M",
      stock_in_qty: "",
      current_stock: "",
      sales_qty: "",
      restock_advice: "",
    });
  };

  /* ── 筛选 ───────────────── */
  const filteredItems = items.filter((item) => {
    const matchSearch = 
      item.sku_code.toLowerCase().includes(search.toLowerCase()) ||
      item.product_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  /* ── 统计 ───────────────── */
  const stats = {
    total: items.length,
    lowStock: items.filter(i => i.status === "low_stock").length,
    outOfStock: items.filter(i => i.status === "out_of_stock").length,
    overstock: items.filter(i => i.status === "overstock").length,
    totalValue: items.reduce((s, i) => s + (i.current_stock * 100), 0), // 假设平均单价100
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
            <h1 className="text-2xl font-bold text-gray-800">库存管理</h1>
            <p className="text-sm text-gray-500 mt-1">实时库存监控 · 售罄率 · 周转天数 · 智能补货建议</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={storeId} onChange={e => setStoreId(e.target.value)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm">
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={() => { resetForm(); setEditing(null); setShowForm(true); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-4 h-4" /> 入库录入
            </button>
          </div>
        </div>

        {/* ── 统计卡片 ───────────────── */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-xs text-gray-500">库存SKU</div>
          </div>
          <div className="bg-orange-50 rounded-2xl border border-orange-200 p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
            <div className="text-xs text-orange-500">库存不足</div>
          </div>
          <div className="bg-red-50 rounded-2xl border border-red-200 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            <div className="text-xs text-red-500">已断货</div>
          </div>
          <div className="bg-purple-50 rounded-2xl border border-purple-200 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.overstock}</div>
            <div className="text-xs text-purple-500">滞销积压</div>
          </div>
          <div className="bg-green-50 rounded-2xl border border-green-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">¥{stats.totalValue.toLocaleString()}</div>
            <div className="text-xs text-green-500">库存价值</div>
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
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="all">全部状态</option>
            <option value="normal">✅ 正常</option>
            <option value="low_stock">⚠️ 库存不足</option>
            <option value="out_of_stock">❌ 断货</option>
            <option value="overstock">📦 滞销积压</option>
          </select>
        </div>

        {/* ── 入库弹窗 ──────────────── */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
              <h2 className="text-lg font-bold mb-4">{editing ? "编辑" : "新增"}库存记录</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">款号 *</label>
                    <input type="text" value={form.sku_code} onChange={e => setForm({ ...form, sku_code: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如：SP2026-001" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">品名 *</label>
                    <input type="text" value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如：真丝连衣裙" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">品类</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">颜色</label>
                    <input type="text" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="米白" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">尺码</label>
                    <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      {SIZE_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">入库数量</label>
                    <input type="number" value={form.stock_in_qty} onChange={e => setForm({ ...form, stock_in_qty: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">当前库存</label>
                    <input type="number" value={form.current_stock} onChange={e => setForm({ ...form, current_stock: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">已售数量</label>
                    <input type="number" value={form.sales_qty} onChange={e => setForm({ ...form, sales_qty: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">补货建议（可选）</label>
                  <input type="text" value={form.restock_advice} onChange={e => setForm({ ...form, restock_advice: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如：建议补货50件" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={saveItem} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">保存</button>
                  <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 py-2.5 bg-gray-200 rounded-xl text-sm">取消</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 库存表格 ───────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3 text-left">款号</th>
                <th className="p-3 text-left">品名</th>
                <th className="p-3 text-left">品类/颜色/尺码</th>
                <th className="p-3 text-right">入库</th>
                <th className="p-3 text-right">当前</th>
                <th className="p-3 text-right">已售</th>
                <th className="p-3 text-right">售罄率</th>
                <th className="p-3 text-right">周转</th>
                <th className="p-3 text-left">补货建议</th>
                <th className="p-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{item.sku_code}</td>
                  <td className="p-3 font-semibold">{item.product_name}</td>
                  <td className="p-3 text-gray-500 text-xs">{item.category} · {item.color} · {item.size}</td>
                  <td className="p-3 text-right">{item.stock_in_qty}</td>
                  <td className="p-3 text-right">
                    <span className={`font-bold ${
                      item.status === "out_of_stock" ? "text-red-600" :
                      item.status === "low_stock" ? "text-orange-600" :
                      "text-gray-800"
                    }`}>{item.current_stock}</span>
                  </td>
                  <td className="p-3 text-right text-gray-600">{item.sales_qty}</td>
                  <td className="p-3 text-right">
                    <span className={`${
                      (item.sell_through_pct || 0) > 0.8 ? "text-green-600" :
                      (item.sell_through_pct || 0) > 0.5 ? "text-blue-600" :
                      "text-gray-500"
                    }`}>
                      {((item.sell_through_pct || 0) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className={`${
                      (item.turnover_days || 999) > 60 ? "text-purple-600" :
                      (item.turnover_days || 999) > 30 ? "text-yellow-600" :
                      "text-green-600"
                    }`}>
                      {item.turnover_days === 999 ? "—" : item.turnover_days + "天"}
                    </span>
                  </td>
                  <td className="p-3 text-xs">
                    {item.status === "out_of_stock" && <span className="text-red-600">❌ 断货，紧急补货</span>}
                    {item.status === "low_stock" && <span className="text-orange-600">⚠️ 热销款，建议补货</span>}
                    {item.status === "overstock" && <span className="text-purple-600">📦 滞销，考虑促销</span>}
                    {item.status === "normal" && <span className="text-green-600">✅ 库存正常</span>}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => { setForm({
                      sku_code: item.sku_code,
                      product_name: item.product_name,
                      category: item.category,
                      color: item.color,
                      size: item.size,
                      stock_in_qty: String(item.stock_in_qty),
                      current_stock: String(item.current_stock),
                      sales_qty: String(item.sales_qty),
                      restock_advice: item.restock_advice || "",
                    }); setEditing(item); setShowForm(true); }} className="text-blue-600 hover:text-blue-800 mr-3 text-xs">
                      <Edit2 className="w-3.5 h-3.5 inline" /> 编辑
                    </button>
                    <button onClick={() => deleteItem(item.id!)} className="text-red-500 hover:text-red-700 text-xs">
                      <Trash2 className="w-3.5 h-3.5 inline" /> 删除
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr><td colSpan={10} className="p-8 text-center text-gray-400">暂无库存数据，点击「入库录入」开始</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── 使用说明 ──────────────── */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-bold text-blue-800 mb-2">智能库存监控逻辑</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✅ <strong>正常：</strong> 售罄率适中，库存周转合理</li>
              <li>⚠️ <strong>库存不足：</strong> 售罄率 &gt; 80% 且当前库存 &lt; 10</li>
              <li>❌ <strong>已断货：</strong> 当前库存 = 0</li>
              <li>📦 <strong>滞销积压：</strong> 周转天数 &gt; 60 且库存 &gt; 50</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h3 className="font-bold text-green-800 mb-2">关键指标说明</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>📊 <strong>售罄率：</strong> 已售 / 入库 × 100%，衡量款型受欢迎程度</li>
              <li>🔄 <strong>周转天数：</strong> 当前库存 / (月销/30)，衡量资金占用效率</li>
              <li>💰 <strong>库存价值：</strong> 当前库存 × 假设均价100元（可自定义）</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
