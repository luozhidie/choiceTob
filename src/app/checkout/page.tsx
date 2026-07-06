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
  calcDiscount, formatPrice,
} from "@/lib/discount";
import { useAuth } from "@/lib/auth-context";

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

// 二维码弹窗组件 - 用 canvas 动态生成二维码
function WechatPayModal({ codeUrl, amount, onClose }: { codeUrl: string; amount: number; onClose: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 动态导入 qrcode 库，生成二维码
    const generateQr = async () => {
      try {
        const QRCode = (await import("qrcode")).toDataURL;
        const dataUrl = await QRCode(codeUrl, {
          width: 200,
          margin: 2,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error("生成二维码失败:", err);
      } finally {
        setLoading(false);
      }
    };
    generateQr();
  }, [codeUrl]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-lg"
        >
          ✕
        </button>
        <h3 className="text-lg font-bold text-center mb-1">微信扫码支付</h3>
        <p className="text-sm text-center text-gray-500 mb-5">请使用微信扫描下方二维码完成支付</p>

        <div className="bg-white p-4 rounded-xl border-2 border-gray-100 flex items-center justify-center mx-auto w-fit">
          {loading ? (
            <div className="w-[200px] h-[200px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
            </div>
          ) : qrDataUrl ? (
            <img src={qrDataUrl} alt="支付二维码" className="w-[200px] h-[200px]" />
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-xs text-red-500 text-center px-4">二维码生成失败<br />请刷新重试</p>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">支付金额</p>
          <p className="text-2xl font-bold text-green-600">{formatPrice(amount)}</p>
        </div>

        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-700 text-center">
            ✅ 支付成功后页面会自动跳转<br />
            或关闭此窗口继续购物
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canViewWholesale, isCertifiedStoreOwner } = useAuth();
  const productId = searchParams.get("id");
  const productSource = searchParams.get("source") || "buyer";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // 微信支付相关状态
  const [payQrCode, setPayQrCode] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [currentOrderNo, setCurrentOrderNo] = useState<string | null>(null);

  const supabase = createClient();

  // 🔑 登录检查：未登录立即跳转登录页
  useEffect(() => {
    let cancelled = false;
    const checkLogin = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u && !cancelled) {
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      }
    };
    checkLogin();
    return () => { cancelled = true; };
  }, []);

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

  /* 零售价（用于显示参考）：优先用 original_price，否则用 price */
  const displayOriginalPrice = useMemo(() => {
    if (!product) return 0;
    return product.original_price || 0;
  }, [product]);

  /* 实付价格：统一使用 product.price（与首页、详情页一致） */
  const actualPrice = useMemo(() => {
    if (!product) return 0;
    return product.price || 0;
  }, [product]);

  /* 兼容旧变量名（retailPrice = 实际支付价格） */
  const retailPrice = actualPrice;

  const totalAmount = useMemo(() => {
    return retailPrice * quantity;
  }, [retailPrice, quantity]);

  // 轮询订单状态
  useEffect(() => {
    if (!currentOrderNo) return;
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/wechat-pay/query?out_trade_no=${currentOrderNo}`);
        const result = await response.json();
        if (result.trade_state === 'SUCCESS') {
          clearInterval(interval);
          setShowPayModal(false);
          setPayQrCode(null);
          alert('✅ 支付成功！');
          router.push('/');
        }
      } catch (err) {
        console.error('查询订单状态失败:', err);
      }
    }, 3000);
    const timer = setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [currentOrderNo, router]);

  const handleSubmit = async () => {
    if (!product) return;
    if (!shippingName.trim() || !shippingPhone.trim()) { alert("请填写收货人姓名和联系电话"); return; }
    setSubmitting(true);
    try {
      // 1. 创建订单（写入数据库）
      const orderData: Record<string, unknown> = {
        product_id: product.id,
        quantity,
        unit_price: retailPrice,
        discount_price: retailPrice,
        total_amount: totalAmount,
        status: "pending",
        shipping_address: shippingAddress || shippingPhone,
        note: [
          `备注: ${note}`,
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
          total_amount: totalAmount,
          status: "pending",
          shipping_address: `${shippingName.trim()} ${shippingPhone.trim()} ${shippingAddress}`,
          note: `微信支付 ${note}`,
        };
        await supabase.from("buyer_orders").insert([basicData]);
      }

      // 2. 调用微信支付统一下单API
      // 注意：数据库价格单位已经是"分"，不需要再转换
      const totalFeeInFen = Math.round(totalAmount);
      console.log('[支付] 发起请求, 金额(分):', totalFeeInFen, '商品:', product.title);

      const payResponse = await fetch('/api/wechat-pay/unified-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          product_title: product.title,
          total_fee: totalFeeInFen,
          quantity: quantity,
          platform: 'native',
        }),
      });

      const payResult = await payResponse.json();
      console.log('[支付] API返回:', JSON.stringify(payResult));

      if (payResult.error) {
        alert(`支付失败：${payResult.error}\n\n如果反复出现此错误，请联系客服`);
        setSubmitting(false);
        return;
      }

      // 微信支付API调用成功
      if (payResult.code_url) {
        const isWeChatBrowser = typeof navigator !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent);

        if (isWeChatBrowser) {
          // ★ 微信内浏览器 → 直接跳转 weixin:// 链接
          // 这个链接格式为 weixin://wxpay/bizpayurl?pr=xxx
          // 微信客户端会拦截并自动拉起支付界面（输入密码）
          const codeUrl = payResult.code_url;
          console.log('[支付] 微信内环境, 跳转:', codeUrl);

          // 显示全屏提示
          const loadingEl = document.createElement('div');
          loadingEl.id = '__wx_pay_loading__';
          loadingEl.innerHTML = '<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:99999"><div style="background:#fff;border-radius:16px;padding:28px;text-align:center;max-width:280px;margin:16px"><div style="font-size:36px;margin-bottom:10px">💳</div><div style="font-size:17px;font-weight:bold;color:#333;margin-bottom:6px">正在调起微信支付</div><div style="font-size:13px;color:#888">即将跳转到支付界面...</div></div></div>';
          document.body.appendChild(loadingEl);

          // 用 iframe 触发 weixin:// 协议跳转（最可靠的方式）
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = codeUrl;
          document.body.appendChild(iframe);

          // 备用：同时用 location 跳转
          setTimeout(() => {
            try { window.location.href = codeUrl; } catch(e) {}
            // 如果5秒后还在页面，移除loading并显示二维码
            setTimeout(() => {
              const el = document.getElementById('__wx_pay_loading__');
              if (el && el.parentNode) { el.parentNode.removeChild(el); }
              setPayQrCode(codeUrl);
              setShowPayModal(true);
              setCurrentOrderNo(payResult.order_no);
              setSubmitting(false);
            }, 4000);
          }, 800);

          // 清理 iframe
          setTimeout(() => {
            try { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); } catch(e) {}
          }, 3000);

          return;
        }

        // 外部浏览器 → 显示二维码
        setPayQrCode(payResult.code_url);
        setShowPayModal(true);
        setCurrentOrderNo(payResult.order_no);
        return;
      }

      // 其他情况：跳转到成功页（降级）
      alert('订单已创建！正在跳转...');
      router.push(`/checkout/success?amount=${totalAmount}&title=${encodeURIComponent(product.title || '商品')}`);

    } catch (err: any) {
      console.error("提交订单失败:", err);
      alert("提交订单失败：" + (err.message || "请稍后重试或联系客服"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (text: string, label: string) => { navigator.clipboard.writeText(text); };

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
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-gray-900">{formatPrice(retailPrice)}</span>
                      {displayOriginalPrice && displayOriginalPrice > retailPrice && (
                        <span className="text-sm text-gray-400 line-through mb-1">原价 {formatPrice(displayOriginalPrice)}</span>
                      )}
                      <span className="text-sm text-gray-400 mb-1">零售价</span>
                    </div>
                    {/* 批发价区域 */}
                    <div
                      className={`mt-2 flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        canViewWholesale && product.wholesale_price
                          ? "bg-green-50 border-green-200"
                          : "bg-gradient-to-r from-blue-50 to-indigo-50 border-dashed border-blue-200 hover:border-solid"
                      }`}
                      onClick={() => {
                        if (!canViewWholesale) {
                          if (isCertifiedStoreOwner) return;
                          window.location.href = '/certify';
                        }
                      }}
                    >
                      <Lock className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-sm font-medium text-blue-700">批发价</span>
                      {canViewWholesale && product.wholesale_price ? (
                        <span className="text-lg font-bold text-green-600 ml-auto">{formatPrice(product.wholesale_price)}</span>
                      ) : (
                        <span className="text-lg font-bold text-blue-600 ml-auto">¥???</span>
                      )}
                      <span className="text-[10px] text-blue-400 ml-1">{
                        canViewWholesale ? "批发价" : isCertifiedStoreOwner ? "" : "认证可见"
                      }</span>
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
                <span>{formatPrice(retailPrice)} × {quantity}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="font-bold text-primary">实付金额</span>
                <span className="text-2xl font-bold text-accent">{formatPrice(totalAmount)}</span>
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
              </div>

              {/* 支付方式提示 */}
              {typeof window !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent) ? (
                <p className="text-xs text-green-700 bg-green-100 rounded-lg p-2 mt-2">
                  ✓ 微信环境检测成功 → 点击"立即支付"将直接拉起微信支付（输入密码即可完成）
                </p>
              ) : (
                <p className="text-xs text-green-700 bg-green-100 rounded-lg p-2 mt-2">
                  💡 点击下方按钮后将显示付款二维码，请用微信扫码支付
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
            disabled={submitting || product.stock === 0}
            className="w-full py-4 bg-green-500 text-white text-lg font-bold rounded-2xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <MessageCircle className="w-5 h-5" /> 立即支付 · {formatPrice(totalAmount)}
              </>
            )}
          </button>
          <p className="mt-3 text-xs text-center text-gray-400">
            点击"立即支付"后将调起微信支付
          </p>

          {/* 微信支付二维码弹窗 */}
          {showPayModal && payQrCode && (
            <WechatPayModal
              codeUrl={payQrCode}
              amount={totalAmount}
              onClose={() => { setShowPayModal(false); setPayQrCode(null); setCurrentOrderNo(null); }}
            />
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
