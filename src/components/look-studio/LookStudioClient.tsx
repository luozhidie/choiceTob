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

type StackItem = { id: string; title: string; cover: string; resultUrl: string };

type Props = { data: { seasons: Season[]; styles: StyleT[]; products: Product[]; error?: string } };

const BG = "#1c111d";
const CARD = "#2a1a2b";
const GOLD = "#C9A24B";
const GOLD_DIM = "rgba(201,162,75,.18)";

export default function LookStudioClient({ data }: Props) {
  const seasons = data.seasons || [];
  const styles = data.styles || [];
  const products = data.products || [];

  const seasonMap = useMemo(() => Object.fromEntries(seasons.map((s) => [s.code, s])), [seasons]);
  const styleMap = useMemo(() => Object.fromEntries(styles.map((s) => [s.code, s])), [styles]);
  const seasonColor = (code: string) => COLOR_SEASON_COLORS[code] || "#ccc";

  const mainWomen = styles.filter((s) => s.gender === "women" && s.is_main);
  const mainMen = styles.filter((s) => s.gender === "men" && s.is_main);

  // —— 我的形象 ——
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [mySeason, setMySeason] = useState<string>("");
  const [myStyle, setMyStyle] = useState<string>("");

  // —— 画布叠加 ——
  const [canvasUrl, setCanvasUrl] = useState<string>(""); // 当前画布（初始=真人照预览）
  const [stack, setStack] = useState<StackItem[]>([]); // 已叠加单品序列
  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string>("");
  const garmentRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"browse" | "buyer" | "manual" | "auto">("browse");
  const [buyerStyle, setBuyerStyle] = useState<string>(mainWomen[0]?.code || "");
  const [filterSeason, setFilterSeason] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState("");
  const [err, setErr] = useState("");

  const seasonName = (c: string) => seasonMap[c]?.name_zh || c;
  const styleName = (c: string) => styleMap[c]?.name_zh || c;

  // 评分：季型权重2，风格权重1
  const score = (p: Product, sc: string[], st: string[]) => {
    const s = (p.seasons || []).filter((x) => sc.includes(x)).length * 2
      + (p.styles || []).filter((x) => st.includes(x)).length * 1;
    return s;
  };

  // 造型卡（展示「穿衣风格」的具像化，单品可逐件加）
  const lookCards = useMemo(() => {
    const mains = [...mainWomen, ...mainMen];
    return mains
      .map((m) => {
        const items = products.filter((p) => (p.styles || []).includes(m.code)).slice(0, 4);
        return { style: m, items };
      })
      .filter((c) => c.items.length > 0);
  }, [mainWomen, mainMen, products]);

  const buyerProducts = useMemo(() => {
    if (!buyerStyle) return [];
    return products.filter((p) => (p.styles || []).includes(buyerStyle));
  }, [buyerStyle, products]);

  const browseProducts = useMemo(() => {
    let list = products;
    if (filterSeason) list = list.filter((p) => (p.seasons || []).includes(filterSeason));
    return list;
  }, [products, filterSeason]);

  const onPickPerson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPersonFile(f);
    setPersonPreview(URL.createObjectURL(f));
    setErr("");
  };
  const onPickGarment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setGarmentFile(f);
    setGarmentPreview(URL.createObjectURL(f));
    setErr("");
  };

  // —— 核心：逐件叠加 ——
  const tryOnCore = async (item: { cover?: string; title: string }) => {
    setErr("");
    if (!personFile && !canvasUrl) {
      setErr("请先上传你的照片（第 1 件试穿的对象）");
      return;
    }
    if (!personFile && stack.length === 0) {
      setErr("请先上传你的照片");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      // 第 1 件传真人照文件；后续用上一张结果图当基底
      if (stack.length === 0) {
        if (!personFile) { setErr("请先上传你的照片"); setLoading(false); return; }
        fd.append("personImage", personFile);
      } else {
        fd.append("personImageUrl", canvasUrl);
      }
      // 单品：商城 URL 或 用户上传图
      if (item.cover) {
        fd.append("garmentImageUrl", item.cover);
      } else if (garmentFile) {
        fd.append("garmentImage", garmentFile);
      } else {
        setErr("缺少单品图片");
        setLoading(false);
        return;
      }
      fd.append("userId", "lookstudio");

      const res = await fetch("/api/tryon/generate", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "试衣失败");

      const newUrl = json.resultUrl;
      const entry: StackItem = {
        id: `s${stack.length}-${Date.now()}`,
        title: item.title,
        cover: item.cover || (garmentPreview || ""),
        resultUrl: newUrl,
      };
      setStack((s) => [...s, entry]);
      setCanvasUrl(newUrl);
      setGarmentFile(null);
      setGarmentPreview("");
    } catch (e: any) {
      setErr(e?.message || "试衣失败");
    } finally {
      setLoading(false);
    }
  };

  const addFromShop = (p: Product) => tryOnCore({ cover: p.cover, title: p.title });
  const addUpload = () => {
    if (!garmentFile) { setErr("先选一张你的单品图"); return; }
    tryOnCore({ title: garmentFile.name || "我的单品" });
  };

  const undo = () => {
    setStack((s) => {
      const next = s.slice(0, -1);
      const last = next[next.length - 1];
      setCanvasUrl(last ? last.resultUrl : "");
      return next;
    });
  };
  const resetCanvas = () => { setStack([]); setCanvasUrl(""); };

  const tabs: { k: typeof mode; label: string }[] = [
    { k: "browse", label: "挑单品" },
    { k: "buyer", label: "买手" },
    { k: "manual", label: "手工组合" },
    { k: "auto", label: "按风格生成" },
  ];

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 14, fontFamily: "system-ui, sans-serif", color: "#f3ece9", paddingBottom: 120, background: BG, minHeight: "100vh" }}>
      <header style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: 22, margin: 0, fontWeight: 800, color: "#fff" }}>云衣橱 · AI 虚拟试衣</h1>
        <p style={{ fontSize: 13, color: "#b9a7ad", margin: "4px 0 0" }}>
          一件件往上加：选好单品 → 点「＋加这件」，真人照上就会多出这件衣服，叠到满意为止。
        </p>
      </header>

      {data.error && <p style={{ color: "#e88", fontSize: 13 }}>数据加载异常：{data.error}</p>}

      {/* ① 上传真人照 */}
      <section style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#fff" }}>① 上传你的照片（第 1 件试穿对象）</div>
        <div style={{ display: "flex", gap: 12 }}>
          <div onClick={() => fileRef.current?.click()} style={{ width: 72, height: 96, borderRadius: 10, border: "1.5px dashed #6b5560", display: "flex", alignItems: "center", justifyContent: "center", color: "#b9a7ad", fontSize: 12, textAlign: "center", overflow: "hidden", background: "#241620", cursor: "pointer", flexShrink: 0 }}>
            {personPreview ? <img src={personPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="me" /> : "上传\n照片"}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickPerson} style={{ display: "none" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "#b9a7ad", marginBottom: 4 }}>色彩季型</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {seasons.map((s) => (
                <span key={s.code} onClick={() => setMySeason(s.code)}
                  style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, cursor: "pointer", border: "1px solid #4a3840", background: mySeason === s.code ? seasonColor(s.code) : "transparent", color: mySeason === s.code ? "#fff" : "#cbb" }}>
                  {s.name_zh}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#b9a7ad", margin: "8px 0 4px" }}>穿衣风格（主风格）</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {[...mainWomen, ...mainMen].map((m) => (
                <span key={m.code} onClick={() => setMyStyle(m.code)}
                  style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, cursor: "pointer", border: "1px solid #4a3840", background: myStyle === m.code ? GOLD : "transparent", color: myStyle === m.code ? "#1c111d" : "#cbb" }}>
                  {m.gender === "women" ? "女" : "男"}·{m.name_zh}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ② 画布 */}
      <section style={{ ...card, marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>② 我的造型画布</div>
          <div style={{ fontSize: 12, color: GOLD }}>已穿 {stack.length} 件 · {stack.length} credits</div>
        </div>
        <div onClick={() => canvasUrl && window.open(canvasUrl, "_blank")}
          style={{ width: "100%", aspectRatio: "3 / 4", borderRadius: 10, border: "1px solid #4a3840", background: "#16100f", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: canvasUrl ? "pointer" : "default" }}>
          {canvasUrl ? <img src={canvasUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="canvas" />
            : personPreview ? <img src={personPreview} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="me" />
            : <span style={{ color: "#8a7580", fontSize: 13 }}>上传照片后，这里显示你的实时造型</span>}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={undo} disabled={stack.length === 0 || loading} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "1px solid #4a3840", background: "transparent", color: stack.length === 0 ? "#6b5560" : "#f3ece9", fontSize: 13, cursor: stack.length === 0 ? "default" : "pointer" }}>↶ 撤销一件</button>
          <button onClick={resetCanvas} disabled={stack.length === 0} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "1px solid #4a3840", background: "transparent", color: stack.length === 0 ? "#6b5560" : "#f3ece9", fontSize: 13, cursor: stack.length === 0 ? "default" : "pointer" }}>清空重来</button>
        </div>
        {/* 历史栈 */}
        {stack.length > 0 && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", marginTop: 10, paddingBottom: 4 }}>
            {stack.map((s, i) => (
              <div key={s.id} style={{ position: "relative", flexShrink: 0, width: 44, height: 58, borderRadius: 6, overflow: "hidden", border: "1px solid #4a3840" }}>
                <img src={s.resultUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={s.title} />
                <span style={{ position: "absolute", top: 1, left: 2, background: "rgba(0,0,0,.6)", color: GOLD, fontSize: 9, padding: "0 4px", borderRadius: 6 }}>{i + 1}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 上传我的单品图 */}
      <section style={{ ...card, marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 6 }}>③ 上传我自己的单品图（可选）</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div onClick={() => garmentRef.current?.click()} style={{ width: 60, height: 60, borderRadius: 8, border: "1.5px dashed #6b5560", display: "flex", alignItems: "center", justifyContent: "center", color: "#b9a7ad", fontSize: 11, textAlign: "center", overflow: "hidden", background: "#241620", cursor: "pointer" }}>
            {garmentPreview ? <img src={garmentPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="g" /> : "单品\n图"}
          </div>
          <input ref={garmentRef} type="file" accept="image/*" onChange={onPickGarment} style={{ display: "none" }} />
          <button onClick={addUpload} disabled={!garmentFile || loading} style={{ ...goldBtn, opacity: !garmentFile ? .5 : 1 }}>＋ 把这张加进造型</button>
        </div>
      </section>

      {/* 模式 Tab（挑单品加入画布） */}
      <nav style={{ display: "flex", gap: 6, margin: "14px 0" }}>
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setMode(t.k)}
            style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", background: mode === t.k ? GOLD : "#33222f", color: mode === t.k ? "#1c111d" : "#d8c3c9" }}>
            {t.label}
          </button>
        ))}
      </nav>

      {err && <p style={{ color: "#e88", fontSize: 13, margin: "4px 0 10px" }}>{err}</p>}

      {loading && (
        <div style={{ background: GOLD_DIM, color: GOLD, fontSize: 13, padding: "10px 12px", borderRadius: 10, marginBottom: 10 }}>
          {loadingTitle || "正在把这件穿上…约 15 秒，请稍候"}
        </div>
      )}

      {/* 挑单品 */}
      {mode === "browse" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {products.map((p) => (
              <ProductCard key={p.id} p={p} onAdd={addFromShop} seasonName={seasonName} styleName={styleName} />
            ))}
          </div>
        </div>
      )}

      {/* 买手 */}
      {mode === "buyer" && (
        <div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
            {[...mainWomen, ...mainMen].map((m) => (
              <span key={m.code} onClick={() => setBuyerStyle(m.code)}
                style={{ fontSize: 12, padding: "6px 12px", borderRadius: 20, whiteSpace: "nowrap", cursor: "pointer", border: "1px solid #4a3840", background: buyerStyle === m.code ? GOLD : "transparent", color: buyerStyle === m.code ? "#1c111d" : "#d8c3c9" }}>
                {m.gender === "women" ? "女·" : "男·"}{m.name_zh} 买手
              </span>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {buyerProducts.map((p) => (
              <ProductCard key={p.id} p={p} onAdd={addFromShop} seasonName={seasonName} styleName={styleName} />
            ))}
          </div>
          {buyerProducts.length === 0 && <p style={{ color: "#8a7580", fontSize: 13 }}>该买手暂无匹配商品。</p>}
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
              <ProductCard key={p.id} p={p} onAdd={addFromShop} seasonName={seasonName} styleName={styleName} />
            ))}
          </div>
        </div>
      )}

      {/* 按风格生成 */}
      {mode === "auto" && (
        <div>
          <p style={{ fontSize: 13, color: "#b9a7ad" }}>基于你在「①」选择的季型与风格，点下方逐件把最匹配的单品穿上身。</p>
          {[...mainWomen, ...mainMen].map((m) => {
            const items = products.filter((p) => (p.styles || []).includes(m.code)).slice(0, 6);
            if (!items.length) return null;
            return (
              <div key={m.code} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "6px 0" }}>{m.gender === "women" ? "女" : "男"}·{m.name_zh} 风格</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {items.map((p) => <ProductCard key={p.id} p={p} onAdd={addFromShop} seasonName={seasonName} styleName={styleName} />)}
                </div>
              </div>
            );
          })}
          {lookCards.length === 0 && <p style={{ color: "#8a7580", fontSize: 13 }}>暂无足够商品，去「挑单品」手动加。</p>}
        </div>
      )}

      {/* 结果大图（点画布查看，这里再给一个浮层保存） */}
      {canvasUrl && (
        <button onClick={() => window.open(canvasUrl, "_blank")} style={{ ...goldBtn, width: "100%", marginTop: 14 }}>查看 / 保存最终造型大图 ↗</button>
      )}
    </main>
  );
}

