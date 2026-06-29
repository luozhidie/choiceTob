"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ShoppingCart, Plus, Trash2, Edit2, FileText,
  CheckCircle2, Clock, Truck, Package, AlertCircle,
} from "lucide-react";

interface PurchaseOrder {
  id?: string;
  order_no: string;
  supplier: string;
  total_amount: number;
  order_date: string;
  delivery_date?: string;
  payment_terms: string;
  status: "draft" | "confirmed" | "shipped" | "received" | "completed";
  items?: OrderItem[];
}

interface OrderItem {
  id?: string;
  sku_code: string;
  product_name: string;
  color: string;
  size: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const PAYMENT_TERMS = [
  "预付30%",
  "货到付款",
  "月结30天",
  "月结60天",
  "季度结算",
];

const STATUS_OPTIONS = [
  { value: "draft", label: "草稿", color: "gray", icon: FileText },
  { value: "confirmed", label: "已确认", color: "blue", icon: CheckCircle2 },
  { value: "shipped", label: "已发货", color: "orange", icon: Truck },
  { value: "received", label: "已收货", color: "purple", icon: Package },
  { value: "completed", label: "已完成", color: "green", icon: CheckCircle2 },
];

export default function PurchaseOrdersPage() {
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
    if (typeof document !== "undefined") {
      setSupabase(createClient());
    }
  }, []);
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);

  // 表单
  const [form, setForm] = useState({
    order_no: "",
    supplier: "",
    total_amount: "",
    order_date: new Date().toISOString().slice(0, 10),
    delivery_date: "",
    payment_terms: "预付30%",
    status: "draft" as const,
  });

  // 订单明细
  const [items, setItems] = useState<OrderItem[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({
    sku_code: "",
    product_name: "",
    color: "",
    size: "",
    quantity: "",
    unit_price: "",
  });

  /* ── 加载店铺 ───────────────────── */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("stores").select("id, name").order("name");
      setStores(data || []);
      if (data?.[0]) setStoreId(data[0].id);
    })();
  }, []);

  /* ── 加载采购订单 ───────────────── */
  const loadOrders = async () => {
    let query = supabase
      .from("purchase_orders")
      .select("*")
      .order("order_date", { ascending: false });
    if (storeId) query = query.eq("store_id", storeId);
    const { data } = await query;
    setOrders(data || []);
  };

  useEffect(() => { if (storeId) loadOrders(); }, [storeId]);

  /* ── 生成订单号 ──────────────── */
  const generateOrderNo = () => {
    const date = new Date();
    const prefix = "PO" + date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${random}`;
  };

  /* ── 保存订单 ───────────────── */
  const saveOrder = async () => {
    const payload = {
      store_id: storeId || null,
      order_no: form.order_no || generateOrderNo(),
      supplier: form.supplier,
      total_amount: +form.total_amount || items.reduce((s, i) => s + i.total_price, 0),
      order_date: form.order_date,
      delivery_date: form.delivery_date || null,
      payment_terms: form.payment_terms,
      status: form.status,
    };

    let orderId = editing?.id;

    if (editing?.id) {
      await supabase.from("purchase_orders").update(payload).eq("id", editing.id);
    } else {
      const { data } = await supabase.from("purchase_orders").insert(payload).select().single();
      orderId = data?.id;
    }

    // 保存订单明细到 purchase_order_items 表
    if (orderId && items.length > 0) {
      // 先删除旧明细（用订单号匹配）
      await supabase.from("purchase_order_items").delete().eq("order_id", payload.order_no);
      // 插入新明细
      for (const item of items) {
        await supabase.from("purchase_order_items").insert({
          store_id: storeId,
          order_id: payload.order_no,
          sku_code: item.sku_code,
          product_name: item.product_name,
          colors: item.color,
          sizes: item.size,
          quantity: item.quantity,
          cost_price: item.unit_price,
          total_amount: item.total_price,
          status: "draft",
        });
      }
    }

    setShowForm(false); setEditing(null);
    resetForm();
    loadOrders();
  };

  /* ── 删除订单 ───────────────── */
  const deleteOrder = async (id: string, orderNo: string) => {
    if (!confirm("确定删除该采购订单？关联的明细也会被删除。")) return;
    await supabase.from("purchase_orders").delete().eq("id", id);
    await supabase.from("purchase_order_items").delete().eq("order_id", orderNo);
    loadOrders();
  };

  /* ── 确认收货 → 自动入库 ── */
  const receiveOrder = async (orderId: string) => {
    if (!confirm("确认收货？将自动写入库存！")) return;
    try {
      const res = await fetch("/api/purchase-orders/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      alert(`✅ ${data.message}`);
      loadOrders();
    } catch (e: any) {
      alert("收货入库失败：" + e.message);
    }
  };

  /* ── 重置表单 ──────────────── */
  const resetForm = () => {
    setForm({
      order_no: "",
      supplier: "",
      total_amount: "",
      order_date: new Date().toISOString().slice(0, 10),
      delivery_date: "",
      payment_terms: "预付30%",
      status: "draft",
    });
    setItems([]);
  };

  /* ── 添加明细项 ──────────────── */
  const addItem = () => {
    const qty = +itemForm.quantity || 0;
    const price = +itemForm.unit_price || 0;
    const newItem: OrderItem = {
      sku_code: itemForm.sku_code,
      product_name: itemForm.product_name,
      color: itemForm.color,
      size: itemForm.size,
      quantity: qty,
      unit_price: price,
      total_price: qty * price,
    };
    setItems([...items, newItem]);
    setItemForm({ sku_code: "", product_name: "", color: "", size: "", quantity: "", unit_price: "" });
    setShowItemForm(false);
  };

  /* ── 删除明细项 ──────────────── */
  const removeItem = (idx: number) => {
    const newItems = [...items];
    newItems.splice(idx, 1);
    setItems(newItems);
  };

  /* ── 统计 ───────────────── */
  const stats = {
    total: orders.length,
    draft: orders.filter(o => o.status === "draft").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    completed: orders.filter(o => o.status === "completed").length,
    totalValue: orders.reduce((s, o) => s + (o.total_amount || 0), 0),
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
            <h1 className="text-2xl font-bold text-gray-800">采购订单管理</h1>
            <p className="text-sm text-gray-500 mt-1">采购单创建 · 供应商管理 · 订单状态追踪</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={storeId} onChange={e => setStoreId(e.target.value)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm">
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={() => { resetForm(); setEditing(null); setShowForm(true); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-4 h-4" /> 新建采购单
            </button>
          </div>
        </div>

        {/* ── 统计卡片 ───────────────── */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-xs text-gray-500">总订单</div>
          </div>
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <div className="text-xs text-gray-500">草稿</div>
          </div>
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
            <div className="text-xs text-blue-500">已确认</div>
          </div>
          <div className="bg-orange-50 rounded-2xl border border-orange-200 p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.shipped}</div>
            <div className="text-xs text-orange-500">已发货</div>
          </div>
          <div className="bg-green-50 rounded-2xl border border-green-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-green-500">已完成</div>
          </div>
          <div className="bg-purple-50 rounded-2xl border border-purple-200 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">¥{stats.totalValue.toLocaleString()}</div>
            <div className="text-xs text-purple-500">采购总额</div>
          </div>
        </div>

        {/* ── 新建/编辑弹窗 ─────────────── */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center overflow-auto">
            <div className="bg-white rounded-2xl p-8 w-full max-w-3xl shadow-2xl my-8">
              <h2 className="text-lg font-bold mb-4">{editing ? "编辑" : "新建"}采购订单</h2>
              
              {/* 订单基本信息 */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-xs text-gray-500">订单号</label>
                  <input type="text" value={form.order_no} onChange={e => setForm({ ...form, order_no: e.target.value })} placeholder={generateOrderNo()} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">供应商 *</label>
                  <input type="text" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="如：杭州供应商A" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">订单总额</label>
                  <input type="number" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} placeholder="自动计算或手动输入" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-xs text-gray-500">下单日期</label>
                  <input type="date" value={form.order_date} onChange={e => setForm({ ...form, order_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">预计交期</label>
                  <input type="date" value={form.delivery_date} onChange={e => setForm({ ...form, delivery_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">付款条件</label>
                  <select value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    {PAYMENT_TERMS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs text-gray-500">订单状态</label>
                <div className="flex gap-2 mt-1">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setForm({ ...form, status: s.value as any })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                        form.status === s.value 
                          ? `bg-${s.color}-100 text-${s.color}-700 ring-2 ring-${s.color}-300` 
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <s.icon className="w-3 h-3" /> {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 订单明细 */}
              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">采购明细（{items.length} 项）</h3>
                  <button onClick={() => setShowItemForm(true)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> 添加明细
                  </button>
                </div>
                
                {items.length > 0 && (
                  <table className="w-full text-xs mb-2">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="p-2 text-left">款号</th>
                        <th className="p-2 text-left">品名</th>
                        <th className="p-2 text-left">颜色/尺码</th>
                        <th className="p-2 text-right">数量</th>
                        <th className="p-2 text-right">单价</th>
                        <th className="p-2 text-right">小计</th>
                        <th className="p-2 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="p-2 font-mono">{item.sku_code}</td>
                          <td className="p-2">{item.product_name}</td>
                          <td className="p-2 text-gray-500">{item.color} / {item.size}</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">¥{item.unit_price}</td>
                          <td className="p-2 text-right font-semibold">¥{item.total_price.toLocaleString()}</td>
                          <td className="p-2 text-center">
                            <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold">
                      <tr>
                        <td colSpan={5} className="p-2 text-right">合计：</td>
                        <td className="p-2 text-right text-blue-600">¥{items.reduce((s, i) => s + i.total_price, 0).toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>

              {/* 添加明细弹窗 */}
              {showItemForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <h4 className="font-semibold text-sm mb-2">添加采购明细</h4>
                  <div className="grid grid-cols-6 gap-2">
                    <input type="text" placeholder="款号" value={itemForm.sku_code} onChange={e => setItemForm({ ...itemForm, sku_code: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded text-xs" />
                    <input type="text" placeholder="品名" value={itemForm.product_name} onChange={e => setItemForm({ ...itemForm, product_name: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded text-xs" />
                    <input type="text" placeholder="颜色" value={itemForm.color} onChange={e => setItemForm({ ...itemForm, color: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded text-xs" />
                    <input type="text" placeholder="尺码" value={itemForm.size} onChange={e => setItemForm({ ...itemForm, size: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded text-xs" />
                    <input type="number" placeholder="数量" value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded text-xs" />
                    <input type="number" placeholder="单价" value={itemForm.unit_price} onChange={e => setItemForm({ ...itemForm, unit_price: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded text-xs" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={addItem} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs">确认添加</button>
                    <button onClick={() => setShowItemForm(false)} className="px-3 py-1.5 bg-gray-200 rounded text-xs">取消</button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={saveOrder} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">保存订单</button>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 py-2.5 bg-gray-200 rounded-xl text-sm">取消</button>
              </div>
            </div>
          </div>
        )}

        {/* ── 订单列表 ───────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3 text-left">订单号</th>
                <th className="p-3 text-left">供应商</th>
                <th className="p-3 text-right">金额</th>
                <th className="p-3 text-left">下单/交期</th>
                <th className="p-3 text-left">付款条件</th>
                <th className="p-3 text-left">状态</th>
                <th className="p-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = STATUS_OPTIONS.find(s => s.value === order.status);
                return (
                  <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs">{order.order_no}</td>
                    <td className="p-3 font-semibold">{order.supplier}</td>
                    <td className="p-3 text-right">¥{order.total_amount?.toLocaleString()}</td>
                    <td className="p-3 text-xs text-gray-500">
                      <div>下单：{order.order_date}</div>
                      {order.delivery_date && <div className="text-orange-500">交期：{order.delivery_date}</div>}
                    </td>
                    <td className="p-3 text-xs">{order.payment_terms}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === "draft" ? "bg-gray-100 text-gray-600" :
                        order.status === "confirmed" ? "bg-blue-100 text-blue-600" :
                        order.status === "shipped" ? "bg-orange-100 text-orange-600" :
                        order.status === "received" ? "bg-purple-100 text-purple-600" :
                        "bg-green-100 text-green-600"
                      }`}>
                        {status?.icon && <status.icon className="w-3 h-3" />}
                        {status?.label}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {(order.status === "shipped" || order.status === "confirmed") && (
                        <button onClick={() => receiveOrder(order.id!)} className="text-green-600 hover:text-green-800 mr-3 text-xs font-semibold">
                          <Package className="w-3.5 h-3.5 inline" /> 收货入库
                        </button>
                      )}
                      <button onClick={() => { setForm({
                        order_no: order.order_no,
                        supplier: order.supplier,
                        total_amount: String(order.total_amount),
                        order_date: order.order_date,
                        delivery_date: order.delivery_date || "",
                        payment_terms: order.payment_terms,
                        status: order.status as any,
                      }); setEditing(order); setShowForm(true); }} className="text-blue-600 hover:text-blue-800 mr-3 text-xs">
                        <Edit2 className="w-3.5 h-3.5 inline" /> 编辑
                      </button>
                      <button onClick={() => deleteOrder(order.id!, order.order_no)} className="text-red-500 hover:text-red-700 text-xs">
                        <Trash2 className="w-3.5 h-3.5 inline" /> 删除
                      </button>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">暂无采购订单，点击「新建采购单」开始</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── 使用说明 ──────────────── */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-bold text-blue-800 mb-2">采购订单状态流转</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>📝 <strong>草稿</strong> → 刚创建，可编辑修改</li>
              <li>✅ <strong>已确认</strong> → 双方确认，等待发货</li>
              <li>🚚 <strong>已发货</strong> → 供应商已发货，在途</li>
              <li>📦 <strong>已收货</strong> → 货物到达，入库验收</li>
              <li>✨ <strong>已完成</strong> → 验收入库，财务结算</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h3 className="font-bold text-green-800 mb-2">操作提示</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>💡 订单号可自动生成，也可手动填写</li>
              <li>💡 添加明细后系统会自动计算总额</li>
              <li>💡 订单状态可随时更新，方便跟踪进度</li>
              <li>💡 删除订单会同时删除关联的采购明细</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
