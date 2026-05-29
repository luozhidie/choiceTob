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
  Store,
  BarChart3,
  Palette,
  Check,
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

/* 店铺服务交付流程 */
const storeServiceSteps = [
  { icon: Eye, title: "店铺诊断", desc: "全面采集店铺经营数据，深度分析定位与客群" },
  { icon: Palette, title: "会员测试", desc: "逐一为核心会员测试色彩季型与个人风格" },
  { icon: BarChart3, title: "数据分析", desc: "聚合会员画像，洞察色彩与风格分布规律" },
  { icon: PenTool, title: "商品企划", desc: "基于数据驱动，精准组货，差异化选品" },
  { icon: Package, title: "方案交付", desc: "选品、陈列、企划全套方案落地交付" },
  { icon: RefreshCw, title: "持续跟踪", desc: "定期复盘优化，确保方案持续产生价值" },
];

/* 销售话术库 */
const salesScripts = [
  {
    scene: "开场破冰",
    tags: ["迎宾", "第一印象"],
    scripts: [
      "欢迎光临！我们刚到一批新款，有几件特别适合您的风格，我帮您推荐一下？",
      "您好！今天想逛逛什么风格？我们最近上了一批很受欢迎的搭配套装。",
    ],
  },
  {
    scene: "需求挖掘",
    tags: ["探需", "画像"],
    scripts: [
      "您平时穿衣更喜欢休闲还是偏正式一点的？这样我可以更精准地帮您挑。",
      "请问您今天是有特定场合需要搭配，还是想日常更新一下衣橱？",
    ],
  },
  {
    scene: "产品介绍",
    tags: ["卖点", "价值"],
    scripts: [
      "这件是我们这季的爆款，面料是XX材质，透气又亲肤，很多老顾客回购。",
      "这个版型特别修饰身形，您看腰线这里的设计，视觉上能拉长比例。",
    ],
  },
  {
    scene: "异议处理",
    tags: ["砍价", "犹豫"],
    scripts: [
      "理解您想对比一下，这件确实是我们性价比很高的款，而且今天有会员专属折扣。",
      "如果您担心颜色，我们支持7天无理由退换，您可以先拿回家搭配试试看。",
    ],
  },
  {
    scene: "连带推荐",
    tags: ["加购", "搭配"],
    scripts: [
      "这件上衣搭配那条阔腿裤特别好看，我帮您一起拿过来试试？",
      "您选的这件外套，里面搭一件真丝吊带会更有层次感，我帮您找一下？",
    ],
  },
  {
    scene: "促成成交",
    tags: ["逼单", "收尾"],
    scripts: [
      "这套搭配下来刚好满减，等于帮您省了XX元，今天带走特别划算。",
      "这个尺码只剩最后两件了，我先帮您留着，您考虑好了随时找我。",
    ],
  },
];

