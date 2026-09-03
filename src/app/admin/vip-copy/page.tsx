"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, RefreshCw, Home, CreditCard, Plus, Trash2, Package, Globe } from "lucide-react";
import { DEFAULT_WEB_PAGE_COPY, type WebPageCopy } from "@/lib/web-copy";

interface VipHero { title: string; subtitle: string; }
interface VipGuideSection { title: string; subtitle: string; }
interface VipTryonCard { icon: string; inactiveIcon: string; nameActive: string; nameInactive: string; sub: string; features: string[]; btnActive: string; btnInactive: string; }
interface VipDepositCard { icon: string; name: string; sub: string; features: string[]; btn: string; }
interface VipAgentCenter { tag: string; title: string; descActive: string; descInactive: string; btnActive: string; btnInactive: string; }
interface VipTryonHeader { title: string; sub: string; }
interface VipPlan { id: string; name: string; priceLabel: string; discountLabel: string; features: string[]; example: string; tryonTip?: string; btn?: string; highlight: boolean; }
interface VipDepositHeader { title: string; sub: string; }
interface VipPayModal { title: string; tip: string; advisorLabel: string; copyBtn: string; copyDialogTitle: string; copyDialogContent: string; }
interface VipCopy {
  hero: VipHero;
  guideSection: VipGuideSection;
  tryonCard: VipTryonCard;
  depositCard: VipDepositCard;
  agentCenter: VipAgentCenter;
  tryonHeader: VipTryonHeader;
  tryonPlan: VipPlan;
  depositHeader: VipDepositHeader;
  depositPlanBtn: string;
  depositPlans: VipPlan[];
  payModal: VipPayModal;
  advisorWx: string;
}

interface DepositHeader { title: string; subtitle: string; }
interface DepositStatus { activeMain: string; activeSub: string; inactiveMain: string; inactiveSub: string; }
interface DepositAgentEntry { title: string; descActive: string; descInactive: string; btnActive: string; btnInactive: string; }
interface DepositPlansHeader { title: string; sub: string; }
interface DepositPlan { id: string; name: string; amountLabel: string; discount: string; refund: number; example: string; tryonTip?: string; isTest: boolean; }
interface DepositAmountLabels { pay: string; deposit: string; noRefund: string; }
interface DepositTips { tip: string; contactPrefix: string; contactLink: string; }
interface DepositPayModal { title: string; payTip: string; copyDialogTitle: string; advisorLabel: string; copyBtn: string; }
interface DepositAgreement { title: string; agreeBtn: string; cancelBtn: string; }
interface DepositContactDialog { title: string; content: string; confirmText: string; }
interface DepositCopy {
  header: DepositHeader;
  status: DepositStatus;
  agentEntry: DepositAgentEntry;
  plansHeader: DepositPlansHeader;
  plans: DepositPlan[];
  amountLabels: DepositAmountLabels;
  tips: DepositTips;
  payModal: DepositPayModal;
  agreement: DepositAgreement;
  contactDialog: DepositContactDialog;
  advisorWx: string;
}

