"use client";

import { useState } from "react";
import { Phone, Mail, Trash2, Loader2 } from "lucide-react";

interface Member {
  id: string;
  name: string;
  phone?: string | null;
  wechat?: string | null;
  gender?: string | null;
  color_season?: string | null;
  main_style?: string | null;
  vip_level?: string | null;
  created_at?: string | null;
  _source?: string;
}

export default function AdminVIPClient({
  members,
  seasonLabel,
}: {
  members: Member[];
  seasonLabel: (v: string) => string;
}) {
  const [list, setList] = useState<Member[]>(members);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("\u786E\u5B9A\u5220\u9664\u6B4E\u4F1A\u5458\uFF1F")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/membership-orders-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, table: "vip_customers" }),
      });
      const json = await res.json();
      if (json.success) {
        setList(prev => prev.filter(m => m.id !== id));
      } else {
        alert("\u5220\u9664\u5931\u8D25:" + (json.error || ""));
      }
    } catch (e: any) {
      alert("\u5220\u9664\u5931\u8D25:" + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">\u59D3\u540D</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-36">\u8054\u7CFB\u65B9\u5F0F</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">\u6027\u522B</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">\u8272\u5F69\u5B63\u578B</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">\u4E3B\u98CE\u683C</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">VIP\u7B49\u7EA7</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-28">\u5F55\u5165\u65F6\u95F4</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-20">\u64CD\u4F5C</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {list.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-primary">{m.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {m.phone && <div><Phone className="w-3 h-3 inline mr-1" />{m.phone}</div>}
                {m.wechat && <div><Mail className="w-3 h-3 inline mr-1" />{m.wechat}</div>}
                {!m.phone && !m.wechat && <span className="text-gray-300">-</span>}
              </td>
              <td className="px-4 py-3 text-sm">{m.gender === "female" ? "\u5973" : m.gender === "male" ? "\u7537" : "-"}</td>
              <td className="px-4 py-3">
                {m.color_season ? (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700 font-medium">{seasonLabel(m.color_season)}</span>
                ) : <span className="text-gray-300">-</span>}
              </td>
              <td className="px-4 py-3 text-sm truncate max-w-[120px]" title={m.main_style}>
                {m.main_style || "-"}
              </td>
              <td className="px-4 py-3 text-sm">
                {m.vip_level ? <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">{m.vip_level}</span> : "-"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {m.created_at ? new Date(m.created_at).toLocaleDateString("zh-CN") : "-"}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={deletingId === m.id}
                  className="text-red-400 hover:text-red-600 disabled:opacity-40 text-sm"
                  title="\u5220\u9664\u6B4E\u8BB0\u5F55"
                >
                  {deletingId === m.id ? <Loader2 className="w-4 h-4 animate-spin inline" /> : <Trash2 className="w-4 h-4 inline" />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
