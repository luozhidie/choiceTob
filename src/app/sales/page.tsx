"use client";
import { useState } from "react";
import { PaywallModal } from "@/components/PaywallModal";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  Handshake,
  Stethoscope,
  PenTool,
  ShoppingCart,
  RefreshCw,
  HeartHandshake,
  Video,
  Package,
  Crown,
  FileText,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Home,
  Users,
  Sparkles,
  Mic,
  ListChecks,
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
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const salesSteps = [
  {
    icon: Handshake,
    title: "建立信任",
    desc: "通过专业形象展示、行业洞察分享与真实案例背书，快速建立客户对品牌与顾问的专业信任感。",
    key: "第一印象决定80%成交可能",
  },
  {
    icon: Stethoscope,
    title: "诊断需求",
    desc: "以买手视角深入分析客户店铺现状，从商品结构、客户画像、运营数据三维度精准定位问题与机会。",
    key: "找到真问题才能给对方案",
  },
  {
    icon: PenTool,
    title: "方案设计",
    desc: "根据诊断结果，定制包含选品策略、陈列方案、营销计划的综合解决方案，确保每项建议可落地可衡量。",
    key: "方案越具体成交率越高",
  },
  {
    icon: ShoppingCart,
    title: "体验成交",
    desc: "提供小批量试单或体验装方案，降低客户决策门槛，通过实际效果验证方案价值，推动正式合作。",
    key: "体验是成交的最佳催化剂",
  },
  {
    icon: RefreshCw,
    title: "持续跟进",
    desc: "建立7天-30天-90天跟进节奏，持续关注方案执行效果，及时调整优化，确保客户持续获得价值。",
    key: "成交只是服务的开始",
  },
  {
    icon: HeartHandshake,
    title: "长期服务",
    desc: "从单次交易升级为长期伙伴，通过季度复盘、年度规划、专属顾问等深度服务，实现客户终身价值最大化。",
    key: "长期客户贡献80%利润",
  },
];

const funnelItems = [
  {
    icon: Video,
    title: "直播引流",
    desc: "专业搭配直播+行业干货分享",
    price: "免费",
    color: "from-blue-400 to-blue-600",
    width: "100%",
  },
  {
    icon: Stethoscope,
    title: "1000元在线诊断",
    desc: "专业买手诊断店铺问题",
    price: "¥1,000",
    color: "from-primary to-primary/80",
    width: "80%",
  },
  {
    icon: Package,
    title: "8800元店铺服务包",
    desc: "全链路店铺运营解决方案",
    price: "¥8,800",
    color: "from-accent to-accent/80",
    width: "60%",
  },
  {
    icon: Crown,
    title: "年度VIP",
    desc: "专属顾问+全年度运营陪伴",
    price: "¥39,800起",
    color: "from-yellow-600 to-yellow-800",
    width: "40%",
  },
];

const diagnosisDimensions = [
  { title: "商品结构", desc: "品类占比、价格带分布、SKU深度分析" },
  { title: "客户画像", desc: "核心客群特征、消费偏好、复购行为" },
  { title: "陈列效果", desc: "动线规划、视觉呈现、连带率分析" },
  { title: "营销节奏", desc: "活动频率、促销策略、渠道覆盖" },
  { title: "库存健康", desc: "周转天数、滞销占比、补货效率" },
  { title: "竞品对比", desc: "同区域竞品分析、差异化定位建议" },
];

const servicePackItems = [
  { title: "深度店铺诊断报告", desc: "6大维度全面分析，输出可执行改善方案" },
  { title: "季度选品方案", desc: "基于数据驱动的精准选品推荐" },
  { title: "陈列搭配方案", desc: "店铺视觉呈现与连带搭配策略" },
  { title: "营销活动策划", desc: "2场月度营销活动方案与执行支持" },
  { title: "VIP客户运营", desc: "客户分层策略与专属权益设计" },
  { title: "买手一对一陪跑", desc: "每周1次线上沟通，持续优化调整" },
  { title: "行业数据月报", desc: "行业趋势与竞品动态月度推送" },
];

