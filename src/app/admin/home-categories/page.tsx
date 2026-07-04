"use client";

import { useState, useEffect } from "react";

interface HomeCategory {
  id: string;
  label: string;
  icon: string;
  link: string;
  sort_order: number;
  is_active: boolean;
}

export default function HomeCategoriesPage() {
  const [list, setList] = useState<HomeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<HomeCategory | null>(null);
  const [form, setForm] = useState({ label: "", icon: "", link: "", sort_order: 0, is_active: true });
  const [saving, setSaving] = useState(false);

  // 加载数据
  const load = () => {
    setLoading(true);
    fetch("/api/public/home-categories")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setList(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // 保存（新增/编辑）
  const save = async () => {
    if (!form.label.trim()) { alert("标签名称不能为空"); return; }
    setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body = editing ? { ...form, id: editing.id } : form;

      const res = await fetch("/api/admin/home-categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const result = await res.json();
      if (result.error || result.success === false) {
        alert("保存失败：" + (result.error || "未知错误"));
      } else {
        setShowForm(false); setEditing(null);
        setForm({ label: "", icon: "", link: "", sort_order: list.length, is_active: true });
        load();
      }
    } catch (e: any) {
      alert("保存失败：" + (e?.message || "网络错误"));
    } finally {
      setSaving(false);
    }
  };

  // 删除
  const del = async (id: string) => {
    if (!confirm("确定删除该标签？")) return;
    try {
      const res = await fetch(`/api/admin/home-categories?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      if (result.error || result.success === false) {
        alert("删除失败：" + (result.error || "未知错误"));
      } else {
        load();
      }
    } catch (e: any) {
      alert("删除失败：" + (e?.message || "网络错误"));
    }
  };

  // 切换激活状态
  const toggleActive = async (item: HomeCategory) => {
    try {
      await fetch("/api/admin/home-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
        credentials: "include",
      });
      load();
    } catch {}
  };

  // 打开编辑弹窗
  const openEdit = (t: HomeCategory) => {
    setForm({ label: t.label, icon: t.icon, link: t.link, sort_order: t.sort_order, is_active: t.is_active });
    setEditing(t);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">首页行业标签</h1>
            <p className="text-sm text-gray-500 mt-1">管理小程序首页顶部分类标签</p>
          </div>
          <button onClick={() => {
            setForm({ label: "", icon: "", link: "", sort_order: list.length, is_active: true });
            setEditing(null); setShowForm(true);
          }}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:bg-blue-800">
            + 新增标签
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">加载中...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3 text-left">标签名称</th>
                  <th className="p-3 text-center w-16">排序</th>
                  <th className="p-3 text-center w-16">状态</th>
                  <th className="p-3 text-center w-40">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.map(t => (
                  <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-bold text-gray-800">{t.label}</td>
                    <td className="p-3 text-center text-gray-500">{t.sort_order}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${t.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => toggleActive(t)} className={`px-2 py-1 rounded-lg text-xs font-medium mr-1 ${t.is_active ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-green-700 bg-green-50 hover:bg-green-100'}`}>
                        {t.is_active ? '隐藏' : '显示'}
                      </button>
                      <button onClick={() => openEdit(t)} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold mr-1 hover:bg-blue-100 active:bg-blue-200">
                        ✏️ 编辑
                      </button>
                      <button onClick={() => del(t.id)} className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 active:bg-red-200">
                        🗑️ 删除
                      </button>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-400">暂无标签，点击上方「新增标签」添加</td></tr>
                )}
              </tbody>
            </table>

            {/* 移动端卡片视图 */}
            <div className="md:hidden divide-y">
              {list.map(t => (
                <div key={t.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-800">{t.label}</span>
                    {!t.is_active && <span className="ml-2 text-xs text-gray-400">(已隐藏)</span>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(t)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium">编辑</button>
                    <button onClick={() => del(t.id)} className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium">删除</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-4">{editing ? "✏️ 编辑" : "+ 新增"}标签</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500">标签名称 *</label>
                <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm mt-1 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                  placeholder="例如：珠宝" autoFocus />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">跳转链接（可选）</label>
                <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm mt-1 focus:border-blue-400 outline-none"
                  placeholder="/products?category=穿搭" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">排序权重（数字越小越靠前）</label>
                <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm mt-1 focus:border-blue-400 outline-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-gray-700">启用（显示在小程序首页分类栏）</span>
              </label>
              <div className="flex gap-3 pt-3">
                <button onClick={save} disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 active:bg-blue-800">
                  {saving ? '保存中...' : '💾 保存'}
                </button>
                <button onClick={() => { setShowForm(false); setEditing(null); }}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 active:bg-gray-300">
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
