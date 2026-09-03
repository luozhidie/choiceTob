"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, RefreshCw, Users, Gift, Sparkles, Plus, Trash2, Store, BadgeCheck, Handshake } from "lucide-react";

interface MemberCard { tag: string; icon: string; name: string; desc: string; btn: string; }
interface MemberModal { title: string; content: string; }
interface MemberCopy {
  badge: string; title: string; subtitle: string;
  userCard: { vipActive: string; vipInactive: string; defaultName: string; openBtn: string };
  sectionTitle: string;
  cards: MemberCard[];
  modals: { plan: MemberModal; marketing: MemberModal };
}
interface Benefit { icon: string; title: string; desc: string; }
interface NewCustomerCopy {
  heroTag: string; heroTitle: string; heroSub: string;
  benefits: Benefit[];
  stepsTitle: string; steps: string[];
  cta: string; toast: string;
  shelf: { title: string; sub: string; hint: string; btn: string };
}
interface TryonCopy {
  aiTag: string; aiText: string;
  promo: any; guide: any; faq: any; normal: any; pro: any;
}
interface AgentRecruitCopy {
  done: { title: string; desc: string; btn: string };
  hero: { badge: string; title: string; desc: string };
  advantages: { label: string; title: string; cards: { icon: string; title: string; desc: string }[] };
  conditions: { label: string; title: string; items: string[] };
  apply: { label: string; title: string; submitText: string; submittingText: string; tip: string };
}
interface AgentShopCopy {
  loading: string;
  empty: { emoji: string; title: string; desc: string; btn: string };
  shopHead: { badge: string; nameSuffix: string; desc: string };
  tryBar: { emoji: string; title: string; desc: string; btn: string };
  product: { buyBtn: string; tryBtn: string };
  tip: string;
  paySheet: { addrEmpty: string; payPrefix: string };
}
interface Sec { icon: string; title: string; hint: string; }
interface CertifyCopy {
  intro: { badge: string; title: string; benefitTitle: string; benefits: { icon: string; name: string; desc: string }[]; btn: string };
  steps: { identity: string; profile: string; extra: string };
  sections: {
    basic: Sec; market: Sec; freq: Sec; category: Sec; style: Sec; target: Sec;
    location: Sec; photos: Sec; proof: Sec; bizData: Sec; notes: Sec;
  };
  photos: {
    frontTitle: string; frontTip: string; frontLabel: string;
    interiorTitle: string; interiorTip: string; interiorLabel: string;
    proofTitle: string; proofTip: string; proofLabel: string;
  };
  btns: { nextIdentity: string; nextProfile: string; submit: string; submitting: string; goBuyer: string; goMy: string };
  done: { crown: string; tit: string; sub: string; items: { b: string; t: string }[] };
  login: { tit: string; dsc: string; btn: string; back: string };
}
interface MpPageCopy {
  member: MemberCopy; newcustomer: NewCustomerCopy; tryon: TryonCopy;
  agent: { recruit: AgentRecruitCopy; shop: AgentShopCopy };
  certify: CertifyCopy;
}

