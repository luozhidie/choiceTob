"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import {
  Sparkles,
  Shirt,
  ShoppingBag,
  CheckCircle2,
  X,
  Loader2,
  LogIn,
  ArrowRight,
} from "lucide-react";

function fmtYuan(fen: number) {
  return `¥${((fen || 0) / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function LandingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const ref = (params.get("ref") || "").trim().toUpperCase();

  const [data, setData] = useState<any>(null);
  const [loadErr, setLoadErr] = useState("");

  const [user, setUser] = useState<any>(null);

  const [buyProduct, setBuyProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [creating, setCreating] = useState(false);
  const [payUrl, setPayUrl] = useState("");
  const [payQr, setPayQr] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [paid, setPaid] = useState(false);
  const [buyErr, setBuyErr] = useState("");

  useEffect(() => {
    if (!ref) {
      setLoadErr("缺少推广码");
      return;
    }
    // 记录推广来源，供本站其他下单入口归因
    try {
      localStorage.setItem("agent_ref", ref);
    } catch {}
    (async () => {
      try {
        const res = await fetch(`/api/agent/landing?ref=${encodeURIComponent(ref)}`);
        const d = await res.json();
        setData(d);
        if (!d.valid) setLoadErr("推广链接无效或代理未激活");
      } catch (e: any) {
        setLoadErr(e.message || "加载失败");
      }
    })();
    // 当前登录态
    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      const { data: s } = await sb.auth.getSession();
      if (s.session?.user) setUser(s.session.user);
    })();
  }, [ref]);

  function openBuy(p: any) {
    setBuyProduct(p);
    setQty(1);
    setPayUrl("");
    setPayQr("");
    setOrderNo("");
    setPaid(false);
    setBuyErr("");
  }

  async function submitOrder() {
    if (!buyProduct) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/agent/landing?ref=${ref}`)}`);
      return;
    }
    if (!contact.trim()) {
      setBuyErr("请填写联系电话");
      return;
    }
    setCreating(true);
    setBuyErr("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      const { data: s } = await sb.auth.getSession();
      const token = s.session?.access_token || "";
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          product_id: buyProduct.product_id,
          product_title: buyProduct.title,
          product_image: buyProduct.cover_image,
          product_price: buyProduct.price, // 对客价（分）
          quantity: qty,
          contact: contact.trim(),
          address: address.trim() || null,
          note: null,
          payment_type: "wechat",
          referral_code: ref,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "下单失败");
      setOrderNo(d.order.order_no);
      if (d.payment) {
        const p: string = d.payment;
        if (/^https?:\/\//.test(p)) {
          setPayUrl(p);
        } else {
          // 微信 code_url → 转二维码
          const url = await QRCode.toDataURL(p, { width: 240, margin: 2 });
          setPayQr(url);
        }
      } else {
        setPayUrl("");
      }
      pollStatus(d.order.order_no);
    } catch (e: any) {
      setBuyErr(e.message || "下单失败");
    } finally {
      setCreating(false);
    }
  }

  function pollStatus(no: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/status?order_no=${no}`);
        const d = await res.json();
        if (d.is_paid) {
          setPaid(true);
          clearInterval(interval);
        }
      } catch {}
    }, 3000);
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
  }

  if (loadErr && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#2d1b2e] text-center px-4 text-white">
        <ShoppingBag className="w-12 h-12 text-[#C9A24B]/60 mb-4" />
        <h1 className="text-2xl font-bold">{loadErr}</h1>
        <Link href="/" className="mt-6 text-[#C9A24B] hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2d1b2e] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A24B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2d1b2e] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#C9A24B]/10 -translate-y-1/3 translate-x-1/3 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A24B]/50 text-[#C9A24B] text-sm font-medium">
            <Sparkles className="w-4 h-4" /> {data.agentName} · 精选推荐
          </div>
          <h1 className="mt-5 text-3xl sm:text-5xl font-bold leading-tight">
            专业买手精选好物
          </h1>
          <p className="mt-4 text-white/65 max-w-2xl mx-auto">
            先试穿再下单，所见即所买。全部商品由专业买手严选，品质与性价比兼具。
          </p>
          <Link
            href={user ? `/tryon?ref=${ref}` : `/login?redirect=${encodeURIComponent(`/tryon?ref=${ref}`)}`}
            className="mt-7 inline-flex items-center gap-2 px-7 py-3.5 bg-[#C9A24B] text-[#2d1b2e] font-bold rounded-xl hover:bg-[#b8945a] transition-colors shadow-lg shadow-[#C9A24B]/20"
          >
            <Shirt className="w-5 h-5" /> 先试穿再买
          </Link>
        </div>
      </section>

      {/* 商品橱窗 */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.products.map((p: any, i: number) => (
            <motion.div
              key={p.product_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl bg-white/5 border border-[#C9A24B]/15 overflow-hidden hover:border-[#C9A24B]/40 transition-colors"
            >
              <div className="aspect-square bg-black/20 relative">
                {p.cover_image ? (
                  <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="text-sm font-medium truncate">{p.title}</div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-lg font-bold text-[#C9A24B]">{fmtYuan(p.price)}</span>
                  <button
                    onClick={() => openBuy(p)}
                    className="px-3 py-1.5 rounded-lg bg-[#C9A24B] text-[#2d1b2e] text-xs font-bold hover:bg-[#b8945a] transition-colors"
                  >
                    立即购买
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {data.products.length === 0 && (
          <p className="text-center text-white/40 py-16">该店铺暂未上架商品</p>
        )}
      </section>

      {/* 购买弹窗 */}
      {buyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !paid && setBuyProduct(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-[#2d1b2e] border border-[#C9A24B]/30 p-6">
            <button
              onClick={() => !paid && setBuyProduct(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {!paid && !payUrl && !payQr && (
              <>
                <div className="flex items-center gap-3">
                  {buyProduct.cover_image ? (
                    <img src={buyProduct.cover_image} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-white/30" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{buyProduct.title}</div>
                    <div className="text-[#C9A24B] font-bold">{fmtYuan(buyProduct.price)}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-white/60">数量</span>
                  <div className="flex items-center gap-3 bg-white/10 rounded-lg px-2 py-1">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-2 text-white/70">−</button>
                    <span className="w-6 text-center">{qty}</span>
                    <button onClick={() => setQty((q) => q + 1)} className="px-2 text-white/70">+</button>
                  </div>
                </div>

                <div className="mt-3">
                  <input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="联系电话"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 outline-none text-white text-sm focus:border-[#C9A24B]"
                  />
                </div>
                <div className="mt-2">
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="收货地址（选填）"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 outline-none text-white text-sm focus:border-[#C9A24B]"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-white/60 text-sm">合计</span>
                  <span className="text-2xl font-bold text-[#C9A24B]">{fmtYuan(buyProduct.price * qty)}</span>
                </div>

                {buyErr && <p className="text-red-400 text-sm mt-2">{buyErr}</p>}

                <button
                  onClick={submitOrder}
                  disabled={creating}
                  className="mt-4 w-full py-3 bg-[#C9A24B] text-[#2d1b2e] font-bold rounded-xl hover:bg-[#b8945a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  {user ? "确认下单并支付" : "登录后下单"}
                </button>
              </>
            )}

            {(payUrl || payQr) && !paid && (
              <div className="text-center py-2">
                <p className="font-medium mb-3">扫码完成支付</p>
                {payQr && <img src={payQr} alt="pay" className="w-48 h-48 mx-auto rounded-lg bg-white p-2" />}
                {payUrl && (
                  <a href={payUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-3 px-6 py-3 bg-[#C9A24B] text-[#2d1b2e] font-bold rounded-xl hover:bg-[#b8945a]">
                    点击跳转支付 <ArrowRight className="w-4 h-4" />
                  </a>
                )}
                <p className="text-white/50 text-xs mt-3">支付成功后自动刷新</p>
              </div>
            )}

            {paid && (
              <div className="text-center py-6">
                <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
                <p className="text-xl font-bold mt-3">支付成功</p>
                <p className="text-white/60 text-sm mt-1">订单号 {orderNo}</p>
                <button onClick={() => setBuyProduct(null)} className="mt-5 px-6 py-2.5 bg-[#C9A24B] text-[#2d1b2e] font-bold rounded-xl hover:bg-[#b8945a]">
                  完成
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentLandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#2d1b2e] text-white"><Loader2 className="w-8 h-8 animate-spin text-[#C9A24B]" /></div>}>
      <LandingInner />
    </Suspense>
  );
}
