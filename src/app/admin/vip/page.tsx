"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, Search, RefreshCw,
  Users, Mail, Phone, Building2, Calendar, Palette, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 字段名兼容映射：数据库可能用不同名称
function getField(row: any, ...names: string[]): any {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null) return row[name];
  }
  return undefined;
}

// 统一的字段访问（兼容 customer_name/name, customer_phone/phone 等）
function normalizeMember(raw: any) {
  return {
    id: raw.id,
    name: getField(raw, "name", "customer_name", "full_name") || "-",
    phone: getField(raw, "phone", "customer_phone", "mobile"),
    wechat: getField(raw, "wechat", "customer_wechat", "wechat_id"),
    gender: getField(raw, "gender"),
    color_season: getField(raw, "color_season", "colour_season", "season_type"),
    main_style: getField(raw, "main_style", "style_type", "body_type"),
    vip_level: getField(raw, "vip_level", "level", "membership_tier"),
    store_name: getField(raw, "store_name", "store"),
    created_at: getField(raw, "created_at", "inserted_at") || new Date().toISOString(),
    // 保留原始数据供调试
    _raw: raw,
  };
}

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

  const fetchMembers = async () => {
    setLoading(true);
    try {
      // 同时查询两个表：vip_customers + customers（客户管理页面录入的数据）
      const [vipRes, custRes] = await Promise.all([
        supabase.from("vip_customers").select("*").order("id", { ascending: false }).limit(100),
        supabase.from("customers").select("*").order("id", { ascending: false }).limit(100),
      ]);

      const allData: any[] = [];
      const sources: string[] = [];

      if (vipRes.data && vipRes.data.length > 0) {
        allData.push(...vipRes.data.map((r: any) => ({ ...normalizeMember(r), _source: "vip_customers" })));
        sources.push(`vip_customers: ${vipRes.data.length}条`);
        console.log("vip_customers 字段:", Object.keys(vipRes.data[0]), "数据:", vipRes.data[0]);
      }

      if (custRes.data && custRes.data.length > 0) {
        allData.push(...custRes.data.map((r: any) => ({ ...normalizeMember(r), _source: "customers" })));
        sources.push(`customers: ${custRes.data.length}条`);
        console.log("customers 字段:", Object.keys(custRes.data[0]), "数据:", custRes.data[0]);
      }

      // 按id去重（同一用户可能两个表都有，保留有更多信息的）
      const seen = new Set<string>();
      const deduped = allData.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });

      setDebugInfo(`数据来源: ${sources.join(" + ") || "无"}`);
      setMembers(deduped);
    } catch (err: any) {
      showToast("error", "加载失败：" + err.message);
      console.error("VIP加载错误:", err);
      setDebugInfo("错误: " + err.message);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const filtered = members.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (m.name || "").toLowerCase();
    const phone = (m.phone || "");
    const wechat = (m.wechat || "").toLowerCase();
    return name.includes(q) || phone.includes(q) || wechat.includes(q);
  });

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">VIP 客户管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理所有录入的客户数据（色彩季型、风格测试等）</p>
          {debugInfo && <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{debugInfo}</p>}
        </div>
        <button onClick={fetchMembers} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> 刷新
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <Users className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-primary">{members.length}</p>
          <p className="text-xs text-muted-foreground">总客户数</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <Palette className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-primary">{members.filter(m => m.color_season).length}</p>
          <p className="text-xs text-muted-foreground">已录色彩季型</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <Sparkles className="w-8 h-8 text-amber-600 mb-2" />
          <p className="text-2xl font-bold text-primary">{members.filter(m => m.main_style).length}</p>
          <p className="text-xs text-muted-foreground">已测风格类型</p>
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
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" /><p className="text-muted-foreground">加载中...</p></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p>{members.length === 0 ? "暂无客户数据，请到「色彩季型录入」添加客户" : "无匹配结果"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">姓名</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">联系方式</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">性别</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">色彩季型</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">主风格</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">店铺/VIP等级</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">来源</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">录入时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">{m.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 space-y-1">
                    {m.phone && <div><Phone className="w-3 h-3 inline mr-1" />{m.phone}</div>}
                    {m.wechat && <div><Mail className="w-3 h-3 inline mr-1" />{m.wechat}</div>}
                    {!m.phone && !m.wechat && <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">{m.gender === "female" ? "女" : m.gender === "male" ? "男" : "-"}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700">{m.color_season || "-"}</span></td>
                  <td className="px-4 py-3 text-sm">{m.main_style || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div>{m.store_name || "-"}</div>
                    {m.vip_level && m.vip_level !== "-" && <div className="text-[10px] text-accent">VIP {m.vip_level}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      m._source === "customers" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                    }`}>
                      {m._source === "customers" ? "客户管理录入" : "色彩季型录入"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(m.created_at).toLocaleDateString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
