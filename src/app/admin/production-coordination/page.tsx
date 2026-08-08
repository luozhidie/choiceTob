"use client";

import { useState, useEffect } from "react";

export default function ProductionCoordinationPage() {
  const [form, setForm] = useState({
    title: "",
    season: "2026 春夏",
    productDesc: "",
    targetPrice: "",
    quantity: "",
    fabricPref: "",
    craftPref: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [source, setSource] = useState("");
  const [records, setRecords] = useState<any[]>([]);

  const loadRecords = async () => {
    try {
      const r = await fetch("/api/ai/production-coordination", { method: "GET" });
      const d = await r.json();
      if (d.records) setRecords(d.records);
    } catch {}
  };
  useEffect(() => { loadRecords(); }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const generate = async () => {
    if (!form.productDesc && !form.title) { alert("请填写商品描述或标题"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/ai/production-coordination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.error) { alert(d.error); return; }
      setResult(d.result);
      setSource(d.source);
      loadRecords();
    } catch (e: any) {
      alert("请求失败：" + (e.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>AI 生产协同</h1>
      <p style={{ color: "#888", marginBottom: 20, fontSize: 14 }}>
        将企划/选品结论转化为可直接对接生产/采购落地的方案（生产方式、面料工艺、成本、起订量、供应商标准、交接清单）。
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="标题"><input style={inp} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="如：通勤西装外套" /></Field>
        <Field label="季节"><input style={inp} value={form.season} onChange={(e) => set("season", e.target.value)} /></Field>
        <Field label="目标零售价(元)"><input style={inp} value={form.targetPrice} onChange={(e) => set("targetPrice", e.target.value)} placeholder="如 299" /></Field>
        <Field label="计划采购量(件)"><input style={inp} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="如 200" /></Field>
        <Field label="面料偏好"><input style={inp} value={form.fabricPref} onChange={(e) => set("fabricPref", e.target.value)} placeholder="如 羊毛混纺" /></Field>
        <Field label="工艺偏好"><input style={inp} value={form.craftPref} onChange={(e) => set("craftPref", e.target.value)} placeholder="如 归拔工艺" /></Field>
      </div>
      <Field label="商品描述 / 企划结论"><textarea style={{ ...inp, minHeight: 90 }} value={form.productDesc} onChange={(e) => set("productDesc", e.target.value)} placeholder="粘贴企划摘要、风格定位、核心卖点等" /></Field>
      <Field label="补充说明"><textarea style={{ ...inp, minHeight: 50 }} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>

      <button onClick={generate} disabled={loading}
        style={{ marginTop: 12, padding: "12px 28px", borderRadius: 10, border: "none", background: "#2d1b2e", color: "#fff", fontWeight: 700, fontSize: 15, opacity: loading ? 0.6 : 1 }}>
        {loading ? "生成中…" : "生成生产协同方案"}
      </button>

      {result && (
        <div style={{ marginTop: 24, background: "#faf8f6", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, color: source === "mock" ? "#c0392b" : "#2e7d32", marginBottom: 10 }}>
            来源：{source === "mock" ? "Mock（未配置 AI Key）" : "AI 生成"} · 生产协同方案
          </div>
          <Section title="概要">{result.summary}</Section>
          <Section title="推荐生产方式">{result.recommendedApproach?.mode} — {result.recommendedApproach?.reason}</Section>
          <ListBlock title="面料/工艺决策" items={result.fabricCraft?.map((x: any) => `${x.item}：${x.suggestion}（${x.reason}）`)} />
          <ListBlock title="成本拆分" items={result.costBreakdown?.map((x: any) => `${x.item}：${x.unitCost}（占售价 ${x.ratio}）`)} />
          <Section title="起订量/交期">最小起订量 {result.moqLeadTime?.moq} · 生产周期 {result.moqLeadTime?.leadTime} · 补货 {result.moqLeadTime?.reorderPoint}</Section>
          <ListBlock title="供应商筛选标准" items={result.supplierCriteria} />
          <ListBlock title="风险预警" items={result.riskWarnings?.map((x: any) => `[${x.level}] ${x.risk} → ${x.mitigation}`)} />
          <ListBlock title="交接清单" items={result.handoffChecklist?.map((x: any) => `${x.step}（${x.owner}）${x.note ? "：" + x.note : ""}`)} />
        </div>
      )}

      <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 32, marginBottom: 10 }}>已保存方案（{records.length}）</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {records.map((r) => (
          <div key={r.id} style={{ border: "1px solid #eee", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span>{r.title}</span>
            <span style={{ color: "#aaa" }}>{r.season} · {new Date(r.created_at).toLocaleString("zh-CN")}</span>
          </div>
        ))}
        {records.length === 0 && <span style={{ color: "#aaa", fontSize: 14 }}>暂无记录</span>}
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, marginTop: 6, boxSizing: "border-box",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#2d1b2e", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 14, lineHeight: 1.6 }}>{children as any}</div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#2d1b2e", marginBottom: 4 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7 }}>
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}
