"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Bell, BellOff, Check, CheckCircle2, Clock, Loader2,
  MessageCircle, Store, AlertCircle, X,
} from "lucide-react";

interface CrmNotification {
  id: string;
  type: string;
  title: string;
  content: string | null;
  related_id: string | null;
  related_type: string | null;
  is_read: boolean;
  created_at: string;
}

interface FollowUpReminder {
  id: string;
  store_id: string;
  contact_id: string;
  next_remind_at: string;
  reminded: boolean;
  content: string;
  store_name?: string;
  contact_name?: string;
}

const TYPE_MAP: Record<string, { label: string; icon: any; color: string }> = {
  FOLLOW_UP_REMINDER: { label: "跟进提醒", icon: Clock, color: "text-orange-600 bg-orange-50" },
  WECHAT_ADD_REMINDER: { label: "加微信提醒", icon: MessageCircle, color: "text-green-600 bg-green-50" },
  STORE_STATUS_CHANGE: { label: "门店状态变更", icon: Store, color: "text-blue-600 bg-blue-50" },
};

export default function CrmRemindersPage() {
  const [notifications, setNotifications] = useState<CrmNotification[]>([]);
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { fetchData(); }, [filterType, showUnreadOnly]);

  const fetchData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoading(false); return; }

    // 获取通知
    let notifQuery = supabase.from("crm_notifications").select("*").eq("user_id", userData.user.id).order("created_at", { ascending: false }).limit(50);
    if (filterType) notifQuery = notifQuery.eq("type", filterType);
    if (showUnreadOnly) notifQuery = notifQuery.eq("is_read", false);
    const { data: notifs } = await notifQuery;
    setNotifications(notifs || []);

    // 获取待跟进提醒（直接查跟进记录表）
    const { data: followData } = await supabase
      .from("crm_follow_ups")
      .select("*, crm_stores!inner(name), crm_contacts!inner(name)")
      .not("next_remind_at", "is", null)
      .eq("reminded", false)
      .lte("next_remind_at", new Date().toISOString())
      .order("next_remind_at", { ascending: true });

    if (followData) {
      const mapped = followData.map((f: any) => ({
        id: f.id,
        store_id: f.store_id,
        contact_id: f.contact_id,
        next_remind_at: f.next_remind_at,
        reminded: f.reminded,
        content: f.content,
        store_name: f.crm_stores?.name,
        contact_name: f.crm_contacts?.name,
      }));
      setReminders(mapped);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("crm_notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    await supabase.from("crm_notifications").update({ is_read: true }).eq("user_id", userData.user.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markReminded = async (id: string) => {
    await supabase.from("crm_follow_ups").update({ reminded: true }).eq("id", id);
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">提醒中心</h1>
          <p className="text-muted-foreground mt-1">查看跟进提醒和系统通知</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn-secondary flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4" /> 全部已读
            </button>
          )}
        </div>
      </div>

      {/* 待跟进提醒 */}
      {reminders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            待跟进 ({reminders.length})
          </h2>
          <div className="space-y-3">
            {reminders.map(r => (
              <div key={r.id} className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium text-primary text-sm">
                      {r.contact_name} @ {r.store_name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      提醒时间：{new Date(r.next_remind_at).toLocaleString("zh-CN")}
                    </div>
                    {r.content && <div className="text-sm text-gray-600 mt-1 line-clamp-2">上次跟进：{r.content}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => router.push(`/admin/crm/follow-ups?storeId=${r.store_id}`)}
                    className="btn-primary text-sm px-3 py-1.5">去跟进</button>
                  <button onClick={() => markReminded(r.id)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="标记已处理">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 筛选栏 */}
      <div className="flex items-center gap-3 mb-4">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm">
          <option value="">全部类型</option>
          {Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={showUnreadOnly} onChange={(e) => setShowUnreadOnly(e.target.checked)}
            className="w-4 h-4 accent-accent" />
          <span className="text-sm text-primary">只看未读</span>
        </label>
        <span className="text-sm text-muted-foreground ml-auto">
          {unreadCount > 0 ? `${unreadCount}条未读` : "全部已读"}
        </span>
      </div>

      {/* 通知列表 */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无通知</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const typeInfo = TYPE_MAP[n.type] || TYPE_MAP.FOLLOW_UP_REMINDER;
            const TypeIcon = typeInfo.icon;
            return (
              <div key={n.id} className={`rounded-xl border p-4 transition-colors ${
                n.is_read ? "bg-white border-gray-100" : "bg-accent/5 border-accent/20"
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-primary text-sm">{n.title}</span>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-accent" />}
                    </div>
                    {n.content && <p className="text-sm text-gray-600 mt-0.5">{n.content}</p>}
                    <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("zh-CN")}</div>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => markAsRead(n.id)}
                      className="p-1.5 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg flex-shrink-0" title="标记已读">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
