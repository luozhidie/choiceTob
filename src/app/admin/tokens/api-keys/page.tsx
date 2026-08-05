"use client";

import { useState, useEffect } from "react";
import { Plus, Copy, Loader2, AlertCircle, CheckCircle2, KeyRound, Power, Trash2 } from "lucide-react";

interface ApiKey {
  id: string;
  api_key: string;
  name: string;
  owner: string;
  status: string;
  usage_count: number;
  credit_balance?: number | null;
  credit_used?: number | null;
  created_at: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/token-keys", { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (String(data.error || "").includes("relation") || String(data.error || "").includes("does not exist")) setTableMissing(true);
        else alert("加载失败：" + (data.error || ""));
        setKeys([]);
      } else {
        setKeys(data.data || []);
      }
    } catch (e: any) {
      alert("加载异常：" + (e.message || ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const create = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/token-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() || "未命名密钥" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (String(data.error || "").includes("relation") || String(data.error || "").includes("does not exist")) setTableMissing(true);
        else alert("生成失败：" + (data.error || ""));
      } else {
        setNewKey(data.data.api_key); // 仅此一次返回完整 key
        setName("");
        load();
      }
    } catch (e: any) {
      alert("生成异常：" + (e.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (k: ApiKey) => {
    const next = k.status === "active" ? "disabled" : "active";
    const res = await fetch("/api/admin/token-keys", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: k.id, status: next }),
    });
    const data = await res.json();
    if (res.ok && data.ok) { setToast(next === "active" ? "已启用" : "已停用"); setTimeout(() => setToast(null), 2000); load(); }
    else alert("操作失败：" + (data.error || ""));
  };

  const remove = async (id: string) => {
    if (!confirm("确定删除该密钥？删除后调用方将失效。")) return;
    const res = await fetch(`/api/admin/token-keys?id=${id}`, { method: "DELETE", credentials: "include" });
    const data = await res.json();
    if (res.ok && data.ok) load();
    else alert("删除失败：" + (data.error || ""));
  };

  const copy = (text: string) => navigator.clipboard?.writeText(text).then(() => { setToast("已复制"); setTimeout(() => setToast(null), 2000); });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">API 接入（词元订阅）</h1>
        <p className="text-muted-foreground mt-1">生成 API Key 给海外卖家/系统直连调用你的词元，按调用量计费，对方只拿到结论、拿不到底层逻辑</p>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      {tableMissing && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 mb-4">
          <div className="flex items-center gap-2 text-amber-800 font-medium mb-2"><AlertCircle className="w-5 h-5" /> 数据表尚未创建</div>
          <p className="text-sm text-amber-700">请到 Supabase Dashboard → SQL Editor 执行仓库里的 <code className="bg-white px-1 rounded">supabase-api-keys.sql</code> 一次，刷新本页即可使用。</p>
        </div>
      )}

      {newKey && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-green-800 font-medium flex items-center gap-1"><KeyRound className="w-4 h-4" /> 新密钥已生成（仅显示一次，请立即复制保存）</p>
          <div className="flex items-center gap-2 mt-2">
            <code className="flex-1 bg-white px-3 py-2 rounded-lg text-sm break-all border border-green-200">{newKey}</code>
            <button onClick={() => copy(newKey)} className="btn-secondary text-sm flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> 复制</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="密钥备注（如：美国Shopify卖家-John）"
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm flex-1 min-w-[200px]" />
        <button onClick={create} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} 生成密钥
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin inline" /> 加载中…</div>
      ) : keys.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-muted-foreground">还没有密钥，生成一条发给你的海外买家。</div>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-primary">{k.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${k.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {k.status === "active" ? "启用中" : "已停用"}
                  </span>
                  <span className="text-xs text-gray-400">调用 {k.usage_count} 次</span>
                  {k.credit_balance !== null && k.credit_balance !== undefined && (
                    <span className="text-xs text-indigo-600">额度 余 {(k.credit_balance || 0) - (k.credit_used || 0)}/{k.credit_balance}</span>
                  )}
                </div>
                <code className="block text-xs text-gray-500 mt-1 break-all">{k.api_key}</code>
                <span className="text-xs text-gray-400">{k.created_at ? new Date(k.created_at).toLocaleString("zh-CN") : ""}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => copy(k.api_key)} title="复制" className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg"><Copy className="w-4 h-4" /></button>
                <button onClick={() => toggle(k)} title={k.status === "active" ? "停用" : "启用"} className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg"><Power className="w-4 h-4" /></button>
                <button onClick={() => remove(k.id)} title="删除" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
