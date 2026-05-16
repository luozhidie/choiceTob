"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PaywallModal } from "@/components/PaywallModal";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  Megaphone,
  Users,
  Clock,
  Crown,
  Presentation,
  Share2,
  Target,
  Eye,
  MousePointerClick,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
  Home,
  Repeat,
  Loader2,
  Handshake,
  Stethoscope,
  PenTool,
  RefreshCw,
  HeartHandshake,
  Video,
  Package,
  Award,
  Gem,
  CalendarDays,
  Bell,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ------------------------------------------------------------------ */
/*  Interfaces                                                         */
/* ------------------------------------------------------------------ */
interface MarketingImage {
  id: string;
  sort_order: number;
  title: string;
  label: string;
  image_url: string;
  section: string;
  is_published: boolean;
}

/* ------------------------------------------------------------------ */
/*  Tab 定义                                                           */
/* ------------------------------------------------------------------ */
const TABS = [
  { key: "marketing", label: "营销策划", icon: Megaphone },
  { key: "sales", label: "销售服务", icon: Users },
  { key: "vip", label: "VIP管理", icon: Crown },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ------------------------------------------------------------------ */
/*  静态数据 - 营销策划                                                 */
/* ------------------------------------------------------------------ */
const activityTypes = [
  { icon: Crown, title: "VIP专场日", desc: "每月固定2-3场VIP专场，提前购、专属折扣、限量款优先选，强化尊贵感与归属感。", metrics: "转化效果显著" },
  { icon: Presentation, title: "主题搭配课", desc: "围绕季节/场合/风格开展线上搭配教学，输出专业内容的同时带动商品销售。", metrics: "课程转化优异" },
  { icon: Users, title: "老带新裂变", desc: "老客户推荐新客户双方享优惠，三级裂变机制，低成本高效获客。", metrics: "获客效率出众" },
  { icon: Clock, title: "线上限时企划", desc: "48小时限时主题活动，制造紧迫感，快速引爆销量，适合清库存与推新品。", metrics: "GMV提升明显" },
  { icon: Target, title: "B端选品会", desc: "定期组织线上/线下选品会，集中展示新品，高效促成批量采购决策。", metrics: "成交表现突出" },
  { icon: Share2, title: "行业分享会", desc: "邀请行业专家与成功客户分享经验，建立品牌专业形象，吸引潜在客户。", metrics: "参与规模可观" },
];

const trackingMetrics = [
  { icon: Eye, label: "曝光量", desc: "衡量品牌触达范围" },
  { icon: MousePointerClick, label: "点击率", desc: "评估内容吸引力" },
  { icon: ShoppingCart, label: "转化率", desc: "衡量销售转化效率" },
  { icon: TrendingUp, label: "客单价", desc: "评估活动价值提升" },
  { icon: Repeat, label: "复购率", desc: "衡量客户粘性" },
  { icon: TrendingUp, label: "ROI", desc: "综合评估营销效果" },
];

/* ------------------------------------------------------------------ */
/*  静态数据 - 销售服务                                                 */
/* ------------------------------------------------------------------ */
const salesSteps = [
  { icon: Handshake, title: "建立信任", desc: "通过专业形象展示与真实案例背书，快速建立客户信任感。" },
  { icon: Stethoscope, title: "诊断需求", desc: "深入分析客户现状，精准定位问题与机会。" },
  { icon: PenTool, title: "方案设计", desc: "根据诊断结果，定制可落地可衡量的综合解决方案。" },
  { icon: ShoppingCart, title: "体验成交", desc: "提供体验方案降低决策门槛，通过实际效果推动合作。" },
  { icon: RefreshCw, title: "持续跟进", desc: "建立跟进节奏，持续关注效果并及时调整优化。" },
  { icon: HeartHandshake, title: "长期服务", desc: "从单次交易升级为长期伙伴，实现客户终身价值最大化。" },
];

const funnelItems = [
  { icon: Video, title: "直播引流", desc: "专业搭配直播+行业干货分享", tier: "免费", color: "from-blue-400 to-blue-600", width: "100%" },
  { icon: Stethoscope, title: "在线诊断", desc: "专业买手诊断店铺问题", tier: "体验级 · 起步价", color: "from-primary to-primary/80", width: "80%" },
  { icon: Package, title: "店铺服务包", desc: "全链路店铺运营解决方案", tier: "专业级 · 投资级", color: "from-accent to-accent/80", width: "60%" },
  { icon: Crown, title: "年度VIP", desc: "专属顾问+全年度运营陪伴", tier: "尊享级 · 定制级", color: "from-yellow-600 to-yellow-800", width: "40%" },
];

const diagnosisDimensions = [
  { title: "商品结构", desc: "品类与价格带分析" },
  { title: "客户画像", desc: "核心客群与消费偏好" },
  { title: "陈列效果", desc: "视觉呈现与连带率" },
  { title: "营销节奏", desc: "促销策略与渠道覆盖" },
  { title: "库存健康", desc: "周转与补货效率" },
  { title: "竞品对比", desc: "差异化定位建议" },
];

/* ------------------------------------------------------------------ */
/*  静态数据 - VIP管理                                                  */
/* ------------------------------------------------------------------ */
const vipTiers = [
  { icon: Award, name: "V1 银卡会员", range: "年消费1-3万", color: "from-gray-300 to-gray-500" },
  { icon: Crown, name: "V2 金卡会员", range: "年消费3-5万", color: "from-yellow-400 to-yellow-600" },
  { icon: Gem, name: "V3 黑卡会员", range: "年消费5万+", color: "from-gray-800 to-gray-950" },
];

const operationRhythm = [
  { period: "年度", icon: CalendarDays, summary: "等级评定、答谢会、数据复盘与权益优化" },
  { period: "月度", icon: Clock, summary: "数据统计、VIP专场、生日关怀与内容推送" },
  { period: "每日", icon: Bell, summary: "穿搭建议、即时响应、会员互动与积分更新" },
];

const churnStrategies = [
  { level: "预警期", icon: AlertTriangle, color: "text-yellow-600 bg-yellow-50", summary: "主动关怀，了解客户动态与需求" },
  { level: "流失期", icon: UserCheck, color: "text-orange-600 bg-orange-50", summary: "深度跟进，提供专属回归支持" },
  { level: "挽回期", icon: HeartHandshake, color: "text-red-600 bg-red-50", summary: "全力挽回，定制化解决方案" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function MarketingPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) || "marketing";
  const [activeTab, setActiveTab] = useState<TabKey>(
    TABS.some((t) => t.key === initialTab) ? initialTab : "marketing"
  );
  const [showPaywall, setShowPaywall] = useState(false);
  const [calendarImages, setCalendarImages] = useState<MarketingImage[]>([]);
  const [contentImages, setContentImages] = useState<MarketingImage[]>([]);
  const [serviceImages, setServiceImages] = useState<MarketingImage[]>([]);
  const [scriptsImages, setScriptsImages] = useState<MarketingImage[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    const [marketingRes, salesRes] = await Promise.all([
      supabase.from("marketing_images").select("*").eq("is_published", true).order("sort_order", { ascending: true }),
      supabase.from("sales_images").select("*").eq("is_published", true).order("sort_order", { ascending: true }),
    ]);

    if (!marketingRes.error && marketingRes.data) {
      const all = marketingRes.data as MarketingImage[];
      setCalendarImages(all.filter((img) => img.section === "calendar"));
      setContentImages(all.filter((img) => img.section === "content"));
    }
    if (!salesRes.error && salesRes.data) {
      const all = salesRes.data as MarketingImage[];
      setServiceImages(all.filter((img) => img.section === "service"));
      setScriptsImages(all.filter((img) => img.section === "scripts"));
    }
    setLoading(false);
  };

  const renderImageCard = (item: MarketingImage, i: number) => (
    <motion.div key={item.id} variants={fadeUp} custom={i} className="group cursor-pointer" onClick={() => setShowPaywall(true)}>
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
        <Image src={item.image_url} alt={item.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="px-5 py-2.5 bg-white/90 text-primary text-sm font-semibold rounded-lg backdrop-blur-sm">查看详情</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h4 className="text-xl font-bold text-white">{item.title}</h4>
        </div>
      </div>
    </motion.div>
  );

  const renderLoading = () => (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-accent mr-3" />
      <span className="text-muted-foreground">加载中...</span>
    </div>
  );

  const renderEmpty = (name: string) => (
    <div className="text-center py-12 col-span-full"><p className="text-muted-foreground">暂无{name}数据</p></div>
  );

  /* ---- 各 Tab 内容 ---- */

  const renderMarketing = () => (
    <>
      {/* 年度营销日历 */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Annual Calendar</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">年度营销日历</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">按季度规划营销节奏，每一季都有核心主题与活动方案。</p>
          </motion.div>
          {loading ? renderLoading() : (
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
              {calendarImages.length > 0 ? calendarImages.map((item, i) => renderImageCard(item, i)) : renderEmpty("年度营销日历")}
            </motion.div>
          )}
        </div>
      </section>

      {/* 六种核心活动类型 */}
      <section className="py-16 lg:py-20 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Core Activities</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">六种核心活动类型</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">从获客到转化到留存，覆盖营销全场景的活动矩阵。</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            {activityTypes.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                <div className="group flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors"><item.icon className="w-6 h-6" /></div>
                  <h3 className="mt-5 text-lg font-bold text-primary">{item.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">{item.desc}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100"><span className="text-sm font-medium text-accent">{item.metrics}</span></div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 内容营销矩阵 */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Content Matrix</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">内容营销矩阵</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">多平台精准分发，内容驱动流量，流量带动转化。</p>
          </motion.div>
          {loading ? renderLoading() : (
            <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
              {contentImages.length > 0 ? contentImages.map((item, i) => renderImageCard(item, i)) : renderEmpty("内容营销矩阵")}
            </motion.div>
          )}
        </div>
      </section>

      {/* 营销效果追踪 */}
      <section className="py-16 lg:py-20 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Tracking Metrics</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">营销效果追踪指标</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">数据驱动决策，每一个营销动作都可衡量、可优化。</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            {trackingMetrics.map((item, i) => (
              <motion.div key={item.label} variants={fadeUp} custom={i}>
                <div className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-accent/10 text-accent shrink-0"><item.icon className="w-5 h-5" /></div>
                  <div><h3 className="font-bold text-primary">{item.label}</h3><p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.desc}</p></div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );

  const renderSales = () => (
    <>
      {/* 顾问式销售六步法 */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Consultative Sales</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">顾问式销售六步法</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">以客户需求为中心，以专业价值为驱动，六步闭环打造高转化销售体系。</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            {salesSteps.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                <div className="group relative flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                  <div className="absolute top-6 right-6 text-5xl font-bold text-gray-100 group-hover:text-accent/10 transition-colors">0{i + 1}</div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors"><item.icon className="w-6 h-6" /></div>
                  <h3 className="mt-5 text-lg font-bold text-primary">{item.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 产品体系漏斗 */}
      <section className="py-16 lg:py-20 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Product Funnel</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">产品体系展示</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">四层漏斗式产品体系，从免费引流到深度服务，层层递进，层层转化。</p>
          </motion.div>
          <div className="max-w-3xl mx-auto space-y-4">
            {funnelItems.map((item, i) => (
              <motion.div key={item.title} className="mx-auto" style={{ width: item.width }} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} custom={i}>
                <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${item.color} text-white p-6 sm:p-8`}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 shrink-0"><item.icon className="w-6 h-6" /></div>
                    <div className="flex-1 min-w-0"><h3 className="font-bold text-lg">{item.title}</h3><p className="mt-1 text-white/80 text-sm">{item.desc}</p></div>
                    <div className="text-right shrink-0"><span className="text-lg font-bold">{item.tier}</span></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 在线诊断 */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Online Diagnosis</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">店铺在线诊断</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">专业买手连麦诊断，快速定位店铺核心问题，出具可执行的改善建议。</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            {diagnosisDimensions.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                <div className="p-5 rounded-xl bg-muted border border-gray-100 hover:border-accent/30 transition-colors">
                  <h4 className="font-bold text-primary text-sm">{item.title}</h4>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 服务包 + 话术库 */}
      <section className="py-16 lg:py-20 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Service & Scripts</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">服务包与销售话术</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">从诊断到落地的完整解决方案，配合实战话术，高效成交。</p>
          </motion.div>
          {loading ? renderLoading() : (
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
              {serviceImages.length > 0 ? serviceImages.map((item, i) => renderImageCard(item, i)) : renderEmpty("服务包案例")}
            </motion.div>
          )}
        </div>
      </section>
    </>
  );

  const renderVip = () => (
    <>
      {/* VIP三级体系 */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">VIP Tiers</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">VIP三级体系</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">消费越多，权益越尊享。三级体系层层递进，激励客户持续升级。</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            {vipTiers.map((tier, i) => (
              <motion.div key={tier.name} variants={fadeUp} custom={i}>
                <div className="group flex flex-col h-full rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className={`bg-gradient-to-r ${tier.color} p-6 text-white`}>
                    <div className="flex items-center gap-3"><tier.icon className="w-8 h-8" /><div><h3 className="text-xl font-bold">{tier.name}</h3><p className="text-white/80 text-sm">{tier.range}</p></div></div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col items-center justify-center text-center"><p className="text-muted-foreground text-sm">解锁更多尊享权益</p></div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 权益对比 + 阶梯案例 */}
      <section className="py-16 lg:py-20 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Benefits & Tiers</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">权益与阶梯激励</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">各等级VIP权益对比与年度货款阶梯，激励客户持续向上。</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            {[
              { style: "银卡权益案例", label: "入门尊享·基础折扣", color: "from-gray-100 to-gray-50" },
              { style: "金卡权益案例", label: "进阶尊享·专属服务", color: "from-yellow-100 to-yellow-50" },
              { style: "黑卡权益案例", label: "顶级尊享·一对一顾问", color: "from-slate-200 to-slate-100" },
            ].map((item, i) => (
              <motion.div key={item.style} variants={fadeUp} custom={i} className="group cursor-pointer" onClick={() => setShowPaywall(true)}>
                <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:shadow-lg transition-shadow overflow-hidden relative`}>
                  <div className="text-6xl opacity-40">&#x1F451;</div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">查看详情</span>
                  </div>
                </div>
                <h4 className="font-semibold text-primary">{item.style}</h4>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* VIP运营节奏 */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Operation Rhythm</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">VIP运营节奏</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">年度、月度、每日三级运营清单，确保VIP服务不缺位、关怀不断线。</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            {operationRhythm.map((rhythm, i) => (
              <motion.div key={rhythm.period} variants={fadeUp} custom={i}>
                <div className="flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/5 text-primary"><rhythm.icon className="w-5 h-5" /></div>
                    <h3 className="text-lg font-bold text-primary">{rhythm.period}清单</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{rhythm.summary}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 流失预警 */}
      <section className="py-16 lg:py-20 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Churn Prevention</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">流失预警概述</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">三级预警机制，从预警到挽回，不放弃每一位VIP客户。</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            {churnStrategies.map((strategy, i) => (
              <motion.div key={strategy.level} variants={fadeUp} custom={i}>
                <div className="flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${strategy.color} text-sm font-bold w-fit mb-4`}>
                    <strategy.icon className="w-4 h-4" />{strategy.level}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{strategy.summary}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );

  const tabContent: Record<TabKey, () => React.JSX.Element> = {
    marketing: renderMarketing,
    sales: renderSales,
    vip: renderVip,
  };

  return (
    <>
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} title="完整数据与深度分析" description="登录后购买会员或单次付费即可查看完整内容" type="single" />

      {/* Breadcrumb */}
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="w-4 h-4" /> 首页</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-primary">营销策划</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-4">
              <Megaphone className="w-4 h-4" /> 营销·销售·VIP 一站式管理
            </span>
          </motion.div>
          <motion.h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            营销策划<span className="text-accent">全案服务</span>
          </motion.h1>
          <motion.p className="mt-4 text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            从年度营销规划到销售服务体系，从VIP会员管理到客户终身价值运营，全链路一站式赋能。
          </motion.p>
        </div>
      </section>

      {/* Tab 切换 */}
      <section className="bg-white border-b border-gray-100 sticky top-[57px] z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-3 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === tab.key ? "bg-primary text-white" : "text-gray-700 hover:bg-primary/5"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab 内容 */}
      {tabContent[activeTab]()}

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-8 sm:px-12 lg:px-20 py-14 sm:py-20 text-center text-white" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-accent/10 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold">定制您的专属营销方案</h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                基于您的品牌定位与客户画像，量身定制年度营销策略与执行方案，让每一分营销投入都产生最大价值。
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
                  咨询定制方案 <ChevronRight className="w-5 h-5" />
                </Link>
                <Link href="/style-test" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20">
                  免费风格测试 <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