const card: React.CSSProperties = { background: CARD, borderRadius: 12, border: "1px solid #3a2832", padding: 12 };
const goldBtn: React.CSSProperties = { padding: "10px 14px", borderRadius: 10, border: "none", background: GOLD, color: "#1c111d", fontWeight: 800, fontSize: 14, cursor: "pointer" };
const chip = (on: boolean, color?: string): React.CSSProperties => ({
  fontSize: 12, padding: "6px 12px", borderRadius: 20, whiteSpace: "nowrap", cursor: "pointer", border: "1px solid #4a3840",
  background: on ? (color || GOLD) : "transparent", color: on ? "#fff" : "#d8c3c9",
});

function ProductCard({ p, onAdd, seasonName, styleName }: {
  p: Product; onAdd: (p: Product) => void; seasonName: (c: string) => string; styleName: (c: string) => string;
}) {
  return (
    <div style={{ ...card, padding: 6 }}>
      <div style={{ position: "relative" }}>
        <img src={p.cover} style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 8 }} alt={p.title} />
      </div>
      <div style={{ fontSize: 11, color: "#e8dde0", marginTop: 4, lineHeight: 1.3, height: 28, overflow: "hidden" }}>{p.title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, margin: "4px 0" }}>
        {(p.seasons || []).slice(0, 2).map((s) => <span key={s} style={{ fontSize: 9, background: GOLD_DIM, color: GOLD, padding: "1px 5px", borderRadius: 6 }}>{seasonName(s)}</span>)}
        {(p.styles || []).slice(0, 1).map((s) => <span key={s} style={{ fontSize: 9, background: "#3a2f3a", color: "#cdd", padding: "1px 5px", borderRadius: 6 }}>{styleName(s)}</span>)}
      </div>
      <button onClick={() => onAdd(p)} style={{ width: "100%", padding: "8px 0", borderRadius: 8, border: "none", background: GOLD, color: "#1c111d", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>＋ 加这件</button>
    </div>
  );
}
