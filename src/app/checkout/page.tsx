"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ShoppingBag, Building2, ArrowLeft, Minus, Plus,
  CheckCircle2, MessageCircle, Phone, Copy, ChevronRight,
  ShieldCheck, Truck, RotateCcw,
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
  const [paymentMethod, setPaymentMethod] = useState<"wechat" | "alipay" | "contact">("contact");
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState("");

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
    if (!product || !discountResult) return;
    if (!shippingName.trim() || !shippingPhone.trim()) { alert("请填写收货人姓名和联系电话"); return; }
    setSubmitting(true);
    try {
      const orderData: Record<string, unknown> = {
        product_id: product.id,
        quantity,
        unit_price: product.original_price || product.price,
        discount_price: discountResult.discountPrice,
        total_amount: totalAmount,
        status: "pending",
        shipping_address: shippingAddress || shippingPhone,
        note: [
          `备注: ${note}`,
          `会员等级: ${discountResult.memberLabel}`,
          `折扣率: ${formatDiscountRate(discountResult.discountRate)}`,
          `支付方式: ${paymentMethod === "wechat" ? "微信" : paymentMethod === "alipay" ? "支付宝" : "联系客服"}`,
          `收货人: ${shippingName}`,
          `电话: ${shippingPhone}`,
          product.supplier_name ? `供应商: ${product.supplier_name}` : "",
        ].filter(Boolean).join(" | "),
        product_title: product.title,
        product_image: product.cover_image,
        product_source: productSource,
        original_price: product.original_price || product.price,
        discount_rate: discountResult.discountRate,
        member_level: memberLevel,
        rebate_rate: discountResult.rebateRate,
        rebate_amount: discountResult.rebateAmount * quantity,
        shipping_name: shippingName.trim(),
        shipping_phone: shippingPhone.trim(),
        payment_method: paymentMethod,
      };
      try {
        await supabase.from("buyer_orders").insert([orderData]);
      } catch {
        // 回退基础字段
        const basicData = {
          product_id: product.id,
          quantity,
          unit_price: product.original_price || product.price,
          discount_price: discountResult.discountPrice,
          total_amount: totalAmount,
          status: "pending",
          shipping_address: `${shippingName.trim()} ${shippingPhone.trim()} ${shippingAddress}`,
          note: `会员:${discountResult.memberLabel} 折扣:${formatDiscountRate(discountResult.discountRate)} 支付:${paymentMethod} ${note}`,
        };
        await supabase.from("buyer_orders").insert([basicData]);
      }
      router.push(`/checkout/success?title=${encodeURIComponent(product.title)}&amount=${totalAmount}&payment=${paymentMethod}`);
    } catch (err) {
      console.error("提交订单失败:", err); alert("提交订单失败，请稍后重试或联系客服");
    } finally { setSubmitting(false); }
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
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-accent">{formatPrice(product.price)}</span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-sm text-gray-400 line-through">{formatPrice(product.original_price)}</span>
                      )}
                    </div>
                    {memberLevel !== "none" && discountResult && (
                      <div className="text-xs text-accent mt-0.5">
                        会员价 {formatPrice(discountResult.discountPrice)} · 省{formatPrice(discountResult.savedAmount)}
                      </div>
                    )}
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

          {/* 会员折扣 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h2 className="text-base font-bold text-primary mb-4">🏷️ 会员折扣</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MEMBER_TIERS.map((tier) => {
                const isSelected = memberLevel === tier.key;
                const disc = calcDiscount(originalPrice, tier.key);
                return (
                  <button
                    key={tier.key}
                    onClick={() => setMemberLevel(tier.key)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected ? "border-accent bg-accent/5 shadow-sm" : "border-gray-100 hover:border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tier.icon}</span>
                        <span className="font-bold text-sm text-primary">{tier.label}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-accent" />}
                    </div>
                    {tier.key === "none" ? (
                      <p className="text-xs text-gray-400">原价购买</p>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">拿货折扣</span>
                          <span className="text-accent font-bold">{formatDiscountRate(tier.discount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">返利比例</span>
                          <span className="text-accent font-bold">{formatRebateRate(tier.rebate)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">本单折后</span>
                          <span className="text-accent font-bold">{formatPrice(disc.discountPrice)}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          充值{(tier.minRecharge / 10000).toFixed(0)}元开通
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {memberLevel !== "none" && discountResult && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-xs text-amber-700">
                  💡 会员折扣需先充值开通，未开通会员将按原价下单。开通后可享{formatDiscountRate(discountResult.discountRate)}拿货价，订单返利{formatRebateRate(discountResult.rebateRate)}将返还至账户余额。
                </p>
                <Link href="/buyer-center" className="text-xs text-accent font-medium hover:underline mt-1 inline-block">
                  前往充值开通 →
                </Link>
              </div>
            )}
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
                <span className="text-gray-500">商品金额</span>
                <span className="text-primary">{formatPrice(originalPrice)} × {quantity}</span>
              </div>
              {discountResult && memberLevel !== "none" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">会员折扣（{formatDiscountRate(discountResult.discountRate)}）</span>
                    <span className="text-green-600">-{formatPrice((originalPrice - discountResult.discountPrice) * quantity)}</span>
                  </div>
                  {discountResult.rebateRate > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">返利（{formatRebateRate(discountResult.rebateRate)}）</span>
                      <span className="text-accent">+{formatPrice(discountResult.rebateAmount * quantity)}</span>
                    </div>
                  )}
                </>
              )}
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="font-bold text-primary">实付金额</span>
                <span className="text-2xl font-bold text-accent">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* 支付方式 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h2 className="text-base font-bold text-primary mb-4">💳 支付方式</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod("contact")}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  paymentMethod === "contact" ? "border-accent bg-accent/5" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <Phone className="w-6 h-6 mx-auto text-primary mb-2" />
                <div className="text-sm font-bold text-primary">联系客服</div>
                <div className="text-[10px] text-gray-400 mt-1">人工确认后付款</div>
              </button>
              <button
                onClick={() => setPaymentMethod("wechat")}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  paymentMethod === "wechat" ? "border-green-500 bg-green-50" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <MessageCircle className="w-6 h-6 mx-auto text-green-600 mb-2" />
                <div className="text-sm font-bold text-primary">微信支付</div>
                <div className="text-[10px] text-gray-400 mt-1">添加微信转账</div>
              </button>
              <button
                onClick={() => setPaymentMethod("alipay")}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  paymentMethod === "alipay" ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <span className="w-6 h-6 mx-auto mb-2 text-blue-600 text-lg">💙</span>
                <div className="text-sm font-bold text-primary">支付宝</div>
                <div className="text-[10px] text-gray-400 mt-1">转账到支付宝账户</div>
              </button>
            </div>
            {paymentMethod === "wechat" && (
              <div className="mt-4 bg-green-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <span className="font-bold text-green-700 text-sm">微信支付</span>
                  </div>
                  <button
                    onClick={() => handleCopy("luozhidie666", "wechat")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                  >
                    {copied === "wechat" ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied === "wechat" ? "已复制" : "复制微信号"}
                  </button>
                </div>
                <p className="text-xs text-green-600">
                  添加微信：<span className="font-mono font-medium">luozhidie666</span>，转账 <span className="font-bold">{formatPrice(totalAmount)}</span>
                </p>
              </div>
            )}
            {paymentMethod === "alipay" && (
              <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-blue-700 text-sm">支付宝</span>
                  <button
                    onClick={() => handleCopy("13925997776", "alipay")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {copied === "alipay" ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied === "alipay" ? "已复制" : "复制账号"}
                  </button>
                </div>
                <p className="text-xs text-blue-600">
                  手机号：<span className="font-mono font-medium">13925997776</span>，转账 <span className="font-bold">{formatPrice(totalAmount)}</span>
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 py-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> 正品保障</span>
            <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> 快速发货</span>
            <span className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> 售后无忧</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || product.stock === 0}
            className="w-full py-4 bg-accent text-white text-lg font-bold rounded-2xl hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" /> 提交订单 · {formatPrice(totalAmount)}
              </>
            )}
          </button>
          <p className="mt-3 text-xs text-center text-gray-400">
            提交订单后，客服将确认商品和价格，确认后安排发货
          </p>
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
