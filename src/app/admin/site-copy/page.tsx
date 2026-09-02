"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, RefreshCw, Type, Palette, CreditCard, Home } from "lucide-react";

interface HomeCopy {
  tagline: string;
  title: string;
  subtitle: string;
  taglineColor: string;
  titleColor: string;
  subtitleColor: string;
}

interface MemberBenefit {
  icon: string;
  label: string;
}

interface MemberCardCopy {
  desc: string;
  nextTierText: string;
  footText: string;
  agentCtaText: string;
  priceEntryText: string;
  benefits: MemberBenefit[];
}

const DEFAULT_HOME: HomeCopy = {
  tagline: "数据趋动·智选未来",
  title: "骆芷蝶·智选｜供应链管理平台",
  subtitle: "服装门店线上服务平台",
  taglineColor: "#C9A24B",
  titleColor: "#2d1b2e",
  subtitleColor: "#666666",
};

const DEFAULT_MEMBER_CARD: MemberCardCopy = {
  desc: "认证即享会员价，购买专业版 ¥998 解锁更高会员折扣",
  nextTierText: "¥998 专业版 · 一件代发",
  footText: "专业版 ¥998 · 一件代发 · 批量拿货价格更低",
  agentCtaText: "¥998 开通专业版，一件代发，批量拿货价格更低",
  priceEntryText: "充值解锁退换额度 + 更高会员折扣",
  benefits: [
    { icon: "🏷️", label: "会员价" },
    { icon: "🔄", label: "会员折扣" },
    { icon: "🎟️", label: "新款抢先" },
    { icon: "⚡", label: "精准推荐" },
  ],
};

export default function AdminSiteCopyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [homeCopy, setHomeCopy] = useState<HomeCopy>(DEFAULT_HOME);
  const [memberCardCopy, setMemberCardCopy] = useState<MemberCardCopy>(DEFAULT_MEMBER_CARD);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/public/settings?keys=home_copy,member_card_copy");
      const json = await res.json();
      const d = json.data || {};
      if (d.home_copy) setHomeCopy({ ...DEFAULT_HOME, ...d.home_copy });
      if (d.member_card_copy) setMemberCardCopy({ ...DEFAULT_MEMBER_CARD, ...d.member_card_copy });
    } catch (e: any) {
      showToast("error", "加载失败：" + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveOne(key: string, value: any) {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || "保存失败");
    }
  }

  async function saveAll() {
    setSaving(true);
    try {
      await saveOne("home_copy", homeCopy);
      await saveOne("member_card_copy", memberCardCopy);
      showToast("success", "已保存，小程序和网站实时生效");
    } catch (e: any) {
      showToast("error", "保存失败：" + e.message);
    } finally {
      setSaving(false);
    }
  }

  function updateHome(patch: Partial<HomeCopy>) {
    setHomeCopy((prev) => ({ ...prev, ...patch }));
  }

  function updateBenefit(i: number, patch: Partial<MemberBenefit>) {
    setMemberCardCopy((prev) => ({
      ...prev,
      benefits: prev.benefits.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
    }));
  }

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-accent mb-4" />
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-primary" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">站点文案</h1>
          <p className="text-sm text-muted-foreground mt-1">
            首页标题、登录页标题、会员卡片文案，改完小程序和网站实时生效
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAll} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-white border border-border rounded-lg hover:bg-muted transition-colors">
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
          <button
            onClick={saveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-accent rounded-lg hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存全部
          </button>
        </div>
      </div>

      {/* 首页 / 登录页标题区 */}
      <Section icon={Home} title="首页 & 登录页标题" desc="小程序首页顶部、登录页大标题共用同一份配置">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="小标签（如：数据趋动·智选未来）">
            <input value={homeCopy.tagline} onChange={(e) => updateHome({ tagline: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border" />
          </Field>
          <ColorField label="小标签颜色" value={homeCopy.taglineColor} onChange={(v) => updateHome({ taglineColor: v })} />
          <Field label="大标题（如：骆芷蝶·智选｜供应链管理平台）">
            <input value={homeCopy.title} onChange={(e) => updateHome({ title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border" />
          </Field>
          <ColorField label="大标题颜色" value={homeCopy.titleColor} onChange={(v) => updateHome({ titleColor: v })} />
          <Field label="副标题（如：服装门店线上服务平台）">
            <input value={homeCopy.subtitle} onChange={(e) => updateHome({ subtitle: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border" />
          </Field>
          <ColorField label="副标题颜色" value={homeCopy.subtitleColor} onChange={(v) => updateHome({ subtitleColor: v })} />
        </div>
      </Section>

      {/* 会员卡片 */}
      <Section icon={CreditCard} title="会员卡片文案" desc="「我的」页已认证会员卡片的全部文案">
        <div className="space-y-4">
          <Field label="卡片说明">
            <input value={memberCardCopy.desc} onChange={(e) => setMemberCardCopy((p) => ({ ...p, desc: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border" />
          </Field>
          <Field label="进度条右侧文案（如：¥998 专业版 · 一件代发）">
            <input value={memberCardCopy.nextTierText} onChange={(e) => setMemberCardCopy((p) => ({ ...p, nextTierText: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border" />
          </Field>
          <Field label="卡片底部文案">
            <input value={memberCardCopy.footText} onChange={(e) => setMemberCardCopy((p) => ({ ...p, footText: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border" />
          </Field>
          <Field label="开通按钮文案">
            <input value={memberCardCopy.agentCtaText} onChange={(e) => setMemberCardCopy((p) => ({ ...p, agentCtaText: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border" />
          </Field>
          <Field label="充值入口文案">
            <input value={memberCardCopy.priceEntryText} onChange={(e) => setMemberCardCopy((p) => ({ ...p, priceEntryText: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border" />
          </Field>

          <div className="pt-2">
            <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" /> 四个权益标签
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {memberCardCopy.benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-xl border border-border bg-white">
                  <input value={b.icon} onChange={(e) => updateBenefit(i, { icon: e.target.value })} className="w-14 px-2 py-2 text-center rounded-lg border border-border" title="图标/emoji" />
                  <input value={b.label} onChange={(e) => updateBenefit(i, { label: e.target.value })} className="flex-1 px-3 py-2 rounded-lg border border-border" placeholder="标签文字" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, desc, children }: { icon: any; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="fashion-card p-6 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-5 h-5 text-accent" />
        <h3 className="font-bold text-primary text-base">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{desc}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 p-0 border-0 rounded-lg overflow-hidden cursor-pointer" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-border font-mono text-xs" />
      </div>
    </label>
  );
}
