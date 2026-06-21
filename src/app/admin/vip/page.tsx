import { createClient } from "@/lib/supabase/server";
import { Loader2, Users, Mail, Phone, Palette, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import AdminVIPClient from "../vip-client";

// 季型中文标签
const seasonLabels: Record<string, string> = {
  light_warm: "\u6D45\u6696\u578B", warm_bright: "\u6696\u4EAE\u578B", clear_warm: "\u51C0\u6696\u578B",
  light_cool: "\u6D51\u51B7\u578B", soft_cool: "\u67D4\u51B7\u578B", cool_soft: "\u51B7\u67D4\u578B",
  warm_soft: "\u6696\u67D4\u578B", soft_warm: "\u67D4\u6696\u578B", deep_warm: "\u6DF1\u6696\u578B",
  clear_cool: "\u51C0\u51B7\u578B", cool_bright: "\u51B7\u4EAE\u578B", deep_cool: "\u6DF1\u51B7\u578B",
};

// 服务端获取所有客户数据
async function getAllMembers() {
  const supabase = await createClient();
  const allData: any[] = [];

  try {
    const { data } = await supabase.from("vip_customers").select("*").order("id", { ascending: false }).limit(200);
    if (data) allData.push(...data.map((r: any) => ({ ...r, _source: "\u8272\u5F69\u5B63\u578B\u5F55\u5165" })));
  } catch {}

  return allData;
}

export default async function AdminVIPPage() {
  const members = await getAllMembers();

  const normalized = members.map((m: any) => ({
    id: m.id,
    name: m.name || m.customer_name || m.full_name || "-",
    phone: m.phone || m.customer_phone || m.mobile,
    wechat: m.wechat || m.customer_wechat,
    gender: m.gender,
    color_season: m.color_season,
    main_style: m.main_style,
    vip_level: m.vip_level || m.level,
    store_name: m.store_name || m.store,
    created_at: m.created_at || "",
    _source: m._source,
  }));

  const seasonLabel = (v: string) => seasonLabels[v] || v || "-";

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">VIP \u5BA2\u6237\u7BA1\u7406</h1>
          <p className="text-sm text-muted-foreground mt-1">
            \u7EDF\u4E00\u67E5\u770B\u6240\u6709\u5BA2\u6237\u6570\u636E &middot; \u5171 <strong className="text-primary">{normalized.length}</strong> \u6761
            {normalized.length > 0 && <span className="ml-2 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">\u5DF2\u4ECE\u6570\u636E\u5E93\u52A0\u8F7D</span>}
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <Users className="w-7 h-7 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-primary">{normalized.length}</p>
          <p className="text-xs text-muted-foreground">\u603B\u5BA2\u6237\u6570</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <Palette className="w-7 h-7 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-primary">{normalized.filter((m: any) => m.color_season).length}</p>
          <p className="text-xs text-muted-foreground">\u5DF2\u5F55\u8272\u5F69\u5B63\u578B</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <Sparkles className="w-7 h-7 text-amber-600 mb-2" />
          <p className="text-2xl font-bold text-primary">{normalized.filter((m: any) => m.main_style).length}</p>
          <p className="text-xs text-muted-foreground">\u5DF6\u6D4B\u98CE\u683C\u7C7B\u578B</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <Phone className="w-7 h-7 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-primary">{normalized.filter((m: any) => m.phone).length}</p>
          <p className="text-xs text-muted-foreground">\u6709\u624B\u673A\u53F7</p>
        </div>
      </div>

      {/* 表格（带删除功能） */}
      {normalized.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-base font-medium mb-2">\u6682\u65E0\u5BA2\u6237\u6570\u636E</p>
          <p className="text-sm mb-4">\u8BF7\u901A\u8FC7\u4EE5\u4E0B\u65B9\u5F0F\u5F55\u5165\u5BA2\u6237:</p>
          <Link href="/admin/color-analysis" className="text-accent hover:underline">&rarr; \u8272\u5F69\u5B63\u578B\u5F55\u5165</Link>
        </div>
      ) : (
        <AdminVIPClient
          members={normalized}
          seasonLabel={seasonLabel}
        />
      )}
    </div>
  );
}
