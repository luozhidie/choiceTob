"use client";

import { useState, useEffect, useMemo, useRef } from "react";

/**
 * 虚拟试衣 · 独立推广落地页（扫码即用，不依赖登录）
 * 复用：/api/public/look-studio（公开数据） + /svc/tryon/api/multi-tryon（试衣代理）
 * 收款：/api/wechat-pay/unified-order（platform=native，返回微信扫码支付码）
 *
 * 说明：MVP 版为「免费带水印预览 + 付费去水印/下载/包月」freemium 形态。
 * 付费解锁在客户端做乐观解锁（点「我已支付」即解锁），服务端对账（tryon 订单表 + notify 分支）
 * 为下一步硬化，不影响本页可用性与线上支付。
 */

type Season = { code: string; name_zh: string; meta?: any };
type StyleT = { code: string; name_zh: string; gender: string; is_main: boolean };
type Product = { id: string; title: string; price: number; cover: string; seasons: string[]; styles: string[]; category: string };

const BRAND = { bg: "#2d1b2e", gold: "#C9A24B", apricot: "#fcefe9", card: "rgba(255,255,255,0.06)", line: "rgba(201,162,75,0.35)" };

const PACKAGES = [
  { id: "tryon_first_1yuan", label: "首单体验", price: 1, unit: "次", desc: "新人专享 1 次整体造型", highlight: true },
  { id: "tryon_monthly_99", label: "包月畅试", price: 99, unit: "月", desc: "30 天无限次试穿 + 高清下载" },
  { id: "tryon_quarter_199", label: "季卡", price: 199, unit: "季", desc: "90 天无限次 + 优先新款" },
  { id: "tryon_year_699", label: "年卡", price: 699, unit: "年", desc: "365 天无限次 + 专属顾问" },
];

