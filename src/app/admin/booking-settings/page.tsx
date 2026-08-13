"use client";

import { useEffect, useState } from "react";

export default function AdminBookingSettingsPage() {
  const [form, setForm] = useState({ location: "", price_per_hour: 200, service_fee: 0, currency: "¥" });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const api = (url: string, opts?: RequestInit) =>
    fetch(url, { credentials: "include", ...opts }).then((r) => r.json());

  useEffect(() => {
    api("/api/admin/booking-settings").then((d) => {
      if (d && d.location !== undefined) {
        setForm({ location: d.location, price_per_hour: d.price_per_hour, service_fee: d.service_fee, currency: d.currency || "¥" });
      }
      setLoading(false);
    });
  }, []);

  const save = async () => {
    await api("/api/admin/booking-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: form.location,
        price_per_hour: Number(form.price_per_hour) || 0,
        service_fee: Number(form.service_fee) || 0,
        currency: form.currency,
      }),
    });
    showToast("已保存");
  };

  if (loading) return <div className="p-6 text-gray-400">加载中…</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">陪购设置</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm mb-1">陪购地点</label>
          <input className="w-full border rounded-lg px-3 py-2" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm mb-1">陪购费用（元/小时）</label>
          <input type="number" className="w-full border rounded-lg px-3 py-2" value={form.price_per_hour} onChange={(e) => setForm({ ...form, price_per_hour: Number(e.target.value) })} />
        </div>
        <div>
          <label className="block text-sm mb-1">服务费（元）</label>
          <input type="number" className="w-full border rounded-lg px-3 py-2" value={form.service_fee} onChange={(e) => setForm({ ...form, service_fee: Number(e.target.value) })} />
        </div>
        <div>
          <label className="block text-sm mb-1">货币符号</label>
          <input className="w-full border rounded-lg px-3 py-2" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
        </div>
        <button onClick={save} className="w-full bg-[#C9A24B] text-[#2d1b2e] font-semibold py-3 rounded-lg">
          保存设置
        </button>
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg z-[60]">{toast}</div>}
    </div>
  );
}
