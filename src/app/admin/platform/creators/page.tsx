"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Users, Pencil } from "lucide-react";

interface Creator {
  id: string;
  name: string;
  platform?: string | null;
  contact?: string | null;
  followers?: number;
  notes?: string | null;
  status?: string;
}

export default function PlatformCreatorsPage() {
  const [list, setList] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", platform: "", contact: "", followers: 0, notes: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/platform/creators", { credentials: "include" });
      const j = await res.json();
      if (j.ok) setList(j.data || []);
      else flash(j.error || "加载失败");
    } catch {
      flash("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", platform: "", contact: "", followers: 0, notes: "" });
    setShowForm(true);
  };

  const openEdit = (c: Creator) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      platform: c.platform || "",
      contact: c.contact || "",
      followers: c.followers || 0,
      notes: c.notes || "",
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      flash("创作者名称必填");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/platform/creators", {
        method: editingId ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      });
      const j = await res.json();
      if (j.ok) {
        flash(editingId ? "已更新" : "已添加");
        setShowForm(false);
        setEditingId(null);
        load();
      } else flash(j.error || "保存失败");
    } catch {
      flash("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("确认删除该创作者？")) return;
    const res = await fetch("/api/admin/platform/creators?id=" + id, {
      method: "DELETE",
      credentials: "include",
    });
    const j = await res.json();
    if (j.ok) load();
    else flash(j.error || "删除失败");
  };

  const field = (label: string, node: React.ReactNode) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {node}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> 平台创作者
          </h1>
          <p className="text-sm text-gray-500 mt-1">管理爆款平台的合作创作者 / 达人。</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> 新增
        </button>
      </div>

      {toast && <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm">{toast}</div>}

      {showForm && (
        <div className="mb-4 p-4 rounded-xl border border-gray-200 bg-white space-y-3">
          {field(
            "名称",
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            {field(
              "平台",
              <input
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                placeholder="如：小红书 / 抖音"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            )}
            {field(
              "粉丝数",
              <input
                type="number"
                value={form.followers}
                onChange={(e) => setForm({ ...form, followers: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            )}
          </div>
          {field(
            "联系方式",
            <input
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
          )}
          {field(
            "备注",
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : null} 保存
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center text-gray-400 py-12 text-sm">暂无创作者，点击右上角“新增”。</div>
      ) : (
        <div className="space-y-2">
          {list.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white">
              <div>
                <div className="font-medium text-gray-800">{c.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {c.platform && <span className="px-1.5 py-0.5 rounded bg-gray-100 mr-1">{c.platform}</span>}
                  {c.followers ? `${c.followers} 粉丝` : ""}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-50" title="编辑">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => del(c.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50" title="删除">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