const salesScripts = [
  {
    scene: "客户嫌贵",
    icon: "💰",
    objection: "\"你们的方案太贵了\""
    ,
    response: "理解您的顾虑。我们换个角度算一笔账：8800元服务包包含7项专业服务，平均每项仅1257元。而一次精准选品就能帮您避免几万元的库存积压，一次好的营销活动就能带来数万的新增营收。这不是成本，是投资，而且是有明确回报的投资。",
    key: "价值重构：从成本视角转为投资视角",
  },
  {
    scene: "客户犹豫",
    icon: "🤔",
    objection: "\"我再考虑考虑\""
    ,
    response: "完全理解，选择合作伙伴确实需要慎重。我想确认一下，您主要在顾虑哪方面？是对方案效果不确定，还是对合作流程有疑问？如果是效果，我们可以先从1000元的在线诊断开始，15分钟就能帮您看清店铺的核心问题。看到问题，您就更有信心做决策了。",
    key: "降低门槛：用小单验证，用效果说服",
  },
  {
    scene: "只想买一件",
    icon: "👗",
    objection: "\"我只想买这一件衣服\""
    ,
    response: "这件确实很适合您！不过作为您的形象顾问，我注意到您今天的搭配如果加上这条丝巾/这件外套，整体效果会更出彩。要不您试一下搭配效果？搭配购买我们还有专属折扣，比单买更划算。",
    key: "连带推荐：从单品到搭配，提升客单价",
  },
  {
    scene: "推荐服务包",
    icon: "📦",
    objection: "\"单次服务就够了\""
    ,
    response: "单次服务当然可以，不过从我们服务过的5000+客户数据来看，选择服务包的客户3个月后的业绩改善幅度是单次服务的3倍以上。原因很简单——服装经营是系统工程，选品、陈列、营销环环相扣，单点改善很难持续。服务包的好处是系统化解决问题，而且平均到每次服务成本更低。",
    key: "系统思维：从单点到系统，用数据说话",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function SalesPage() {
  const [showPaywall, setShowPaywall] = useState(false);

  return (
    <>
      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="完整数据与深度分析"
        description="登录后购买会员或单次付费即可查看完整内容"
        type="single"
      />
      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-8">
            <Link href="/" className="hover:text-white/80 transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" /> 首页
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white/90">销售服务</span>
          </nav>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-6">
              <Users className="w-4 h-4" />
              顾问式销售，价值驱动成交
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl font-bold leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            销售服务<span className="text-accent">体系</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg text-white/80 leading-relaxed max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            以顾问式销售方法论为核心，从建立信任到长期服务全流程赋能，让每一次客户接触都成为价值传递的契机。
          </motion.p>
        </div>
      </section>

      {/* ====== 顾问式销售六步法 ====== */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              Consultative Sales
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              顾问式销售六步法
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              以客户需求为中心，以专业价值为驱动，六步闭环打造高转化销售体系。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {salesSteps.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                <div className="group relative flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                  <div className="absolute top-6 right-6 text-5xl font-bold text-gray-100 group-hover:text-accent/10 transition-colors">
                    0{i + 1}
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-primary">{item.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                    {item.desc}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-accent">{item.key}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== 产品体系 - 漏斗展示 ====== */}
      <section className="py-20 lg:py-28 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              Product Funnel
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              产品体系展示
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              四层漏斗式产品体系，从免费引流到深度服务，层层递进，层层转化。
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {funnelItems.map((item, i) => (
              <motion.div
                key={item.title}
                className="mx-auto"
                style={{ width: item.width }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                custom={i}
              >
                <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${item.color} text-white p-6 sm:p-8`}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 shrink-0">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <p className="mt-1 text-white/80 text-sm">{item.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-2xl font-bold">{item.price}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 1000元在线诊断 ====== */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              Online Diagnosis
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              1000元店铺在线诊断
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              专业买手15分钟连麦诊断，快速定位店铺核心问题，出具可执行的改善建议。
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* 买手角色 & SOP */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
            >
              <div className="p-8 rounded-2xl bg-primary text-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/20 text-accent">
                    <Mic className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">15分钟连麦SOP</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { time: "0-3min", content: "破冰与需求确认：了解店铺基本情况、核心痛点与期望" },
                    { time: "3-8min", content: "6维快速诊断：商品/客户/陈列/营销/库存/竞品逐一扫描" },
                    { time: "8-12min", content: "核心问题定位：聚焦最关键的2-3个改善点" },
                    { time: "12-15min", content: "改善建议输出：给出可立即执行的3条行动建议" },
                  ].map((step) => (
                    <div key={step.time} className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-white/10 text-accent text-xs font-mono font-bold shrink-0">
                        {step.time}
                      </span>
                      <p className="text-white/80 text-sm leading-relaxed">{step.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* 6大诊断维度 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={stagger}
            >
              <h3 className="text-xl font-bold text-primary mb-6">6大诊断维度</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {diagnosisDimensions.map((item, i) => (
                  <motion.div key={item.title} variants={fadeUp} custom={i}>
                    <div className="p-5 rounded-xl bg-muted border border-gray-100 hover:border-accent/30 transition-colors">
                      <h4 className="font-bold text-primary text-sm">{item.title}</h4>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ====== 8800元服务包 ====== */}
      <section className="py-20 lg:py-28 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              Service Package
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              8800元店铺诊断服务包
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              七项专业服务全涵盖，季度陪伴式运营，从诊断到落地的完整解决方案。
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* 服务列表 */}
            <div className="lg:col-span-2">
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={stagger}
              >
                {servicePackItems.map((item, i) => (
                  <motion.div key={item.title} variants={fadeUp} custom={i}>
                    <div className="flex items-start gap-3 p-5 rounded-xl bg-white border border-gray-100 hover:border-accent/30 transition-colors">
                      <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-primary text-sm">{item.title}</h4>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* 费用结构 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
            >
              <div className="p-8 rounded-2xl bg-primary text-white sticky top-24">
                <h3 className="text-xl font-bold mb-6">费用结构</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <span className="text-white/80">深度诊断报告</span>
                    <span className="font-semibold">¥2,000</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <span className="text-white/80">季度选品方案</span>
                    <span className="font-semibold">¥1,500</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <span className="text-white/80">陈列+营销方案</span>
                    <span className="font-semibold">¥2,000</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <span className="text-white/80">VIP运营方案</span>
                    <span className="font-semibold">¥1,000</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <span className="text-white/80">买手陪跑(12次)</span>
                    <span className="font-semibold">¥1,800</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <span className="text-white/80">行业数据月报</span>
                    <span className="font-semibold">¥500</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-bold text-accent">服务包总价</span>
                    <span className="text-3xl font-bold text-accent">¥8,800</span>
                  </div>
                  <p className="text-xs text-white/50">相比单项购买节省¥1,000</p>
                </div>
                <Link
                  href="/contact"
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors"
                >
                  立即购买 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ====== 销售话术库 ====== */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              Sales Scripts
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              销售话术库
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              四大高频场景实战话术，从异议处理到价值传递，每一句都经过实战验证。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {salesScripts.map((item, i) => (
              <motion.div key={item.scene} variants={fadeUp} custom={i}>
                <div className="flex flex-col h-full p-8 rounded-2xl bg-muted border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{item.icon}</span>
                    <h3 className="text-lg font-bold text-primary">{item.scene}</h3>
                  </div>
                  <div className="p-4 rounded-lg bg-white border border-gray-200 mb-4">
                    <p className="text-sm text-muted-foreground italic">{item.objection}</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1">{item.response}</p>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-accent">{item.key}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Login Prompt ====== */}
      <section className="py-20 lg:py-28 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-12 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl text-center">
            <div className="max-w-xl mx-auto px-6">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-lg font-bold text-primary">完整数据与深度分析</h3>
              <p className="mt-2 text-sm text-muted-foreground">详细商业数据、供应链信息与专业分析报告，仅对授权用户开放</p>
              <a href="/admin/login" className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                登录管理后台
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-20 lg:py-28 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-8 sm:px-12 lg:px-20 py-14 sm:py-20 text-center text-white"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-accent/10 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold">
                预约1000元在线诊断
              </h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                15分钟专业买手连麦，6大维度精准诊断，3条可执行改善建议。让数据说话，让专业做主。
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  预约在线诊断
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/vip"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  了解VIP服务
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
