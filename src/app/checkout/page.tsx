"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ShoppingBag, Building2, ArrowLeft, Minus, Plus,
  CheckCircle2, MessageCircle, Phone, Copy, ChevronRight,
  ShieldCheck, Truck, RotateCcw, Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  calcDiscount, formatPrice, formatDiscountRate, formatRebateRate,
  MEMBER_TIERS,
} from "@/lib/discount";
import { CATEGORY_MAP } from "@/lib/categories";

interface Product {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  images: string[] | null;
  price: number;
  original_price: number | null;
  category: string | null;
  stock: number;
  supplier_name?: string | null;
  source?: string | null;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const productSource = searchParams.get("source") || "buyer";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [memberLevel, setMemberLevel] = useState("none");
  const [paymentMethod, setPaymentMethod] = useState<"wechat_pay">("wechat_pay");  // 默认微信支付
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState("");
  // 微信支付相关状态
  const [payQrCode, setPayQrCode] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!productId) { setLoading(false); return; }
    let cancelled = false;
    const fetchProduct = async () => {
      setLoading(true);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const headers: Record<string, string> = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
      const tableName = productSource === "platform" ? "products" : "buyer_products";
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/${tableName}?id=eq.${encodeURIComponent(productId)}&select=*`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0 && !cancelled) {
            const p = data[0];
            setProduct({
              id: p.id,
              title: p.title || p.name || "商品",
              description: p.description,
              cover_image: p.cover_image || p.image_url || null,
              images: p.images || null,
              price: p.price || 0,
              original_price: p.original_price || null,
              category: p.category || null,
              stock: p.stock || 0,
              supplier_name: p.supplier_name || null,
              source: productSource,
            });
          }
        }
      } catch (e) { console.error("获取商品失败:", e); }
      setLoading(false);
    };
    fetchProduct();
    return () => { cancelled = true; };
  }, [productId, productSource]);

  const discountResult = useMemo(() => {
    if (!product) return null;
    return calcDiscount(product.original_price || product.price, memberLevel);
  }, [product, memberLevel]);

  const totalAmount = useMemo(() => {
    if (!discountResult) return 0;
    return discountResult.discountPrice * quantity;
  }, [discountResult, quantity]);

  const handleSubmit = async () => {
    if (!product) return;
    if (!shippingName.trim() || !shippingPhone.trim()) { alert("请填写收货人姓名和联系电话"); return; }
    const retailPrice = product.original_price || Math.round(product.price * 2);
    const totalAmt = retailPrice * quantity;
    setSubmitting(true);
    try {
      // 1. 创建订单
      const orderData: Record<string, unknown> = {
        product_id: product.id,
        quantity,
        unit_price: retailPrice,
        discount_price: retailPrice,
        total_amount: totalAmt,
        status: "pending",
        shipping_address: shippingAddress || shippingPhone,
        note: [
          `备注: ${note}`,
          `支付方式: 微信支付`,
          `收货人: ${shippingName}`,
          `电话: ${shippingPhone}`,
          product.supplier_name ? `供应商: ${product.supplier_name}` : "",
        ].filter(Boolean).join(" | "),
        product_title: product.title,
        product_image: product.cover_image,
        product_source: productSource,
        original_price: retailPrice,
        shipping_name: shippingName.trim(),
        shipping_phone: shippingPhone.trim(),
        payment_method: "wechat_pay",
      };
      try {
        await supabase.from("buyer_orders").insert([orderData]);
      } catch {
        const basicData = {
          product_id: product.id,
          quantity,
          unit_price: retailPrice,
          discount_price: retailPrice,
          total_amount: totalAmt,
          status: "pending",
          shipping_address: `${shippingName.trim()} ${shippingPhone.trim()} ${shippingAddress}`,
          note: `微信支付 ${note}`,
        };
        await supabase.from("buyer_orders").insert([basicData]);
      }

      // 2. 调用微信支付API
      await handleWechatPay(product.id, totalAmt);
    } catch (err) {
      console.error("提交订单失败:", err); alert("提交订单失败，请稍后重试或联系客服");
    } finally { setSubmitting(false); }
  };

  // 微信支付核心逻辑
  const handleWechatPay = async (productId: string, price: number) => {
    setPayLoading(true);
    try {
      // 判断是否在微信内
      const isWeChat = /MicroMessenger/i.test(navigator.userAgent);
      const platform = isWeChat ? 'mp' : 'native';

      const response = await fetch('/api/wechat-pay/unified-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          product_title: product?.title || '商品购买',
          total_fee: Math.round(price),  // 微信支付金额单位是分
          platform,
          openid: '',  // JSAPI需要openid，但这里先留空
        }),
      });
      const result = await response.json();

      if (result.error) {
        alert('支付发起失败：' + result.error);
        setPayLoading(false);
        return;
      }

      // 微信内：JSAPI 直接拉起微信支付
      if (isWeChat && result.prepay_id && typeof window !== 'undefined') {
        invokeWechatPay(result);
      } else if (result.code_url) {
        // 非微信内：显示二维码
        setPayQrCode(result.code_url);
        setShowPayModal(true);
        setPayLoading(false);
      } else {
        alert('支付发起失败，请稍后重试');
        setPayLoading(false);
      }
    } catch (error) {
      console.error('[wechat pay]', error);
      alert('支付请求失败，请检查网络后重试');
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
          alert('✅ 支付成功！感谢您的购买');
          router.push('/');
        } else if (res.err_msg === "get_brand_wcpay_request:cancel") {
          alert('支付已取消');
        } else {
          alert('❌ 支付失败：' + res.err_msg);
        }
      });
    } else {
      // WeixinJSBridge 还没准备好，等一下再调
      document.addEventListener('WeixinJSBridgeReady', function() {
        invokeWechatPay(payParams);
      }, { once: true });
    }
  };

  const handleCopy = (text: string, label: string) => { navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(""), 2000); };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="text-lg text-gray-400">商品不存在或已下架</div>
        <Link href="/buyer" className="text-sm text-primary hover:underline">返回买手选品 →</Link>
      </div>
    );
  }

  const originalPrice = product.original_price || product.price;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 面包屑 */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">首页</Link>
            <span>/</span>
            <Link href="/buyer" className="hover:text-primary">买手选品</Link>
            <span>/</span>
            <span className="text-primary font-medium">确认订单</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> 返回商品详情
          </button>

          {/* 商品信息 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <div className="flex gap-4">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0 overflow-hidden">
                {product.cover_image ? (
                  <img src={product.cover_image} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag className="w-8 h-8 text-primary/30" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-primary line-clamp-2">{product.title}</h1>
                {product.supplier_name && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <Building2 className="w-3.5 h-3.5" /> {product.supplier_name}
                  </div>
                )}
                <div className="mt-3 flex items-end justify-between flex-wrap gap-3">
                  <div>
                    {/* 只显示零售价 */}
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-gray-900">{formatPrice(product.original_price || Math.round(product.price * 2))}</span>
                      <span className="text-sm text-gray-400 mb-1">零售价</span>
                    </div>
                    {/* 批发价区域 - 隐藏显示 */}
                    <div className="mt-2 flex items-center gap-2 p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-dashed border-blue-200 cursor-pointer hover:border-solid transition-all"
                       onClick={() => window.location.href = '/vip'}>
                      <Lock className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-sm font-medium text-blue-700">批发价</span>
                      <span className="text-lg font-bold text-blue-600 ml-auto">¥???</span>
                      <span className="text-[10px] text-blue-400 ml-1">会员可见</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-1.5">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-gray-400 hover:text-primary transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-primary w-8 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(product.stock || 999, quantity + 1))} className="text-gray-400 hover:text-primary transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 拿货会员提示 - 选3件以上显示 */}
                {quantity >= 3 && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <div className="flex items-start gap-2">
                      <Truck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-amber-800">提示：同色同款3件起可享拿货折扣</p>
                        <p className="text-[11px] text-amber-600 mt-0.5">开通拿货会员（充值5万起）可享受批发价和返点服务</p>
                        <a href="/vip" className="inline-block mt-2 text-[11px] font-medium text-amber-700 hover:text-amber-800 underline">
                          了解拿货会员 →
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 收货信息 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h2 className="text-base font-bold text-primary mb-4">📦 收货信息</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">收货人 *</label>
                <input
                  type="text"
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">联系电话 *</label>
                <input
                  type="tel"
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                  placeholder="请输入手机号"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">收货地址</label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                  placeholder="省/市/区/详细地址"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none resize-none"
                  placeholder="尺码、颜色等要求（选填）"
                />
              </div>
            </div>
          </div>

          {/* 订单汇总 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h2 className="text-base font-bold text-primary mb-4">📋 订单汇总</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">零售价</span>
                <span>{formatPrice(product.original_price || Math.round(product.price * 2))} × {quantity}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="font-bold text-primary">实付金额</span>
                <span className="text-2xl font-bold text-accent">{formatPrice((product.original_price || Math.round(product.price * 2)) * quantity)}</span>
              </div>
            </div>
          </div>

          {/* 支付方式 - 微信支付 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h2 className="text-base font-bold text-primary mb-4">💳 支付方式</h2>
            <div className="bg-green-50 rounded-xl p-5 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-green-800 text-base">微信支付</div>
                  <div className="text-xs text-green-600">安全快捷 · 即时到账</div>
                </div>
                {payLoading && (
                  <div className="ml-auto animate-spin rounded-full h-5 w-5 border-b-2 border-green-500" />
                )}
              </div>

              {/* 非微信环境显示提示 */}
              {typeof window !== 'undefined' && !/MicroMessenger/i.test(navigator.userAgent) && (
                <p className="text-xs text-green-700 bg-green-100 rounded-lg p-2 mt-2">
                  💡 如需在微信内直接支付，请在微信中打开此页面；当前将显示付款二维码
                </p>
              )}

              {/* 微信内显示提示 */}
              {typeof window !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent) && (
                <p className="text-xs text-green-700 bg-green-100 rounded-lg p-2 mt-2">
                  ✓ 检测到微信环境，点击下方按钮将直接拉起微信支付
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 py-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> 正品保障</span>
            <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> 快速发货</span>
            <span className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> 售后无忧</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || payLoading || product.stock === 0}
            className="w-full py-4 bg-green-500 text-white text-lg font-bold rounded-2xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
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
                <MessageCircle className="w-5 h-5" /> 立即支付 · {formatPrice((product.original_price || Math.round(product.price * 2)) * quantity)}
              </>
            )}
          </button>
          <p className="mt-3 text-xs text-center text-gray-400">
            点击"立即支付"后将调起微信支付，请在微信中完成付款
          </p>

          {/* 微信支付二维码弹窗（非微信环境） */}
          {showPayModal && payQrCode && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
                <button
                  onClick={() => { setShowPayModal(false); setPayQrCode(null); }}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
                <h3 className="text-lg font-bold text-center mb-2">微信扫码支付</h3>
                <p className="text-sm text-center text-gray-500 mb-4">请使用微信扫描二维码完成支付</p>
                <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-center">
                  {/* 使用QRCode组件或img标签显示二维码 */}
                  {payQrCode.startsWith('weixin://') || payQrCode.startsWith('wxpay://') ? (
                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                      <p className="text-xs text-gray-500 text-center px-4">
                        请在微信中打开此页面以使用更便捷的JSAPI支付
                      </p>
                    </div>
                  ) : (
                    // 如果是URL格式的code_url，需要生成二维码图片
                    <div className="w-48 h-48 bg-gray-100 flex flex-col items-center justify-center gap-2 p-4">
                      <MessageCircle className="w-12 h-12 text-green-500" />
                      <p className="text-xs text-center text-gray-500">正在生成支付二维码...</p>
                      <p className="text-[10px] text-gray-400 break-all">{payQrCode.slice(0, 30)}...</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-center text-gray-400 mt-4">
                  支付金额：<span className="font-bold text-green-600">{formatPrice((product.original_price || Math.round(product.price * 2)) * quantity)}</span>
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
