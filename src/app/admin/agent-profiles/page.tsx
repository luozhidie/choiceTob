"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, RefreshCw, Search, User, X, Trash2 } from "lucide-react";

interface AgentProfile {
  id: string;
  nickname: string | null;
  agent_store_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  wechat: string | null;
  email: string | null;
  role: string | null;
  membership_type: string | null;
  bio: string | null;
  created_at: string | null;
}

const DEFAULT_EDIT: Partial<AgentProfile> = {
  nickname: "",
  agent_store_name: "",
  phone: "",
  wechat: "",
  bio: "",
  avatar_url: "",
};

export default function AgentProfilesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [list, setList] = useState<AgentProfile[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [editing, setEditing] = useState<AgentProfile | null>(null);
  const [editForm, setEditForm] = useState<Partial<AgentProfile>>(DEFAULT_EDIT);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/agent-profiles?q=${encodeURIComponent(q)}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          showToast("error", "未登录，请重新登录后台");
          setTimeout(() => (window.location.href = "/admin/login"), 1500);
          return;
        }
        throw new Error("加载失败");
      }
      const json = await res.json();
      setList(json.list || []);
    } catch (e: any) {
      showToast("error", "加载失败：" + e.message);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [q]);

  const openEdit = (item: AgentProfile) => {
    setEditing(item);
    setEditForm({
      nickname: item.nickname || "",
      agent_store_name: item.agent_store_name || "",
      phone: item.phone || "",
      wechat: item.wechat || "",
      bio: item.bio || "",
      avatar_url: item.avatar_url || "",
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setEditForm(DEFAULT_EDIT);
  };

  const save = async () => {
    if (!editing) return;
    if (!editForm.nickname || !editForm.nickname.trim()) {
      showToast("error", "昵称不能为空");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/agent-profiles", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: editing.id, fields: editForm }),
      });
      if (!res.ok) throw new Error("保存失败");
      showToast("success", "已保存");
      closeEdit();
      load();
    } catch (e: any) {
      showToast("error", "保存失败：" + e.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (item: AgentProfile) => {
    if (!window.confirm(`确定删除「${item.nickname || item.phone || "未命名"}」的代理人资料？删除后不可恢复。`)) return;
    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/admin/agent-profiles?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "删除失败");
      showToast("success", "已删除");
      load();
    } catch (e: any) {
      showToast("error", "删除失败：" + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const fmtMembership = (t: string | null) => {
    const map: Record<string, string> = {
      none: "无会员",
      view_price: "查看价格会员",
      deposit_discount: "充值折扣会员",
    };
    return map[t || "none"] || t || "无会员";
  };

  return (
    <div className="min-h-screen pb-24">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${
            toast.type === "success" ? "bg-primary" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">代理人资料</h1>
          <p className="text-sm text-muted-foreground mt-1">查看和编辑代理人的展示资料</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索昵称 / 姓名 / 手机 / 邮箱 / 店铺名"
              className="pl-9 pr-4 py-2 rounded-lg border border-border bg-white text-sm w-72"
            />
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-white border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-accent mb-4" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      ) : list.length === 0 ? (
        <div className="fashion-card p-12 text-center text-muted-foreground">
          暂无代理人资料
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item) => (
            <div key={item.id} className="fashion-card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {item.avatar_url ? (
                  <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                <div className="min-w-0">
                  <div className="font-semibold text-primary truncate">
                    {item.nickname || item.agent_store_name || item.full_name || "未命名"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {item.agent_store_name || "无店铺名"}
                  </div>
                </div>
                <div className="min-w-0 text-muted-foreground truncate">
                  <div>{item.full_name || "—"}</div>
                  <div className="text-xs">{item.phone || item.wechat || "—"}</div>
                </div>
                <div className="min-w-0 text-muted-foreground truncate">
                  <div className="text-xs">{item.email || "—"}</div>
                  <div className="text-xs">{fmtMembership(item.membership_type)}</div>
                </div>
                <div className="min-w-0 text-muted-foreground truncate text-xs">
                  {item.bio || "—"}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(item)}
                  className="px-4 py-2 text-sm font-medium text-accent border border-accent rounded-lg hover:bg-accent/5"
                >
                  编辑
                </button>
                <button
                  onClick={() => del(item)}
                  disabled={deletingId === item.id}
                  className="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-1"
                >
                  {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="bg-white w-full md:w-[520px] max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-primary">编辑代理人资料</h2>
              <button onClick={closeEdit} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="头像 URL">
                <input
                  value={editForm.avatar_url || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, avatar_url: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border"
                />
                {editForm.avatar_url && (
                  <img src={editForm.avatar_url} alt="" className="mt-2 w-16 h-16 rounded-full object-cover" />
                )}
              </Field>
              <Field label="昵称 *">
                <input
                  value={editForm.nickname || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, nickname: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border"
                />
              </Field>
              <Field label="店铺名">
                <input
                  value={editForm.agent_store_name || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, agent_store_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="手机号">
                  <input
                    value={editForm.phone || ""}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border"
                  />
                </Field>
                <Field label="微信号">
                  <input
                    value={editForm.wechat || ""}
                    onChange={(e) => setEditForm((p) => ({ ...p, wechat: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border"
                  />
                </Field>
              </div>
              <Field label="简介">
                <textarea
                  value={editForm.bio || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border"
                />
              </Field>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeEdit}
                className="flex-1 px-4 py-2 text-sm font-medium text-primary bg-white border border-border rounded-lg hover:bg-muted"
              >
                取消
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-accent rounded-lg hover:brightness-110 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
