"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Trash2, Mail, User, Building, Clock } from "lucide-react";

interface PendingUser {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  created_at: string;
  approval_status: string;
}

export default function PendingPage() {
  const [list, setList] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // user_id if processing
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/approve", { method: "GET" });
      const result = await res.json();
      if (result.success) {
        setList(result.data || []);
      }
    } catch (e) {
      console.error("获取待审列表失败", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleApprove = async (userId: string) => {
    if (!confirm("确定批准该用户？")) return;
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/approve", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action: "approve" }),
      });
      const result = await res.json();
      if (result.success) {
        fetchList();
      } else {
        alert("操作失败：" + result.error);
      }
    } catch (e: any) {
      alert("操作失败：" + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/approve", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action: "reject", reason: rejectReason }),
      });
      const result = await res.json();
      if (result.success) {
        setRejectTarget(null);
        setRejectReason("");
        fetchList();
      } else {
        alert("操作失败：" + result.error);
      }
    } catch (e: any) {
      alert("操作失败：" + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("确定删除该用户的注册申请？删除后该用户需重新注册。")) return;
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/approve", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const result = await res.json();
      if (result.success) {
        fetchList();
      } else {
        alert("删除失败：" + result.error);
      }
    } catch (e: any) {
      alert("删除失败：" + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleString("zh-CN");

  return (
    <div className="space-y-6">
      {/* 顶栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">待审批管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理新用户的后台访问申请</p>
        </div>
        <button
          onClick={fetchList}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          刷新列表
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#1e293b]">{list.length}</div>
              <div className="text-xs text-gray-500">待审批</div>
            </div>
          </div>
        </div>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
          <CheckCircle2 className="w-12 h-12 text-green-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无待审批用户</h3>
          <p className="text-sm text-gray-400">所有注册申请已处理完毕</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {list.map((u) => (
              <div key={u.id} className="p-5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                {/* 头像 */}
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                  {(u.full_name || u.email || "?")[0].toUpperCase()}
                </div>

                {/* 用户信息 */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#1e293b] truncate">{u.full_name || "未填写姓名"}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {u.email}
                    </span>
                    {u.company_name && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" /> {u.company_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(u.created_at)}
                    </span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(u.id)}
                    disabled={actionLoading === u.id}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-[14px] h-[14px]" />
                    批准
                  </button>
                  <button
                    onClick={() => setRejectTarget(u.id)}
                    disabled={actionLoading === u.id}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <XCircle className="w-[14px] h-[14px]" />
                    拒绝
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={actionLoading === u.id}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <Trash2 className="w-[14px] h-[14px]" />
                    删除
                  </button>
                </div>

                {/* 拒绝原因弹窗 */}
                {rejectTarget === u.id && (
                  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
                      <h3 className="text-lg font-bold text-[#1e293b] mb-4">拒绝申请</h3>
                      <p className="text-sm text-gray-500 mb-3">请填写拒绝原因（可选）：</p>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                        rows={3}
                        placeholder="如：资料不完整、不符合申请条件..."
                      />
                      <div className="flex gap-3 justify-end mt-4">
                        <button
                          onClick={() => { setRejectTarget(null); setRejectReason(""); }}
                          className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleReject(u.id)}
                          className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          确认拒绝
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
