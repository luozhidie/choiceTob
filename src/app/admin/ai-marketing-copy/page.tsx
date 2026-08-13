"use client";

import { useState, useEffect } from "react";
import { Sparkles, Copy, Check, Save, Loader2, Megaphone, Trash2 } from "lucide-react";

const PLATFORMS = [
  { value: "wechat", label: "朋友圈" },
  { value: "xiaohongshu", label: "小红书" },
  { value: "douyin", label: "抖音" },
  { value: "group", label: "社群/团购" },
];

const TONES = [
  { value: "爆款", label: "爆款促销" },
  { value: "温柔", label: "温柔种草" },
  { value: "高级", label: "高级感" },
  { value: "促销", label: "限时促销" },
];

export default function AIMarketingCopyPage() {
  const [form, setForm] = useState({
    title: "",
    productDesc: "",
    keywords: "",
    imageUrl: "",
    platform: "wechat",
    tone: "爆款",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const loadRecords = async () => {
    try {
      const r = await fetch("/api/ai/marketing-copy", { credentials: "include" });
      const d = await r.json();
      if (d.records) setRecords(d.records);
    } catch {}
  };
  useEffect(() => { loadRecords(); }, []);

  const generate = async () => {
    if (!form.title) { alert("请输入商品标题"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/ai/marketing-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.error) { alert(d.error); return; }
      setResult(d.result);
      loadRecords();
    } catch (e: any) {
      alert("请求失败：" + (e.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  const deleteRecord = async (id: string) => {
    if (!confirm("删除这条文案？")) return;
    try {
      await fetch("/api/admin/common/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, table: "ai_marketing_copies" }),
      });
      loadRecords();
    } catch {}
  };

  const section = (label: string, text: string, key: string) => (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-primary">{label}</span>
        <button onClick={() => copy(text, key)} className="text-xs flex items-center gap-1 text-accent hover:underline">
          {copied === key ? <><Check className="w-3 h-3" />已复制</> : <><Copy className="w-3 h-3" />复制</>}
        </button>
      </div>
      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{text}</div>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1 className="text-2xl font-bold text-primary mb-1 flex items-center gap-2"><Megaphone className="w-6 h-6 text-accent" /> AI 爆款文案</h1>
      <p className="text-sm text-muted-foreground mb-6">输入商品标题和描述，一键生成朋友圈、小红书、抖音、社群文案。图你可以去 APP 生成，文案交给我。</p>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-primary mb-2">商品标题 <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="如：法式碎花茶歇连衣裙 收腰显瘦" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-primary mb-2">商品描述 / 卖点</label>
            <textarea value={form.productDesc} onChange={(e) => setForm({ ...form, productDesc: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none" placeholder="面料、版型、适合人群、场合等" />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">关键词</label>
            <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="碎花、连衣裙、显瘦、通勤" />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">参考图片 URL（可选）</label>
            <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">目标平台</label>
            <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent">
              {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">文案风格</label>
            <select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent">
              {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-5">
          <button onClick={generate} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />生成中...</> : <><Sparkles className="w-4 h-4" />生成文案</>}
          </button>
        </div>
      </div>

      {result && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><Save className="w-4 h-4" /> 生成结果</h2>
          {section("优化标题", result.titleOptimized, "title")}
          {section("图片配文", result.imageCaption, "caption")}
          {result.bulletPoints && section("卖点", (result.bulletPoints || []).join("\n"), "bullets")}
          {section("朋友圈文案", result.friendCircle, "friend")}
          {section("社群/团购文案", result.groupCopy, "group")}
          {result.hashtags && section("话题标签", (result.hashtags || []).join(" "), "hashtags")}
          {result.priceLine && section("价格话术", result.priceLine, "price")}
          {result.cta && section("行动号召", result.cta, "cta")}
        </div>
      )}

      {records.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-primary mb-4">历史文案</h2>
          <div className="space-y-3">
            {records.slice(0, 10).map((r) => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary">{r.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("zh-CN")}</span>
                    <button onClick={() => deleteRecord(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="text-sm text-gray-700 line-clamp-2">{(r.result_json?.friendCircle || r.result_json?.imageCaption || "")}</div>
                <button onClick={() => setResult(r.result_json)} className="text-xs text-accent hover:underline mt-2">查看完整结果</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
