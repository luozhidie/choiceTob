"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, Crown, Eye, Wallet, Search, RefreshCw, Clock, AlertTriangle,
  Users, UserCheck, UserX, UserPlus, Calendar, Mail, Phone, Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VipMember {
  id: string;
  name: string;
  phone: string | null;
  wechat: string | null;
  gender: string | null;
  color_season: string | null;
  main_style: string | null;
  membership_type: "view_price" | "deposit_discount" | null;
  membership_expires_at: string | null;
  created_at: string;
  store_id: string | null;
  store_name?: string;
}

const MEMBERSHIP_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  view_price: { label: "基础VIP", icon: Eye, color: "bg-blue-50 text-blue-700 border-blue-200" },
  deposit_discount: { label: "高阶VIP", icon: Crown, color: "bg-amber-50 text-amber-700 border-amber-200" },
};

export default function AdminVIPPage() {
  const [members, setMembers] = useState<VipMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const supabase = createClient();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // 获取所有 VIP 客户（从 vip_customers 表）
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vip_customers")
        .select(`
          id, name, phone, wechat, gender, color_season, main_style,
          membership_type, membership_expires_at, created_at, store_id,
          stores (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const list = (data || []).map((item: any) => ({
        ...item,
        store_name: item.stores?.name || "",
      }));
      setMembers(list as VipMember[]);
    } catch (err: any) {
      showToast("error", "加载失败：" + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  // 搜索 + 筛选
  const filteredMembers = useMemo(() => {
    let list = [...members];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.phone && m.phone?.includes(q)) ||
          (m.wechat && m.wechat.toLowerCase().includes(q))
      );
    }
    if (filterType) {
      list = list.filter((m) => m.membership_type === filterType);
    }
    return list;
  }, [search, filterType, members]);

  // 修改会员类型
  const handleEditSave = async (member: VipMember) => {
    if (!editType) return;
    setSaving(true);
    try {
      const updates: any = { membership_type: editType };
      if (editExpiry) updates.membership_expires_at = new Date(editExpiry).toISOString();

      const { error } = await supabase
        .from("vip_customers")
        .update(updates)
        .eq("id", member.id);

      if (error) throw error;
      showToast("success", "已更新");
      setEditingId(null);
      fetchMembers();
    } catch (err: any) {
      showToast("error", "更新失败：" + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 移除会员（降级为 none）
  const handleRevoke = async (member: VipMember) => {
    if (!confirm(`确定取消「${member.name || member.phone}」的会员资格？`)) return;
    try {
      const { error } = await supabase
        .from("vip_customers")
        .update({ membership_type: null, membership_expires_at: null })
        .eq("id", member.id);
      if (error) throw error;
      showToast("success", "已取消会员资格");
      fetchMembers();
    } catch (err: any) {
      showToast("error", "取消失败：" + err.message);
    }
  };

  // 续期一个月
  const handleExtend = async (member: VipMember) => {
    if (!confirm(`确定为「${member.name || member.phone}」续期1个月？`)) return;
    try {
      const current = member.membership_expires_at
        ? new Date(member.membership_expires_at)
        : new Date();
      current.setMonth(current.getMonth() + 1);
      const { error } = await supabase
        .from("vip_customers")
        .update({ membership_expires_at: current.toISOString() })
        .eq("id", member.id);
      if (error) throw error;
      showToast("success", "已续期至 " + current.toLocaleDateString("zh-CN"));
      fetchMembers();
    } catch (err: any) {
      showToast("error", "续期失败：" + err.message);
    }
  };

  // 统计数据
  const now = new Date();
  const next30Days = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  const totalMembers = members.filter((m) => m.membership_type).length;
  const activeMembers = members.filter(
    (m) => m.membership_expires_at && new Date(m.membership_expires_at) > now
  ).length;
  const expiredMembers = totalMembers - activeMembers;
  const expiringSoon = members.filter(
    (m) =>
      m.membership_expires_at &&
      new Date(m.membership_expires_at) > now &&
      new Date(m.membership_expires_at) <= next30Days
  ).length;
  const basicCount = members.filter((m) => m.membership_type === "view_price").length;
  const premiumCount = members.filter((m) => m.membership_type === "deposit_discount").length;

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-primary" : "bg-red-500"}`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 页面标题 + 操作 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">VIP会员管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理所有付费会员，续期、升降级、取消资格</p>
        </div>
        <button
          onClick={fetchMembers}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "总会员", value: totalMembers, icon: Users, color: "text-primary bg-primary/10" },
          { label: "有效", value: activeMembers, icon: UserCheck, color: "text-green-600 bg-green-50" },
          { label: "已过期", value: expiredMembers, icon: UserX, color: "text-red-500 bg-red-50" },
          { label: "30天到期", value: expiringSoon, icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "基础VIP", value: basicCount, icon: Eye, color: "text-blue-600 bg-blue-50" },
          { label: "高阶VIP", value: premiumCount, icon: Crown, color: "text-amber-600 bg-amber-50" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-primary">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {/* 搜索 + 筛选 */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索姓名/手机号/微信号..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">全部类型</option>
          <option value="view_price">基础VIP</option>
          <option value="deposit_discount">高阶VIP</option>
        </select>

        {expiringSoon > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5" />
            {expiringSoon} 位会员30天内到期
          </div>
        )}
      </div>

      {/* 表格 */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-muted-foreground text-sm">
          {members.length === 0 ? "暂无付费会员" : "无匹配结果"}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">客户</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">联系方式</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">会员类型</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">到期时间</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMembers.map((member) => {
                  const isExpired =
                    member.membership_expires_at &&
                    new Date(member.membership_expires_at) <= now;
                  const memberInfo = member.membership_type ? MEMBERSHIP_LABELS[member.membership_type] : null;
                  const MemberIcon = memberInfo?.icon || Crown;

                  return (
                    <tr key={member.id} className={`hover:bg-gray-50/50 transition-colors ${isExpired ? "opacity-60" : ""}`}>
                      {/* 客户信息 */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {(member.name || "?")[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-primary truncate">
                              {member.name || "未设置姓名"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {member.store_name && `店铺: ${member.store_name}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 联系方式 */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          {member.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone className="w-3 h-3" /> {member.phone}
                            </div>
                          )}
                          {member.wechat && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Mail className="w-3 h-3" /> {member.wechat}
                            </div>
                          )}
                          {!member.phone && !member.wechat && (
                            <span className="text-xs text-gray-300">-</span>
                          )}
                        </div>
                      </td>

                      {/* 会员类型 */}
                      <td className="px-4 py-3.5">
                        {editingId === member.id ? (
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value)}
                            className="text-xs px-2 py-1 rounded border border-gray-200"
                          >
                            <option value="">选择...</option>
                            <option value="view_price">基础VIP</option>
                            <option value="deposit_discount">高阶VIP</option>
                          </select>
                        ) : (
                          memberInfo && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${memberInfo.color}`}
                            >
                              <MemberIcon className="w-3 h-3" />
                              {memberInfo.label}
                            </span>
                          )
                        )}
                      </td>

                      {/* 到期时间 */}
                      <td className="px-4 py-3.5">
                        {editingId === member.id ? (
                          <input
                            type="date"
                            value={editExpiry}
                            onChange={(e) => setEditExpiry(e.target.value)}
                            className="text-xs px-2 py-1 rounded border border-gray-200 w-32"
                          />
                        ) : member.membership_expires_at ? (
                          <span className="text-sm text-gray-700">
                            {new Date(member.membership_expires_at).toLocaleDateString("zh-CN")}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">永久</span>
                        )}
                      </td>

                      {/* 状态 */}
                      <td className="px-4 py-3.5">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                            <AlertTriangle className="w-3 h-3" /> 已过期
                          </span>
                        ) : member.membership_expires_at &&
                          new Date(member.membership_expires_at) <= next30Days ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
                            <Clock className="w-3 h-3" /> 即将到期
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                            <UserCheck className="w-3 h-3" /> 有效
                          </span>
                        )}
                      </td>

                      {/* 操作 */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {editingId === member.id ? (
                            <>
                              <button
                                onClick={() => handleEditSave(member)}
                                disabled={saving || !editType}
                                className="px-2.5 py-1 text-xs font-medium bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
                              >
                                {saving ? "..." : "保存"}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 rounded border border-gray-200"
                              >
                                取消
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingId(member.id);
                                  setEditType(member.membership_type || "");
                                  setEditExpiry(
                                    member.membership_expires_at
                                      ? new Date(member.membership_expires_at).toISOString().slice(0, 10)
                                      : ""
                                  );
                                }}
                                className="p-1.5 text-gray-400 hover:text-primary rounded hover:bg-gray-100 transition-colors"
                                title="编辑"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleExtend(member)}
                                className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-gray-100 transition-colors"
                                title="续期1个月"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRevoke(member)}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 transition-colors"
                                title="取消会员"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
