"use client";

import { useState } from "react";

export default function TryonPayButton({
  productId,
  title,
  price,
  sub,
  label,
}: {
  productId: string;
  title: string;
  price: number;
  sub?: string;
  label?: string;
}) {
  const [paying, setPaying] = useState(false);
  const [qr, setQr] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);

  const pay = async () => {
    setPaying(true);
    setErr("");
    try {
      // 走试衣专属下单通道（与小程序共用 /api/tryon/create），
      // native 扫码付不依赖 openid；为防 tryon_orders.openid 为空触发唯一约束，
      // 用本机匿名标识占位，权益落库后可在小程序内关联到真实账号。
      let anon = "";
      try { anon = "web_" + (localStorage.getItem("tryon_web_openid") || ""); } catch (e) {}
      if (!anon || anon === "web_") {
        anon = "web_" + Math.random().toString(36).slice(2, 12);
        try { localStorage.setItem("tryon_web_openid", anon.slice(4)); } catch (e) {}
      }
      const r = await fetch("/api/tryon/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: productId,
          platform: "native",
          openid: anon,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.code_url) throw new Error(d.error || "下单失败");
      const QRCode = (await import("qrcode")).default;
      const qrData = await QRCode.toDataURL(d.code_url, { width: 220, margin: 1 });
      setQr(qrData);
      setOrderNo(d.order_no);
      setOpen(true);
    } catch (e: any) {
      setErr(e?.message || "调起支付失败");
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <button
        onClick={pay}
        disabled={paying}
        className="w-full py-3 rounded-xl bg-[#2d1b2e] text-[#C9A24B] font-extrabold text-base disabled:opacity-60"
      >
        {paying ? "调起支付…" : label || `购买 ¥${price}`}
      </button>
      {err && <p className="text-red-500 text-sm mt-2 text-center">{err}</p>}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-5 w-full max-w-xs text-center"
          >
            <div className="font-bold text-lg text-[#2d1b2e]">微信扫码支付 ¥{price}</div>
            <div className="text-xs text-gray-600 my-1">
              {title}
              {sub ? ` · ${sub}` : ""}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="pay qr" className="w-[200px] h-[200px] mx-auto block bg-gray-50 rounded-lg" />
            <button
              onClick={() => setOpen(false)}
              className="mt-3 w-full py-2.5 rounded-lg bg-[#C9A24B] text-[#2d1b2e] font-bold text-sm"
            >
              我已完成支付
            </button>
            <div className="text-[11px] text-gray-400 mt-2 break-all">订单号：{orderNo}</div>
            <div className="text-[11px] text-gray-400 mt-1">支付成功即开通 · 如需绑定账号请在小程序内购买</div>
          </div>
        </div>
      )}
    </>
  );
}
