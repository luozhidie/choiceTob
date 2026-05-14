"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  Calendar,
  Megaphone,
  Users,
  Clock,
  Gift,
  Crown,
  Presentation,
  Share2,
  BarChart3,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Home,
  Target,
  Eye,
  MousePointerClick,
  ShoppingCart,
  Repeat,
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
const calendarData = [
  { month: "1月", theme: "新年焕新", event: "新春穿搭指南+满减活动", target: "复购率+25%" },
  { month: "2月", theme: "情人节浪漫", event: "情侣搭配专题+限时礼盒", target: "客单价+30%" },
  { month: "3月", theme: "女王节盛典", event: "女性主题搭配课+VIP专场", target: "新客+500" },
  { month: "4月", theme: "春日焕型", event: "春季新品企划+搭配大赛", target: "连带率+20%" },
  { month: "5月", theme: "母亲节感恩", event: "母女装搭配+礼品专区", target: "转介绍+15%" },
  { month: "6月", theme: "年中大促", event: "618限时企划+老带新裂变", target: "GMV+50%" },
  { month: "7月", theme: "盛夏派对", event: "度假穿搭+主题选品会", target: "新客+300" },
  { month: "8月", theme: "秋装预售", event: "早秋预售+VIP优先购", target: "预售额+40%" },
  { month: "9月", theme: "开学季风尚", event: "职场穿搭课+新人礼包", target: "复购率+20%" },
  { month: "10月", theme: "金秋双节", event: "国庆专题+行业分享会", target: "GMV+35%" },
  { month: "11月", theme: "双11狂欢", event: "全年最大力度+限时秒杀", target: "GMV+80%" },
  { month: "12月", theme: "年终答谢", event: "VIP感恩宴+年度复盘", target: "续约率+30%" },
];

const activityTypes = [
  {
    icon: Crown,
    title: "VIP专场日",
    desc: "每月固定2-3场VIP专场，提前购、专属折扣、限量款优先选，强化尊贵感与归属感。",
    metrics: "场均转化率35%+",
  },
  {
    icon: Presentation,
    title: "主题搭配课",
    desc: "围绕季节/场合/风格开展线上搭配教学，输出专业内容的同时带动商品销售。",
    metrics: "课程转化率20%+",
  },
  {
    icon: Users,
    title: "老带新裂变",
    desc: "老客户推荐新客户双方享优惠，三级裂变机制，低成本高效获客。",
    metrics: "单次裂变获客50+",
  },
  {
    icon: Clock,
    title: "线上限时企划",
    desc: "48小时限时主题活动，制造紧迫感，快速引爆销量，适合清库存与推新品。",
    metrics: "限时活动GMV提升60%",
  },
  {
    icon: Target,
    title: "B端选品会",
    desc: "定期组织线上/线下选品会，集中展示新品，高效促成批量采购决策。",
    metrics: "单场成交额50万+",
  },
  {
    icon: Share2,
    title: "行业分享会",
    desc: "邀请行业专家与成功客户分享经验，建立品牌专业形象，吸引潜在客户。",
    metrics: "场均参与200+人",
  },
];

const contentMatrix = [
  { platform: "微信公众号", type: "深度文章/行业报告", frequency: "每周3篇", goal: "品牌权威性建设", kpi: "阅读量10万+/月" },
  { platform: "小红书", type: "穿搭笔记/种草图文", frequency: "每日1-2篇", goal: "精准获客引流", kpi: "笔记曝光50万+/月" },
  { platform: "抖音/视频号", type: "短视频/直播切片", frequency: "每日1条+周1直播", goal: "流量获取与转化", kpi: "视频播放100万+/月" },
  { platform: "社群/私域", type: "专属福利/搭配推荐", frequency: "每日3-5条", goal: "客户深度运营", kpi: "社群活跃度60%+" },
  { platform: "官网/小程序", type: "活动页/专题页", frequency: "月度更新", goal: "品牌形象与转化", kpi: "转化率8%+" },
];

