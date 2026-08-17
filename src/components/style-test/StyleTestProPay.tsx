"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Loader2, CreditCard } from "lucide-react";

// 与 TryonPayButton 完全一致的本机匿名标识：
// 网站端不依赖微信 openid，用 tryon_web_openid 占位，权益落在 tryon_entitlements(openid=web_xxx)。
function getWebOpenid() {
  let anon = "";
  try {
    anon = "web_" + (localStorage.getItem("tryon_web_openid") || "");
  } catch (e) {}
  if (!anon || anon === "web_") {
    anon = "web_" + Math.random().toString(36).slice(2, 12);
    try {
      localStorage.setItem("tryon_web_openid", anon.slice(4));
    } catch (e) {}
  }
  return anon;
}

// 风格测试 = 专业版套餐（tryon_pro_998）：微信扫码支付 ¥998，回调自动发放 pro 权益，
// 前端轮询查单直到支付成功即跳转测试界面，与小程序 tryon 套餐完全打通。
export default function StyleTestProPay({ onPaid }: { onPaid: () => void }) {
  const [checking, setChecking] = useState(true);
  const [qr, setQr] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [err, setErr] = useState("");

  // 初始：已购专业版(pro)直接放行，避免重复扣费
  useEffect(() => {
    (async () => {
      try {
        const openid = getWebOpenid();
        const r = await fetch(`/api/tryon/entitlement?openid=${encodeURIComponent(openid)}`);
        const d = await r.json().catch(() => ({}));
        if (d && d.active && (d.proLeft ?? 0) > 0) {
          onPaid();
          return;
        }
      } catch (e) {}
      setChecking(false);
    })();
  }, []);

  const startPay = async () => {
    setSubmitting(true);
    setErr("");
    try {
      const openid = getWebOpenid();
      const r = await fetch("/api/tryon/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package_id: "tryon_pro_998", platform: "native", openid }),
      });
      const d = await r.json();
      if (!r.ok || !d.code_url) throw new Error(d.error || "下单失败，请重试");
      const QRCode = (await import("qrcode")).default;
      const qrData = await QRCode.toDataURL(d.code_url, { width: 220, margin: 1 });
      setQr(qrData);
      setOrderNo(d.order_no);
      setPolling(true);
    } catch (e: any) {
      setErr(e?.message || "调起支付失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 轮询查单：微信回调可能因网络延迟，主动同步订单状态
  useEffect(() => {
    if (!polling || !orderNo) return;
    const timer = setInterval(async () => {
      try {
        const r = await fetch(`/api/tryon/order-query?order_no=${encodeURIComponent(orderNo)}`);
        const d = await r.json().catch(() => ({}));
        if (d.wechat_state === "SUCCESS" || d.order?.status === "paid") {
          clearInterval(timer);
          setPolling(false);
          onPaid();
        }
      } catch (e) {}
    }, 4000);
    return () => clearInterval(timer);
  }, [polling, orderNo]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CreditCard className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-2">风格测试 · 专业版</h2>
        <p className="text-sm text-muted-foreground mb-6">
          微信扫码支付 ¥998，支付成功立即可测
          <br />
          （含八大风格真人试穿 100 次专业版权益）
        </p>
        <div className="text-4xl font-bold text-primary mb-6">¥998</div>

        {!qr ? (
          <button
            onClick={startPay}
            disabled={submitting}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {submitting ? "调起支付中..." : "微信扫码支付"}
          </button>
        ) : (
          <div>
            <div className="w-48 h-48 mx-auto mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="微信支付二维码" className="w-full h-full bg-gray-50 rounded-lg" />
            </div>
            <p className="text-xs text-gray-400 mb-3">请使用微信扫描上方二维码完成支付</p>
            <button
              onClick={startPay}
              className="w-full text-sm text-muted-foreground py-2 hover:text-primary transition-colors"
            >
              二维码失效？点击重新生成
            </button>
            {polling && (
              <p className="text-xs text-primary mt-3 flex items-center justify-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> 正在自动确认支付状态…
              </p>
            )}
          </div>
        )}
        {err && <p className="text-sm text-red-500 mt-3">{err}</p>}
        <p className="text-xs text-muted-foreground mt-3">支付成功后自动开通，无需等待客服确认</p>
      </div>
    </div>
  );
}
