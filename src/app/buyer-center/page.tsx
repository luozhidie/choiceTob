'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  balance: number;
  discount_rate: number;
}

interface ChargeOrder {
  id: string;
  order_no: string;
  amount: number;
  discount_rate: number;
  actual_amount: number;
  status: string;
  created_at: string;
}

export default function BuyerCenterPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ChargeOrder[]>([]);
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<number>(50000);
  const [rechargeMethod, setRechargeMethod] = useState<string>('bank_transfer');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchOrders();
  }, []);

  const fetchProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('获取用户信息失败:', error);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('获取用户信息异常:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/charge-orders?userId=current&page=1&pageSize=10');
      const result = await response.json();

      if (result.success) {
        setOrders(result.data || []);
      }
    } catch (err) {
      console.error('获取充值订单失败:', err);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || rechargeAmount <= 0) {
      alert('请输入正确的充值金额');
      return;
    }

    setSubmitting(true);
    try {
      const discountRate = profile?.discount_rate || 1;
      
      const response = await fetch('/api/charge-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: rechargeAmount,
          discount_rate: discountRate,
          payment_method: rechargeMethod,
          remark: ''
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('充值订单创建成功！请按照支付方式完成支付，等待管理员确认。');
        setShowRecharge(false);
        fetchOrders();
      } else {
        alert('创建充值订单失败：' + result.error);
      }
    } catch (err: any) {
      alert('创建充值订单失败：' + err.message);
    } finally {
      setSubmitting(false);
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

  const formatMoney = (amount: number) => {
    return `¥${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  const discountRate = profile?.discount_rate || 1;
  const actualAmount = rechargeAmount * discountRate;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">充值中心</h1>

        {/* 账户信息卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">账户余额</div>
            <div className="text-3xl font-bold text-green-600">
              {formatMoney(profile?.balance || 0)}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">折扣率</div>
            <div className="text-3xl font-bold text-blue-600">
              {(discountRate * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-500 mt-1">
              充值享受{discountRate * 10}折优惠
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">累计充值</div>
            <div className="text-3xl font-bold text-purple-600">
              {formatMoney(orders
                .filter(o => o.status === 'confirmed')
                .reduce((sum, o) => sum + o.actual_amount, 0)
              )}
            </div>
          </div>
        </div>

        {/* 充值按钮 */}
        <div className="mb-8">
          <button
            onClick={() => setShowRecharge(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            立即充值
          </button>
        </div>

        {/* 充值订单列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">充值记录</h2>
          </div>
          
          <div className="divide-y">
            {orders.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                暂无充值记录
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-sm text-gray-600 mb-1">
                        {order.order_no}
                      </div>
                      <div className="text-lg font-medium mb-1">
                        充值 {formatMoney(order.amount)}
                      </div>
                      <div className="text-sm text-gray-600">
                        到账 {formatMoney(order.actual_amount)}
                        {order.discount_rate && order.discount_rate < 1 && (
                          <span className="ml-2 text-green-600">
                            ({ (order.discount_rate * 100).toFixed(0) }折)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 充值弹窗 */}
        {showRecharge && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">充值</h3>
                <button
                  onClick={() => setShowRecharge(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">充值金额（元）</label>
                  <input
                    type="number"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 border rounded"
                    min={1}
                    step={1000}
                  />
                  <div className="mt-2 flex gap-2">
                    {[50000, 100000, 300000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setRechargeAmount(amount)}
                        className={`px-3 py-1 rounded text-sm ${
                          rechargeAmount === amount
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {amount / 10000}万
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">支付方式</label>
                  <select
                    value={rechargeMethod}
                    onChange={(e) => setRechargeMethod(e.target.value)}
                    className="w-full px-4 py-2 border rounded"
                  >
                    <option value="bank_transfer">银行转账</option>
                    <option value="wechat">微信支付</option>
                  </select>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <div className="flex justify-between mb-2">
                    <span>充值金额</span>
                    <span className="font-medium">{formatMoney(rechargeAmount)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>折扣率</span>
                    <span className="text-green-600">{(discountRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>实际到账</span>
                    <span className="text-green-600">{formatMoney(actualAmount)}</span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowRecharge(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleRecharge}
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? '提交中...' : '确认充值'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
