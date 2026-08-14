"use client";

import { useState, useMemo, useRef } from "react";
import { COLOR_SEASON_COLORS } from "@/lib/styles";

type Season = { code: string; name_zh: string; meta?: any };
type StyleT = {
  code: string;
  name_zh: string;
  gender: string;
  type?: string | null;
  is_main: boolean;
  parent_code?: string | null;
  direction?: string | null;
};
type Product = {
  id: string;
  title: string;
  price: number;
  cover: string;
  seasons: string[];
  styles: string[];
  category: string;
};

type Props = { data: { seasons: Season[]; styles: StyleT[]; products: Product[]; error?: string } };

export default function LookStudioClient({ data }: Props) {
  const seasons = data.seasons || [];
  const styles = data.styles || [];
  const products = data.products || [];

  const seasonMap = useMemo(() => Object.fromEntries(seasons.map((s) => [s.code, s])), [seasons]);
  const styleMap = useMemo(() => Object.fromEntries(styles.map((s) => [s.code, s])), [styles]);
  const seasonColor = (code: string) => COLOR_SEASON_COLORS[code] || "#ccc";

  const mainWomen = styles.filter((s) => s.gender === "women" && s.is_main);
  const mainMen = styles.filter((s) => s.gender === "men" && s.is_main);

  const [mode, setMode] = useState<"look" | "buyer" | "manual" | "auto">("look");
  const [mySeason, setMySeason] = useState<string>("");
  const [myStyle, setMyStyle] = useState<string>("");
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [tray, setTray] = useState<Product[]>([]);
  const [buyerStyle, setBuyerStyle] = useState<string>(mainWomen[0]?.code || "");
  const [filterSeason, setFilterSeason] = useState<string>("");
  const [result, setResult] = useState<{ url: string; credits: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // 评分：季型权重2，风格权重1
  const score = (p: Product, sc: string[], st: string[]) => {
    const s = (p.seasons || []).filter((x) => sc.includes(x)).length * 2
      + (p.styles || []).filter((x) => st.includes(x)).length * 1;
    return s;
  };

  const seasonName = (c: string) => seasonMap[c]?.name_zh || c;
  const styleName = (c: string) => styleMap[c]?.name_zh || c;

  // 造型：按主风格生成造型卡（展示「穿衣风格」的具像化）
  const lookCards = useMemo(() => {
    const mains = [...mainWomen, ...mainMen];
    return mains
      .map((m) => {
        const items = products
          .filter((p) => (p.styles || []).includes(m.code))
          .slice(0, 4);
        return { style: m, items };
      })
      .filter((c) => c.items.length > 0);
  }, [mainWomen, mainMen, products]);

  // 买手：当前买手风格下的商品
  const buyerProducts = useMemo(() => {
    if (!buyerStyle) return [];
    return products.filter((p) => (p.styles || []).includes(buyerStyle));
  }, [buyerStyle, products]);

  // 手工组合 / 自动：按筛选浏览
  const browseProducts = useMemo(() => {
    let list = products;
    if (filterSeason) list = list.filter((p) => (p.seasons || []).includes(filterSeason));
    return list;
  }, [products, filterSeason]);

  const addToTray = (p: Product) => {
    if (tray.find((t) => t.id === p.id)) return;
    setTray((t) => [...t, p]);
  };
  const removeTray = (id: string) => setTray((t) => t.filter((x) => x.id !== id));

  const onPickPerson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPersonFile(f);
    setPersonPreview(URL.createObjectURL(f));
  };

  // 按风格自动生成：用我的季型+风格结论，挑分的高的若干单品
  const autoGenerate = () => {
    const sc = mySeason ? [mySeason] : [];
    const st = myStyle ? [myStyle] : [];
    if (!sc.length && !st.length) {
      setErr("请先在「我的形象」选择你的色彩季型和穿衣风格");
      return;
    }
    const ranked = [...products]
      .map((p) => ({ p, s: score(p, sc, st) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 4)
      .map((x) => x.p);
    if (!ranked.length) {
      setErr("暂无与你的季型/风格匹配的商品，试着放宽筛选");
      return;
    }
    setTray(ranked);
    setErr("");
  };

  const runTryOn = async () => {
    setErr("");
    if (!personFile) {
      setErr("请先上传你的照片（用于把造型试穿到你身上）");
      return;
    }
    if (tray.length === 0) {
      setErr("请先添加至少 1 件单品到「我的造型」");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("personImage", personFile);
      fd.append(
        "products",
        JSON.stringify(tray.map((p) => ({ url: p.cover, title: p.title })))
      );
      fd.append("userId", "lookstudio");
      const res = await fetch("/api/tryon/generate", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "试衣失败");
      setResult({ url: json.resultUrl, credits: json.credits ?? tray.length });
    } catch (e: any) {
      setErr(e?.message || "试衣失败");
    } finally {
      setLoading(false);
    }
  };

  const tabs: { k: typeof mode; label: string }[] = [
    { k: "look", label: "造型" },
    { k: "buyer", label: "买手" },
    { k: "manual", label: "手工组合" },
    { k: "auto", label: "按风格生成" },
  ];

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 14, fontFamily: "system-ui, sans-serif", color: "#1a1a1a", paddingBottom: 120 }}>
      <header style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: 22, margin: 0, fontWeight: 800 }}>整体造型 · Look Studio</h1>
        <p style={{ fontSize: 13, color: "#666", margin: "4px 0 0" }}>
          把打过「色彩季型 × 穿衣风格」标签的服装，试穿到与你季型/风格结论匹配的你身上。
        </p>
      </header>

      {data.error && <p style={{ color: "#c0392b", fontSize: 13 }}>数据加载异常：{data.error}</p>}

      {/* 我的形象 */}
      <section style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>① 我的形象（试穿对象）</div>
        <div style={{ display: "flex", gap: 12 }}>
          <div onClick={() => fileRef.current?.click()} style={{ width: 72, height: 96, borderRadius: 10, border: "1.5px dashed #bbb", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 12, textAlign: "center", overflow: "hidden", background: "#fafafa", cursor: "pointer", flexShrink: 0 }}>
            {personPreview ? <img src={personPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="me" /> : "上传\n照片"}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickPerson} style={{ display: "none" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>色彩季型</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {seasons.map((s) => (
                <span key={s.code} onClick={() => setMySeason(s.code)}
                  style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, cursor: "pointer", border: "1px solid #ddd", background: mySeason === s.code ? seasonColor(s.code) : "#fff", color: mySeason === s.code ? "#fff" : "#555" }}>
                  {s.name_zh}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#888", margin: "8px 0 4px" }}>穿衣风格（主风格）</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {[...mainWomen, ...mainMen].map((m) => (
                <span key={m.code} onClick={() => setMyStyle(m.code)}
                  style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, cursor: "pointer", border: "1px solid #ddd", background: myStyle === m.code ? "#222" : "#fff", color: myStyle === m.code ? "#fff" : "#555" }}>
                  {m.gender === "women" ? "女" : "男"}·{m.name_zh}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 模式 Tab */}
      <nav style={{ display: "flex", gap: 6, margin: "14px 0" }}>
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setMode(t.k)}
            style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", background: mode === t.k ? "#222" : "#f0f0f0", color: mode === t.k ? "#fff" : "#555" }}>
            {t.label}
          </button>
        ))}
      </nav>

      {/* 造型 */}
      {mode === "look" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {lookCards.map((c) => (
            <div key={c.style.code} style={{ ...card, padding: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{c.style.name_zh} 风格造型</div>
              <div style={{ display: "flex", gap: 4, height: 120, marginBottom: 6 }}>
                {c.items.map((p) => (
                  <img key={p.id} src={p.cover} style={{ flex: 1, height: "100%", objectFit: "cover", borderRadius: 6 }} alt={p.title} />
                ))}
              </div>
              <button onClick={() => { setTray(c.items); setErr(""); }} style={btnSm}>装入「我的造型」并试穿 →</button>
            </div>
          ))}
          {lookCards.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>暂无足够商品生成造型，先去「手工组合」挑选单品。</p>}
        </div>
      )}

      {/* 买手 */}
      {mode === "buyer" && (
        <div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
            {[...mainWomen, ...mainMen].map((m) => (
              <span key={m.code} onClick={() => setBuyerStyle(m.code)}
                style={{ fontSize: 12, padding: "6px 12px", borderRadius: 20, whiteSpace: "nowrap", cursor: "pointer", border: "1px solid #ddd", background: buyerStyle === m.code ? "#222" : "#fff", color: buyerStyle === m.code ? "#fff" : "#555" }}>
                {m.gender === "women" ? "女·" : "男·"}{m.name_zh} 买手
              </span>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {buyerProducts.map((p) => (
              <ProductCard key={p.id} p={p} onAdd={() => addToTray(p)} added={!!tray.find((t) => t.id === p.id)} seasonName={seasonName} styleName={styleName} />
            ))}
          </div>
          {buyerProducts.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>该买手暂无匹配商品。</p>}
        </div>
      )}

      {/* 手工组合 */}
      {mode === "manual" && (
        <div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
            <span onClick={() => setFilterSeason("")} style={chip(filterSeason === "")}>全部季型</span>
            {seasons.map((s) => (
              <span key={s.code} onClick={() => setFilterSeason(s.code)} style={chip(filterSeason === s.code, seasonColor(s.code))}>{s.name_zh}</span>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {browseProducts.map((p) => (
              <ProductCard key={p.id} p={p} onAdd={() => addToTray(p)} added={!!tray.find((t) => t.id === p.id)} seasonName={seasonName} styleName={styleName} />
            ))}
          </div>
        </div>
      )}

      {/* 按风格生成 */}
      {mode === "auto" && (
        <div>
          <p style={{ fontSize: 13, color: "#666" }}>基于你在「我的形象」选择的季型与风格，自动挑出最匹配的单品组成完整造型。</p>
          <button onClick={autoGenerate} style={{ ...btnSm, background: "#7b4dff", color: "#fff", marginBottom: 10 }}>✨ 一键生成我的专属造型</button>
          {tray.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
              {tray.map((p) => <img key={p.id} src={p.cover} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 6 }} alt={p.title} />)}
            </div>
          )}
        </div>
      )}

      {err && <p style={{ color: "#c0392b", fontSize: 13, marginTop: 10 }}>{err}</p>}

      {/* 我的造型 固定底栏 */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "#fff", borderTop: "1px solid #eee", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, maxWidth: 720, margin: "0 auto" }}>
        <div style={{ flex: 1, display: "flex", gap: 6, overflowX: "auto" }}>
          {tray.length === 0 && <span style={{ fontSize: 12, color: "#aaa" }}>「我的造型」空空如也</span>}
          {tray.map((p) => (
            <div key={p.id} style={{ position: "relative", flexShrink: 0 }}>
              <img src={p.cover} style={{ width: 44, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }} alt={p.title} />
              <span onClick={() => removeTray(p.id)} style={{ position: "absolute", top: -6, right: -6, background: "#c0392b", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>×</span>
            </div>
          ))}
        </div>
        <button onClick={runTryOn} disabled={loading || tray.length === 0}
          style={{ padding: "11px 16px", borderRadius: 10, border: "none", background: loading ? "#aaa" : "#222", color: "#fff", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>
          {loading ? "生成中…" : `试穿 (${tray.length}件/${tray.length}credit)`}
        </button>
      </div>

      {/* 结果弹层 */}
      {result && (
        <div onClick={() => setResult(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
          <div style={{ color: "#fff", fontSize: 13, marginBottom: 8 }}>整体造型已生成 · 消耗 {result.credits} credit</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.url} style={{ maxWidth: "100%", maxHeight: "78vh", borderRadius: 12, border: "1px solid #444" }} alt="look" />
          <div style={{ color: "#ccc", fontSize: 12, marginTop: 10 }}>点击空白处关闭</div>
        </div>
      )}
    </main>
  );
}

const card: React.CSSProperties = { background: "#fff", borderRadius: 12, border: "1px solid #eee", padding: 12, marginBottom: 4 };
const btnSm: React.CSSProperties = { width: "100%", padding: "8px 0", borderRadius: 8, border: "none", background: "#f0f0f0", color: "#333", fontSize: 12, fontWeight: 600, cursor: "pointer" };
const chip = (on: boolean, color?: string): React.CSSProperties => ({
  fontSize: 12, padding: "6px 12px", borderRadius: 20, whiteSpace: "nowrap", cursor: "pointer", border: "1px solid #ddd",
  background: on ? (color || "#222") : "#fff", color: on ? "#fff" : "#555",
});

function ProductCard({ p, onAdd, added, seasonName, styleName }: {
  p: Product; onAdd: () => void; added: boolean; seasonName: (c: string) => string; styleName: (c: string) => string;
}) {
  return (
    <div style={{ ...card, padding: 6 }}>
      <div style={{ position: "relative" }}>
        <img src={p.cover} style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 8 }} alt={p.title} />
        {added && <span style={{ position: "absolute", top: 4, right: 4, background: "#27ae60", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 10 }}>已选</span>}
      </div>
      <div style={{ fontSize: 11, color: "#333", marginTop: 4, lineHeight: 1.3, height: 28, overflow: "hidden" }}>{p.title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, margin: "4px 0" }}>
        {(p.seasons || []).slice(0, 2).map((s) => <span key={s} style={{ fontSize: 9, background: "#f3f0ff", color: "#7b4dff", padding: "1px 5px", borderRadius: 6 }}>{seasonName(s)}</span>)}
        {(p.styles || []).slice(0, 1).map((s) => <span key={s} style={{ fontSize: 9, background: "#eef", color: "#446", padding: "1px 5px", borderRadius: 6 }}>{styleName(s)}</span>)}
      </div>
      <button onClick={onAdd} disabled={added} style={{ ...btnSm, background: added ? "#ddd" : "#222", color: "#fff" }}>{added ? "已加入" : "加入造型"}</button>
    </div>
  );
}