const DEFAULT_VIP: VipCopy = {
  hero: { title: "骆芷蝶 · VIP会员", subtitle: "企划定品控方向，严选稳货源" },
  guideSection: { title: "两种会员方式", subtitle: "认证会员可先看会员价；会员折扣与退换额度按所选赛道生效" },
  tryonCard: { icon: "试", inactiveIcon: "代", nameActive: "虚拟试衣会员", nameInactive: "成为合作代理", sub: "¥998 开通 · 享会员店铺专属价与权益", features: ["单件发货 3.3 折", "满 5 件 2.8 折", "赠 100 次专属额度"], btnActive: "继续使用 ›", btnInactive: "立即开通 ↓" },
  depositCard: { icon: "充", name: "预存货款会员", sub: "充值即同时享折扣+退换额度", features: ["退换额度", "会员折扣", "优先发货"], btn: "选套餐 ↓" },
  agentCenter: { tag: "AGENT", title: "权益中心", descActive: "已开通会员店铺 · 享专属价 · 分享搭配", descInactive: "购买 ¥998 专业版或充值货款，即可开通会员店铺享专属价", btnActive: "进入 ›", btnInactive: "去开通 ›" },
  tryonHeader: { title: "虚拟试衣会员", sub: "¥998 开通 · 无需预存" },
  tryonPlan: { id: "tryon_pro_998", name: "虚拟试衣会员·¥998", priceLabel: "购买 ¥998", discountLabel: "3.3折起", features: ["单件3.3折", "满5件2.8折", "赠专业版100次", "无需预存"], example: "", btn: "立即开通", highlight: true },
  depositHeader: { title: "充值会员套餐", sub: "充值即得 折扣权 + 退换额度" },
  depositPlanBtn: "立即充值",
  depositPlans: [
    { id: "wholesale_6k", name: "会员·首充6000", priceLabel: "充值 ¥6,000", discountLabel: "2.8折", features: ["同色同款三件起购", "会员折扣2.8折", "无退换额度", "小批量试购"], example: "原价¥100 → ¥28 + 赠专业试衣100次", tryonTip: "充值¥6000将自动扣除¥998专业版试衣费，剩余¥5002计入预存货款（仅用于选购，不退现）", highlight: false },
    { id: "wholesale_5w", name: "充值会员·5万", priceLabel: "充值 ¥50,000", discountLabel: "2.8折", features: ["同色同款三件起购", "会员折扣2.8折", "退换额度5%", "优先发货权"], example: "原价¥100 → ¥28", highlight: false },
    { id: "wholesale_10w", name: "充值会员·10万", priceLabel: "充值 ¥100,000", discountLabel: "2.8折", features: ["同色同款三件起购", "会员折扣2.8折", "退换额度10%", "优先发货权", "专属配货师"], example: "原价¥100 → ¥28", highlight: true },
    { id: "wholesale_30w", name: "充值会员·30万", priceLabel: "充值 ¥300,000", discountLabel: "2.6折", features: ["同色同款三件起购", "会员折扣2.6折", "退换额度20%", "优先发货权", "专属配货师", "专属服务支持"], example: "原价¥100 → ¥26", highlight: true },
  ],
  payModal: { title: "联系顾问充值", tip: "预存货款为线下对公入账，由顾问确认后开通", advisorLabel: "顾问微信", copyBtn: "复制微信号", copyDialogTitle: "已复制微信号", copyDialogContent: "请在微信中搜索添加顾问 {advisorWx}，发送「充值 + 套餐名」，顾问确认到账后立即为你开通权益。" },
  advisorWx: "luozhidie666",
};

const DEFAULT_DEPOSIT: DepositCopy = {
  header: { title: "📦 预存货款 · 折扣选购", subtitle: "预存越多，折扣越低。预存款可用于采购下单，随时退。" },
  status: { activeMain: "已激活：预存 ¥{depositText}", activeSub: "选购 {discountText} 折 · 可退 {returnText}%", inactiveMain: "未开通预存货款会员", inactiveSub: "充值后即可享受会员折扣价" },
  agentEntry: { title: "代理中心", descActive: "已开通会员店铺 · 去设置专属价、分享搭配", descInactive: "充值后自动开通会员店铺，享专属价", btnActive: "进入 ›", btnInactive: "去开通 ›" },
  plansHeader: { title: "充值会员套餐", sub: "充值即得 折扣权 + 退换额度" },
  plans: [
    { id: "agent_test_cent", name: "链路测试", amountLabel: "¥0.01", discount: "2.8折", refund: 5, example: "验证充值到账", isTest: true },
    { id: "wholesale_6k", name: "会员·首充6000", amountLabel: "¥6,000", discount: "2.8折", refund: 0, example: "原价¥100 → ¥28 + 赠专业试衣100次", tryonTip: "充值¥6000将自动扣除¥998专业版试衣费，剩余¥5002计入预存货款（仅用于选购，不退现）", isTest: false },
    { id: "wholesale_5w", name: "充值会员·5万", amountLabel: "¥50,000", discount: "2.8折", refund: 5, example: "原价¥100 → ¥28", isTest: false },
    { id: "wholesale_10w", name: "充值会员·10万", amountLabel: "¥100,000", discount: "2.8折", refund: 10, example: "原价¥100 → ¥28", isTest: false },
    { id: "wholesale_30w", name: "充值会员·30万", amountLabel: "¥300,000", discount: "2.6折", refund: 20, example: "原价¥100 → ¥26", isTest: false },
  ],
  amountLabels: { pay: "支付金额", deposit: "预存金额", noRefund: "不退现" },
  tips: { tip: "💡 预存货款仅用于本店选购，不退现；已享折扣的已消费部分不退。详情请联系客服", contactPrefix: "如有疑问或需要帮助，请", contactLink: "联系客服" },
  payModal: { title: "联系顾问充值", payTip: "预存货款为线下对公入账，需由顾问确认后开通。添加顾问微信后发送「充值 + 套餐名」，到账后 5 分钟内自动开通权益。", copyDialogTitle: "已复制微信号", advisorLabel: "顾问微信", copyBtn: "复制微信号" },
  agreement: { title: "请阅读并签署《预充货款协议》", agreeBtn: "我已阅读并同意签署", cancelBtn: "暂不开通" },
  contactDialog: { title: "联系客服", content: "微信：{advisorWx}\n工作时间 9:00-18:00", confirmText: "知道了" },
  advisorWx: "luozhidie666",
};

