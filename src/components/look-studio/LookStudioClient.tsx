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

const ACCESSORY_CATS = new Set(["shoes", "bag", "accessory"]);
const isAccessory = (cat?: string) => ACCESSORY_CATS.has(cat || "");

export default function LookStudioClient({ data }: Props) {
  const seasons = data.seasons || [];
  const styles = data.styles || [];
  const products = data.products || [];

  const seasonMap = useMemo(() => Object.fromEntries(seasons.map((s) => [s.code, s])), [seasons]);
  const styleMap = useMemo(() => Object.fromEntries(styles.map((s) => [s.code, s])), [styles]);
  const seasonColor = (code: string) => COLOR_SEASON_COLORS[code] || "#ccc";

  const mainWomen = styles.filter((s) => s.gender === "women" && s.is_main);
  const mainMen = styles.filter((s) => s.gender === "men" && s.is_main);

  // —— 版本：普通版 / 专业版 ——
  const [edition, setEdition] = useState<"basic" | "pro">("basic");

  // —— 我的形象 ——
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [mySeason, setMySeason] = useState<string>("");
  const [myStyle, setMyStyle] = useState<string>("");

  // —— 画布叠加 ——
  const [canvasUrl, setCanvasUrl] = useState<string>("");
  const [stack, setStack] = useState<StackItem[]>([]);
  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string>("");
  const garmentRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState("");
  const [err, setErr] = useState("");

  const seasonName = (c: string) => seasonMap[c]?.name_zh || c;
  const styleName = (c: string) => styleMap[c]?.name_zh || c;

  // 普通版：按分类筛选
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(set);
  }, [products]);

  const basicProducts = useMemo(() => {
    let list = products;
    if (category) list = list.filter((p) => p.category === category);
    return list;
  }, [products, category]);

  // 专业版：按季型(权重2)+风格(权重1)打分排序
  const score = (p: Product, sc: string[], st: string[]) =>
    (p.seasons || []).filter((x) => sc.includes(x)).length * 2
    + (p.styles || []).filter((x) => st.includes(x)).length * 1;

  const proProducts = useMemo(() => {
    const sc = mySeason ? [mySeason] : [];
    const st = myStyle ? [myStyle] : [];
    if (sc.length === 0 && st.length === 0) return products;
    // 专业版：全部商品都展示，匹配项按分数置顶并标「匹配」
    return [...products]
      .map((p) => ({ p, s: score(p, sc, st) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.p);
  }, [products, mySeason, myStyle]);

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
      setErr("请先上传你的照片");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      if (stack.length === 0) {
        if (!personFile) { setErr("请先上传你的照片"); setLoading(false); return; }
        fd.append("personImage", personFile);
      } else {
        fd.append("personImageUrl", canvasUrl);
      }
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

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 14, fontFamily: "system-ui, sans-serif", color: "#f3ece9", paddingBottom: 120, background: BG, minHeight: "100vh" }}>
      <header style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: 22, margin: 0, fontWeight: 800, color: "#fff" }}>云衣橱 · AI 虚拟试衣</h1>
        <p style={{ fontSize: 13, color: "#b9a7ad", margin: "4px 0 0" }}>
          一件件往上加：选好单品 → 点「＋加这件」，真人照上就会多出这件，叠到满意为止。
        </p>
      </header>

      {data.error && <p style={{ color: "#e88", fontSize: 13 }}>数据加载异常：{data.error}</p>}

      {/* 版本切换 */}
      <nav style={{ display: "flex", gap: 6, margin: "12px 0" }}>
        {([["basic", "普通版"], ["pro", "专业版"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setEdition(k)}
            style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", background: edition === k ? GOLD : "#33222f", color: edition === k ? "#1c111d" : "#d8c3c9" }}>
            {label}
          </button>
        ))}
      </nav>
      <p style={{ fontSize: 11, color: "#8a7580", margin: "0 0 10px", lineHeight: 1.5 }}>
        普通版 = 按分类挑单品试穿；专业版 = 按你的色彩季型 / 穿衣风格智能排序推荐。两者次数独立，普通套餐不含专业版次数。
      </p>

      {/* ① 上传真人照 */}
      <section style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#fff" }}>① 上传你的照片（第 1 件试穿对象）</div>
        <p style={{ fontSize: 11, color: "#8a7580", margin: "0 0 8px", lineHeight: 1.5 }}>建议上传「仅穿贴身内搭 / 低领单品」的正脸半身照。原衣露在领口、袖口的部分会明显残留，换成低领 / 打底基底后干净很多；原图越清晰，叠穿也越不易丢细节。</p>
        <div style={{ display: "flex", gap: 12 }}>
          <div onClick={() => fileRef.current?.click()} style={{ width: 72, height: 96, borderRadius: 10, border: "1.5px dashed #6b5560", display: "flex", alignItems: "center", justifyContent: "center", color: "#b9a7ad", fontSize: 12, textAlign: "center", overflow: "hidden", background: "#241620", cursor: "pointer", flexShrink: 0 }}>
            {personPreview ? <img src={personPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="me" /> : "上传\n照片"}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickPerson} style={{ display: "none" }} />

          {/* 专业版才显示季型 + 风格 */}
          {edition === "pro" ? (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "#b9a7ad", marginBottom: 4 }}>我的色彩季型</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {seasons.map((s) => (
                  <span key={s.code} onClick={() => setMySeason(s.code)}
                    style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, cursor: "pointer", border: "1px solid #4a3840", background: mySeason === s.code ? seasonColor(s.code) : "transparent", color: mySeason === s.code ? "#fff" : "#cbb" }}>
                    {s.name_zh}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "#b9a7ad", margin: "8px 0 4px" }}>我的穿衣风格（主风格）</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {[...mainWomen, ...mainMen].map((m) => (
                  <span key={m.code} onClick={() => setMyStyle(m.code)}
                    style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, cursor: "pointer", border: "1px solid #4a3840", background: myStyle === m.code ? GOLD : "transparent", color: myStyle === m.code ? "#1c111d" : "#cbb" }}>
                    {m.gender === "women" ? "女" : "男"}·{m.name_zh}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", fontSize: 12, color: "#8a7580", lineHeight: 1.5 }}>
              上传后直接在下方挑单品试穿。<br />（想按季型/风格智能选款，切换到「专业版」）
            </div>
          )}
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
        {stack.length > 0 && (
          <p style={{ fontSize: 11, color: "#8a7580", margin: "10px 0 0", lineHeight: 1.5 }}>若领口 / 袖口还残留原衣服，多半是原图穿了高领或叠穿——点「清空重来」，换张低领 / 贴身内搭的基底照即可解决。</p>
        )}
      </section>

      {/* ③ 上传我的单品图 */}
      <section style={{ ...card, marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 6 }}>③ 上传我自己的单品图（可选）</div>
        <p style={{ fontSize: 11, color: "#8a7580", margin: "0 0 8px", lineHeight: 1.5 }}>衣服平铺 / 挂拍效果最佳；鞋 · 包 · 配饰为 AI 创意合成，比例位置仅供参考。</p>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div onClick={() => garmentRef.current?.click()} style={{ width: 60, height: 60, borderRadius: 8, border: "1.5px dashed #6b5560", display: "flex", alignItems: "center", justifyContent: "center", color: "#b9a7ad", fontSize: 11, textAlign: "center", overflow: "hidden", background: "#241620", cursor: "pointer" }}>
            {garmentPreview ? <img src={garmentPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="g" /> : "单品\n图"}
          </div>
          <input ref={garmentRef} type="file" accept="image/*" onChange={onPickGarment} style={{ display: "none" }} />
          <button onClick={addUpload} disabled={!garmentFile || loading} style={{ ...goldBtn, opacity: !garmentFile ? .5 : 1 }}>＋ 把这张加进造型</button>
        </div>
      </section>

      {/* ④ 挑单品 / 智能推荐 */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "16px 0 8px" }}>
        {edition === "basic" ? "④ 挑单品试穿" : "④ 按我的季型 + 风格 · 智能推荐"}
      </div>
      <p style={{ fontSize: 11, color: "#8a7580", margin: "0 0 10px", lineHeight: 1.5 }}>鞋 · 包 · 配饰由 AI 创意合成，比例位置仅供参考，效果可能不如服装稳定。</p>

      {err && <p style={{ color: "#e88", fontSize: 13, margin: "4px 0 10px" }}>{err}</p>}

      {loading && (
        <div style={{ background: GOLD_DIM, color: GOLD, fontSize: 13, padding: "10px 12px", borderRadius: 10, marginBottom: 10 }}>
          {loadingTitle || "正在把这件穿上…约 15 秒，请稍候"}
        </div>
      )}

      {/* 普通版：分类筛选 + 全部单品 */}
      {edition === "basic" && (
        <div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
            <span onClick={() => setCategory("")} style={chip(category === "")}>全部</span>
            {categories.map((c) => (
              <span key={c} onClick={() => setCategory(c)} style={chip(category === c)}>{c}</span>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {basicProducts.map((p) => (
              <ProductCard key={p.id} p={p} onAdd={addFromShop} seasonName={seasonName} styleName={styleName} />
            ))}
          </div>
        </div>
      )}

      {/* 专业版：按季型+风格推荐排序 */}
      {edition === "pro" && (
        <div>
          {(!mySeason && !myStyle) && (
            <p style={{ fontSize: 13, color: "#b9a7ad", margin: "0 0 10px" }}>在「①」选好你的季型与风格，这里会自动把最匹配的单品排到前面。</p>
          )}
          {proProducts.length > 0 && mySeason === '' && myStyle === '' && (
            <p style={{ fontSize: 12, color: "#8a7580", margin: "0 0 10px", lineHeight: 1.5 }}>已按全部单品展示。在「①」选好季型/风格后，最匹配的会排在前面并标「匹配」。</p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {proProducts.map((p) => (
              <ProductCard key={p.id} p={p} onAdd={addFromShop} seasonName={seasonName} styleName={styleName} matched={edition === "pro" && ((p.seasons || []).includes(mySeason) || (p.styles || []).includes(myStyle))} />
            ))}
          </div>
        </div>
      )}

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

function ProductCard({ p, onAdd, seasonName, styleName, matched }: {
  p: Product; onAdd: (p: Product) => void; seasonName: (c: string) => string; styleName: (c: string) => string; matched?: boolean;
}) {
  return (
    <div style={{ ...card, padding: 6, borderColor: matched ? GOLD : "#3a2832" }}>
      <div style={{ position: "relative" }}>
        <img src={p.cover} style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 8 }} alt={p.title} />
        {matched && <span style={{ position: "absolute", top: 4, right: 4, background: GOLD, color: "#1c111d", fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 6 }}>匹配</span>}
        {isAccessory(p.category) && <span style={{ position: "absolute", top: 4, left: 4, background: "rgba(255,255,255,.18)", color: "#e8dde0", fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 6 }}>AI 示意</span>}
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
