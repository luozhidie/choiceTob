"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, KeyRound, ShieldCheck, EyeOff } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  provider: string;
  api_key: string;
  status: string;
  created_at: string;
}

const PROVIDERS = ["OpenAI", "DeepSeek", "OpenRouter", "通义", "Gemini", "其他"];

export default function ApiKeysPage() {
  const [list, setList] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", provider: "DeepSeek", api_key: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tokens/api-keys", { credentials: "include" });
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

  const save = async () => {
    if (!form.name.trim() || !form.provider.trim() || !form.api_key.trim()) {
      flash("名称 / 供应商 / 密钥均为必填");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tokens/api-keys", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (j.ok) {
        flash("已添加密钥");
        setShowForm(false);
        setForm({ name: "", provider: "DeepSeek", api_key: "" });
        load();
      } else flash(j.error || "保存失败");
    } catch {
      flash("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("确认删除该密钥？此操作不可撤销。")) return;
    const res = await fetch("/api/admin/tokens/api-keys?id=" + id, {
      method: "DELETE",
      credentials: "include",
    });
    const j = await res.json();
    if (j.ok) load();
    else flash(j.error || "删除失败");
  };

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" /> API 密钥管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">管理各模型供应商的 API Key，密钥仅显示首尾，安全存储于服务端。</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> 新增
        </button>
      </div>

      {toast && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm">{toast}</div>
      )}

      {showForm && (
        <div className="mb-4 p-4 rounded-xl border border-gray-200 bg-white space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">名称</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="如：生产-DeepSeek"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">供应商</label>
            <select
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">密钥</label>
            <input
              type="password"
              value={form.api_key}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
              placeholder="sk-..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white text-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} 保存
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
        <div className="text-center text-gray-400 py-12 text-sm">暂无密钥，点击右上角“新增”添加。</div>
      ) : (
        <div className="space-y-2">
          {list.map((k) => (
            <div key={k.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white">
              <div>
                <div className="font-medium text-gray-800">{k.name}</div>
                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-gray-100">{k.provider}</span>
                  <span className="font-mono flex items-center gap-1"><EyeOff className="w-3 h-3" />{k.api_key}</span>
                </div>
              </div>
              <button
                onClick={() => del(k.id)}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
