"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Users, Mail, Phone, Palette, Sparkles, Trash2 } from "lucide-react";

const seasonLabels: Record<string, string> = {
  light_warm: "\u6D45\u6696\u578B", warm_bright: "\u6696\u4EAE\u578B", clear_warm: "\u51C0\u6696\u578B",
  light_cool: "\u6D51\u51B7\u578B", soft_cool: "\u67D4\u51B7\u578B", cool_soft: "\u51B7\u67D4\u578B",
  warm_soft: "\u6696\u67D4\u578B", soft_warm: "\u67D4\u6696\u578B", deep_warm: "\u6DF1\u6696\u578B",
  clear_cool: "\u51C0\u51B7\u578B", cool_bright: "\u51B7\u4EAE\u578B", deep_cool: "\u6DF1\u51B7\u578B",
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
    if (!confirm("\u786E\u5B9A\u5220\u9664\u6B4E VIP \u8BB0\u5F55?")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/membership-orders-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, table: "vip_customers" }),
      });
      const json = await res.json();
      if (json.success) setMembers(prev => prev.filter((m: any) => m.id !== id));
      else alert("\u5220\u9664\u5931\u8D25:" + (json.error || ""));
    } catch (e: any) { alert("\u5220\u9664\u5931\u8D25:" + e.message); }
    finally { setDeletingId(null); }
  }

  const sl = (v: string) => seasonLabels[v] || v || "-";
  const stats = { total: members.length, color: members.filter(m => m.color_season).length, style: members.filter(m => m.main_style).length, phone: members.filter(m => m.phone).length };

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">VIP \u5BA2\u6237\u7BA1\u7406</h1>
          <p className="text-sm text-muted-foreground mt-1">
            \u7EDF\u4E00\u67E5\u770B\u5BA2\u6237\u6570\u636E &middot; \u5171 <strong className="text-primary">{stats.total}</strong> \u6761
          </p>
        </div>
        <button onClick={fetchMembers} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><Loader2 className="w-4 h-4 inline mr-1" /> \u5237\u65B0</button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[{l:"\u603B\u5BA2\u6237\u6570",v:stats.total,c:"text-blue-600",I:Users},{l:"\u5DF2\u5F55\u8272\u5F69\u5B63\u578B",v:stats.color,c:"text-purple-600",I:Palette},{l:"\u5DF6\u6D4B\u98CE\u683C",v:stats.style,c:"text-amber-600",I:Sparkles},{l:"\u6709\u624B\u673A\u53F7",v:stats.phone,c:"text-green-600",I:Phone}].map(({l,v,c,I})=>(<div key={l} className="bg-white rounded-xl p-4 border shadow-sm"><I className={"w-6 h-6 "+c+" mb-1"} /><p className="text-xl font-bold">{v}</p><p className="text-xs text-muted-foreground">{l}</p></div>))}
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="font-medium mb-2">\u6682\u65E0\u6570\u636E</p>
          <Link href="/admin/color-analysis" className="text-accent hover:underline text-sm">&rarr; \u8272\u5F69\u5B63\u578B\u5F55\u5165</Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase">
              <th className="text-left px-4 py-3">\u59D3\u540D</th><th className="text-left px-4 py-3 w-32">\u8054\u7CFB</th><th className="text-left px-4 py-3">\u6027\u522B</th><th className="text-left px-4 py-3">\u8272\u5F69\u5B63\u578B</th><th className="text-left px-4 py-3 w-20">\u98CE\u683C</th><th className="text-left px-4 py-3 w-16">VIP</th><th className="text-left px-4 py-3 w-24">\u65F6\u95F4</th><th className="text-right px-4 py-3 w-16"></th>
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
                <td className="px-4 py-2.5">{m.gender==="female"?"\u5973":m.gender==="male"?"\u7537":"-"}</td>
                <td className="px-4 py-2.5">{m.color_season?<span className="px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700 font-medium">{sl(m.color_season)}</span>:"-"}</td>
                <td className="px-4 py-2.5 truncate max-w-[100px]" title={m.main_style}>{m.main_style||"-"}</td>
                <td className="px-4 py-2.5">{m.vip_level?<span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">{m.vip_level}</span>:"-"}</td>
                <td className="px-4 py-2.5 text-xs text-gray-400">{m.created_at?new Date(m.created_at).toLocaleDateString("zh-CN"):"-"}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={()=>handleDelete(m.id)} disabled={deletingId===m.id} className="text-red-400 hover:text-red-600 disabled:opacity-30 text-xs" title="\u5220\u9664">
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
