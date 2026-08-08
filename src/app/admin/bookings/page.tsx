"use client";

import { useEffect, useState } from "react";

interface Booking {
  id: string;
  consultant_name: string;
  user_name: string;
  phone: string;
  date: string;
  slots: { time: string; status?: string }[];
  location: string;
  price_per_hour: number;
  service_fee: number;
  total_amount: number;
  coupon: string;
  note: string;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = ["待确认", "已确认", "已完成", "已取消"];

export default function AdminBookingsPage() {
  const [list, setList] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const api = (url: string, opts?: RequestInit) =>
    fetch(url, { credentials: "include", ...opts }).then((r) => r.json());

  const load = async () => {
    setLoading(true);
    const url = filter ? `/api/admin/bookings?status=${encodeURIComponent(filter)}` : "/api/admin/bookings";
    const data = await api(url);
    setList(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await api("/api/admin/bookings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    showToast("状态已更新");
    load();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">预约订单</h1>
        <div className="flex gap-2">
          <button onClick={() => setFilter("")} className={`px-3 py-1 rounded ${filter === "" ? "bg-[#2d1b2e] text-white" : "border"}`}>全部</button>
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded ${filter === s ? "bg-[#2d1b2e] text-white" : "border"}`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400">加载中…</div>
      ) : (
        <div className="grid gap-4">
          {list.map((b) => (
            <div key={b.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">{b.user_name} · {b.phone}</div>
                <span className="text-sm text-[#C9A24B]">{b.status}</span>
              </div>
              <div className="text-sm text-gray-600">
                顾问：{b.consultant_name || "未指定"} ｜ {b.date} ｜ {b.slots.map((s) => s.time).join("、")}
              </div>
              <div className="text-sm text-gray-500 mt-1">地点：{b.location}</div>
              {b.note && <div className="text-sm text-gray-500 mt-1">备注：{b.note}</div>}
              <div className="text-sm text-[#C9A24B] font-semibold mt-2">合计 ¥{b.total_amount}（¥{b.price_per_hour}/h）</div>
              <div className="flex gap-2 mt-3">
                {STATUS_OPTIONS.filter((s) => s !== b.status).map((s) => (
                  <button key={s} onClick={() => updateStatus(b.id, s)} className="text-sm px-3 py-1 border rounded">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {list.length === 0 && <div className="text-gray-400">暂无订单。</div>}
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg z-[60]">{toast}</div>}
    </div>
  );
}
