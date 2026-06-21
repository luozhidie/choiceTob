"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, Search, RefreshCw,
  Users, Mail, Phone, Palette, Sparkles, Trash2, Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 字段名兼容映射
function getField(row: any, ...names: string[]): any {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null) return row[name];
  }
  return undefined;
}

function normalizeMember(raw: any, source: string) {
  return {
    id: raw.id,
    name: getField(raw, "name", "customer_name", "full_name") || "-",
    phone: getField(raw, "phone", "customer_phone", "mobile"),
    wechat: getField(raw, "wechat", "customer_wechat", "wechat_id"),
    gender: getField(raw, "gender"),
    color_season: getField(raw, "color_season", "colour_season", "season_type"),
    main_style: getField(raw, "main_style", "style_type", "body_type"),
    vip_level: getField(raw, "vip_level", "level", "membership_tier", "membership_level"),
    store_name: getField(raw, "store_name", "store"),
    created_at: getField(raw, "created_at", "inserted_at") || new Date().toISOString(),
    _source: source,
    _raw: raw,
  };
}

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
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const supabase = createClient();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // 从所有可能的表查询客户数据
  const fetchMembers = async () => {
    setLoading(true);
    try {
      // 同时查询所有可能存储客户数据的表
      const results = await Promise.allSettled([
        supabase.from("vip_customers").select("*").order("id", { ascending: false }).limit(200),
        supabase.from("customers").select("*").order("id", { ascending: false }).limit(200),
        supabase.from("profiles").select("*").order("id", { ascending: false }).limit(200),
      ]);

      const allData: any[] = [];
      const sourceCounts: Record<string, number> = {};

      // vip_customers
      if (results[0].status === "fulfilled" && results[0].value.data?.length) {
        const d = results[0].value.data;
        allData.push(...d.map((r: any) => normalizeMember(r, "色彩季型录入")));
        sourceCounts["色彩季型录入(vip_customers)"] = d.length;
        if (d.length > 0) console.log("[vip_customers] 字段:", Object.keys(d[0]), "样例:", JSON.stringify(d[0]).slice(0, 300));
      }

      // customers
      if (results[1].status === "fulfilled" && results[1].value.data?.length) {
        const d = results[1].value.data;
        allData.push(...d.map((r: any) => normalizeMember(r, "客户管理")));
        sourceCounts["客户管理(customers)"] = d.length;
        if (d.length > 0) console.log("[customers] 字段:", Object.keys(d[0]), "样例:", JSON.stringify(d[0]).slice(0, 300));
      }

      // profiles（注册用户）
      if (results[2].status === "fulfilled" && results[2].value.data?.length) {
        const d = results[2].value.data;
        // 只取有名字的记录
        const withName = d.filter((r: any) => r.full_name || r.name || r.phone || r.email);
        allData.push(...withName.map((r: any) => normalizeMember(r, "注册用户")));
        if (withName.length > 0) sourceCounts["注册用户(profiles)"] = withName.length;
      }

      // 按id去重
      const seen = new Set<string>();
      const deduped = allData.filter((m) => {
        if (!m.id || seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });

      const infoParts = Object.entries(sourceCounts).map(([k, v]) => `${k}: ${v}条`);
      setDebugInfo(deduped.length > 0 ? `共 ${deduped.length} 条 (${infoParts.join(" + ")})` : `未找到任何客户数据`);
      setMembers(deduped);
    } catch (err: any) {
      showToast("error", "加载失败：" + err.message);
      console.error("加载错误:", err);
      setDebugInfo("错误: " + err.message);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  // 删除客户
  const handleDelete = async (member: any) => {
    if (!confirm(`确定删除「${member.name}」？`)) return;
    try {
      let error;
      if (member._source === "色彩季型录入") {
        ({ error } = await supabase.from("vip_customers").delete().eq("id", member.id));
      } else if (member._source === "客户管理") {
        ({ error } = await supabase.from("customers").delete().eq("id", member.id));
      }
      if (error) throw error;
      showToast("success", "已删除");
      fetchMembers();
    } catch (err: any) {
      showToast("error", "删除失败：" + err.message);
    }
  };

  const filtered = members.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (m.name || "").toLowerCase().includes(q) ||
      (m.phone || "").includes(q) ||
      (m.wechat || "").toLowerCase().includes(q)
    );
  });

  const seasonLabel = (val: string) => seasonLabels[val] || val || "-";

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">VIP 客户管理</h1>
          <p className="text-sm text-muted-foreground mt-1">统一查看所有客户数据（色彩季型录入 / 客户管理 / 注册用户）</p>
          {debugInfo && <p className="text-xs font-mono mt-1 px-2 py-1 bg-gray-100 rounded inline-block">{debugInfo}</p>}
        </div>
        <button onClick={fetchMembers} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> 刷新
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <Users className="w-7 h-7 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-primary">{members.length}</p>
          <p className="text-xs text-muted-foreground">总客户数</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <Palette className="w-7 h-7 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-primary">{members.filter(m => m.color_season && m.color_season !== "-").length}</p>
          <p className="text-xs text-muted-foreground">已录色彩季型</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <Sparkles className="w-7 h-7 text-amber-600 mb-2" />
          <p className="text-2xl font-bold text-primary">{members.filter(m => m.main_style && m.main_style !== "-").length}</p>
          <p className="text-xs text-muted-foreground">已测风格类型</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <Phone className="w-7 h-7 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-primary">{members.filter(m => m.phone).length}</p>
          <p className="text-xs text-muted-foreground">有手机号</p>
        </div>
      </div>

      {/* 搜索 */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索姓名/手机/微信..." className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      {/* 表格 */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" /><p className="text-muted-foreground">正在从所有数据源加载...</p></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-base font-medium mb-2">暂无客户数据</p>
          <p className="text-sm mb-4">请通过以下任一方式录入客户：</p>
          <div className="flex justify-center gap-4 text-sm">
            <a href="/admin/color-analysis" className="text-accent hover:underline">→ 色彩季型录入</a>
            <span className="text-gray-300">|</span>
            <a href="/admin/customers" className="text-blue-600 hover:underline">→ 客户管理</a>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">姓名</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-36">联系方式</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">性别</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">色彩季型</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">主风格</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-28">来源</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((m) => (
                <tr key={`${m._source}-${m.id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">{m.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {m.phone && <div><Phone className="w-3 h-3 inline mr-1" />{m.phone}</div>}
                    {m.wechat && <div><Mail className="w-3 h-3 inline mr-1" />{m.wechat}</div>}
                    {!m.phone && !m.wechat && <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">{m.gender === "female" ? "女" : m.gender === "male" ? "男" : "-"}</td>
                  <td className="px-4 py-3">
                    {m.color_season && m.color_season !== "-" ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700 font-medium">{seasonLabel(m.color_season)}</span>
                    ) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-sm truncate max-w-[120px]" title={m.main_style}>
                    {m.main_style && m.main_style !== "-" ? m.main_style : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      m._source.includes("色彩") ? "bg-green-50 text-green-600" :
                      m._source.includes("客户") ? "bg-blue-50 text-blue-600" :
                      "bg-gray-100 text-gray-500"
                    }`}>{m._source}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(m)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" title="删除">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 10 && <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">显示前{Math.min(filtered.length, 200)}条</div>}
        </div>
      )}
    </div>
  );
}