/* VIP客户管理看板模拟数据 */
const vipCustomerDemo = [
  { name: "张女士", level: "V3 黑卡", spend: 86000, visits: 24, lastVisit: "3天前", tags: ["暖春型", "优雅风", "高客单"], rfm: "重要价值" },
  { name: "李女士", level: "V2 金卡", spend: 42000, visits: 15, lastVisit: "1周前", tags: ["浅夏型", "淑女风", "复购高"], rfm: "重要发展" },
  { name: "王女士", level: "V2 金卡", spend: 38000, visits: 12, lastVisit: "2周前", tags: ["深秋型", "职业风", "新品敏感"], rfm: "重要保持" },
  { name: "陈女士", level: "V1 银卡", spend: 18000, visits: 8, lastVisit: "1月前", tags: ["净冬型", "潮牌风"], rfm: "重要挽留" },
  { name: "赵女士", level: "V1 银卡", spend: 12000, visits: 6, lastVisit: "3周前", tags: ["柔夏型", "休闲风"], rfm: "一般价值" },
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
/*  Props                                                              */
/* ------------------------------------------------------------------ */
export default function MarketingClient({ initialTab }: { initialTab?: string }) {
  const searchParams = useSearchParams();
  const tabFromUrl = (searchParams.get("tab") as TabKey) || (initialTab as TabKey) || "marketing";
  const [activeTab, setActiveTab] = useState<TabKey>(
    TABS.some((t) => t.key === tabFromUrl) ? tabFromUrl : "marketing"
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

      {/* 营销服务定价 */}
      <section className="py-16 lg:py-20 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Service Pricing</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">营销服务定价</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">从年度方案到单次咨询，灵活选择适合您的营销服务。</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            {[
              {
                name: "年度营销方案定制",
                price: "¥3,800",
                unit: "起/年",
                features: ["年度营销节奏规划", "全年节日活动排期", "内容日历定制", "渠道投放策略", "季度复盘报告"],
                icon: CalendarDays,
                color: "from-blue-500 to-cyan-400",
              },
              {
                name: "节日/活动策划包",
                price: "¥1,980",
                unit: "/季度",
                features: ["季度主题活动策划", "执行手册交付", "物料设计建议", "转化路径设计", "效果追踪模板"],
                icon: Megaphone,
                color: "from-accent to-pink-400",
                highlight: true,
              },
              {
                name: "1v1营销顾问咨询",
                price: "¥598",
                unit: "/小时",
                features: ["店铺营销诊断", "问题定位分析", "定制化建议", "落地执行指导", "后续跟进一次"],
                icon: Target,
                color: "from-emerald-500 to-green-400",
              },
            ].map((service, i) => (
              <motion.div key={service.name} variants={fadeUp} custom={i}>
                <div className={`group flex flex-col h-full rounded-2xl bg-white border-2 transition-all duration-300 overflow-hidden ${service.highlight ? "border-accent shadow-lg" : "border-gray-100 shadow-sm hover:shadow-lg"}`}>
                  <div className={`bg-gradient-to-r ${service.color} p-6 text-white`}>
                    <div className="flex items-center gap-3">
                      <service.icon className="w-8 h-8" />
                      <h3 className="text-lg font-bold">{service.name}</h3>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-accent">{service.price}</span>
                      <span className="text-sm text-gray-500 ml-1">{service.unit}</span>
                    </div>
                    <ul className="space-y-2.5 flex-1">
                      {service.features.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/contact" className="mt-6 block w-full py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent/90 transition-colors text-center">
                      立即咨询
                    </Link>
                  </div>
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

      {/* 销售话术库 */}
      <section className="py-16 lg:py-20 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Sales Scripts</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">实战销售话术库</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">覆盖全流程六大场景，即学即用，快速提升成交率与连带率。</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            {salesScripts.map((item, i) => (
              <motion.div key={item.scene} variants={fadeUp} custom={i}>
                <div className="h-full p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-bold text-primary">{item.scene}</h3>
                    <div className="flex gap-1">
                      {item.tags.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 bg-accent/10 text-accent text-[10px] rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {item.scripts.map((script, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">{idx + 1}</span>
                        <p className="text-sm text-gray-700 leading-relaxed">{script}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 服务包 */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Service Packages</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">服务包案例</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">从诊断到落地的完整解决方案，配合实战话术，高效成交。</p>
          </motion.div>
          {loading ? renderLoading() : (
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
              {serviceImages.length > 0 ? serviceImages.map((item, i) => renderImageCard(item, i)) : renderEmpty("服务包案例")}
            </motion.div>
          )}
        </div>
      </section>

      {/* 销售服务定价 */}
      <section className="py-16 lg:py-20 bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Service Pricing</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">销售服务定价</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">从话术训练到客户管理方案，提升门店销售转化效率。</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            {[
              {
                name: "销售话术训练营",
                price: "¥1,280",
                unit: "/人",
                features: ["全场景话术模板", "线上视频课程", "实战演练指导", "考核认证证书", "社群答疑陪伴"],
                icon: Megaphone,
                color: "from-orange-500 to-amber-400",
              },
              {
                name: "客户跟进SOP定制",
                price: "¥1,980",
                unit: "/套",
                features: ["客户分层模型", "跟进节奏设计", "话术库定制", "转化节点设置", "执行手册交付"],
                icon: Users,
                color: "from-accent to-pink-400",
                highlight: true,
              },
              {
                name: "1v1销售教练",
                price: "¥598",
                unit: "/小时",
                features: ["销售能力诊断", "个性化提升方案", "实战陪跑带教", "问题现场纠正", "后续跟踪一次"],
                icon: Handshake,
                color: "from-teal-500 to-emerald-400",
              },
            ].map((service, i) => (
              <motion.div key={service.name} variants={fadeUp} custom={i}>
                <div className={`group flex flex-col h-full rounded-2xl bg-white border-2 transition-all duration-300 overflow-hidden ${service.highlight ? "border-accent shadow-lg" : "border-gray-100 shadow-sm hover:shadow-lg"}`}>
                  <div className={`bg-gradient-to-r ${service.color} p-6 text-white`}>
                    <div className="flex items-center gap-3">
                      <service.icon className="w-8 h-8" />
                      <h3 className="text-lg font-bold">{service.name}</h3>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-accent">{service.price}</span>
                      <span className="text-sm text-gray-500 ml-1">{service.unit}</span>
                    </div>
                    <ul className="space-y-2.5 flex-1">
                      {service.features.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/contact" className="mt-6 block w-full py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent/90 transition-colors text-center">
                      立即咨询
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 店铺级服务交付 */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Store-Level Service</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">店铺级服务交付系统</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">不是一份报告，而是一套能让你服务客户、让客户营利的持续交付系统。以核心会员为根基，以数据为驱动，帮每一家店铺找到差异化竞争力。</p>
          </motion.div>

          {/* 核心理念 */}
          <motion.div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 sm:p-12 text-white mb-12" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><Store className="w-6 h-6" /></div>
              <h3 className="text-2xl font-bold">以店铺为单位，以会员为核心</h3>
            </div>
            <p className="text-white/80 leading-relaxed max-w-3xl">
              当下市场供过于求，唯有精准定位核心会员需求，才能稳住店铺发展。我们通过逐一测试会员色彩季型与风格，
              统计店铺会员画像分布，结合经营数据，为每一家店铺定制差异化的商品企划方案——让选品有数据支撑，让经营有方向指引。
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              {[
                { value: "色彩季型", desc: "精准匹配颜色偏好" },
                { value: "风格画像", desc: "锁定面料剪裁图案" },
                { value: "数据企划", desc: "差异化组货选品" },
                { value: "持续交付", desc: "不止报告的闭环" },
              ].map((item) => (
                <div key={item.value} className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                  <div className="text-lg font-bold">{item.value}</div>
                  <div className="text-xs text-white/70 mt-1">{item.desc}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 服务流程 */}
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            {storeServiceSteps.map((item, i) => (
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


          {/* 三步启动入口：把展示变成转化 */}
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mt-12">
            <motion.div className="bg-white rounded-3xl shadow-lg border border-accent/10 p-8 sm:p-10" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <div className="text-center mb-8">
                <span className="text-accent font-bold text-sm tracking-widest uppercase">Start Now</span>
                <h3 className="mt-3 text-2xl sm:text-3xl font-bold text-primary">开始你的店铺买手系统</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">三步启动，让VIP数据变成选品决策依据</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                {[
                  { step: "01", title: "录入店铺", desc: "填写店铺信息，逐一录入核心VIP会员，完成色彩季型与风格测试", href: "/admin/stores", cta: "前往店铺管理" },
                  { step: "02", title: "生成企划", desc: "系统自动聚合会员画像，AI生成色彩/风格/品类/价格带完整企划方案", href: "/admin/store-buyer", cta: "打开买手决策" },
                  { step: "03", title: "落地跟踪", desc: "按企划采购陈列，分区展示，定期复盘销售数据持续优化", href: "/admin/deliveries", cta: "查看交付方案" },
                ].map((item, i) => (
                  <motion.div key={item.step} variants={fadeUp} custom={i}>
                    <Link href={item.href} className="group block">
                      <div className="relative p-6 rounded-2xl bg-muted hover:bg-accent/5 border border-transparent hover:border-accent/20 transition-all duration-300 h-full">
                        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-lg bg-accent text-white text-sm font-bold flex items-center justify-center shadow-md">{item.step}</div>
                        <h4 className="font-bold text-primary mb-2">{item.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-accent group-hover:gap-2 transition-all">
                          {item.cta}<ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div className="text-center mt-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <p className="text-muted-foreground mb-4">已有 <span className="font-bold text-accent">50+</span> 家店铺启动买手系统</p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
                预约免费诊断 <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/admin/stores" className="inline-flex items-center gap-2 px-8 py-3 border-2 border-accent text-accent font-semibold rounded-xl hover:bg-accent/5 transition-colors">
                直接录入店铺 <Store className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
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

      {/* VIP增值服务 · 收费项目 */}
      <section className="py-16 lg:py-20 bg-gradient-to-b from-amber-50/50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Premium Services</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">VIP增值服务</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">专业色彩诊断、形象顾问、穿搭定制，为VIP客户打造极致专属体验。</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            {[
              {
                name: "VIP色彩+风格诊断",
                price: "¥1,980",
                unit: "/人",
                groupPrice: "¥59,400/30人",
                groupTag: "新客5折 ¥29,700",
                features: ["12季色彩精准诊断", "八大风格定位分析", "个人色彩报告书", "搭配建议方案", "季型色卡专属定制"],
                icon: Palette,
                color: "from-pink-500 to-rose-400",
                highlight: true,
              },
              {
                name: "1v1私人形象顾问",
                price: "¥19,800",
                unit: "/次",
                features: ["上门衣橱整理诊断", "个人形象全案设计", "12套场景穿搭方案", "购物清单精准推荐", "全年形象跟踪顾问"],
                icon: Crown,
                color: "from-amber-500 to-yellow-400",
                highlight: false,
              },
              {
                name: "门店VIP季度穿搭方案",
                price: "¥98,000",
                unit: "/30人/季度",
                features: ["季度主题穿搭企划", "30人专属穿搭档案", "门店陈列搭配指导", "VIP到店穿搭服务", "季度效果复盘优化"],
                icon: Gem,
                color: "from-violet-500 to-purple-400",
                highlight: false,
              },
            ].map((service, i) => (
              <motion.div key={service.name} variants={fadeUp} custom={i}>
                <div className={`group flex flex-col h-full rounded-2xl bg-white border-2 transition-all duration-300 overflow-hidden ${service.highlight ? "border-accent shadow-lg" : "border-gray-100 shadow-sm hover:shadow-lg"}`}>
                  <div className={`bg-gradient-to-r ${service.color} p-6 text-white relative`}>
                    {service.highlight && <span className="absolute top-3 right-3 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">热门</span>}
                    <div className="flex items-center gap-3">
                      <service.icon className="w-8 h-8" />
                      <div>
                        <h3 className="text-lg font-bold">{service.name}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-accent">{service.price}</span>
                        <span className="text-sm text-gray-500">{service.unit}</span>
                      </div>
                      {service.groupPrice && (
                        <div className="mt-1 text-sm">
                          <span className="text-gray-500">团体价 {service.groupPrice}</span>
                          {service.groupTag && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">{service.groupTag}</span>}
                        </div>
                      )}
                    </div>
                    <ul className="space-y-2.5 flex-1">
                      {service.features.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/contact" className="mt-6 block w-full py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent/90 transition-colors text-center">
                      立即咨询
                    </Link>
                  </div>
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

      {/* VIP客户管理看板 */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">VIP Dashboard</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">店铺VIP客户管理</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">精准管理每一位终端消费VIP，标签化运营，提升复购与客单价。</p>
          </motion.div>

          {/* 统计卡片 */}
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            {[
              { label: "VIP总数", value: "128", change: "+12%", color: "text-primary" },
              { label: "本月消费", value: "¥18.6万", change: "+8%", color: "text-accent" },
              { label: "复购率", value: "67%", change: "+5%", color: "text-green-600" },
              { label: "客单价", value: "¥3,200", change: "+15%", color: "text-amber-600" },
            ].map((stat, i) => (
              <motion.div key={stat.label} variants={fadeUp} custom={i}>
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-green-500 mt-1">{stat.change} 较上月</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* 客户列表 */}
          <motion.div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={fadeUp}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-primary">核心VIP客户列表</h3>
              <span className="text-xs text-gray-400">RFM模型自动分级</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs">
                    <th className="px-6 py-3 text-left font-medium">客户</th>
                    <th className="px-6 py-3 text-left font-medium">等级</th>
                    <th className="px-6 py-3 text-left font-medium">年消费</th>
                    <th className="px-6 py-3 text-left font-medium">到店次数</th>
                    <th className="px-6 py-3 text-left font-medium">最近到店</th>
                    <th className="px-6 py-3 text-left font-medium">标签</th>
                    <th className="px-6 py-3 text-left font-medium">RFM分级</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vipCustomerDemo.map((c) => (
                    <tr key={c.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-primary">{c.name}</td>
                      <td className="px-6 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          c.level.includes("黑卡") ? "bg-gray-800 text-white" :
                          c.level.includes("金卡") ? "bg-amber-100 text-amber-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>{c.level}</span>
                      </td>
                      <td className="px-6 py-3.5 text-accent font-semibold">¥{(c.spend / 10000).toFixed(1)}万</td>
                      <td className="px-6 py-3.5 text-gray-600">{c.visits}次</td>
                      <td className="px-6 py-3.5 text-gray-500">{c.lastVisit}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {c.tags.map((t) => (
                            <span key={t} className="px-1.5 py-0.5 bg-primary/5 text-primary text-[10px] rounded-full">{t}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          c.rfm.includes("重要") ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"
                        }`}>{c.rfm}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* VIP运营节奏 */}
      <section className="py-16 lg:py-20 bg-muted">
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
                  风格测试 <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
