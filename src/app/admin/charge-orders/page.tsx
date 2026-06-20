'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/app/admin/layout';

interface ChargeOrder {
  id: string;
  created_at: string;
  order_no: string;
  user_id: string;
  user_email: string;
  user_name: string;
  amount: number;
  discount_rate: number;
  actual_amount: number;
  payment_method: string;
  payment_proof: string;
  status: string;
  paid_at: string;
  confirmed_at: string;
  confirmed_by: string;
  remark: string;
  admin_remark: string;
  balance_before: number;
  balance_after: number;
}

export default function AdminChargeOrdersPage() {
  const [orders, setOrders] = useState<ChargeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<ChargeOrder | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [adminRemark, setAdminRemark] = useState('');
  const [updating, setUpdating] = useState(false);

  const pageSize = 20;

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/charge-orders?${params}`);
      const result = await response.json();

      if (result.success) {
        setOrders(result.data || []);
        setTotalPages(Math.ceil(result.pagination.total / pageSize));
      } else {
        setError(result.error || '获取充值订单失败');
      }
    } catch (err: any) {
      setError(err.message || '获取充值订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!confirm(`确定要将订单状态改为"${getStatusText(newStatus)}"吗？`)) {
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/charge-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          admin_remark: adminRemark
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('更新成功！');
        setShowDetail(false);
        fetchOrders();
      } else {
        alert('更新失败：' + result.error);
      }
    } catch (err: any) {
      alert('更新失败：' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: '待支付',
      paid: '已支付待确认',
      confirmed: '已确认',
      cancelled: '已取消'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentMethodText = (method: string) => {
    const methodMap: { [key: string]: string } = {
      wechat: '微信支付',
      bank_transfer: '银行转账',
      online: '在线支付'
    };
    return methodMap[method] || method;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const formatMoney = (amount: number) => {
    return `¥${amount.toFixed(2)}`;
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">充值订单管理</h1>

        {/* 筛选条件 */}
        <div className="mb-4 flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded"
          >
            <option value="all">全部状态</option>
            <option value="pending">待支付</option>
            <option value="paid">已支付待确认</option>
            <option value="confirmed">已确认</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* 订单列表 */}
        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">订单号</th>
                    <th className="px-4 py-2 text-left">用户</th>
                    <th className="px-4 py-2 text-right">充值金额</th>
                    <th className="px-4 py-2 text-right">折扣率</th>
                    <th className="px-4 py-2 text-right">到账金额</th>
                    <th className="px-4 py-2 text-left">支付方式</th>
                    <th className="px-4 py-2 text-left">状态</th>
                    <th className="px-4 py-2 text-left">创建时间</th>
                    <th className="px-4 py-2 text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        暂无充值订单
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-sm">
                          {order.order_no}
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-sm">
                            <div className="font-medium">{order.user_name || '-'}</div>
                            <div className="text-gray-500">{order.user_email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          {formatMoney(order.amount)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {order.discount_rate ? `${(order.discount_rate * 100).toFixed(0)}%` : '-'}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-green-600">
                          {formatMoney(order.actual_amount)}
                        </td>
                        <td className="px-4 py-2">
                          {getPaymentMethodText(order.payment_method)}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetail(true);
                              setAdminRemark(order.admin_remark || '');
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            查看详情
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  上一页
                </button>
                <span className="px-4 py-1">
                  第 {page} / {totalPages} 页
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}

        {/* 订单详情弹窗 */}
        {showDetail && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">充值订单详情</h2>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600">订单号</label>
                    <div className="font-mono">{selectedOrder.order_no}</div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">状态</label>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">用户</label>
                    <div>
                      <div>{selectedOrder.user_name || '-'}</div>
                      <div className="text-sm text-gray-500">{selectedOrder.user_email}</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">支付方式</label>
                    <div>{getPaymentMethodText(selectedOrder.payment_method)}</div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">充值金额</label>
                    <div className="text-lg font-bold">{formatMoney(selectedOrder.amount)}</div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">折扣率</label>
                    <div>{selectedOrder.discount_rate ? `${(selectedOrder.discount_rate * 100).toFixed(0)}%` : '-'}</div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">到账金额</label>
                    <div className="text-lg font-bold text-green-600">{formatMoney(selectedOrder.actual_amount)}</div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">创建时间</label>
                    <div>{formatDate(selectedOrder.created_at)}</div>
                  </div>
                </div>

                {selectedOrder.payment_proof && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">支付凭证</label>
                    <img 
                      src={selectedOrder.payment_proof} 
                      alt="支付凭证" 
                      className="max-w-full h-auto border rounded"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-600">用户备注</label>
                  <div className="p-2 bg-gray-50 rounded">{selectedOrder.remark || '无'}</div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">管理员备注</label>
                  <textarea
                    value={adminRemark}
                    onChange={(e) => setAdminRemark(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                    placeholder="输入管理员备注..."
                  />
                </div>

                {selectedOrder.balance_before !== null && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded">
                    <div>
                      <label className="block text-sm text-gray-600">充值前余额</label>
                      <div>{formatMoney(selectedOrder.balance_before)}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">充值后余额</label>
                      <div className="font-bold text-green-600">{formatMoney(selectedOrder.balance_after)}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="mt-6 flex gap-2 justify-end">
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'paid')}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    标记为已支付
                  </button>
                )}
                
                {selectedOrder.status === 'paid' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')}
                    disabled={updating}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    确认充值（到账）
                  </button>
                )}

                {selectedOrder.status !== 'confirmed' && selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                    disabled={updating}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    取消订单
                  </button>
                )}

                <button
                  onClick={() => setShowDetail(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
