"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Download, Eye, Trash2, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CoursePurchase {
  id: string;
  user_id: string;
  course_id: string;
  price: number;
  status: string;
  purchased_at: string;
  user_email?: string;
  course_title?: string;
}

export default function AdminCoursePurchasesPage() {
  const [purchases, setPurchases] = useState<CoursePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("course_purchases")
        .select("*")
        .order("purchased_at", { ascending: false });
      if (error) throw error;
      // 获取用户邮箱和课程标题
      const userIds = [...new Set(data?.map((p: any) => p.user_id) || [])];
      const courseIds = [...new Set(data?.map((p: any) => p.course_id) || [])];
      
      const [usersRes, coursesRes] = await Promise.all([
        userIds.length > 0 ? supabase.from("profiles").select("id, email").in("id", userIds) : { data: [] },
        courseIds.length > 0 ? supabase.from("courses").select("id, title").in("id", courseIds) : { data: [] },
      ]);

      const userMap = new Map((usersRes.data || []).map((u: any) => [u.id, u.email]));
      const courseMap = new Map((coursesRes.data || []).map((c: any) => [c.id, c.title]));

      const enriched = (data || []).map((p: any) => ({
        ...p,
        user_email: userMap.get(p.user_id) || "未知",
        course_title: courseMap.get(p.course_id) || p.course_id,
      }));
      setPurchases(enriched);
    } catch (err: any) {
      showToast("error", "加载失败：" + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPurchases(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此购买记录？")) return;
    try {
      const { error } = await supabase.from("course_purchases").delete().eq("id", id);
      if (error) throw error;
      showToast("success", "已删除");
      fetchPurchases();
    } catch (err: any) {
      showToast("error", "删除失败：" + err.message);
    }
  };

  const filtered = filterStatus ? purchases.filter((p) => p.status === filterStatus) : purchases;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
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

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">课程购买记录</h1>
            <p className="text-sm text-muted-foreground mt-1">查看所有课程购买记录</p>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm"
          >
            <option value="">全部状态</option>
            <option value="paid">已支付</option>
            <option value="refunded">已退款</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">暂无购买记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-muted-foreground">
                    <th className="px-5 py-3">用户</th>
                    <th className="px-5 py-3">课程</th>
                    <th className="px-5 py-3">金额</th>
                    <th className="px-5 py-3">状态</th>
                    <th className="px-5 py-3">购买时间</th>
                    <th className="px-5 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-sm">{p.user_email}</td>
                      <td className="px-5 py-3 text-sm font-medium text-primary">{p.course_title}</td>
                      <td className="px-5 py-3 text-sm">¥{(p.price / 100).toFixed(0)}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === "paid" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                          {p.status === "paid" ? "已支付" : "已退款"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {new Date(p.purchased_at).toLocaleString("zh-CN")}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
