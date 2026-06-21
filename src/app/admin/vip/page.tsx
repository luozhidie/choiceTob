"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Users, Mail, Phone, Palette, Sparkles, Trash2 } from "lucide-react";

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

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vip-data");
      const json = await res.json();
      if (json.success) setMembers(json.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除此 VIP 记录?")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/membership-orders-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, table: "vip_customers" }),
      });
      const json = await res.json();
      if (json.success) setMembers(prev => prev.filter((m: any) => m.id !== id));
      else alert("删除失败:" + (json.error || ""));
    } catch (e: any) { alert("删除失败:" + e.message); }
    finally { setDeletingId(null); }
  }

  const sl = (v: string) => seasonLabels[v] || v || "-";
  const statsTotal = members.length;
  const statsColor = members.filter(m => m.color_season).length;
  const statsStyle = members.filter(m => m.main_style).length;
  const statsPhone = members.filter(m => m.phone).length;

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">VIP 客户管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            统一查看客户数据 · 共 <strong className="text-primary">{statsTotal}</strong> 条
          </p>
        </div>
        <button onClick={fetchMembers} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><Loader2 className="w-4 h-4 inline mr-1" /> 刷新</button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <Users className="w-6 h-6 text-blue-600 mb-1" /><p className="text-xl font-bold">{statsTotal}</p><p className="text-xs text-muted-foreground">总客户数</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <Palette className="w-6 h-6 text-purple-600 mb-1" /><p className="text-xl font-bold">{statsColor}</p><p className="text-xs text-muted-foreground">已录色彩季型</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <Sparkles className="w-6 h-6 text-amber-600 mb-1" /><p className="text-xl font-bold">{statsStyle}</p><p className="text-xs text-muted-foreground">已测风格类型</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <Phone className="w-6 h-6 text-green-600 mb-1" /><p className="text-xl font-bold">{statsPhone}</p><p className="text-xs text-muted-foreground">有手机号</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="font-medium mb-2">暂无数据</p>
          <Link href="/admin/color-analysis" className="text-accent hover:underline text-sm">&rarr; 色彩季型录入</Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase">
              <th className="text-left px-4 py-3">姓名</th><th className="text-left px-4 py-3 w-32">联系</th>
              <th className="text-left px-4 py-3">性别</th><th className="text-left px-4 py-3">色彩季型</th>
              <th className="text-left px-4 py-3 w-20">风格</th><th className="text-left px-4 py-3 w-16">VIP</th>
              <th className="text-left px-4 py-3 w-24">时间</th><th className="text-right px-4 py-3 w-16"></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
            {members.map((m:any)=>(
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium">{m.name||m.customer_name||"-"}</td>
                <td className="px-4 py-2.5 text-xs text-gray-500">
                  {m.phone&&<span><Phone className="w-3 h-3 inline mr-0.5"/>{m.phone}</span>}
                  {m.wechat&&<span className="ml-1"><Mail className="w-3 h-3 inline mr-0.5"/>{m.wechat}</span>}
                  {!m.phone&&!m.wechat&&"-"}
                </td>
                <td className="px-4 py-2.5">{m.gender==="female"?"女":m.gender==="male"?"男":"-"}</td>
                <td className="px-4 py-2.5">{m.color_season?<span className="px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700 font-medium">{sl(m.color_season)}</span>:"-"}</td>
                <td className="px-4 py-2.5 truncate max-w-[100px]" title={m.main_style}>{m.main_style||"-"}</td>
                <td className="px-4 py-2.5">{m.vip_level?<span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">{m.vip_level}</span>:"-"}</td>
                <td className="px-4 py-2.5 text-xs text-gray-400">{m.created_at?new Date(m.created_at).toLocaleDateString("zh-CN"):"-"}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={()=>handleDelete(m.id)} disabled={deletingId===m.id} className="text-red-400 hover:text-red-600 disabled:opacity-30 text-xs" title="删除">
                    {deletingId===m.id?<Loader2 className="w-4 h-4 animate-spin inline"/>:<Trash2 className="w-4 h-4 inline"/>}
                  </button>
                </td>
              </tr>
            ))}
            </tbody></table>
        </div>
      )}
    </div>
  );
}
