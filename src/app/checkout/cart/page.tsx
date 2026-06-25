"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";
import {
  ShoppingCart, Minus, Plus, Trash2, ArrowLeft,
  MessageCircle, CheckCircle2, ShoppingBag, LogIn, UserPlus
} from "lucide-react";
import { motion } from "framer-motion";
import TabBar from "@/components/TabBar";

export default function CartCheckoutPage() {
  const router = useRouter();
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const supabase = createClient();

  // 🔑 用户登录状态
  const [user, setUser] = useState<any>(null);

  // 检查登录状态
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!cancelled) setUser(u || null);
    });
    return () => { cancelled = true; };
  }, []);

  // 表单状态
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payQrCode, setPayQrCode] = useState<string | null>(null);

  // 格式化价格
  const formatPrice = (price: number) => `¥${(price / 100).toFixed(2)}`;

  // 提交订单并调用微信支付
  const handleSubmit = async () => {
    if (items.length === 0) {
      alert("购物车是空的");
      return;
    }
    // 🔑 未登录 → 跳转登录
    if (!user) {
      router.push("/login?redirect=/checkout/cart");
      return;
    }
    if (!shippingName.trim() || !shippingPhone.trim()) {
      alert("请填写收货人姓名和联系电话");
      return;
    }

    setSubmitting(true);
    try {
      // 为每个商品创建订单（或者创建一个合并订单）
      for (const item of items) {
        const orderData = {
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          discount_price: item.price,
          total_amount: item.price * item.quantity,
          status: "pending",
          shipping_address: shippingAddress || shippingPhone,
          note: `购物车结算 | ${note}`,
          product_title: item.title,
          product_image: item.image,
          product_source: item.source || 'buyer',
          original_price: item.originalPrice || item.price,
          shipping_name: shippingName.trim(),
          shipping_phone: shippingPhone.trim(),
          payment_method: "wechat_pay",
        };

        await supabase.from("buyer_orders").insert([orderData]);
      }

      // 订单创建成功 → 跳转到付款页（不再调用微信API）
      const title = items.length === 1 ? items[0].title : `购物车订单(${totalItems}件)`;
      router.push(`/checkout/success?amount=${totalPrice}&title=${encodeURIComponent(title)}`);
    } catch (err) {
      console.error("提交订单失败:", err);
      alert("提交订单失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  // 微信支付核心逻辑
  const handleWechatPay = async (productId: string, price: number) => {
    setPayLoading(true);
    try {
      const isWeChat = /MicroMessenger/i.test(navigator.userAgent);
      const platform = isWeChat ? 'mp' : 'native';

      // 使用第一个商品标题作为描述
      const title = items.length === 1
        ? items[0].title
        : `${items[0].title}等${items.length}件商品`;

      const response = await fetch('/api/wechat-pay/unified-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          product_title: title,
          total_fee: Math.round(price),
          platform,
          openid: '',
        }),
      });

      const result = await response.json();

      if (result.error) {
        alert('支付发起失败：' + result.error);
        setPayLoading(false);
        return;
      }

      if (isWeChat && result.prepay_id && typeof window !== 'undefined') {
        invokeWechatPay(result);
      } else if (result.code_url) {
        setPayQrCode(result.code_url);
        setPayLoading(false);
      } else {
        alert('支付发起失败，请稍后重试');
        setPayLoading(false);
      }
    } catch (error) {
      console.error('[wechat pay]', error);
      alert('支付请求失败');
      setPayLoading(false);
    }
  };

  // 调用微信JSAPI支付
  const invokeWechatPay = (payParams: any) => {
    if ((window as any).WeixinJSBridge) {
      (window as any).WeixinJSBridge.invoke('getBrandWCPayRequest', {
        appId: payParams.appId,
        timeStamp: payParams.timeStamp,
        nonceStr: payParams.nonceStr,
        package: payParams.package || ('prepay_id=' + payParams.prepay_id),
        signType: payParams.signType || 'MD5',
        paySign: payParams.paySign,
      }, function(res: any) {
        setPayLoading(false);
        if (res.err_msg === "get_brand_wcpay_request:ok") {
          clearCart();
          alert('✅ 支付成功！感谢您的购买');
          router.push('/');
        } else if (res.err_msg === "get_brand_wcpay_request:cancel") {
          alert('支付已取消');
        } else {
          alert('❌ 支付失败：' + res.err_msg);
        }
      });
    } else {
      document.addEventListener('WeixinJSBridgeReady', function() {
        invokeWechatPay(payParams);
      }, { once: true });
    }
  };

  if (items.length === 0 && !payQrCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-16">
        <div className="text-center">
          <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-600 mb-2">购物车是空的</h1>
          <p className="text-gray-400 mb-6">快去挑选喜欢的商品吧</p>
          <Link href="/buyer" className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent/90">
            <ShoppingBag className="w-5 h-5" /> 去选购
          </Link>
        </div>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">🛒 购物车 ({totalItems}件)</h1>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 商品列表 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-lg mb-4">商品清单</h2>
          {items.map(item => (
            <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
              {item.image ? (
                <img src={item.image} alt="" className="w-24 h-24 rounded-xl object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gray-200 flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium line-clamp-2">{item.title}</h3>
                <p className="text-accent font-bold mt-2">{formatPrice(item.price)}</p>
                {item.originalPrice && item.originalPrice > item.price && (
                  <p className="text-xs text-gray-400 line-through">{formatPrice(item.originalPrice)}</p>
                )}

                {/* 数量控制 */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-sm font-bold text-primary">
                    小计: {formatPrice(item.price * item.quantity)}
                  </div>

                  <button onClick={() => removeItem(item.id)}
                    className="ml-auto p-2 text-red-400 hover:bg-red-50 rounded-lg"
                    title="删除">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* 清空按钮 */}
          {items.length > 0 && (
            <button
              onClick={() => { if (confirm('确定要清空购物车吗？')) clearCart(); }}
              className="text-sm text-red-500 hover:text-red-600 font-medium"
            >
              🗑️ 清空购物车
            </button>
          )}
        </div>

        {/* 收货信息 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-lg mb-4">📦 收货信息</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">收货人 *</label>
              <input
                type="text"
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none"
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">联系电话 *</label>
              <input
                type="tel"
                value={shippingPhone}
                onChange={(e) => setShippingPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none"
                placeholder="请输入手机号"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">收货地址</label>
              <input
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none"
                placeholder="省/市/区/详细地址"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">备注</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none resize-none"
                placeholder="尺码、颜色等要求（选填）"
              />
            </div>
          </div>
        </div>

        {/* 订单汇总 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-lg mb-4">📋 订单汇总</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">商品数量</span><span>{totalItems} 件</span></div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-bold text-base">合计金额</span>
              <span className="text-2xl font-bold text-accent">{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* 支付方式提示 */}
        <div className="bg-green-50 rounded-2xl p-5 border-2 border-green-200">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-10 h-10 text-green-500" />
            <div>
              <div className="font-bold text-green-800">微信支付</div>
              <div className="text-sm text-green-600">点击下方按钮将调起微信安全支付</div>
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={submitting || payLoading}
          className="w-full py-4 bg-green-500 text-white text-lg font-bold rounded-2xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
        >
          {payLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              正在调起微信支付...
            </>
          ) : submitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              <MessageCircle className="w-5 h-5" /> 立即支付 · {formatPrice(totalPrice)}
            </>
          )}
        </button>

        {/* 微信支付二维码弹窗 */}
        {payQrCode && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative">
              <button
                onClick={() => setPayQrCode(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
              <h3 className="text-lg font-bold text-center mb-4">微信扫码支付</h3>
              <div className="bg-gray-100 p-8 rounded-xl flex flex-col items-center">
                <MessageCircle className="w-16 h-16 text-green-500 mb-3" />
                <p className="text-sm text-gray-500 text-center">
                  请使用微信扫描二维码完成支付<br/>
                  <span className="text-xs mt-2 block">或复制链接到微信打开</span>
                </p>
              </div>
              <p className="text-center mt-4 font-bold text-green-600">
                金额: {formatPrice(totalPrice)}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* 🔑 未登录时显示底部登录提示栏（类似1688） */}
      {!user && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] bg-gradient-to-r from-orange-50 via-white to-primary/5 border-t border-orange-200 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Hi,欢迎光临骆芷蝶智选！</p>
                <p className="text-xs text-gray-500">登录后享受会员价 · 快捷下单</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/login?redirect=/checkout/cart")}
              className="px-5 py-2 bg-accent text-white text-sm font-bold rounded-full hover:bg-accent/90 active:scale-95 transition-all shadow-md"
            >
              一键登录
            </button>
            {/* 关闭按钮 */}
          </div>
        </div>
      )}

      {/* 有TabBar的话，给底部留空间避免遮挡 */}
      {user && <TabBar />}
    </div>
  );
}