const DEFAULT: MpPageCopy = {
  member: {
    badge: "🛡 会员专享服务中心",
    title: "骆芷蝶智选 · 会员中心",
    subtitle: "整合VIP服务、商品企划、爆款样衣、营销策划的一站式赋能平台",
    userCard: { vipActive: "✓ VIP 已激活", vipInactive: "未开通VIP", defaultName: "会员用户", openBtn: "开通" },
    sectionTitle: "会员专享功能",
    cards: [
      { tag: "热门", icon: "VIP", name: "VIP 会员服务", desc: "专属选品权、设计稿优先、大数据爆款推荐", btn: "立即进入 →" },
      { tag: "AI驱动", icon: "企", name: "商品企划中心", desc: "AI驱动的商品开发决策、96格货盘矩阵、采购清单生成", btn: "立即进入 →" },
      { tag: "独家", icon: "爆", name: "爆款样衣展厅", desc: "精选市场最新爆款样衣，会员可查看详情与价格，看中即咨询下单", btn: "立即进入 →" },
      { tag: "智能", icon: "营", name: "营销策划工具", desc: "AI营销方案生成、推广策略建议、投放效果预估", btn: "立即进入 →" },
    ],
    modals: {
      plan: { title: "商品企划中心", content: "AI驱动的商品开发决策\n96格货盘矩阵\n采购清单生成\n\n开发中，敬请期待" },
      marketing: { title: "营销策划工具", content: "AI营销方案生成\n推广策略建议\n投放效果预估\n\n开发中，敬请期待" },
    },
  },
  newcustomer: {
    heroTag: "新人专享",
    heroTitle: "首单 4 重福利",
    heroSub: "下单即享，限时放送，错过不再有",
    benefits: [
      { icon: "📦", title: "满199包邮", desc: "首单满199全国包邮，偏远同享" },
      { icon: "🧥", title: "首单搭配指导", desc: "免费一次一衣多搭指导" },
      { icon: "🧧", title: "满399减30", desc: "注册即领新人专享红包" },
      { icon: "⚡", title: "优先发货", desc: "新人订单优先拣货极速发" },
    ],
    stepsTitle: "如何领取",
    steps: [
      "注册并登录骆芷蝶智选账号",
      "浏览专场 / 分类，加入购物车",
      "结算时自动抵扣福利，优先发货",
    ],
    cta: "一键领取新客红包 ›",
    toast: "新客红包已放入卡券包",
    shelf: { title: "新客下单专栏货架", sub: "精选好物 · 新人专享价", hint: "进入「专场」或「分类」挑选新人专享好货", btn: "去逛新人专享 ›" },
  },
  tryon: {
    aiTag: "AI生成", aiText: "本页内容由人工智能生成，仅供参考，请以实物与专业判断为准",
    promo: {
      tag: "骆芷蝶智选 · 云衣橱•AI虚拟试衣",
      title: "先试再买\n穿上身再决定",
      sub: "上传你的照片，AI 把衣服「穿」到你身上。好不好看，一眼就知道。",
      badges: ["9.9元首单", "30 秒出图", "隐私保护"],
      ctaMain: "新人首单 ¥9.9 试穿", ctaSub: "10 次普通试穿 · 限时",
      stepsTitle: "三步，看见上身效果",
      steps: [
        { t: "上传照片", d: "正面半身照，仅用于本次合成" },
        { t: "挑选衣服", d: "从店铺商品里选，或 AI 推荐" },
        { t: "生成上身图", d: "AI 合成真实穿着效果" },
      ],
      entryTitle: "选择你的试衣方式",
      entries: [
        { emoji: "👕", name: "普通版", sub: "快速看上身 · ¥99/月 100 次" },
        { emoji: "✨", name: "专业版", sub: "诊断+搭配 · ¥998/100 次" },
        { emoji: "📖", name: "怎么用", sub: "一步步图文教程" },
        { emoji: "❓", name: "常见问题", sub: "隐私/效果/退订" },
      ],
    },
    guide: {
      title: "怎么用 · 4 步穿上身", sub: "不用学，跟着走一遍就会。整个过程约 1 分钟。",
      steps: [
        { n: "1", t: "上传照片", d: "拍一张正面半身照。照片只用于本次 AI 合成，不会留存或公开。", tip: "光线均匀、背景干净，效果更准" },
        { n: "2", t: "挑选衣服", d: "从店铺里挑想试的款，或让 AI 按你的风格推荐。也能上传自己的衣服图。", tip: "一次可多选几件对比" },
        { n: "3", t: "生成上身图", d: "点「试穿」，AI 把衣服「穿」到你身上，约 30 秒出图。", tip: "普通版一键合成，专业版带风格诊断" },
        { n: "4", t: "看效果做决定", d: "上身图、颜色、版型一眼可见，喜欢再下单，不踩雷。", tip: "专业版还能看 AI 搭配建议" },
      ],
      ctaTip: "看懂了？去试一件看看", ctaBtn: "进入试衣台",
    },
    faq: {
      title: "常见问题", sub: "还有疑问？这里先答。",
      faqs: [
        { q: "照片会被保存或公开吗？", a: "不会。照片仅用于本次 AI 试衣合成，处理后不保留、不公开。" },
        { q: "试衣效果能当真实试穿看吗？", a: "AI 合成效果仅供参考，帮助你判断款式、颜色是否适合自己。" },
        { q: "专业版可以随时取消吗？", a: "可以。到期不续费自动回到基础版，已购权益不受影响。" },
        { q: "普通版和专业版能同时用吗？", a: "能。专业版包含普通版全部功能，开通专业版后两者权益合并计算。" },
      ],
    },
    normal: {
      title: "普通版", sub: "快速看上身 · 不想研究搭配选这个",
      includeTitle: "包含", excludeTitle: "不含",
      include: ["上传自己的人像照片", "上传想试穿的衣服照片", "一键 AI 合成上身效果", "从店铺挑选商品试穿"],
      exclude: ["风格诊断", "AI 智能搭配 / 买手推荐"],
      pkgFirstTitle: "首单体验", pkgFirstSub: "10 次普通试穿", pkgFirstPriceLabel: "¥9.9", pkgFirstBtn: "购买 ¥9.9",
      pkgMonthTitle: "普通月卡", pkgMonthSub: "30 天 100 次普通试穿", pkgMonthPriceLabel: "¥99", pkgMonthBtn: "购买 ¥99",
    },
    pro: {
      title: "专业版", sub: "诊断 + 搭配", sub2: "在普通版基础上，加 14 题风格诊断与 AI 智能搭配。",
      features: ["普通版全部功能", "14 题穿衣风格诊断", "AI 按风格自动生成造型", "风格匹配 + 场合搭配建议"],
      pkgTitle: "专业版", pkgSub: "100 次专业诊断 · 含 14 题风格测试 / 八大风格真人试穿", pkgPriceLabel: "¥998", pkgBtn: "购买 ¥998",
    },
  },

  agent: {
    recruit: {
      done: { title: "提交成功", desc: "我们已收到你的代理申请，专属顾问会在 1-2 个工作日内联系你", btn: "返回首页" },
      hero: { badge: "JOIN AGENT", title: "成为销售代理", desc: "共享时尚产业红利，预存货款享会员价，邀好友再得返利" },
      advantages: {
        label: "ADVANTAGES",
        title: "权益优势",
        cards: [
          { icon: "📈", title: "数据驱动", desc: "AI 选品 + 销售预测，降低压货风险" },
          { icon: "🎨", title: "设计支持", desc: "专业设计团队，季度更新 300+ 款" },
          { icon: "📦", title: "直采货源", desc: "广州/杭州直采，价格优势明显" },
          { icon: "🎓", title: "培训体系", desc: "从零到专业买手的全链路培训" },
        ],
      },
      conditions: {
        label: "CONDITIONS",
        title: "升级条件",
        items: [
          "认同品牌理念，遵纪守法",
          "有实体渠道或线上销售渠道",
          "具备一定资金实力与抗风险能力",
          "愿接受平台统一管理及培训",
          "有良好商业信誉与服务意识",
        ],
      },
      apply: {
        label: "APPLY NOW",
        title: "立即报名",
        submitText: "提交报名",
        submittingText: "提交中...",
        tip: "提交即表示同意我们与你联系，信息仅用于代理审核",
      },
    },
    shop: {
      loading: "加载中…",
      empty: { emoji: "🔗", title: "链接无效", desc: "链接不存在或未激活", btn: "回到首页" },
      shopHead: { badge: "专属精选店", nameSuffix: " 的精选店", desc: "先试再买 · 由专属买手为你服务" },
      tryBar: { emoji: "👗", title: "云衣橱 · AI 虚拟试衣", desc: "上传照片，先看上身效果再决定", btn: "去试衣 ›" },
      product: { buyBtn: "立即买", tryBtn: "试穿 ›" },
      tip: "价格由店铺设定",
      paySheet: { addrEmpty: "＋ 选择收货地址", payPrefix: "微信支付 ¥" },
    },
  },

  certify: {
    intro: {
      badge: "认证会员 · 开通会员价",
      title: "填写资料，即刻开通会员价查看权",
      benefitTitle: "认证后可享 4 大权益",
      benefits: [
        { icon: "价", name: "会员价查看权", desc: "认证即可查看所有商品会员价" },
        { icon: "退", name: "退换额度", desc: "充值后享阶梯退换额度" },
        { icon: "新", name: "新款抢先看", desc: "当季新品提前浏览推荐" },
        { icon: "荐", name: "精准推荐", desc: "基于店铺画像匹配款式" },
      ],
      btn: "开始填写 →",
    },
    steps: { identity: "1/4 店铺基本信息", profile: "2/4 经营画像", extra: "3/4 补充信息" },
    sections: {
      basic: { icon: "🏪", title: "基本信息", hint: "*全项必填" },
      market: { icon: "🚛", title: "主要采购渠道", hint: "*至少选1个" },
      freq: { icon: "📅", title: "月均采购频次", hint: "*" },
      category: { icon: "👗", title: "主营品类", hint: "*至少选1个" },
      style: { icon: "🎨", title: "风格偏好", hint: "*至少选1个" },
      target: { icon: "👥💰", title: "目标客群", hint: "*" },
      location: { icon: "📍", title: "店铺位置", hint: "*" },
      photos: { icon: "📷", title: "店铺照片", hint: "*各1张" },
      proof: { icon: "🧾", title: "购物凭证", hint: "*" },
      bizData: { icon: "📊", title: "经营数据", hint: "选填" },
      notes: { icon: "📝", title: "备注 / 需求说明", hint: "选填" },
    },
    photos: {
      frontTitle: "点击上传门头照", frontTip: "展示招牌/店招", frontLabel: "* 店铺门头照",
      interiorTitle: "点击上传陈列照", interiorTip: "展示店内陈列/货架", interiorLabel: "* 店内陈列照",
      proofTitle: "点击上传购物凭证", proofTip: "拍照或相册选取近期购物凭证", proofLabel: "* 上传购物凭证（必填）",
    },
    btns: {
      nextIdentity: "下一步：经营画像 →",
      nextProfile: "下一步：补充信息 →",
      submit: "提交认证，开通会员价 🛡",
      submitting: "提交中...",
      goBuyer: "去看款选购",
      goMy: "前往个人中心",
    },
    done: {
      crown: "👑",
      tit: "认证成功！🎉",
      sub: "会员价已开启 · 信息已同步至后台",
      items: [
        { b: "会员价已解锁", t: "全店商品可看会员价" },
        { b: "退换额度", t: "开通充值会员后生效" },
        { b: "新款抢先看", t: "当季新品提前推荐" },
        { b: "精准款式推荐", t: "按店铺画像匹配" },
      ],
    },
    login: { tit: "请先登录", dsc: "认证会员需先登录账号", btn: "去登录", back: "返回首页" },
  },
};