export default function TryonPromoPage() {
  const [data, setData] = useState<{ seasons: Season[]; styles: StyleT[]; products: Product[] }>({ seasons: [], styles: [], products: [] });
  const [loadingData, setLoadingData] = useState(true);

  const [personFile, setPersonFile] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState("");
  const [tray, setTray] = useState<Product[]>([]);
  const [filterSeason, setFilterSeason] = useState("");
  const [result, setResult] = useState<{ url: string; credits: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [paid, setPaid] = useState(false);
  const [pay, setPay] = useState<{ pkg: typeof PACKAGES[number]; codeUrl: string; orderNo: string } | null>(null);
  const [paying, setPaying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const seasonMap = useMemo(() => Object.fromEntries(data.seasons.map((s) => [s.code, s])), [data.seasons]);
  const styleMap = useMemo(() => Object.fromEntries(data.styles.map((s) => [s.code, s])), [data.styles]);

  useEffect(() => {
    fetch("/api/public/look-studio")
      .then((r) => r.json())
      .then((d) => setData({ seasons: d.seasons || [], styles: d.styles || [], products: d.products || [] }))
      .catch(() => setErr("数据加载失败，请重试"))
      .finally(() => setLoadingData(false));
  }, []);

  const browse = useMemo(() => {
    let list = data.products;
    if (filterSeason) list = list.filter((p) => (p.seasons || []).includes(filterSeason));
    return list;
  }, [data.products, filterSeason]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPersonFile(f);
    setPersonPreview(URL.createObjectURL(f));
  };

  const addTray = (p: Product) => { if (!tray.find((t) => t.id === p.id)) setTray((t) => [...t, p]); };
  const removeTray = (id: string) => setTray((t) => t.filter((x) => x.id !== id));

  const runTryOn = async () => {
    setErr("");
    if (!personFile) { setErr("请先上传你的照片（用于把造型试穿到你身上）"); return; }
    if (tray.length === 0) { setErr("请先添加至少 1 件单品到「我的造型」"); return; }
    setLoading(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("personImage", personFile);
      fd.append("products", JSON.stringify(tray.map((p) => ({ url: p.cover, title: p.title }))));
      fd.append("userId", "tryon-promo");
      const res = await fetch("/svc/tryon/api/multi-tryon", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "试衣失败");
      setResult({ url: json.resultUrl, credits: json.credits ?? tray.length });
    } catch (e: any) {
      setErr(e?.message || "试衣失败");
    } finally {
      setLoading(false);
    }
  };

  const startPay = async (pkg: typeof PACKAGES[number]) => {
    if (!personFile || tray.length === 0) { setErr("请先完成「上传照片 + 选好单品」再购买"); return; }
    setPaying(true); setErr("");
    try {
      const r = await fetch("/api/wechat-pay/unified-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: pkg.id,
          product_title: `骆芷蝶智选·虚拟试衣${pkg.label}`,
          total_fee: pkg.price * 100,
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

  const confirmPaid = () => { setPaid(true); setPay(null); };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", minHeight: "100vh", background: `linear-gradient(180deg, ${BRAND.bg}, #1c1020)`, color: "#fff", fontFamily: "system-ui, sans-serif", paddingBottom: 140 }}>
      {/* 顶部品牌条（柔杏色） */}
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: BRAND.apricot, color: "#2d1b2e", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>骆芷蝶·智选 <span style={{ color: BRAND.gold }}>│ 虚拟试衣</span></div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>扫码即试 · 逛街网购先试穿</div>
      </header>

      <section style={{ padding: "18px 14px 6px" }}>
        <h1 style={{ fontSize: 22, margin: 0, fontWeight: 800, color: BRAND.gold }}>AI 虚拟试衣 · 先试再买</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,.7)", margin: "6px 0 0", lineHeight: 1.6 }}>
          上传你的照片，把店里的衣服「穿」到你身上看效果。逛街前试、网购前试，不买错、不踩雷。
        </p>
      </section>

      {loadingData && <p style={{ textAlign: "center", color: "rgba(255,255,255,.6)", fontSize: 13 }}>加载中…</p>}
      {err && <p style={{ color: "#ff9b9b", fontSize: 13, padding: "8px 14px" }}>{err}</p>}

      {/* ① 上传照片 */}
      <Section title="① 上传你的照片（试穿对象）">
        <div onClick={() => fileRef.current?.click()} style={{ width: 88, height: 116, borderRadius: 12, border: `1.5px dashed ${BRAND.gold}`, display: "flex", alignItems: "center", justifyContent: "center", color: BRAND.gold, fontSize: 12, textAlign: "center", overflow: "hidden", background: BRAND.card, cursor: "pointer", flexShrink: 0 }}>
          {personPreview ? <img src={personPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="me" /> : "上传\n照片"}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />
        <div style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,.6)", lineHeight: 1.7 }}>
          上传即表示同意《试衣服务协议》与《隐私政策》。<br />照片仅用于本次试衣，加密存储，可随时删除。
        </div>
      </Section>

      {/* ② 选单品 */}
      <Section title="② 挑选单品（加入我的造型）">
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
          <Chip on={filterSeason === ""} onClick={() => setFilterSeason("")}>全部</Chip>
          {data.seasons.map((s) => <Chip key={s.code} on={filterSeason === s.code} onClick={() => setFilterSeason(s.code)}>{s.name_zh}</Chip>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {browse.slice(0, 30).map((p) => {
            const added = !!tray.find((t) => t.id === p.id);
            return (
              <div key={p.id} style={{ background: BRAND.card, borderRadius: 10, padding: 6, border: `1px solid ${BRAND.line}` }}>
                <img src={p.cover} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }} alt={p.title} />
                <div style={{ fontSize: 11, color: "#eee", marginTop: 4, lineHeight: 1.3, height: 28, overflow: "hidden" }}>{p.title}</div>
                <button onClick={() => addTray(p)} disabled={added} style={{ width: "100%", marginTop: 4, padding: "7px 0", borderRadius: 8, border: "none", background: added ? "#555" : BRAND.gold, color: added ? "#ccc" : "#2d1b2e", fontWeight: 700, fontSize: 12 }}>{added ? "已加入" : "加入造型"}</button>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ③ 我的造型 + 试衣 */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "#1c1020", borderTop: `1px solid ${BRAND.line}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, maxWidth: 720, margin: "0 auto", zIndex: 20 }}>
        <div style={{ flex: 1, display: "flex", gap: 6, overflowX: "auto" }}>
          {tray.length === 0 && <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>「我的造型」空空如也</span>}
          {tray.map((p) => (
            <div key={p.id} style={{ position: "relative", flexShrink: 0 }}>
              <img src={p.cover} style={{ width: 44, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid #444" }} alt={p.title} />
              <span onClick={() => removeTray(p.id)} style={{ position: "absolute", top: -6, right: -6, background: "#c0392b", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>×</span>
            </div>
          ))}
        </div>
        <button onClick={runTryOn} disabled={loading || tray.length === 0} style={{ padding: "11px 16px", borderRadius: 10, border: "none", background: loading ? "#666" : BRAND.gold, color: "#2d1b2e", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap" }}>
          {loading ? "生成中…" : `试穿 (${tray.length}件)`}
        </button>
      </div>

      {/* 结果弹层 */}
      {result && (
        <div onClick={() => setResult(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.88)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
          <div style={{ color: "#fff", fontSize: 13, marginBottom: 8 }}>整体造型已生成 · 消耗 {result.credits} credit</div>
          <div style={{ position: "relative", maxWidth: "100%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.url} style={{ maxWidth: "100%", maxHeight: "68vh", borderRadius: 12, border: `1px solid ${BRAND.line}`, filter: paid ? "none" : "blur(0px)" }} alt="look" />
            {!paid && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <span style={{ transform: "rotate(-18deg)", color: "rgba(201,162,75,.85)", fontSize: 22, fontWeight: 800, border: `3px solid rgba(201,162,75,.85)`, padding: "6px 14px", borderRadius: 8 }}>AI 虚拟试衣 · 预览</span>
              </div>
            )}
          </div>
          <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 14, width: "100%", maxWidth: 360 }}>
            {!paid ? (
              <button onClick={() => startPay(PACKAGES[0])} disabled={paying} style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "none", background: BRAND.gold, color: "#2d1b2e", fontWeight: 800, fontSize: 15 }}>
                {paying ? "调起支付…" : "¥1 首单体验 · 去水印 + 高清下载"}
              </button>
            ) : (
              <a href={result.url} download style={{ display: "block", textAlign: "center", width: "100%", padding: "13px 0", borderRadius: 10, border: "none", background: BRAND.gold, color: "#2d1b2e", fontWeight: 800, fontSize: 15, textDecoration: "none" }}>下载高清造型图</a>
            )}
            <div style={{ color: "#bbb", fontSize: 12, marginTop: 8, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>点击空白处关闭</div>
          </div>
        </div>
      )}

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

      {/* 套餐区（推广展示） */}
      <Section title="套餐 · 随心试">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {PACKAGES.map((p) => (
            <div key={p.id} style={{ background: p.highlight ? "rgba(201,162,75,.12)" : BRAND.card, borderRadius: 12, padding: 12, border: `1px solid ${p.highlight ? BRAND.gold : BRAND.line}` }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: BRAND.gold }}>¥{p.price}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>/{p.unit}</span>
                {p.highlight && <span style={{ fontSize: 10, background: BRAND.gold, color: "#2d1b2e", padding: "2px 6px", borderRadius: 6, fontWeight: 700, marginLeft: "auto" }}>新人</span>}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{p.label}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", marginTop: 2, lineHeight: 1.4 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      <footer style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,.4)", padding: "16px 14px" }}>
        本服务由 AI 生成虚拟试衣效果，仅供参考，以实物为准。<br />骆芷蝶·智选 · 泉州鲤城服装批发
      </footer>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ margin: "10px 14px", background: BRAND.card, borderRadius: 14, border: `1px solid ${BRAND.line}`, padding: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: BRAND.gold }}>{title}</div>
      <div style={{ display: "flex", gap: 12 }}>{children}</div>
    </section>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <span onClick={onClick} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 20, whiteSpace: "nowrap", cursor: "pointer", border: `1px solid ${BRAND.line}`, background: on ? BRAND.gold : "transparent", color: on ? "#2d1b2e" : "#ddd", fontWeight: on ? 700 : 400 }}>
      {children}
    </span>
  );
}
