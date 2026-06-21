"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, Users, Mail, Phone, Palette, Sparkles, Trash2 } from "lucide-react";

// 季型中文标签
const seasonLabels: Record<string, string> = {
  light_warm: "浅暖型", warm_bright: "暖亮型", clear_warm: "净暖型",
  light_cool: "浅冷型", soft_cool: "柔冷型", cool_soft: "冷柔型",
  warm_soft: "暖柔型", soft_warm: "柔暖型", deep_warm: "深暖型",
  clear_cool: "净冷型", cool_bright: "冷亮型", deep_cool: "深冷型",
};

export default function AdminVIPPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchMembers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vip-data");
      const json = await res.json();
      if (json.success) setMembers(json.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchMembers(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("确定删除此VIP记录？")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/membership-orders-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, table: "vip_customers" }),
      });
      const json = await res.json();
      if (json.success) {
        setMembers(prev => prev.filter(m => m.id !== id));
      } else {
        alert("删除失败：" + (json.error || ""));
      }
    } catch (e: any) {
      alert("删除失败：" + e.message);
    } finally {
      setDeletingId(null);
    }
  }

  const stats = {
    total: members.length,
    color: members.filter(m => m.color_season).length,
    style: members.filter(m => m.main_style).length,
    phone: members.filter(m => m.phone).length,
  };

  return (
    <div className="min-h-screen">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">VIP 客户管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            统一查看客户数据 · 共 <strong className="text-primary">{stats.total}</strong> 条
          </p>
        </div>
        <button onClick={fetchMembers} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
          <Loader2 className="w-4 h-4 inline mr-1" /> 刷新
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <Users className="w-7 h-7 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-primary">{stats.total}</p>
          <p className="text-xs text-muted-foreground">总客户数</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <Palette className="w-7 h-7 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-primary">{stats.color}</p>
          <p className="text-xs text-muted-foreground">已录色彩季型</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <Sparkles className="w-7 h-7 text-amber-600 mb-2" />
          <p className="text-2xl font-bold text-primary">{stats.style}</p>
          <p className="text-xs text-muted-foreground">已测风格类型</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <Phone className="w-7 h-7 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-primary">{stats.phone}</p>
          <p className="text-xs text-muted-foreground">有手机号</p>
        </div>
      </div>

      {/* 表格 */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-base font-medium mb-2">暂无客户数据</p>
          <p className="text-sm mb-4">请通过以下方式录入客户：</p>
          <Link href="/admin/color-analysis" className="text-accent hover:underline">→ 色彩季型录入</Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">姓名</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-36">联系方式</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">性别</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">色彩季型</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">主风格</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">VIP等级</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-28">录入时间</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((m: any) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">{m.name || m.customer_name || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {m.phone && <div><Phone className="w-3 h-3 inline mr-1" />{m.phone}</div>}
                    {m.wechat && <div><Mail className="w-3 h-3 inline mr-1" />{m.wechat}</div>}
                    {!m.phone && !m.wechat && <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">{m.gender === "female" ? "女" : m.gender === "male" ? "男" : "-"}</td>
                  <td className="px-4 py-3">
                    {m.color_season ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700 font-medium">{seasonLabels[m.color_season] || m.color_season}</span>
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
                      className="text-red-400 hover:text-red-600 disabled:opacity-30 text-sm"
                      title="删除"
                    >
                      {deletingId === m.id ? <Loader2 className="w-4 h-4 animate-spin inline" /> : <Trash2 className="w-4 h-4 inline" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
