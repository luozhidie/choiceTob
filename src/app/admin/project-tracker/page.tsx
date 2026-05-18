"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckSquare, Plus, Trash2, Edit2, AlertCircle } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  not_started: { label: "未开始", color: "text-gray-600", bg: "bg-gray-100" },
  in_progress: { label: "进行中", color: "text-blue-600", bg: "bg-blue-100" },
  done:         { label: "已完成", color: "text-green-600", bg: "bg-green-100" },
};

interface Project {
  id?: string;
  store_id: string;
  task_name: string;
  owner?: string;
  deliverable?: string;
  start_date?: string;
  due_date?: string;
  status: string;
  progress_pct: number;
  notes?: string;
}

export default function ProjectTrackerPage() {
  const supabase = createClient();
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [filterStatus, setFilterStatus] = useState("");

  const [form, setForm] = useState({
    task_name: "",
    owner: "",
    deliverable: "",
    start_date: "",
    due_date: "",
    status: "not_started",
    progress_pct: 0,
    notes: "",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("stores").select("id, name").order("name");
      setStores(data || []);
      if (data?.[0]) setStoreId(data[0].id);
    })();
  }, []);

  const load = async () => {
    if (!storeId) return;
    const { data } = await supabase.from("project_tracker").select("*").eq("store_id", storeId).order("due_date");
    setTasks(data || []);
  };
  useEffect(() => { load(); }, [storeId]);

  const save = async () => {
    if (!form.task_name.trim()) { alert("请填写任务名称"); return; }
    const payload = { store_id: storeId, ...form };
    if (editing?.id) await supabase.from("project_tracker").update(payload).eq("id", editing.id);
    else await supabase.from("project_tracker").insert(payload);
    setShowForm(false); setEditing(null);
    resetForm(); load();
  };

  const del = async (id: string) => {
    if (!confirm("确定删除？")) return;
    await supabase.from("project_tracker").delete().eq("id", id);
    load();
  };

  const resetForm = () => setForm({
    task_name: "", owner: "", deliverable: "",
    start_date: "", due_date: "", status: "not_started",
    progress_pct: 0, notes: "",
  });

  const openEdit = (t: Project) => {
    setForm({
      task_name: t.task_name, owner: t.owner || "", deliverable: t.deliverable || "",
      start_date: t.start_date || "", due_date: t.due_date || "",
      status: t.status, progress_pct: t.progress_pct || 0, notes: t.notes || "",
    });
    setEditing(t); setShowForm(true);
  };

  const filtered = tasks.filter(t => filterStatus ? t.status === filterStatus : true);

  const stats = {
    total: tasks.length,
    not_started: tasks.filter(t => t.status === "not_started").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    done: tasks.filter(t => t.status === "done").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6"><div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">项目进度跟踪</h1>
          <p className="text-sm text-gray-500 mt-1">任务分配 · 进度管理 · 交付物跟踪</p>
        </div>
        <div className="flex gap-3">
          <select value={storeId} onChange={e => setStoreId(e.target.value)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm">
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={() => { resetForm(); setEditing(null); setShowForm(true); }}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> 新建任务
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "全部任务", value: stats.total, color: "text-gray-800", bg: "bg-white" },
          { label: "未开始", value: stats.not_started, color: "text-gray-600", bg: "bg-gray-100" },
          { label: "进行中", value: stats.in_progress, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "已完成", value: stats.done, color: "text-green-600", bg: "bg-green-50" },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl shadow-sm border border-gray-100 p-4 text-center`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 筛选 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 flex items-center gap-4">
        <span className="text-sm text-gray-500">筛选：</span>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">全部状态</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* 弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h2 className="text-lg font-bold mb-4">{editing ? "编辑" : "新建"}任务</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">任务名称 *</label>
                <input value={form.task_name} onChange={e => setForm({ ...form, task_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="任务名称" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">负责人</label>
                  <input value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="姓名" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">状态</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">开始日期</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">截止日期</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">交付物</label>
                <input value={form.deliverable} onChange={e => setForm({ ...form, deliverable: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如：商品企划报告.docx" />
              </div>
              <div>
                <label className="text-xs text-gray-500">进度（{form.progress_pct}%）</label>
                <input type="range" min="0" max="100" value={form.progress_pct}
                  onChange={e => setForm({ ...form, progress_pct: +e.target.value })}
                  className="w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-500">备注</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">保存</button>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 py-2.5 bg-gray-200 rounded-xl text-sm">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 表格 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3 text-left">任务名称</th>
              <th className="p-3 text-left">负责人</th>
              <th className="p-3 text-left">开始/截止</th>
              <th className="p-3 text-center">进度</th>
              <th className="p-3 text-center">状态</th>
              <th className="p-3 text-left">交付物</th>
              <th className="p-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => {
              const s = STATUS_MAP[t.status] || STATUS_MAP.not_started;
              return (
                <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-semibold">{t.task_name}</td>
                  <td className="p-3 text-gray-600">{t.owner || "—"}</td>
                  <td className="p-3 text-xs text-gray-500">{t.start_date || "—"}<br/>{t.due_date || "—"}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${t.progress_pct >= 100 ? "bg-green-500" : t.progress_pct >= 50 ? "bg-blue-500" : "bg-yellow-500"}`}
                          style={{ width: `${t.progress_pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">{t.progress_pct}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${s.bg} ${s.color}`}>{s.label}</span>
                  </td>
                  <td className="p-3 text-xs text-gray-500 max-w-xs truncate">{t.deliverable || "—"}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => openEdit(t)} className="text-blue-600 hover:text-blue-800 mr-3 text-xs">编辑</button>
                    <button onClick={() => del(t.id!)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">暂无数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div></div>
  );
}
