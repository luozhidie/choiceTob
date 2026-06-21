import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Trash2, RefreshCw, DollarSign, Clock, UserCheck } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: "待确认", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  confirmed: { label: "已开通", cls: "bg-green-50 text-green-700 border border-green-200" },
  cancelled: { label: "已取消", cls: "bg-gray-100 text-gray-500 border border-gray-200" },
};

// 服务端获取订单
async function getOrders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("membership_orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

// 服务端删除订单
async function deleteOrder(orderId: string): Promise<{ success?: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // 方案1：用 createClient 删除（service role 绕过RLS）
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("membership_orders").delete().eq("id", orderId);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch {}

  // 方案2：直接用 REST API
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/membership_orders?id=eq.${encodeURIComponent(orderId)}`, {
      method: "DELETE",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: "return=minimal",
      },
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "未知错误" };
  }
}

export default async function MembershipOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const action = params.action;
  const targetId = params.id;

  // 处理删除操作
  if (action === "delete" && targetId) {
    const result = await deleteOrder(targetId);
    if (result.success) {
      // redirect to show success
      return new Response(null, { status: 302, headers: { Location: "/admin/membership-orders?msg=deleted" } });
    }
  }

  const msg = params.msg || null;
  const orders = await getOrders();

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    revenue: orders.filter(o => o.status === "confirmed").reduce((s, o) => s + (o.price || 0), 0),
  };

  const filterStatus = params.status || "";

  const filtered = filterStatus ? orders.filter(o => o.status === filterStatus) : orders;

  return (
    <div className="min-h-screen p-6">
      {/* 操作结果提示 */}
      {msg && (
        <div className="mb-6 px-5 py-3 rounded-xl font-medium text-sm shadow-sm bg-green-50 text-green-700 border border-green-200">
          订单已成功删除
          <a href="/admin/membership-orders" className="ml-3 underline">返回列表</a>
        </div>
      )}

      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/dashboard" className="text-muted-foreground hover:text-primary">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-primary">VIP订单管理</h1>
          </div>
          <p className="text-sm text-muted-foreground">审核会员支付订单，确认开通或取消</p>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-muted-foreground">待确认</p>
          <p className="text-2xl font-black text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-muted-foreground">已开通</p>
          <p className="text-2xl font-black text-green-600">{stats.confirmed}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-muted-foreground">累计营收</p>
          <p className="text-2xl font-black text-accent">¥{(stats.revenue / 100).toFixed(0)}</p>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex gap-3 mb-4">
        <a href="?status=pending"
          className={("px-3 py-2 rounded-lg text-sm border ") + (filterStatus === "pending" ? "bg-primary text-white border-primary" : "border-gray-200 hover:bg-gray-50")}>
          待确认 ({stats.pending})
        </a>
        <a href="?status=confirmed"
          className={("px-3 py-2 rounded-lg text-sm border ") + (filterStatus === "confirmed" ? "bg-green-600 text-white border-green-600" : "border-gray-200 hover:bg-gray-50")}>
          已开通 ({stats.confirmed})
        </a>
        <a href="/admin/membership-orders"
          className={("px-3 py-2 rounded-lg text-sm border ") + (!filterStatus ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 hover:bg-gray-50")}>
          全部 ({stats.total})
        </a>
      </div>

      {/* 表格 */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border shadow-sm">
          <p className="text-muted-foreground">暂无{filterStatus ? STATUS_MAP[filterStatus]?.label : ""}订单</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-muted-foreground uppercase">
                <th className="text-left px-4 py-3">套餐</th>
                <th className="text-left px-4 py-3">支付方式</th>
                <th className="text-right px-4 py-3">金额</th>
                <th className="text-left px-4 py-3">时间</th>
                <th className="text-left px-4 py-3">状态</th>
                <th className="text-right px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((o) => {
                const st = STATUS_MAP[o.status] || STATUS_MAP.pending;
                return (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{o.plan_name || o.plan_id || "-"}</td>
                    <td className="px-4 py-3">{o.payment_method === "wechat" ? "微信" : o.payment_method === "alipay" ? "支付宝" : "-"}</td>
                    <td className="px-4 py-3 text-right font-bold">¥{(o.price / 100).toFixed(0)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ") + st.cls}>
                        {o.status === "confirmed" ? <CheckCircle2 className="w-3 h-3" /> :
                         o.status === "cancelled" ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form method="GET" action="/admin/membership-orders" className="inline">
                        <input type="hidden" name="action" value="delete" />
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit"
                          onClick={() => confirm("确定删除「" + (o.plan_name || "") + "」？") || undefined}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50 inline-flex items-center gap-1"
                          title="彻底删除此订单"
                        >
                          <Trash2 className="w-4 h-4" /> 删除
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 text-xs text-gray-400 text-center">
        订单数据来自 membership_orders 表 · 共 {stats.total} 条记录
      </div>
    </div>
  );
}
