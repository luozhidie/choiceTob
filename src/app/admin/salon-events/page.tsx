"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar, Users, DollarSign, MapPin, Plus, Trash2, Edit2,
  TrendingUp, TrendingDown, MinusCircle, CheckCircle, XCircle,
} from "lucide-react";

interface SalonEvent {
  id?: string;
  store_id?: string;
  event_name: string;
  event_date: string;
  location: string;
  expected_attendees: number;
  actual_attendees: number;
  budget: number;
  actual_cost: number;
  status: "planned" | "ongoing" | "completed" | "cancelled";
  notes: string;
}

const STATUS_OPTIONS = [
  { value: "planned", label: "计划中", color: "blue" },
  { value: "ongoing", label: "进行中", color: "orange" },
  { value: "completed", label: "已完成", color: "green" },
  { value: "cancelled", label: "已取消", color: "gray" },
];

const STATUS_COLOR_MAP: Record<string, string> = {
  planned: "bg-blue-100 text-blue-700 border-blue-200",
  ongoing: "bg-orange-100 text-orange-700 border-orange-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function SalonEventsPage() {
  const supabase = createClient();
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [events, setEvents] = useState<SalonEvent[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SalonEvent | null>(null);

  // 表单
  const [form, setForm] = useState({
    event_name: "",
    event_date: "",
    location: "",
    expected_attendees: "",
    actual_attendees: "",
    budget: "",
    actual_cost: "",
    status: "planned",
    notes: "",
  });

  /* ── 加载店铺 ───────────────────── */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("stores").select("id, name").order("name");
      setStores(data || []);
      if (data?.[0]) setStoreId(data[0].id);
    })();
  }, []);

  /* ── 加载活动 ───────────────────── */
  const loadEvents = async () => {
    if (!storeId) return;
    const { data } = await supabase
      .from("salon_events")
      .select("*")
      .eq("store_id", storeId)
      .order("event_date", { ascending: false });
    setEvents(data || []);
  };

  useEffect(() => { loadEvents(); }, [storeId]);

  /* ── 保存 ───────────────── */
  const saveEvent = async () => {
    if (!storeId) { alert("请先选择店铺"); return; }
    if (!form.event_name.trim()) { alert("请输入活动名称"); return; }
    if (!form.event_date) { alert("请选择活动日期"); return; }

    const payload = {
      store_id: storeId,
      event_name: form.event_name.trim(),
      event_date: form.event_date,
      location: form.location.trim(),
      expected_attendees: +form.expected_attendees || 0,
      actual_attendees: +form.actual_attendees || 0,
      budget: +form.budget || 0,
      actual_cost: +form.actual_cost || 0,
      status: form.status,
      notes: form.notes.trim(),
    };

    if (editing?.id) {
      const { error } = await supabase.from("salon_events").update(payload).eq("id", editing.id);
      if (error) { alert("保存失败：" + error.message); return; }
      alert("活动更新成功");
    } else {
      const { error } = await supabase.from("salon_events").insert(payload);
      if (error) { alert("保存失败：" + error.message); return; }
      alert("活动创建成功");
    }
    setShowForm(false); setEditing(null);
    resetForm();
    loadEvents();
  };

  /* ── 删除 ───────────────── */
  const deleteEvent = async (id: string, name: string) => {
    if (!confirm(`确定删除活动「${name}」？此操作不可恢复。`)) return;
    const { error } = await supabase.from("salon_events").delete().eq("id", id);
    if (error) { alert("删除失败：" + error.message); return; }
    alert("活动已删除");
    loadEvents();
  };

  /* ── 重置表单 ──────────────── */
  const resetForm = () => {
    setForm({
      event_name: "",
      event_date: "",
      location: "",
      expected_attendees: "",
      actual_attendees: "",
      budget: "",
      actual_cost: "",
      status: "planned",
      notes: "",
    });
  };

  /* ── 打开编辑 ──────────────── */
  const openEdit = (event: SalonEvent) => {
    setForm({
      event_name: event.event_name,
      event_date: event.event_date,
      location: event.location || "",
      expected_attendees: String(event.expected_attendees || ""),
      actual_attendees: String(event.actual_attendees || ""),
      budget: String(event.budget || ""),
      actual_cost: String(event.actual_cost || ""),
      status: event.status,
      notes: event.notes || "",
    });
    setEditing(event);
    setShowForm(true);
  };

  /* ── 筛选 ───────────────── */
  const filteredEvents = events.filter((event) => {
    return filterStatus === "all" || event.status === filterStatus;
  });

  /* ── 计算到场率 ──────────────── */
  const getAttendanceRate = (event: SalonEvent) => {
    if (!event.expected_attendees || event.expected_attendees === 0) return null;
    return (event.actual_attendees / event.expected_attendees) * 100;
  };

  /* ── 计算预算执行率 ──────────────── */
  const getBudgetRate = (event: SalonEvent) => {
    if (!event.budget || event.budget === 0) return null;
    return (event.actual_cost / event.budget) * 100;
  };

  /* ── 预算执行率颜色 ──────────────── */
  const getBudgetRateColor = (rate: number | null) => {
    if (rate === null) return "text-gray-400";
    if (rate < 90) return "text-green-600";
    if (rate <= 110) return "text-orange-600";
    return "text-red-600";
  };

  /* ── 统计 ───────────────── */
  const stats = {
    total: events.length,
    ongoing: events.filter(e => e.status === "ongoing").length,
    completed: events.filter(e => e.status === "completed").length,
    totalBudget: events.reduce((s, e) => s + (e.budget || 0), 0),
    totalActualCost: events.reduce((s, e) => s + (e.actual_cost || 0), 0),
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
            <h1 className="text-2xl font-bold text-gray-800">沙龙活动流程管理</h1>
            <p className="text-sm text-gray-500 mt-1">活动策划 · 到场率分析 · 预算执行监控</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={storeId}
              onChange={e => setStoreId(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
            >
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button
              onClick={() => { resetForm(); setEditing(null); setShowForm(true); }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> 新增活动
            </button>
          </div>
        </div>

        {/* ── 统计卡片 ───────────────── */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-xs text-gray-500">活动总数</div>
          </div>
          <div className="bg-orange-50 rounded-2xl border border-orange-200 p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.ongoing}</div>
            <div className="text-xs text-orange-500">进行中</div>
          </div>
          <div className="bg-green-50 rounded-2xl border border-green-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-green-500">已完成</div>
          </div>
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">¥{stats.totalBudget.toLocaleString()}</div>
            <div className="text-xs text-blue-500">总预算</div>
          </div>
          <div className="bg-purple-50 rounded-2xl border border-purple-200 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">¥{stats.totalActualCost.toLocaleString()}</div>
            <div className="text-xs text-purple-500">总实际费用</div>
          </div>
        </div>

        {/* ── 筛选栏 ───────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 flex items-center gap-4">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">全部状态</option>
            <option value="planned">📋 计划中</option>
            <option value="ongoing">🔥 进行中</option>
            <option value="completed">✅ 已完成</option>
            <option value="cancelled">❌ 已取消</option>
          </select>
          <div className="flex-1 text-right text-sm text-gray-400">
            共 {filteredEvents.length} 条活动记录
          </div>
        </div>

        {/* ── 新增/编辑弹窗 ──────────────── */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold mb-6">{editing ? "编辑活动" : "新增活动"}</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500">活动名称 *</label>
                  <input
                    type="text"
                    value={form.event_name}
                    onChange={e => setForm({ ...form, event_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="如：春季护肤沙龙"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">活动日期 *</label>
                    <input
                      type="date"
                      value={form.event_date}
                      onChange={e => setForm({ ...form, event_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">状态</label>
                    <select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">地点</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="如：店铺二楼活动区"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">预计人数</label>
                    <input
                      type="number"
                      value={form.expected_attendees}
                      onChange={e => setForm({ ...form, expected_attendees: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">实际人数</label>
                    <input
                      type="number"
                      value={form.actual_attendees}
                      onChange={e => setForm({ ...form, actual_attendees: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">预算（元）</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.budget}
                      onChange={e => setForm({ ...form, budget: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">实际费用（元）</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.actual_cost}
                      onChange={e => setForm({ ...form, actual_cost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">备注</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    rows={3}
                    placeholder="活动备注信息..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={saveEvent} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">
                    {editing ? "保存修改" : "创建活动"}
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setEditing(null); }}
                    className="flex-1 py-2.5 bg-gray-200 rounded-xl text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 活动表格 ───────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3 text-left">活动名称</th>
                <th className="p-3 text-left">日期</th>
                <th className="p-3 text-left">地点</th>
                <th className="p-3 text-right">预计/实际人数</th>
                <th className="p-3 text-right">到场率</th>
                <th className="p-3 text-right">预算/实际费用</th>
                <th className="p-3 text-right">执行率</th>
                <th className="p-3 text-center">状态</th>
                <th className="p-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => {
                const attendanceRate = getAttendanceRate(event);
                const budgetRate = getBudgetRate(event);
                return (
                  <tr key={event.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-semibold text-gray-800">{event.event_name}</td>
                    <td className="p-3 text-gray-500 text-xs">{event.event_date}</td>
                    <td className="p-3 text-gray-500 text-xs">{event.location || "—"}</td>
                    <td className="p-3 text-right text-xs">
                      <span className="text-gray-700">{event.expected_attendees}</span>
                      <span className="text-gray-300 mx-1">/</span>
                      <span className={
                        event.actual_attendees >= event.expected_attendees
                          ? "text-green-600 font-semibold"
                          : "text-orange-600 font-semibold"
                      }>{event.actual_attendees}</span>
                    </td>
                    <td className="p-3 text-right text-xs">
                      {attendanceRate !== null ? (
                        <span className={
                          attendanceRate >= 80 ? "text-green-600 font-semibold" :
                          attendanceRate >= 50 ? "text-blue-600" :
                          "text-red-500"
                        }>
                          {attendanceRate.toFixed(1)}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="p-3 text-right text-xs">
                      <span className="text-gray-700">¥{(event.budget || 0).toLocaleString()}</span>
                      <span className="text-gray-300 mx-1">/</span>
                      <span className={getBudgetRateColor(budgetRate)}>
                        ¥{(event.actual_cost || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-right text-xs">
                      {budgetRate !== null ? (
                        <span className={getBudgetRateColor(budgetRate)}>
                          {budgetRate.toFixed(1)}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLOR_MAP[event.status]}`}>
                        {STATUS_OPTIONS.find(o => o.value === event.status)?.label || event.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => openEdit(event)}
                        className="text-blue-600 hover:text-blue-800 mr-3 text-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" /> 编辑
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id!, event.event_name)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" /> 删除
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400">
                    暂无活动数据，点击「新增活动」开始创建
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── 使用说明 ──────────────── */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-bold text-blue-800 mb-2">状态说明</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>📋 <strong>计划中：</strong> 活动已创建，尚未开始</li>
              <li>🔥 <strong>进行中：</strong> 活动正在执行</li>
              <li>✅ <strong>已完成：</strong> 活动顺利结束</li>
              <li>❌ <strong>已取消：</strong> 活动已取消</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h3 className="font-bold text-green-800 mb-2">关键指标说明</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>📊 <strong>到场率：</strong> 实际人数 / 预计人数 × 100%</li>
              <li>💰 <strong>预算执行率：</strong> 实际费用 / 预算 × 100%</li>
              <li>🟢 <strong>绿色：</strong> 执行率 &lt; 90%，控制良好</li>
              <li>🟠 <strong>橙色：</strong> 执行率 90%~110%，正常范围</li>
              <li>🔴 <strong>红色：</strong> 执行率 &gt; 110%，严重超支</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
