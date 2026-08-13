"use client";

import { useState, type ReactNode } from "react";

/**
 * 虚拟试衣 · 推广落地页（与小程序 tryon-promo 同版式）
 * 双轨定价：首单 ¥9.9 / 普通月卡 ¥59 / 专业月卡 ¥199 / 专业年卡 ¥999
 * 网站支付：/api/wechat-pay/unified-order（platform=native，返回微信扫码支付码）
 * 试衣动作引导至 /look-studio（扫码即用）
 */

const BRAND = { bg: "#2d1b2e", gold: "#C9A24B", apricot: "#fcefe9", card: "rgba(255,255,255,0.06)", line: "rgba(201,162,75,0.35)", sub: "rgba(255,255,255,.7)" };

const PACKAGES = [
  { id: "tryon_first_1yuan", label: "首单体验", price: 9.9, unit: "次", desc: "新人专享 9 次普通 + 1 次专业", highlight: true },
  { id: "tryon_normal_monthly_59", label: "普通月卡", price: 59, unit: "月", desc: "30 天 70 次普通试穿" },
  { id: "tryon_pro_monthly_199", label: "专业月卡", price: 199, unit: "月", desc: "30 天 200 次专业诊断" },
  { id: "tryon_pro_year_999", label: "专业年卡", price: 999, unit: "年", desc: "365 天 1000 次专业诊断" },
];

const firstPkg = PACKAGES[0];
const proMonthPkg = PACKAGES[2];
const proYearPkg = PACKAGES[3];

