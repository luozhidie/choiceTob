"use client";

import { useState, useEffect, useCallback } from "react";

interface BuyerRequest {
  id: string;
  user_id: string | null;
  contact_name: string | null;
  contact_info: string | null;
  category: string | null;
  style: string | null;
  color: string | null;
  has_orphan: boolean;
  budget_min: number | null;
  budget_max: number | null;
  note: string | null;
  images: string[] | null;
  status: string;
  admin_note: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "待跟进",
  reviewed: "已查看",
  matched: "已匹配",
  contacted: "已联系",
  done: "已完成",
};
const STATUS_LIST = ["pending", "reviewed", "matched", "contacted", "done"];

export default function BuyerRequestsPage() {
  const [list, setList] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [editing, setEditing] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const q = filter ? `?status=${filter}` : "";
    const r = await fetch(`/api/admin/buyer-requests${q}`, { cache: "no-store" });
    const j = await r.json();
    setList(j.data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: string, admin_note?: string) {
    setSaving(true);
    const r = await fetch(`/api/admin/buyer-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, admin_note }),
    });
    const j = await r.json();
    setSaving(false);
    if (j.success) { setEditing(null); load(); }
    else alert("更新失败：" + (j.error || ""));
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">找货需求管理</h1>
        <p className="text-gray-500 text-sm mb-5">
          店主 / 用户提交的「想找的款 / 风格 / 色系 / 孤品搭配」需求，人工跟进并引导进私域。
        </p>

        {/* 状态筛选 */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setFilter("")}
            className={`px-4 py-2 rounded-full text-sm ${filter === "" ? "bg-[#2d1b2e] text-white" : "bg-white text-gray-600 border"}`}
          >全部</button>
          {STATUS_LIST.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-sm ${filter === s ? "bg-[#2d1b2e] text-white" : "bg-white text-gray-600 border"}`}
            >{STATUS_LABELS[s]}</button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400">加载中…</p>
        ) : list.length === 0 ? (
          <p className="text-gray-400">暂无需求</p>
        ) : (
          <div className="space-y-4">
            {list.map((it) => (
              <div key={it.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-[#2d1b2e] text-white text-xs">
                        {STATUS_LABELS[it.status] || it.status}
                      </span>
                      {it.has_orphan && (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs">有孤品搭配</span>
                      )}
                      <span className="text-xs text-gray-400">{new Date(it.created_at).toLocaleString("zh-CN")}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-2">
                      <Field label="品类" value={it.category} />
                      <Field label="风格" value={it.style} />
                      <Field label="色系" value={it.color} />
                      <Field label="预算" value={it.budget_min || it.budget_max ? `${it.budget_min || "—"} ~ ${it.budget_max || "—"} 元` : "—"} />
                    </div>
                    {it.note && <p className="text-sm text-gray-700 mb-2">需求：{it.note}</p>}
                    <div className="text-xs text-gray-500">
                      联系：{it.contact_name || "未填"} / {it.contact_info || "未留"}
                      {it.user_id ? `（UID: ${it.user_id}）` : ""}
                    </div>
                    {it.admin_note && (
                      <p className="text-xs text-gray-400 mt-1">跟进备注：{it.admin_note}</p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {editing === it.id ? (
                      <div className="w-56 space-y-2">
                        <select
                          defaultValue={it.status}
                          onChange={(e) => updateStatus(it.id, e.target.value, noteDraft || it.admin_note || "")}
                          disabled={saving}
                          className="w-full border rounded-lg px-2 py-2 text-sm"
                        >
                          {STATUS_LIST.map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                        <textarea
                          placeholder="跟进备注"
                          value={noteDraft}
                          onChange={(e)  => setNoteDraft(e.target.value)}
                          className="w-full border rounded-lg px-2 py-1 text-sm"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(it.id, it.status, noteDraft || it.admin_note || "")}
                            disabled={saving}
                            className="flex-1 bg-[#C9A24B] text-white rounded-lg py-1.5 text-sm"
                          >保存</button>
                          <button
                            onClick={() => { setEditing(null); setNoteDraft(""); }}
                            className="flex-1 bg-gray-100 rounded-lg py-1.5 text-sm"
                          >取消</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditing(it.id); setNoteDraft(it.admin_note || ""); }}
                        className="text-sm text-[#2d1b2e] border border-[#2d1b2e] rounded-lg px-3 py-1.5"
                      >跟进</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-gray-400">{label}：</span>
      <span className="text-gray-800">{value || "—"}</span>
    </div>
  );
}