const trackingMetrics = [
  { icon: Eye, label: "曝光量", desc: "各渠道活动触达人数，衡量品牌声量" },
  { icon: MousePointerClick, label: "点击率", desc: "从曝光到点击的转化，评估内容吸引力" },
  { icon: ShoppingCart, label: "转化率", desc: "从点击到购买的转化，衡量销售效率" },
  { icon: BarChart3, label: "客单价", desc: "活动期间平均客单价变化，评估活动价值" },
  { icon: Repeat, label: "复购率", desc: "活动后30天复购比例，衡量客户粘性" },
  { icon: TrendingUp, label: "ROI", desc: "投入产出比，综合评估营销效果" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function MarketingPage() {
  return (
    <>
      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-8">
            <Link href="/" className="hover:text-white/80 transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" /> 首页
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white/90">营销策划</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-6">
              <Megaphone className="w-4 h-4" />
              精准营销，高效转化
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl font-bold leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            营销策划<span className="text-accent">全案服务</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg text-white/80 leading-relaxed max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            从年度营销规划到单场活动落地，以数据驱动营销策略，全渠道精准触达目标客户，实现流量与转化的双增长。
          </motion.p>
        </div>
      </section>

      {/* ====== 年度营销日历 ====== */}
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
              Annual Calendar
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              年度营销日历
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              12个月全覆盖，月月有主题、有活动、有目标，确保营销节奏不中断。
            </p>
          </motion.div>

          <motion.div
            className="overflow-x-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={fadeUp}
          >
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="px-6 py-4 text-left font-semibold text-sm rounded-tl-xl">月份</th>
                  <th className="px-6 py-4 text-left font-semibold text-sm">营销主题</th>
                  <th className="px-6 py-4 text-left font-semibold text-sm">核心活动</th>
                  <th className="px-6 py-4 text-left font-semibold text-sm rounded-tr-xl">目标</th>
                </tr>
              </thead>
              <tbody>
                {calendarData.map((row, i) => (
                  <tr
                    key={row.month}
                    className={`border-b border-gray-100 hover:bg-accent/5 transition-colors ${
                      i % 2 === 0 ? "bg-muted/50" : "bg-white"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 font-semibold text-primary">
                        <Calendar className="w-4 h-4 text-accent" />
                        {row.month}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{row.theme}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{row.event}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                        {row.target}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ====== 六种核心活动类型 ====== */}
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
              Core Activities
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              六种核心活动类型
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              从获客到转化到留存，覆盖营销全场景的活动矩阵。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {activityTypes.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                <div className="group flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-primary">{item.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                    {item.desc}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-sm font-medium text-accent">{item.metrics}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== 内容营销矩阵 ====== */}
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
              Content Matrix
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              内容营销矩阵
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              五大平台精准分发，内容驱动流量，流量带动转化。
            </p>
          </motion.div>

          <motion.div
            className="overflow-x-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={fadeUp}
          >
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="px-6 py-4 text-left font-semibold text-sm rounded-tl-xl">平台</th>
                  <th className="px-6 py-4 text-left font-semibold text-sm">内容类型</th>
                  <th className="px-6 py-4 text-left font-semibold text-sm">更新频率</th>
                  <th className="px-6 py-4 text-left font-semibold text-sm">核心目标</th>
                  <th className="px-6 py-4 text-left font-semibold text-sm rounded-tr-xl">考核KPI</th>
                </tr>
              </thead>
              <tbody>
                {contentMatrix.map((row, i) => (
                  <tr
                    key={row.platform}
                    className={`border-b border-gray-100 hover:bg-accent/5 transition-colors ${
                      i % 2 === 0 ? "bg-muted/50" : "bg-white"
                    }`}
                  >
                    <td className="px-6 py-4 font-semibold text-primary">{row.platform}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{row.type}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{row.frequency}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{row.goal}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                        {row.kpi}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ====== 营销效果追踪指标 ====== */}
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
              Tracking Metrics
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              营销效果追踪指标
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              数据驱动决策，每一个营销动作都可衡量、可优化。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {trackingMetrics.map((item, i) => (
              <motion.div key={item.label} variants={fadeUp} custom={i}>
                <div className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-accent/10 text-accent shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary">{item.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-20 lg:py-28 bg-white">
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
              <h2 className="text-3xl sm:text-4xl font-bold">定制您的专属营销方案</h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                基于您的品牌定位与客户画像，量身定制年度营销策略与执行方案，让每一分营销投入都产生最大价值。
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  定制营销方案
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/sales"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  了解销售服务
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