export default function AdminPageCopyPage() {
  const [tab, setTab] = useState<"member" | "newcustomer" | "tryon" | "agentrecruit" | "agentshop" | "certify">("member");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [copy, setCopy] = useState<MpPageCopy>(DEFAULT);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/public/settings?keys=mp_page_copy");
      const json = await res.json();
      const d = (json.data && json.data.mp_page_copy) || {};
      setCopy({ ...DEFAULT, ...d });
    } catch (e: any) {
      showToast("error", "加载失败：" + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key: "mp_page_copy", value: copy }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "保存失败");
      }
      showToast("success", "已保存，小程序实时生效");
    } catch (e: any) {
      showToast("error", "保存失败：" + e.message);
    } finally {
      setSaving(false);
    }
  }

  function update(path: string, value: any) {
    setCopy((prev) => setPath({ ...prev }, path, value));
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
          <h1 className="text-2xl font-bold text-primary">小程序页面文案</h1>
          <p className="text-sm text-muted-foreground mt-1">会员中心 / 新客页 / 虚拟试衣系列文案，改完小程序实时生效</p>
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
        {([["member", "会员中心"], ["newcustomer", "新客页"], ["tryon", "虚拟试衣"], ["agentrecruit", "代理招募"], ["agentshop", "代理小店"], ["certify", "店主认证"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-accent text-white" : "bg-white text-primary border border-border hover:bg-muted"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "member" && <MemberTab copy={copy} update={update} />}
      {tab === "newcustomer" && <NewCustomerTab copy={copy} update={update} />}
      {tab === "tryon" && <TryonTab copy={copy} update={update} />}
      {tab === "agentrecruit" && <AgentRecruitTab copy={copy} update={update} />}
      {tab === "agentshop" && <AgentShopTab copy={copy} update={update} />}
      {tab === "certify" && <CertifyTab copy={copy} update={update} />}
    </div>
  );
}

/* ---------- 会员中心 ---------- */
function MemberTab({ copy, update }: { copy: MpPageCopy; update: (p: string, v: any) => void }) {
  const m = copy.member;
  return (
    <div className="space-y-6">
      <Section icon={Users} title="页面头部" desc="会员中心顶部标题与用户卡">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="角标"><input value={m.badge} onChange={(e) => update("member.badge", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="主标题"><input value={m.title} onChange={(e) => update("member.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="副标题"><textarea value={m.subtitle} onChange={(e) => update("member.subtitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border h-16" /></Field>
          <Field label="功能区标题"><input value={m.sectionTitle} onChange={(e) => update("member.sectionTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="已开通文案"><input value={m.userCard.vipActive} onChange={(e) => update("member.userCard.vipActive", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="未开通文案"><input value={m.userCard.vipInactive} onChange={(e) => update("member.userCard.vipInactive", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="默认昵称"><input value={m.userCard.defaultName} onChange={(e) => update("member.userCard.defaultName", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="开通按钮"><input value={m.userCard.openBtn} onChange={(e) => update("member.userCard.openBtn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
      </Section>

      <Section icon={Users} title="功能卡片（4 张）" desc="会员专享功能区的卡片">
        <div className="space-y-4">
          {m.cards.map((c, i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-white space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-primary">卡片 {i + 1}</h4>
                {m.cards.length > 1 && (
                  <button onClick={() => update("member.cards", m.cards.filter((_, idx) => idx !== i))} className="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="删除"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="标签"><input value={c.tag} onChange={(e) => update("member.cards", m.cards.map((x, idx) => idx === i ? { ...x, tag: e.target.value } : x))} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="图标"><input value={c.icon} onChange={(e) => update("member.cards", m.cards.map((x, idx) => idx === i ? { ...x, icon: e.target.value } : x))} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="名称"><input value={c.name} onChange={(e) => update("member.cards", m.cards.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="按钮文字"><input value={c.btn} onChange={(e) => update("member.cards", m.cards.map((x, idx) => idx === i ? { ...x, btn: e.target.value } : x))} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
                <Field label="描述（整行）"><textarea value={c.desc} onChange={(e) => update("member.cards", m.cards.map((x, idx) => idx === i ? { ...x, desc: e.target.value } : x))} className="w-full px-3 py-2 rounded-lg border border-border md:col-span-2 h-16" /></Field>
              </div>
            </div>
          ))}
          <button onClick={() => update("member.cards", [...m.cards, { tag: "", icon: "", name: "", desc: "", btn: "立即进入 →" }])} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-accent border border-accent rounded-lg hover:bg-accent/5"><Plus className="w-4 h-4" /> 添加卡片</button>
        </div>
      </Section>

      <Section icon={Users} title="弹窗文案" desc="商品企划中心 / 营销策划工具 弹窗">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="企划弹窗标题"><input value={m.modals.plan.title} onChange={(e) => update("member.modals.plan.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="营销弹窗标题"><input value={m.modals.marketing.title} onChange={(e) => update("member.modals.marketing.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="企划弹窗内容（\\n 换行）"><textarea value={m.modals.plan.content} onChange={(e) => update("member.modals.plan.content", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border h-24" /></Field>
          <Field label="营销弹窗内容（\\n 换行）"><textarea value={m.modals.marketing.content} onChange={(e) => update("member.modals.marketing.content", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border h-24" /></Field>
        </div>
      </Section>
    </div>
  );
}

/* ---------- 新客页 ---------- */
function NewCustomerTab({ copy, update }: { copy: MpPageCopy; update: (p: string, v: any) => void }) {
  const n = copy.newcustomer;
  return (
    <div className="space-y-6">
      <Section icon={Gift} title="页面头部" desc="新客页顶部">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="角标"><input value={n.heroTag} onChange={(e) => update("newcustomer.heroTag", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="主标题"><input value={n.heroTitle} onChange={(e) => update("newcustomer.heroTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="副标题"><input value={n.heroSub} onChange={(e) => update("newcustomer.heroSub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border md:col-span-2" /></Field>
        </div>
      </Section>

      <Section icon={Gift} title="福利列表" desc="首单 N 重福利卡片">
        <div className="space-y-3">
          {n.benefits.map((b, i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-white grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <Field label="图标"><input value={b.icon} onChange={(e) => update("newcustomer.benefits", n.benefits.map((x, idx) => idx === i ? { ...x, icon: e.target.value } : x))} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="标题"><input value={b.title} onChange={(e) => update("newcustomer.benefits", n.benefits.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="描述"><input value={b.desc} onChange={(e) => update("newcustomer.benefits", n.benefits.map((x, idx) => idx === i ? { ...x, desc: e.target.value } : x))} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            </div>
          ))}
          <button onClick={() => update("newcustomer.benefits", [...n.benefits, { icon: "🎁", title: "", desc: "" }])} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-accent border border-accent rounded-lg hover:bg-accent/5"><Plus className="w-4 h-4" /> 添加福利</button>
        </div>
      </Section>

      <Section icon={Gift} title="领取步骤 & 按钮" desc="如何领取、红包提示、货架区">
        <Field label="步骤标题"><input value={n.stepsTitle} onChange={(e) => update("newcustomer.stepsTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border mb-3" /></Field>
        <StrList value={n.steps} onChange={(v) => update("newcustomer.steps", v)} addLabel="添加步骤" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="领取按钮"><input value={n.cta} onChange={(e) => update("newcustomer.cta", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="领取提示 Toast"><input value={n.toast} onChange={(e) => update("newcustomer.toast", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="货架标题"><input value={n.shelf.title} onChange={(e) => update("newcustomer.shelf.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="货架副标题"><input value={n.shelf.sub} onChange={(e) => update("newcustomer.shelf.sub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="货架提示"><input value={n.shelf.hint} onChange={(e) => update("newcustomer.shelf.hint", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="货架按钮"><input value={n.shelf.btn} onChange={(e) => update("newcustomer.shelf.btn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
      </Section>
    </div>
  );
}

/* ---------- 虚拟试衣 ---------- */
function TryonTab({ copy, update }: { copy: MpPageCopy; update: (p: string, v: any) => void }) {
  const t = copy.tryon;
  return (
    <div className="space-y-6">
      <Section icon={Sparkles} title="AI 标识 & 首页 Promo" desc="虚拟试衣全部页面共享的 AI 生成标识 + 试衣首页">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="AI 标识标签"><input value={t.aiTag} onChange={(e) => update("tryon.aiTag", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="AI 标识文案"><input value={t.aiText} onChange={(e) => update("tryon.aiText", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
        <hr className="my-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Promo 角标"><input value={t.promo.tag} onChange={(e) => update("tryon.promo.tag", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="Promo 标题（\\n 换行）"><input value={t.promo.title} onChange={(e) => update("tryon.promo.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="Promo 副标题"><textarea value={t.promo.sub} onChange={(e) => update("tryon.promo.sub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border h-16" /></Field>
          <Field label="Promo 步骤标题"><input value={t.promo.stepsTitle} onChange={(e) => update("tryon.promo.stepsTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="CTA 主文案"><input value={t.promo.ctaMain} onChange={(e) => update("tryon.promo.ctaMain", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="CTA 副文案"><input value={t.promo.ctaSub} onChange={(e) => update("tryon.promo.ctaSub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="入口区标题"><input value={t.promo.entryTitle} onChange={(e) => update("tryon.promo.entryTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
        <div className="mt-4">
          <span className="text-xs text-muted-foreground">首页角标徽章</span>
          <StrList value={t.promo.badges} onChange={(v) => update("tryon.promo.badges", v)} addLabel="添加徽章" />
        </div>
        <div className="mt-4">
          <span className="text-xs text-muted-foreground">三步说明</span>
          <ObjList fields={[{ key: "t", label: "标题" }, { key: "d", label: "描述" }]} value={t.promo.steps} onChange={(v) => update("tryon.promo.steps", v)} addLabel="添加步骤" emptyItem={{ t: "", d: "" }} />
        </div>
        <div className="mt-4">
          <span className="text-xs text-muted-foreground">试衣方式入口（4 个，顺序固定）</span>
          <ObjList fields={[{ key: "emoji", label: "图标" }, { key: "name", label: "名称" }, { key: "sub", label: "副标题" }]} value={t.promo.entries} onChange={(v) => update("tryon.promo.entries", v)} addLabel="添加入口" emptyItem={{ emoji: "", name: "", sub: "" }} />
        </div>
      </Section>

      <Section icon={Sparkles} title="怎么用（Guide）" desc="图文教程页">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="标题"><input value={t.guide.title} onChange={(e) => update("tryon.guide.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="副标题"><input value={t.guide.sub} onChange={(e) => update("tryon.guide.sub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="CTA 提示"><input value={t.guide.ctaTip} onChange={(e) => update("tryon.guide.ctaTip", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="CTA 按钮"><input value={t.guide.ctaBtn} onChange={(e) => update("tryon.guide.ctaBtn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
        <div className="mt-4">
          <span className="text-xs text-muted-foreground">步骤（4 步）</span>
          <ObjList fields={[{ key: "n", label: "序号" }, { key: "t", label: "标题" }, { key: "d", label: "描述" }, { key: "tip", label: "提示" }]} value={t.guide.steps} onChange={(v) => update("tryon.guide.steps", v)} addLabel="添加步骤" emptyItem={{ n: "", t: "", d: "", tip: "" }} />
        </div>
      </Section>

      <Section icon={Sparkles} title="常见问题（FAQ）" desc="虚拟试衣常见问题">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="标题"><input value={t.faq.title} onChange={(e) => update("tryon.faq.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="副标题"><input value={t.faq.sub} onChange={(e) => update("tryon.faq.sub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
        <div className="mt-4">
          <span className="text-xs text-muted-foreground">问答列表</span>
          <ObjList fields={[{ key: "q", label: "问题" }, { key: "a", label: "答案" }]} value={t.faq.faqs} onChange={(v) => update("tryon.faq.faqs", v)} addLabel="添加问答" emptyItem={{ q: "", a: "" }} />
        </div>
      </Section>

      <Section icon={Sparkles} title="普通版 / 专业版 套餐页" desc="试衣套餐的标题、权益、展示价格">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="普通版标题"><input value={t.normal.title} onChange={(e) => update("tryon.normal.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="普通版副标题"><input value={t.normal.sub} onChange={(e) => update("tryon.normal.sub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="专业版标题"><input value={t.pro.title} onChange={(e) => update("tryon.pro.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="专业版副标题"><input value={t.pro.sub} onChange={(e) => update("tryon.pro.sub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="专业版补充文案"><input value={t.pro.sub2} onChange={(e) => update("tryon.pro.sub2", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border md:col-span-2" /></Field>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="普通版-含 标题"><input value={t.normal.includeTitle} onChange={(e) => update("tryon.normal.includeTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="普通版-不含 标题"><input value={t.normal.excludeTitle} onChange={(e) => update("tryon.normal.excludeTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
        <div className="mt-4">
          <span className="text-xs text-muted-foreground">普通版 · 包含</span>
          <StrList value={t.normal.include} onChange={(v) => update("tryon.normal.include", v)} addLabel="添加" />
        </div>
        <div className="mt-4">
          <span className="text-xs text-muted-foreground">普通版 · 不含</span>
          <StrList value={t.normal.exclude} onChange={(v) => update("tryon.normal.exclude", v)} addLabel="添加" />
        </div>
        <div className="mt-4">
          <span className="text-xs text-muted-foreground">专业版 · 特性</span>
          <StrList value={t.pro.features} onChange={(v) => update("tryon.pro.features", v)} addLabel="添加" />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="首单体验 名称"><input value={t.normal.pkgFirstTitle} onChange={(e) => update("tryon.normal.pkgFirstTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="首单体验 描述"><input value={t.normal.pkgFirstSub} onChange={(e) => update("tryon.normal.pkgFirstSub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="首单体验 价格标签"><input value={t.normal.pkgFirstPriceLabel} onChange={(e) => update("tryon.normal.pkgFirstPriceLabel", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="首单体验 按钮"><input value={t.normal.pkgFirstBtn} onChange={(e) => update("tryon.normal.pkgFirstBtn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="普通月卡 名称"><input value={t.normal.pkgMonthTitle} onChange={(e) => update("tryon.normal.pkgMonthTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="普通月卡 描述"><input value={t.normal.pkgMonthSub} onChange={(e) => update("tryon.normal.pkgMonthSub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="普通月卡 价格标签"><input value={t.normal.pkgMonthPriceLabel} onChange={(e) => update("tryon.normal.pkgMonthPriceLabel", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="普通月卡 按钮"><input value={t.normal.pkgMonthBtn} onChange={(e) => update("tryon.normal.pkgMonthBtn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="专业版 名称"><input value={t.pro.pkgTitle} onChange={(e) => update("tryon.pro.pkgTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="专业版 描述"><input value={t.pro.pkgSub} onChange={(e) => update("tryon.pro.pkgSub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="专业版 价格标签"><input value={t.pro.pkgPriceLabel} onChange={(e) => update("tryon.pro.pkgPriceLabel", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="专业版 按钮"><input value={t.pro.pkgBtn} onChange={(e) => update("tryon.pro.pkgBtn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
      </Section>
    </div>
  );
}

/* ---------- 代理招募 ---------- */
function AgentRecruitTab({ copy, update }: { copy: MpPageCopy; update: (p: string, v: any) => void }) {
  const a = copy.agent.recruit;
  return (
    <div className="space-y-6">
      <Section icon={Handshake} title="成功态" desc="提交后的提示">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="标题"><input value={a.done.title} onChange={(e) => update("agent.recruit.done.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="按钮"><input value={a.done.btn} onChange={(e) => update("agent.recruit.done.btn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="描述（整行）"><textarea value={a.done.desc} onChange={(e) => update("agent.recruit.done.desc", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border md:col-span-2 h-16" /></Field>
        </div>
      </Section>

      <Section icon={Handshake} title="页面头部 Hero" desc="招募页顶部">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="角标"><input value={a.hero.badge} onChange={(e) => update("agent.recruit.hero.badge", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="主标题"><input value={a.hero.title} onChange={(e) => update("agent.recruit.hero.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="副标题"><textarea value={a.hero.desc} onChange={(e) => update("agent.recruit.hero.desc", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border md:col-span-2 h-16" /></Field>
        </div>
      </Section>

      <Section icon={Handshake} title="权益优势" desc="4 张优势卡片">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="区块标签"><input value={a.advantages.label} onChange={(e) => update("agent.recruit.advantages.label", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="区块标题"><input value={a.advantages.title} onChange={(e) => update("agent.recruit.advantages.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
        <div className="space-y-3 mt-4">
          {a.advantages.cards.map((c, i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-white grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <Field label="图标"><input value={c.icon} onChange={(e) => update("agent.recruit.advantages.cards", a.advantages.cards.map((x, idx) => idx === i ? { ...x, icon: e.target.value } : x))} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="标题"><input value={c.title} onChange={(e) => update("agent.recruit.advantages.cards", a.advantages.cards.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
              <Field label="描述"><input value={c.desc} onChange={(e) => update("agent.recruit.advantages.cards", a.advantages.cards.map((x, idx) => idx === i ? { ...x, desc: e.target.value } : x))} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Handshake} title="升级条件" desc="5 条条件说明">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="区块标签"><input value={a.conditions.label} onChange={(e) => update("agent.recruit.conditions.label", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="区块标题"><input value={a.conditions.title} onChange={(e) => update("agent.recruit.conditions.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
        <div className="mt-4">
          <span className="text-xs text-muted-foreground">条件列表</span>
          <StrList value={a.conditions.items} onChange={(v) => update("agent.recruit.conditions.items", v)} addLabel="添加条件" />
        </div>
      </Section>

      <Section icon={Handshake} title="报名表单" desc="表单区块标题与提交文案">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="区块标签"><input value={a.apply.label} onChange={(e) => update("agent.recruit.apply.label", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="区块标题"><input value={a.apply.title} onChange={(e) => update("agent.recruit.apply.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="提交按钮"><input value={a.apply.submitText} onChange={(e) => update("agent.recruit.apply.submitText", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="提交中文案"><input value={a.apply.submittingText} onChange={(e) => update("agent.recruit.apply.submittingText", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="提交提示（整行）"><textarea value={a.apply.tip} onChange={(e) => update("agent.recruit.apply.tip", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border md:col-span-2 h-16" /></Field>
        </div>
      </Section>
    </div>
  );
}

/* ---------- 代理小店 ---------- */
function AgentShopTab({ copy, update }: { copy: MpPageCopy; update: (p: string, v: any) => void }) {
  const s = copy.agent.shop;
  return (
    <div className="space-y-6">
      <Section icon={Store} title="加载 / 无效码" desc="加载中与链接无效提示">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="加载中文案"><input value={s.loading} onChange={(e) => update("agent.shop.loading", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="无效码 emoji"><input value={s.empty.emoji} onChange={(e) => update("agent.shop.empty.emoji", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="无效码标题"><input value={s.empty.title} onChange={(e) => update("agent.shop.empty.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="无效码描述"><input value={s.empty.desc} onChange={(e) => update("agent.shop.empty.desc", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="无效码按钮"><input value={s.empty.btn} onChange={(e) => update("agent.shop.empty.btn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
      </Section>

      <Section icon={Store} title="专属店铺头" desc="店铺名称 = 代理商名 + 后缀">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="角标"><input value={s.shopHead.badge} onChange={(e) => update("agent.shop.shopHead.badge", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="名称后缀"><input value={s.shopHead.nameSuffix} onChange={(e) => update("agent.shop.shopHead.nameSuffix", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="店铺描述（整行）"><textarea value={s.shopHead.desc} onChange={(e) => update("agent.shop.shopHead.desc", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border md:col-span-2 h-16" /></Field>
        </div>
      </Section>

      <Section icon={Store} title="虚拟试衣 CTA" desc="商品列表上方试衣入口">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="emoji"><input value={s.tryBar.emoji} onChange={(e) => update("agent.shop.tryBar.emoji", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="标题"><input value={s.tryBar.title} onChange={(e) => update("agent.shop.tryBar.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="描述"><input value={s.tryBar.desc} onChange={(e) => update("agent.shop.tryBar.desc", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="按钮"><input value={s.tryBar.btn} onChange={(e) => update("agent.shop.tryBar.btn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
      </Section>

      <Section icon={Store} title="商品 / 支付" desc="商品卡按钮、价格提示、支付弹窗">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="立即买按钮"><input value={s.product.buyBtn} onChange={(e) => update("agent.shop.product.buyBtn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="试穿按钮"><input value={s.product.tryBtn} onChange={(e) => update("agent.shop.product.tryBtn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="价格提示"><input value={s.tip} onChange={(e) => update("agent.shop.tip", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="选地址占位"><input value={s.paySheet.addrEmpty} onChange={(e) => update("agent.shop.paySheet.addrEmpty", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="支付按钮前缀"><input value={s.paySheet.payPrefix} onChange={(e) => update("agent.shop.paySheet.payPrefix", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
      </Section>
    </div>
  );
}

/* ---------- 店主认证 ---------- */
function CertifyTab({ copy, update }: { copy: MpPageCopy; update: (p: string, v: any) => void }) {
  const c = copy.certify;
  return (
    <div className="space-y-6">
      <Section icon={BadgeCheck} title="开场 Intro" desc="认证入口与 4 大权益">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="角标"><input value={c.intro.badge} onChange={(e) => update("certify.intro.badge", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="主标题"><input value={c.intro.title} onChange={(e) => update("certify.intro.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="权益标题"><input value={c.intro.benefitTitle} onChange={(e) => update("certify.intro.benefitTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="开始按钮"><input value={c.intro.btn} onChange={(e) => update("certify.intro.btn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
        <div className="mt-4">
          <span className="text-xs text-muted-foreground">4 大权益（顺序固定）</span>
          <ObjList fields={[{ key: "icon", label: "图标" }, { key: "name", label: "名称" }, { key: "desc", label: "描述" }]} value={c.intro.benefits} onChange={(v) => update("certify.intro.benefits", v)} addLabel="添加权益" emptyItem={{ icon: "", name: "", desc: "" }} />
        </div>
      </Section>

      <Section icon={BadgeCheck} title="步骤标题 & 区块标题" desc="流程步骤与 section 标题">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="步骤1 标题"><input value={c.steps.identity} onChange={(e) => update("certify.steps.identity", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="步骤2 标题"><input value={c.steps.profile} onChange={(e) => update("certify.steps.profile", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="步骤3 标题"><input value={c.steps.extra} onChange={(e) => update("certify.steps.extra", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="基本信息 标题"><input value={c.sections.basic.title} onChange={(e) => update("certify.sections.basic.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="基本信息 提示"><input value={c.sections.basic.hint} onChange={(e) => update("certify.sections.basic.hint", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="采购渠道 标题"><input value={c.sections.market.title} onChange={(e) => update("certify.sections.market.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="采购频次 标题"><input value={c.sections.freq.title} onChange={(e) => update("certify.sections.freq.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="主营品类 标题"><input value={c.sections.category.title} onChange={(e) => update("certify.sections.category.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="风格偏好 标题"><input value={c.sections.style.title} onChange={(e) => update("certify.sections.style.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="目标客群 标题"><input value={c.sections.target.title} onChange={(e) => update("certify.sections.target.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="店铺位置 标题"><input value={c.sections.location.title} onChange={(e) => update("certify.sections.location.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="店铺照片 标题"><input value={c.sections.photos.title} onChange={(e) => update("certify.sections.photos.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="购物凭证 标题"><input value={c.sections.proof.title} onChange={(e) => update("certify.sections.proof.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="经营数据 标题"><input value={c.sections.bizData.title} onChange={(e) => update("certify.sections.bizData.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="备注 标题"><input value={c.sections.notes.title} onChange={(e) => update("certify.sections.notes.title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
      </Section>

      <Section icon={BadgeCheck} title="照片上传引导" desc="门头照 / 陈列照 / 购物凭证">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="门头照 标题"><input value={c.photos.frontTitle} onChange={(e) => update("certify.photos.frontTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="门头照 提示"><input value={c.photos.frontTip} onChange={(e) => update("certify.photos.frontTip", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="门头照 标签"><input value={c.photos.frontLabel} onChange={(e) => update("certify.photos.frontLabel", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="陈列照 标题"><input value={c.photos.interiorTitle} onChange={(e) => update("certify.photos.interiorTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="陈列照 提示"><input value={c.photos.interiorTip} onChange={(e) => update("certify.photos.interiorTip", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="陈列照 标签"><input value={c.photos.interiorLabel} onChange={(e) => update("certify.photos.interiorLabel", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="凭证 标题"><input value={c.photos.proofTitle} onChange={(e) => update("certify.photos.proofTitle", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="凭证 提示"><input value={c.photos.proofTip} onChange={(e) => update("certify.photos.proofTip", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="凭证 标签"><input value={c.photos.proofLabel} onChange={(e) => update("certify.photos.proofLabel", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
      </Section>

      <Section icon={BadgeCheck} title="按钮 & 成功页" desc="流程按钮与认证成功页">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="下一步(画像)"><input value={c.btns.nextIdentity} onChange={(e) => update("certify.btns.nextIdentity", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="下一步(补充)"><input value={c.btns.nextProfile} onChange={(e) => update("certify.btns.nextProfile", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="提交按钮"><input value={c.btns.submit} onChange={(e) => update("certify.btns.submit", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="提交中"><input value={c.btns.submitting} onChange={(e) => update("certify.btns.submitting", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="成功页 皇冠"><input value={c.done.crown} onChange={(e) => update("certify.done.crown", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="成功页 标题"><input value={c.done.tit} onChange={(e) => update("certify.done.tit", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="成功页 副标题"><input value={c.done.sub} onChange={(e) => update("certify.done.sub", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="去看款按钮"><input value={c.btns.goBuyer} onChange={(e) => update("certify.btns.goBuyer", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="个人中心按钮"><input value={c.btns.goMy} onChange={(e) => update("certify.btns.goMy", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="登录提示标题"><input value={c.login.tit} onChange={(e) => update("certify.login.tit", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="登录提示描述"><input value={c.login.dsc} onChange={(e) => update("certify.login.dsc", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="去登录按钮"><input value={c.login.btn} onChange={(e) => update("certify.login.btn", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
          <Field label="返回首页"><input value={c.login.back} onChange={(e) => update("certify.login.back", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /></Field>
        </div>
        <div className="mt-4">
          <span className="text-xs text-muted-foreground">成功页 4 项权益（顺序固定）</span>
          <ObjList fields={[{ key: "b", label: "名称" }, { key: "t", label: "说明" }]} value={c.done.items} onChange={(v) => update("certify.done.items", v)} addLabel="添加项" emptyItem={{ b: "", t: "" }} />
        </div>
      </Section>
    </div>
  );
}

/* ---------- 通用组件 ---------- */
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

function StrList({ value, onChange, addLabel }: { value: string[]; onChange: (v: string[]) => void; addLabel: string }) {
  return (
    <div className="space-y-2">
      {value.map((s, i) => (
        <div key={i} className="flex gap-2">
          <input value={s} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} className="flex-1 px-3 py-2 rounded-lg border border-border text-sm" />
          <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg border border-border" title="删除"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...value, ""])} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-accent border border-accent rounded-lg hover:bg-accent/5"><Plus className="w-4 h-4" /> {addLabel}</button>
    </div>
  );
}

function ObjList({ fields, value, onChange, addLabel, emptyItem }: { fields: { key: string; label: string }[]; value: any[]; onChange: (v: any[]) => void; addLabel: string; emptyItem: any }) {
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          {fields.map((f) => (
            <input key={f.key} value={item[f.key] || ""} onChange={(e) => onChange(value.map((x, idx) => idx === i ? { ...x, [f.key]: e.target.value } : x))} placeholder={f.label} className="flex-1 px-3 py-2 rounded-lg border border-border text-sm min-w-0" />
          ))}
          <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg border border-border shrink-0" title="删除"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...value, { ...emptyItem }])} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-accent border border-accent rounded-lg hover:bg-accent/5"><Plus className="w-4 h-4" /> {addLabel}</button>
    </div>
  );
}
