"use client";

import { useState } from "react";

/**
 * 虚拟试衣 · 推广落地页（完全按用户 P 图版式）
 * 双轨定价：首单 ¥9.9 / 普通月卡 ¥59 / 专业月卡 ¥199 / 专业年卡 ¥999
 * 网站支付：/api/wechat-pay/unified-order（platform=native，返回微信扫码支付码）
 * 试衣动作引导至 /look-studio（扫码即用）
 */

const BRAND = { bg: "#2d1b2e", gold: "#C9A24B", apricot: "#fcefe9" };

const PACKAGES = [
  { id: "tryon_first_1yuan", label: "首单体验", price: 9.9, desc: "新人专享 9 次普通 + 1 次专业" },
  { id: "tryon_normal_monthly_59", label: "普通月卡", price: 59, desc: "30 天 70 次普通试穿" },
  { id: "tryon_pro_monthly_199", label: "专业月卡", price: 199, desc: "30 天 200 次专业诊断" },
  { id: "tryon_pro_year_999", label: "专业年卡", price: 999, desc: "365 天 1000 次专业诊断" },
];

const firstPkg = PACKAGES[0];
const normalPkg = PACKAGES[1];
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
    setErr("支付成功～ 权益在小程序「我的」里查看");
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", minHeight: "100vh", background: `linear-gradient(180deg, ${BRAND.bg}, #1c1020)`, color: "#fff", fontFamily: "system-ui, -apple-system, sans-serif", paddingBottom: 140 }}>
      {/* Hero */}
      <section style={{ padding: "36px 18px 24px", textAlign: "center" }}>
        <span style={{ display: "inline-block", fontSize: 12, color: BRAND.gold, border: `1px solid ${BRAND.gold}`, opacity: 0.8, padding: "4px 14px", borderRadius: 20 }}>骆芷蝶智选 · AI 试衣</span>
        <h1 style={{ fontSize: 32, margin: "18px 0 0", fontWeight: 800, lineHeight: 1.2 }}>先试再买<br />穿上身再决定</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,.7)", margin: "14px auto 0", lineHeight: 1.7, maxWidth: 560 }}>
          上传你的照片，AI 把衣服「穿」到你身上。好不好看，一眼就知道。
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
          {["9.9元首单", "30 秒出图", "隐私保护"].map((b) => (
            <span key={b} style={{ fontSize: 12, color: BRAND.apricot, background: "rgba(255,255,255,.1)", padding: "6px 14px", borderRadius: 20 }}>{b}</span>
          ))}
        </div>
        <button onClick={() => startPay(firstPkg)} disabled={paying} style={{ marginTop: 22, width: "100%", maxWidth: 420, padding: "16px 0", borderRadius: 14, border: "none", background: `linear-gradient(90deg, ${BRAND.gold}, #dab860)`, color: "#2d1b2e", fontWeight: 800, fontSize: 18, boxShadow: "0 12px 30px rgba(201,162,75,.4)" }}>
          {paying ? "调起支付…" : "新人首单 ¥9.9 试穿"}
        </button>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 10 }}>9 次普通 + 1 次专业 · 限时体验</div>
      </section>

      {err && <p style={{ color: "#ff9b9b", fontSize: 13, padding: "6px 18px", textAlign: "center" }}>{err}</p>}

      {/* 三步 */}
      <Section title="三步，看见上身效果">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
          {[
            { n: "1", t: "上传照片", d: "正面半身照，仅用于本次合成" },
            { n: "2", t: "挑选衣服", d: "从店铺商品里选，或 AI 推荐" },
            { n: "3", t: "生成上身图", d: "AI 合成真实穿着效果" },
          ].map((s, i) => (
            <div key={s.n} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ width: 40, height: 40, lineHeight: "40px", borderRadius: "50%", background: "#2d1b2e", color: BRAND.gold, fontWeight: 800, margin: "0 auto 10px" }}>{s.n}</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{s.t}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 6, lineHeight: 1.5 }}>{s.d}</div>
              {i < 2 && <span style={{ display: "inline-block", marginTop: 8, color: BRAND.gold, fontSize: 12 }}>→</span>}
            </div>
          ))}
        </div>
      </Section>

      {/* 普通版 */}
      <Card title="普通版" price={null}>
        <p style={{ fontSize: 13, color: "#888", margin: "0 0 12px", lineHeight: 1.6 }}>像后台验收一样简单：上传人像 + 上传衣服，点试穿</p>
        {[
          "上传自己的人像照片",
          "上传想试穿的衣服照片",
          "一键 AI 合成上身效果",
          "也可以从店铺挑选商品试穿",
        ].map((t) => <div key={t} style={{ fontSize: 14, color: "#222", lineHeight: 1.9 }}>✓ {t}</div>)}
        <div style={{ fontSize: 13, color: "#bbb", lineHeight: 1.9, marginTop: 4 }}>— 不含风格诊断<br />— 不含 AI 智能搭配 / 买手推荐</div>
        <div onClick={() => startPay(normalPkg)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f7f5f2", borderRadius: 10, padding: "12px 14px", marginTop: 14, cursor: "pointer" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>普通月卡</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>30 天 70 次普通试穿</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: BRAND.gold }}>¥59</div>
        </div>
      </Card>

      {/* 专业版 */}
      <Card title="专业版" price="¥199/月起" tag="专业版">
        <p style={{ fontSize: 13, color: "#888", margin: "0 0 12px", lineHeight: 1.6 }}>在普通版基础上，加风格诊断与智能搭配</p>
        {[
          "普通版全部功能",
          "21 题穿衣风格诊断",
          "AI 按风格自动生成造型",
          "专属买手推荐 + 优先新款",
        ].map((t) => <div key={t} style={{ fontSize: 14, color: "#222", lineHeight: 1.9 }}>✓ {t}</div>)}
        <button onClick={() => startPay(proMonthPkg)} disabled={paying} style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: BRAND.bg, color: BRAND.gold, fontWeight: 800, fontSize: 16, marginTop: 14 }}>
          开通专业版
        </button>
      </Card>

      {/* 专业年卡 */}
      <Card title="专业年卡" price="¥999">
        <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.6 }}>365 天 1000 次专业诊断</p>
        <button onClick={() => startPay(proYearPkg)} disabled={paying} style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: `1px solid ${BRAND.gold}`, background: "transparent", color: BRAND.gold, fontWeight: 800, fontSize: 15, marginTop: 14 }}>
          开通专业年卡
        </button>
      </Card>

      {/* FAQ */}
      <Section title="常见问题">
        {[
          { q: "照片会被保存或公开吗？", a: "不会。照片仅用于本次 AI 试衣合成，处理后不保留、不公开。" },
          { q: "试衣效果能当真实试穿看吗？", a: "AI 合成效果仅供参考，帮助你判断款式、颜色是否适合自己。" },
          { q: "专业版可以随时取消吗？", a: "可以。到期不续费自动回到基础版，已购权益不受影响。" },
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
        <a href="/look-studio" style={{ padding: "14px 44px", borderRadius: 14, border: "none", background: BRAND.bg, color: BRAND.gold, fontWeight: 800, fontSize: 16, textDecoration: "none" }}>立即试穿</a>
      </div>

      {/* 付费弹窗：扫码支付 */}
      {pay && (
        <div onClick={() => setPay(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 60 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", color: "#222", borderRadius: 14, padding: 18, width: "100%", maxWidth: 320, textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>微信扫码支付 ¥{pay.pkg.price}</div>
            <div style={{ fontSize: 12, color: "#666", margin: "4px 0 12px" }}>{pay.pkg.label} · {pay.pkg.desc}</div>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pay.codeUrl)}`} alt="pay qr" style={{ width: 200, height: 200, margin: "0 auto", display: "block", background: "#f5f5f5", borderRadius: 8 }} />
            <div style={{ fontSize: 11, color: "#999", marginTop: 8, wordBreak: "break-all" }}>如二维码不显示，请复制此付款码用微信「扫一扫」：<br />{pay.codeUrl}</div>
            <button onClick={confirmPaid} style={{ marginTop: 12, width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: BRAND.gold, color: "#2d1b2e", fontWeight: 800, fontSize: 14 }}>我已完成支付</button>
            <div style={{ fontSize: 11, color: "#999", marginTop: 6 }}>订单号：{pay.orderNo}</div>
          </div>
        </div>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ margin: "14px 14px", background: "rgba(255,255,255,0.06)", borderRadius: 14, border: `1px solid rgba(201,162,75,.35)`, padding: 14 }}>
      <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 12, color: BRAND.gold }}>{title}</div>
      {children}
    </section>
  );
}

function Card({ title, price, tag, children }: { title: string; price: string | null; tag?: string; children: React.ReactNode }) {
  return (
    <div style={{ margin: "14px 14px", background: "#fff", color: "#222", borderRadius: 16, padding: 16, position: "relative", border: tag ? `2px solid ${BRAND.gold}` : "none" }}>
      {tag && (
        <div style={{ position: "absolute", top: 0, right: 16, background: `linear-gradient(90deg, ${BRAND.gold}, #dab860)`, color: "#2d1b2e", fontSize: 12, fontWeight: 800, padding: "6px 14px", borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }}>{tag}</div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 20, fontWeight: 800 }}>{title}</span>
        {price && <span style={{ fontSize: 22, fontWeight: 800, color: BRAND.gold }}>{price}</span>}
      </div>
      {children}
    </div>
  );
}