export default function AdminVipCopyPage() {
  const [tab, setTab] = useState<"vip" | "deposit" | "web">("vip");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [vipCopy, setVipCopy] = useState<VipCopy>(DEFAULT_VIP);
  const [depositCopy, setDepositCopy] = useState<DepositCopy>(DEFAULT_DEPOSIT);
  const [webCopy, setWebCopy] = useState<WebPageCopy>(DEFAULT_WEB_PAGE_COPY);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/public/settings?keys=vip_page_copy,deposit_page_copy,web_page_copy");
      const json = await res.json();
      const d = json.data || {};
      if (d.vip_page_copy) setVipCopy({ ...DEFAULT_VIP, ...d.vip_page_copy });
      if (d.deposit_page_copy) setDepositCopy({ ...DEFAULT_DEPOSIT, ...d.deposit_page_copy });
      if (d.web_page_copy) setWebCopy({ ...DEFAULT_WEB_PAGE_COPY, ...d.web_page_copy });
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
      await saveOne("vip_page_copy", vipCopy);
      await saveOne("deposit_page_copy", depositCopy);
      await saveOne("web_page_copy", webCopy);
      showToast("success", "已保存，小程序和网站实时生效");
    } catch (e: any) {
      showToast("error", "保存失败：" + e.message);
    } finally {
      setSaving(false);
    }
  }

  function updateVip(path: string, value: any) {
    setVipCopy((prev) => setPath({ ...prev }, path, value));
  }

  function updateDeposit(path: string, value: any) {
    setDepositCopy((prev) => setPath({ ...prev }, path, value));
  }

  function updateWeb(path: string, value: any) {
    setWebCopy((prev) => setPath({ ...prev }, path, value));
  }

  function updateVipFeature(planKey: "tryonPlan" | undefined, index: number, value: string) {
    setVipCopy((prev) => {
      const next = { ...prev };
      if (planKey) {
        next.tryonPlan = { ...next.tryonPlan, features: next.tryonPlan.features.map((f, i) => (i === index ? value : f)) };
      }
      return next;
    });
  }

  function updateDepositFeature(index: number, value: string) {
    setDepositCopy((prev) => {
      const next = { ...prev };
      next.plans = next.plans.map((p, i) => (i === index ? { ...p, example: value } : p));
      return next;
    });
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

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">会员充值文案</h1>
          <p className="text-sm text-muted-foreground mt-1">VIP 页、充值页、代理招募页文案，改完小程序和网站实时生效</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAll} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-white border border-border rounded-lg hover:bg-muted transition-colors">
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
          <button onClick={saveAll} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-accent rounded-lg hover:brightness-110 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存全部
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(["vip", "deposit", "web"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-accent text-white" : "bg-white text-primary border border-border hover:bg-muted"}`}>
            {t === "vip" ? "VIP 页文案" : t === "deposit" ? "充值页文案" : "网站文案"}
          </button>
        ))}
      </div>

      {tab === "vip" ? (
        <div className="space-y-6">
          <Section icon={Home} title="页面 Hero" desc="小程序 VIP 页顶部标题">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="主标题"><input value={vipCopy.hero.title} onChange={(e) => updateVip("hero.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="副标题"><input value={vipCopy.hero.subtitle} onChange={(e) => updateVip("hero.subtitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            </div>
          </Section>

          <Section icon={CreditCard} title="两种会员方式" desc="顶部引导区标题与两张会员卡">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="区标题"><input value={vipCopy.guideSection.title} onChange={(e) => updateVip("guideSection.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="区副标题"><input value={vipCopy.guideSection.subtitle} onChange={(e) => updateVip("guideSection.subtitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-white space-y-3">
                  <h4 className="text-sm font-semibold text-primary">虚拟试衣 / 代理卡</h4>
                  <Field label="图标"><input value={vipCopy.tryonCard.icon} onChange={(e) => updateVip("tryonCard.icon", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                  <Field label="已开通名称"><input value={vipCopy.tryonCard.nameActive} onChange={(e) => updateVip("tryonCard.nameActive", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                  <Field label="未开通名称"><input value={vipCopy.tryonCard.nameInactive} onChange={(e) => updateVip("tryonCard.nameInactive", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                  <Field label="副文案"><input value={vipCopy.tryonCard.sub} onChange={(e) => updateVip("tryonCard.sub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                  <Field label="已开通按钮"><input value={vipCopy.tryonCard.btnActive} onChange={(e) => updateVip("tryonCard.btnActive", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                  <Field label="未开通按钮"><input value={vipCopy.tryonCard.btnInactive} onChange={(e) => updateVip("tryonCard.btnInactive", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                  <FeatureList value={vipCopy.tryonCard.features} onChange={(v) => updateVip("tryonCard.features", v)} />
                </div>
                <div className="p-4 rounded-xl border border-border bg-white space-y-3">
                  <h4 className="text-sm font-semibold text-primary">预存货款卡</h4>
                  <Field label="图标"><input value={vipCopy.depositCard.icon} onChange={(e) => updateVip("depositCard.icon", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                  <Field label="名称"><input value={vipCopy.depositCard.name} onChange={(e) => updateVip("depositCard.name", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                  <Field label="副文案"><input value={vipCopy.depositCard.sub} onChange={(e) => updateVip("depositCard.sub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                  <Field label="按钮"><input value={vipCopy.depositCard.btn} onChange={(e) => updateVip("depositCard.btn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                  <FeatureList value={vipCopy.depositCard.features} onChange={(v) => updateVip("depositCard.features", v)} />
                </div>
              </div>
            </div>
          </Section>

          <Section icon={Package} title="权益中心 & 998 试衣" desc="权益中心入口与 998 试衣套餐">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-white space-y-3">
                <h4 className="text-sm font-semibold text-primary">权益中心</h4>
                <Field label="标签"><input value={vipCopy.agentCenter.tag} onChange={(e) => updateVip("agentCenter.tag", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="标题"><input value={vipCopy.agentCenter.title} onChange={(e) => updateVip("agentCenter.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="已开通描述"><input value={vipCopy.agentCenter.descActive} onChange={(e) => updateVip("agentCenter.descActive", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="未开通描述"><input value={vipCopy.agentCenter.descInactive} onChange={(e) => updateVip("agentCenter.descInactive", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="已开通按钮"><input value={vipCopy.agentCenter.btnActive} onChange={(e) => updateVip("agentCenter.btnActive", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="未开通按钮"><input value={vipCopy.agentCenter.btnInactive} onChange={(e) => updateVip("agentCenter.btnInactive", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              </div>
              <div className="p-4 rounded-xl border border-border bg-white space-y-3">
                <h4 className="text-sm font-semibold text-primary">998 试衣会员</h4>
                <Field label="区标题"><input value={vipCopy.tryonHeader.title} onChange={(e) => updateVip("tryonHeader.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="区副标题"><input value={vipCopy.tryonHeader.sub} onChange={(e) => updateVip("tryonHeader.sub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="套餐名称"><input value={vipCopy.tryonPlan.name} onChange={(e) => updateVip("tryonPlan.name", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="价格标签"><input value={vipCopy.tryonPlan.priceLabel} onChange={(e) => updateVip("tryonPlan.priceLabel", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="折扣标签"><input value={vipCopy.tryonPlan.discountLabel} onChange={(e) => updateVip("tryonPlan.discountLabel", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <FeatureList value={vipCopy.tryonPlan.features} onChange={(v) => updateVip("tryonPlan.features", v)} />
              </div>
            </div>
          </Section>

          <Section icon={CreditCard} title="充值会员套餐" desc="VIP 页下方四个预存货款档位">
            <Field label="区标题"><input value={vipCopy.depositHeader.title} onChange={(e) => updateVip("depositHeader.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border mb-3" /></Field>
            <Field label="区副标题"><input value={vipCopy.depositHeader.sub} onChange={(e) => updateVip("depositHeader.sub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border mb-4" /></Field>
            <PlanEditor plans={vipCopy.depositPlans} onChange={(v) => updateVip("depositPlans", v)} />
          </Section>

          <Section icon={CreditCard} title="支付弹窗 & 顾问微信" desc="弹窗文案与复制微信号内容">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="弹窗标题"><input value={vipCopy.payModal.title} onChange={(e) => updateVip("payModal.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="顾问微信号"><input value={vipCopy.advisorWx} onChange={(e) => updateVip("advisorWx", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="提示文案"><input value={vipCopy.payModal.tip} onChange={(e) => updateVip("payModal.tip", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="顾问标签"><input value={vipCopy.payModal.advisorLabel} onChange={(e) => updateVip("payModal.advisorLabel", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="复制按钮"><input value={vipCopy.payModal.copyBtn} onChange={(e) => updateVip("payModal.copyBtn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="复制成功弹窗标题"><input value={vipCopy.payModal.copyDialogTitle} onChange={(e) => updateVip("payModal.copyDialogTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="复制成功弹窗内容（可用 {advisorWx} 占位）"><textarea value={vipCopy.payModal.copyDialogContent} onChange={(e) => updateVip("payModal.copyDialogContent", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border md:col-span-2 h-20" /></Field>
            </div>
          </Section>
        </div>
      ) : (
        <div className="space-y-6">
          <Section icon={Home} title="页面标题区" desc="小程序充值页顶部">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="主标题"><input value={depositCopy.header.title} onChange={(e) => updateDeposit("header.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="副标题"><input value={depositCopy.header.subtitle} onChange={(e) => updateDeposit("header.subtitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            </div>
          </Section>

          <Section icon={CreditCard} title="当前权益状态" desc="根据是否开通显示不同文案">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="已开通主文案（可用 {depositText} 占位）"><input value={depositCopy.status.activeMain} onChange={(e) => updateDeposit("status.activeMain", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="已开通副文案（可用 {discountText} / {returnText}）"><input value={depositCopy.status.activeSub} onChange={(e) => updateDeposit("status.activeSub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="未开通主文案"><input value={depositCopy.status.inactiveMain} onChange={(e) => updateDeposit("status.inactiveMain", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="未开通副文案"><input value={depositCopy.status.inactiveSub} onChange={(e) => updateDeposit("status.inactiveSub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            </div>
          </Section>

          <Section icon={Package} title="代理中心入口" desc="充值页代理中心卡片">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="标题"><input value={depositCopy.agentEntry.title} onChange={(e) => updateDeposit("agentEntry.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="已开通描述"><input value={depositCopy.agentEntry.descActive} onChange={(e) => updateDeposit("agentEntry.descActive", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="未开通描述"><input value={depositCopy.agentEntry.descInactive} onChange={(e) => updateDeposit("agentEntry.descInactive", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="已开通按钮"><input value={depositCopy.agentEntry.btnActive} onChange={(e) => updateDeposit("agentEntry.btnActive", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="未开通按钮"><input value={depositCopy.agentEntry.btnInactive} onChange={(e) => updateDeposit("agentEntry.btnInactive", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            </div>
          </Section>

          <Section icon={CreditCard} title="套餐列表" desc="充值页五个套餐档位">
            <Field label="区标题"><input value={depositCopy.plansHeader.title} onChange={(e) => updateDeposit("plansHeader.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border mb-3" /></Field>
            <Field label="区副标题"><input value={depositCopy.plansHeader.sub} onChange={(e) => updateDeposit("plansHeader.sub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border mb-4" /></Field>
            <DepositPlanEditor plans={depositCopy.plans} onChange={(v) => updateDeposit("plans", v)} />
          </Section>

          <Section icon={CreditCard} title="底部提示 & 弹窗" desc="充值页提示文案与协议弹窗">
            <div className="space-y-4">
              <Field label="提示文案"><textarea value={depositCopy.tips.tip} onChange={(e) => updateDeposit("tips.tip", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border h-16" /></Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="联系客服前缀"><input value={depositCopy.tips.contactPrefix} onChange={(e) => updateDeposit("tips.contactPrefix", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="联系客服链接文字"><input value={depositCopy.tips.contactLink} onChange={(e) => updateDeposit("tips.contactLink", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              </div>
              <Field label="顾问微信号"><input value={depositCopy.advisorWx} onChange={(e) => updateDeposit("advisorWx", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="弹窗标题"><input value={depositCopy.payModal.title} onChange={(e) => updateDeposit("payModal.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="弹窗说明"><textarea value={depositCopy.payModal.payTip} onChange={(e) => updateDeposit("payModal.payTip", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border h-20" /></Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="协议弹窗标题"><input value={depositCopy.agreement.title} onChange={(e) => updateDeposit("agreement.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="同意按钮"><input value={depositCopy.agreement.agreeBtn} onChange={(e) => updateDeposit("agreement.agreeBtn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="取消按钮"><input value={depositCopy.agreement.cancelBtn} onChange={(e) => updateDeposit("agreement.cancelBtn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="复制微信号按钮"><input value={depositCopy.payModal.copyBtn} onChange={(e) => updateDeposit("payModal.copyBtn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              </div>
            </div>
          </Section>
        </div>
      )}

      {tab === "web" && (
        <div className="space-y-6">
          <Section icon={Globe} title="VIP 页（网站）" desc="网站 /vip 页面展示文案，价格与折扣比例不可在此改">
            <div className="space-y-4">
              <Field label="Hero 主标题"><input value={webCopy.vip.hero.title} onChange={(e) => updateWeb("vip.hero.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="Hero 副标题 1"><input value={webCopy.vip.hero.subtitle} onChange={(e) => updateWeb("vip.hero.subtitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="Hero 副标题 2"><input value={webCopy.vip.hero.subtitle2} onChange={(e) => updateWeb("vip.hero.subtitle2", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="充值引导区标题"><input value={webCopy.vip.guide.title} onChange={(e) => updateWeb("vip.guide.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="充值引导区副标题"><input value={webCopy.vip.guide.subtitle} onChange={(e) => updateWeb("vip.guide.subtitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="充值入口卡片标题"><input value={webCopy.vip.depositEntry.title} onChange={(e) => updateWeb("vip.depositEntry.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="充值入口卡片副标题"><input value={webCopy.vip.depositEntry.subtitle} onChange={(e) => updateWeb("vip.depositEntry.subtitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="套餐卡片默认副标题"><input value={webCopy.vip.planSubtitle} onChange={(e) => updateWeb("vip.planSubtitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="支付弹窗标题（可用 {planName}）"><input value={webCopy.vip.pay.confirmTitle} onChange={(e) => updateWeb("vip.pay.confirmTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="支付弹窗副标题"><input value={webCopy.vip.pay.confirmSub} onChange={(e) => updateWeb("vip.pay.confirmSub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            </div>
          </Section>

          <Section icon={Globe} title="会员中心页（网站）" desc="网站 /members 页面展示文案">
            <div className="space-y-4">
              <Field label="Hero 标题"><input value={webCopy.members.heroTitle} onChange={(e) => updateWeb("members.heroTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="Hero 副标题"><input value={webCopy.members.heroSubtitle} onChange={(e) => updateWeb("members.heroSubtitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="拿货充值区标题"><input value={webCopy.members.depositSectionTitle} onChange={(e) => updateWeb("members.depositSectionTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="拿货充值区副标题"><input value={webCopy.members.depositSectionSub} onChange={(e) => updateWeb("members.depositSectionSub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="拿货充值区底部提示"><input value={webCopy.members.depositTip} onChange={(e) => updateWeb("members.depositTip", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            </div>
          </Section>

          <Section icon={Globe} title="代理招募页（网站）" desc="网站 /agent/recruit 页面展示文案">
            <div className="space-y-4">
              <Field label="Hero 角标"><input value={webCopy.agent.heroTag} onChange={(e) => updateWeb("agent.heroTag", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="Hero 标题（前段）"><input value={webCopy.agent.heroTitleMain} onChange={(e) => updateWeb("agent.heroTitleMain", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="Hero 标题（高亮段）"><input value={webCopy.agent.heroTitleAccent} onChange={(e) => updateWeb("agent.heroTitleAccent", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="Hero 副标题"><textarea value={webCopy.agent.heroSub} onChange={(e) => updateWeb("agent.heroSub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border h-20" /></Field>
              <Field label="代理档级区标题"><input value={webCopy.agent.tierSectionTitle} onChange={(e) => updateWeb("agent.tierSectionTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="常见问题区标题"><input value={webCopy.agent.faqSectionTitle} onChange={(e) => updateWeb("agent.faqSectionTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

function setPath(obj: any, path: string, value: any): any {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] = { ...cur[parts[i]] };
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
  return obj;
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

function FeatureList({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-2">
      <span className="text-xs text-muted-foreground">特性列表（每行一条）</span>
      {value.map((f, i) => (
        <div key={i} className="flex gap-2">
          <input value={f} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} className="flex-1 px-3 py-2 rounded-lg border border-border text-sm" />
          <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg border border-border" title="删除"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...value, ""])} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-accent border border-accent rounded-lg hover:bg-accent/5"><Plus className="w-4 h-4" /> 添加特性</button>
    </div>
  );
}

function PlanEditor({ plans, onChange }: { plans: VipPlan[]; onChange: (v: VipPlan[]) => void }) {
  function updatePlan(i: number, patch: Partial<VipPlan>) {
    onChange(plans.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  return (
    <div className="space-y-4">
      {plans.map((plan, i) => (
        <div key={plan.id} className="p-4 rounded-xl border border-border bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-primary">套餐 {i + 1}（{plan.id}）</h4>
            <button onClick={() => onChange(plans.filter((_, idx) => idx !== i))} className="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="删除"><Trash2 className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="展示名称"><input value={plan.name} onChange={(e) => updatePlan(i, { name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            <Field label="价格标签"><input value={plan.priceLabel} onChange={(e) => updatePlan(i, { priceLabel: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            <Field label="折扣标签"><input value={plan.discountLabel} onChange={(e) => updatePlan(i, { discountLabel: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            <Field label="示例文案"><input value={plan.example} onChange={(e) => updatePlan(i, { example: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            <label className="flex items-center gap-2 text-sm text-primary md:col-span-2">
              <input type="checkbox" checked={plan.highlight} onChange={(e) => updatePlan(i, { highlight: e.target.checked })} /> 标记为推荐
            </label>
            <div className="md:col-span-2">
              <FeatureList value={plan.features} onChange={(v) => updatePlan(i, { features: v })} />
            </div>
            {plan.tryonTip !== undefined && (
              <Field label="试衣提示（仅首充档）"><input value={plan.tryonTip || ""} onChange={(e) => updatePlan(i, { tryonTip: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border md:col-span-2" /></Field>
            )}
          </div>
        </div>
      ))}
      <button onClick={() => onChange([...plans, { id: "new_" + Date.now(), name: "", priceLabel: "", discountLabel: "", features: [""], example: "", highlight: false }])} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-accent border border-accent rounded-lg hover:bg-accent/5"><Plus className="w-4 h-4" /> 添加套餐</button>
    </div>
  );
}

function DepositPlanEditor({ plans, onChange }: { plans: DepositPlan[]; onChange: (v: DepositPlan[]) => void }) {
  function updatePlan(i: number, patch: Partial<DepositPlan>) {
    onChange(plans.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  return (
    <div className="space-y-4">
      {plans.map((plan, i) => (
        <div key={plan.id} className="p-4 rounded-xl border border-border bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-primary">套餐 {i + 1}（{plan.id}）</h4>
            <button onClick={() => onChange(plans.filter((_, idx) => idx !== i))} className="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="删除"><Trash2 className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="展示名称"><input value={plan.name} onChange={(e) => updatePlan(i, { name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            <Field label="金额标签"><input value={plan.amountLabel} onChange={(e) => updatePlan(i, { amountLabel: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            <Field label="折扣标签"><input value={plan.discount} onChange={(e) => updatePlan(i, { discount: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            <Field label="示例文案"><input value={plan.example} onChange={(e) => updatePlan(i, { example: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            <Field label="退换比例（数字 %）"><input type="number" value={plan.refund} onChange={(e) => updatePlan(i, { refund: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            <label className="flex items-center gap-2 text-sm text-primary">
              <input type="checkbox" checked={plan.isTest} onChange={(e) => updatePlan(i, { isTest: e.target.checked })} /> 测试套餐
            </label>
            {plan.tryonTip !== undefined && (
              <Field label="试衣提示（仅首充档）"><input value={plan.tryonTip || ""} onChange={(e) => updatePlan(i, { tryonTip: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border md:col-span-2" /></Field>
            )}
          </div>
        </div>
      ))}
      <button onClick={() => onChange([...plans, { id: "new_" + Date.now(), name: "", amountLabel: "", discount: "", refund: 0, example: "", isTest: false }])} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-accent border border-accent rounded-lg hover:bg-accent/5"><Plus className="w-4 h-4" /> 添加套餐</button>
    </div>
  );
}
