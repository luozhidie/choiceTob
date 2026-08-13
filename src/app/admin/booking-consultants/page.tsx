"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Consultant {
  id: string;
  name: string;
  avatar_url: string | null;
  title: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  schedules?: Record<string, { time: string; status: string }[]>;
}

const DEFAULT_TIMES = ["10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

function nextDays(n: number) {
  const days: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const dt = new Date(d);
    dt.setDate(d.getDate() + i);
    days.push(dt.toISOString().slice(0, 10));
  }
  return days;
}

export default function AdminBookingConsultantsPage() {
  const [list, setList] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Consultant | null>(null);
  const [form, setForm] = useState({ name: "", avatar_url: "", title: "", description: "", is_active: true, sort_order: 0 });
  const [schedConsultant, setSchedConsultant] = useState<Consultant | null>(null);
  const [schedMap, setSchedMap] = useState<Record<string, { time: string; status: string }[]>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const api = (url: string, opts?: RequestInit) =>
    fetch(url, { credentials: "include", ...opts }).then((r) => r.json());

  const load = async () => {
    setLoading(true);
    const data = await api("/api/admin/consultants");
    if (data && data.error) {
      showToast("加载失败：" + data.error);
      setList([]);
    } else {
      setList(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", avatar_url: "", title: "", description: "", is_active: true, sort_order: 0 });
    setShowForm(true);
  };

  const openEdit = (c: Consultant) => {
    setEditing(c);
    setForm({
      name: c.name,
      avatar_url: c.avatar_url || "",
      title: c.title || "",
      description: c.description || "",
      is_active: c.is_active,
      sort_order: c.sort_order,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) return showToast("请填写姓名");
    const payload = { ...form, sort_order: Number(form.sort_order) || 0 };
    const res = editing
      ? await api("/api/admin/consultants", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...payload }),
        })
      : await api("/api/admin/consultants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    if (res && res.error) {
      return showToast("保存失败：" + res.error);
    }
    setShowForm(false);
    showToast("已保存");
    load();
  };

  const del = async (id: string) => {
    if (!confirm("确定删除该顾问？")) return;
    await api("/api/admin/consultants?delete&id=" + id, { method: "DELETE" });
    showToast("已删除");
    load();
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "consultants");
    try {
      const r = await fetch("/api/admin/upload", { method: "POST", credentials: "include", body: fd });
      const data = await r.json();
      if (data.url) {
        setForm((prev) => ({ ...prev, avatar_url: data.url }));
        showToast("上传成功");
      } else {
        showToast(data.error || "上传失败");
      }
    } catch (err) {
      showToast("上传失败");
    }
    setUploading(false);
  };

  const openSched = async (c: Consultant) => {
    const days = nextDays(14);
    const map: Record<string, { time: string; status: string }[]> = {};
    days.forEach((d) => (map[d] = DEFAULT_TIMES.map((t) => ({ time: t, status: "available" }))));
    setSchedMap(map);
    setSchedConsultant(c);
    try {
      const data = await api("/api/admin/booking-schedules?consultant_id=" + c.id);
      if (Array.isArray(data)) {
        data.forEach((s: any) => {
          if (map[s.date]) map[s.date] = s.slots;
        });
        setSchedMap({ ...map });
      }
    } catch (e) {}
  };

  const toggleSlot = (day: string, idx: number) => {
    const slots = schedMap[day].map((s, i) =>
      i === idx ? { ...s, status: s.status === "available" ? "rest" : "available" } : s
    );
    setSchedMap({ ...schedMap, [day]: slots });
  };

  const saveSched = async () => {
    if (!schedConsultant) return;
    const days = nextDays(14);
    const c = schedConsultant;
    for (const day of days) {
      await api("/api/admin/booking-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultant_id: c.id, date: day, slots: schedMap[day] }),
      });
    }
    showToast("排期已保存");
    setSchedConsultant(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">形象顾问管理</h1>
        <button onClick={openAdd} className="bg-[#2d1b2e] text-white px-4 py-2 rounded-lg">
          + 新增顾问
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400">加载中…</div>
      ) : (
        <div className="grid gap-4">
          {list.map((c) => (
            <div key={c.id} className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm">
              <img src={c.avatar_url || "/placeholder.png"} alt="" className="w-16 h-16 rounded-full object-cover bg-gray-100" />
              <div className="flex-1">
                <div className="font-semibold text-lg">
                  {c.name} <span className="text-sm text-gray-400 font-normal">{c.title}</span>
                </div>
                <div className="text-sm text-gray-500 line-clamp-1">{c.description}</div>
                <div className="text-xs mt-1">
                  <span className={c.is_active ? "text-green-600" : "text-gray-400"}>
                    {c.is_active ? "展示中" : "已隐藏"}
                  </span>
                </div>
              </div>
              <button onClick={() => openSched(c)} className="text-sm text-blue-600 px-3 py-1 border rounded">
                排期
              </button>
              <button onClick={() => openEdit(c)} className="text-sm text-gray-600 px-3 py-1 border rounded">
                编辑
              </button>
              <button onClick={() => del(c.id)} className="text-sm text-red-500 px-3 py-1 border rounded">
                删除
              </button>
            </div>
          ))}
          {list.length === 0 && <div className="text-gray-400">暂无顾问，点击右上角新增。</div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editing ? "编辑顾问" : "新增顾问"}</h2>
            <label className="block text-sm mb-1">姓名 *</label>
            <input className="w-full border rounded-lg px-3 py-2 mb-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <label className="block text-sm mb-1">头衔</label>
            <input className="w-full border rounded-lg px-3 py-2 mb-3" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="如 V5 搭配师" />
            <label className="block text-sm mb-1">头像</label>
            <div className="flex items-center gap-3 mb-2">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="avatar" className="w-16 h-16 rounded-full object-cover border" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl">👤</div>
              )}
              <label className="px-4 py-2 border rounded-lg cursor-pointer text-sm text-gray-700 hover:bg-gray-50">
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
                {uploading ? "上传中..." : "上传图片"}
              </label>
            </div>
            <input className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="或粘贴图片 URL" />
            <label className="block text-sm mb-1">简介</label>
            <textarea className="w-full border rounded-lg px-3 py-2 mb-3 h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <label className="block text-sm mb-1">排序</label>
            <input type="number" className="w-full border rounded-lg px-3 py-2 mb-3" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            <label className="flex items-center gap-2 mb-4">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <span className="text-sm">前台展示</span>
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border">取消</button>
              <button onClick={save} className="px-4 py-2 rounded-lg bg-[#C9A24B] text-[#2d1b2e] font-semibold">保存</button>
            </div>
          </motion.div>
        </div>
      )}

      {schedConsultant && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{schedConsultant.name} - 排期（未来14天）</h2>
            <div className="grid gap-3">
              {nextDays(14).map((day) => (
                <div key={day} className="border rounded-lg p-3">
                  <div className="text-sm font-medium mb-2">{day}</div>
                  <div className="flex flex-wrap gap-2">
                    {schedMap[day].map((s, i) => (
                      <button
                        key={s.time}
                        onClick={() => toggleSlot(day, i)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          s.status === "available" ? "bg-green-50 text-green-700 border border-green-300" : "bg-gray-100 text-gray-400 line-through border border-gray-200"
                        }`}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setSchedConsultant(null)} className="px-4 py-2 rounded-lg border">取消</button>
              <button onClick={saveSched} className="px-4 py-2 rounded-lg bg-[#2d1b2e] text-white">保存排期</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg z-[60]">{toast}</div>}
    </div>
  );
}