export default function TryonPromoPage() {
  const [pay, setPay] = useState<{ pkg: typeof PACKAGES[number]; codeUrl: string; orderNo: string } | null>(null);
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState("");

  const startPay = async (pkg: typeof PACKAGES[number]) => {
    setPaying(true); setErr("");
    try {
      const r = await fetch("/api/wechat-pay/unified-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: pkg.id,
          product_title: `骆芷蝶智选·虚拟试衣${pkg.label}`,
          total_fee: Math.round(pkg.price * 100),
          platform: "native",
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.code_url) throw new Error(d.error || "下单失败");
      setPay({ pkg, codeUrl: d.code_url, orderNo: d.order_no });
    } catch (e: any) {
      setErr(e?.message || "调起支付失败");
    } finally {
      setPaying(false);
    }
  };

  const confirmPaid = () => {
    setPay(null);
    setErr("支付成功～ 权益在小程序「我的」里查看，试衣去「立即试穿」");
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", minHeight: "100vh", background: `linear-gradient(180deg, ${BRAND.bg}, #1c1020)`, color: "#fff", fontFamily: "system-ui, sans-serif", paddingBottom: 140 }}>
      {/* 顶部品牌条（柔杏色） */}
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: BRAND.apricot, color: "#2d1b2e", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>骆芷蝶·智选 <span style={{ color: BRAND.gold }}>│ 虚拟试衣</span></div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>扫码即试 · 先试再买</div>
      </header>

      {/* Hero */}
      <section style={{ padding: "30px 18px 18px", textAlign: "center" }}>
        <span style={{ display: "inline-block", fontSize: 12, color: BRAND.gold, border: `1px solid ${BRAND.line}`, padding: "4px 14px", borderRadius: 20 }}>骆芷蝶智选 · AI 试衣</span>
        <h1 style={{ fontSize: 30, margin: "16px 0 0", fontWeight: 800, lineHeight: 1.25 }}>先试再买<br />穿上身再决定</h1>
        <p style={{ fontSize: 14, color: BRAND.sub, margin: "14px auto 0", lineHeight: 1.7, maxWidth: 560 }}>
          把你平时的照片传上来，AI 把店里的衣服「穿」到你身上。好不好看、适不适合，一眼就清楚，省得买回来压箱底。
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
          {["首单 ¥9.9", "30 秒出图", "照片不外流"].map((b) => (
            <span key={b} style={{ fontSize: 12, color: BRAND.apricot, background: "rgba(255,255,255,.12)", padding: "6px 14px", borderRadius: 20 }}>{b}</span>
          ))}
        </div>
        <button onClick={() => startPay(firstPkg)} disabled={paying} style={{ marginTop: 22, width: "100%", maxWidth: 420, padding: "16px 0", borderRadius: 14, border: "none", background: `linear-gradient(90deg, ${BRAND.gold}, #dab860)`, color: "#2d1b2e", fontWeight: 800, fontSize: 18, boxShadow: "0 12px 30px rgba(201,162,75,.4)" }}>
          {paying ? "调起支付…" : "新人首单 ¥9.9 试穿"}
        </button>
        <div style={{ fontSize: 13, color: "#5a4723", marginTop: 8, fontWeight: 600 }}>9 次普通 + 1 次专业 · 限时体验</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 10 }}>先试后买，少踩一次雷就回本了</div>
      </section>

      {err && <p style={{ color: "#ff9b9b", fontSize: 13, padding: "6px 18px", textAlign: "center" }}>{err}</p>}

      {/* 三步 */}
      <Section title="三步，看见上身效果">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          {[
            { n: "1", t: "传照片", d: "一张日常的你，正面半身最好，只用来这次合成" },
            { n: "2", t: "挑衣服", d: "店里随便挑，或自己拍件衣服图上来看看" },
            { n: "3", t: "出上身图", d: "AI 帮你把衣服「穿」上，30 秒出效果" },
          ].map((s, i) => (
            <div key={s.n} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ width: 40, height: 40, lineHeight: "40px", borderRadius: "50%", background: BRAND.bg, color: BRAND.gold, fontWeight: 800, margin: "0 auto 10px" }}>{s.n}</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{s.t}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 6, lineHeight: 1.5 }}>{s.d}</div>
              {i < 2 && <div style={{ display: "none" }} />}
            </div>
          ))}
        </div>
      </Section>

      {/* 版本对比 */}
      <Section title="两个版本，按需挑">
        {/* 普通版 */}
        <div style={{ background: "#fff", color: "#222", borderRadius: 16, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 20, fontWeight: 800 }}>普通版</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: BRAND.gold }}>¥59<span style={{ fontSize: 13, color: "#aaa" }}/月</span></span>
          </div>
          <p style={{ fontSize: 13, color: "#888", margin: "8px 0 12px", lineHeight: 1.6 }}>最简单那种：传张人像 + 传件衣服，点一下就出图，跟你后台验收款式一个感觉。</p>
          {[
            "传一张你自己的照片",
            "传想试穿的衣服图（也能直接用店里的）",
            "一键 AI 合成上身效果",
            "店里商品也能直接拿来试",
          ].map((t) => <div key={t} style={{ fontSize: 14, color: "#222", lineHeight: 1.9 }}>✓ {t}</div>)}
          <div style={{ fontSize: 13, color: "#bbb", lineHeight: 1.9, marginTop: 4 }}>
            — 不做穿衣风格诊断<br />— 不配 AI 智能搭配 / 买手推荐
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f7f5f2", borderRadius: 10, padding: "10px 12px", margin: "12px 0" }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>普通月卡 ¥59 · 30 天 70 次</span>
            <span style={{ fontSize: 12, color: "#888", background: "#ece7e0", padding: "4px 10px", borderRadius: 16 }}>够日常挑款用</span>
          </div>
          <button onClick={() => startPay(firstPkg)} disabled={paying} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: BRAND.bg, color: BRAND.gold, fontWeight: 800, fontSize: 15 }}>
            ¥9.9 新人首单体验
          </button>
        </div>

        {/* 专业版 */}
        <div style={{ background: "#fff", color: "#222", borderRadius: 16, padding: 16, border: `2px solid ${BRAND.gold}`, position: "relative" }}>
          <div style={{ position: "absolute", top: 0, right: 16, background: `linear-gradient(90deg, ${BRAND.gold}, #dab860)`, color: "#2d1b2e", fontSize: 12, fontWeight: 800, padding: "6px 14px", borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }}>更懂你 · 推荐</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 20, fontWeight: 800 }}>专业版</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: BRAND.gold }}>¥199<span style={{ fontSize: 13, color: "#aaa" }}/月起</span></span>
          </div>
          <p style={{ fontSize: 13, color: "#888", margin: "8px 0 12px", lineHeight: 1.6 }}>普通版之上，多一个「懂你风格」——测完帮你搭、帮你选，不是瞎试。</p>
          {[
            "普通版能干的它都能",
            "21 题穿衣风格诊断（先搞清自己适合啥）",
            "AI 按你的风格自动生成造型",
            "专属买手推荐 + 新款优先看",
          ].map((t) => <div key={t} style={{ fontSize: 14, color: "#222", lineHeight: 1.9 }}>✓ {t}</div>)}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f7f5f2", borderRadius: 10, padding: "10px 12px", margin: "12px 0" }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>专业月卡 ¥199/月起</span>
            <span style={{ fontSize: 12, color: "#9a7220", background: "rgba(201,162,75,.16)", padding: "4px 10px", borderRadius: 16 }}>想认真穿好看就选它</span>
          </div>
          <button onClick={() => startPay(proMonthPkg)} disabled={paying} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: `linear-gradient(90deg, ${BRAND.gold}, #dab860)`, color: "#2d1b2e", fontWeight: 800, fontSize: 15, boxShadow: "0 10px 26px rgba(201,162,75,.35)" }}>
            开通专业版
          </button>
          <div onClick={() => startPay(proYearPkg)} style={{ textAlign: "center", fontSize: 13, color: "#9a7220", marginTop: 12, cursor: "pointer" }}>
            或直接选年卡 · ¥999 / 365 天 1000 次专业诊断 ›
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section title="几个你大概会问的">
        {[
          { q: "我的照片会不会被拿去乱用？", a: "不会。只用于这次试衣合成，用完不留存、不公开，你随时能让我们删掉。" },
          { q: "试出来的效果能当真吗？", a: "当参考最稳——帮你判断版型、颜色上身好不好看。真要下单还是以实物为准，别全信图。" },
          { q: "专业版不想要了能退吗？", a: "到期不续就自动回普通版，已买的权益照常用，不扣不罚。想提前关也行，跟我们说一声。" },
        ].map((f) => (
          <div key={f.q} style={{ background: "#fff", color: "#222", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{f.q}</div>
            <div style={{ fontSize: 13, color: "#777", lineHeight: 1.6 }}>{f.a}</div>
          </div>
        ))}
      </Section>

      <footer style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,.4)", padding: "16px 14px" }}>
        本服务由 AI 生成虚拟试衣效果，仅供参考，以实物为准。<br />骆芷蝶·智选 · 泉州鲤城服装批发
      </footer>

      {/* 底部固定栏 */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "#fff", borderTop: "1px solid #eee", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 720, margin: "0 auto", zIndex: 20, boxShadow: "0 -4px 20px rgba(0,0,0,.06)" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: BRAND.gold }}>首单 ¥9.9</span>
          <span style={{ fontSize: 12, color: "#999" }}>新人限时体验价</span>
        </div>
        <a href="/look-studio" style={{ padding: "14px 44px", borderRadius: 14, border: "none", background: `linear-gradient(90deg, ${BRAND.bg}, #4a2d4c)`, color: BRAND.gold, fontWeight: 800, fontSize: 16, textDecoration: "none", boxShadow: "0 8px 22px rgba(45,27,46,.3)" }}>立即试穿</a>
      </div>

      {/* 付费弹窗：扫码支付 */}
      {pay && (
        <div onClick={() => setPay(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 60 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", color: "#222", borderRadius: 14, padding: 18, width: "100%", maxWidth: 320, textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>微信扫码支付 ¥{pay.pkg.price}</div>
            <div style={{ fontSize: 12, color: "#666", margin: "4px 0 12px" }}>{pay.pkg.label} · {pay.pkg.desc}</div>
            {/* 微信 native 支付码 → 生成二维码供微信扫描 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pay.codeUrl)}`} alt="pay qr" style={{ width: 200, height: 200, margin: "0 auto", display: "block", background: "#f5f5f5", borderRadius: 8 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div style={{ fontSize: 11, color: "#999", marginTop: 8, wordBreak: "break-all" }}>如二维码不显示，请复制此付款码用微信「扫一扫」：<br />{pay.codeUrl}</div>
            <button onClick={confirmPaid} style={{ marginTop: 12, width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: BRAND.gold, color: "#2d1b2e", fontWeight: 800, fontSize: 14 }}>我已完成支付</button>
            <div style={{ fontSize: 11, color: "#999", marginTop: 6 }}>订单号：{pay.orderNo}</div>
          </div>
        </div>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ margin: "14px 14px", background: BRAND.card, borderRadius: 14, border: `1px solid ${BRAND.line}`, padding: 14 }}>
      <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 12, color: BRAND.gold }}>{title}</div>
      {children}
    </section>
  );
}
