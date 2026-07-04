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

  // 加载数据
  const load = () => {
    setLoading(true);
    fetch("/api/public/home-categories")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setList(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // 保存（新增/编辑）
  const save = async () => {
    if (!form.label.trim()) { alert("标签名称不能为空"); return; }
    const url = editing
      ? "/api/admin/home-categories"
      : "/api/admin/home-categories";
    const method = editing ? "PUT" : "POST";
    const body = editing ? { ...form, id: editing.id } : form;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });
    const result = await res.json();
    if (result.success !== false) {
      setShowForm(false); setEditing(null);
      setForm({ label: "", icon: "", link: "", sort_order: list.length, is_active: true });
      load();
    } else {
      alert("保存失败：" + (result.error || "未知错误"));
    }
  };

  // 删除
  const del = async (id: string) => {
    if (!confirm("确定删除？")) return;
    const res = await fetch(`/api/admin/home-categories?id=${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const result = await res.json();
    if (result.success !== false) {
      load();
    } else {
      alert("删除失败：" + (result.error || "未知错误"));
    }
  };

  // 切换激活状态
  const toggleActive = async (item: HomeCategory) => {
    await fetch("/api/admin/home-categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
      credentials: "include",
    });
    load();
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
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
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
                  <th className="p-3 text-center w-28">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.map(t => (
                  <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-bold text-gray-800">{t.label}</td>
                    <td className="p-3 text-center text-gray-500">{t.sort_order}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${t.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => toggleActive(t)} className={`text-xs mr-2 ${t.is_active ? 'text-amber-600' : 'text-green-600'}`}>
                        {t.is_active ? '隐藏' : '显示'}
                      </button>
                      <button onClick={() => { setForm(t); setEditing(t); setShowForm(true); }} className="text-blue-600 hover:text-blue-800 mr-2 text-xs">编辑</button>
                      <button onClick={() => del(t.id)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-400">暂无标签，点击上方「新增标签」添加</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-4">{editing ? "编辑" : "新增"}标签</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">标签名称 *</label>
                <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">链接地址（可选）</label>
                <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="/products?category=穿搭" />
              </div>
              <div>
                <label className="text-xs text-gray-500">排序权重</label>
                <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                <span className="text-sm text-gray-700">启用（显示在小程序首页）</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">保存</button>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 py-2.5 bg-gray-200 rounded-xl text-sm">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
