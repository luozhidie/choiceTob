"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  ArrowRight,
  Database,
  FileOutput,
  Activity,
  PieChart,
  Palette,
  Tag,
  FileText,
  CheckCircle2,
  Home,
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
const flowSteps = [
  {
    icon: Database,
    title: "数据输入",
    items: ["历史销售数据", "市场趋势数据", "客户画像数据", "库存结构数据"],
  },
  {
    icon: FileOutput,
    title: "企划输出",
    items: ["商品结构规划", "色彩企划方案", "价格带分布", "季度企划书"],
  },
  {
    icon: Activity,
    title: "执行跟踪",
    items: ["到货进度跟踪", "销售数据监控", "库存预警提醒", "方案动态调整"],
  },
];

const productStructure = [
  { type: "引流款", ratio: "15%", color: "bg-blue-500", desc: "低毛利高流量，吸引新客进店", width: "w-[15%]" },
  { type: "利润款", ratio: "50%", color: "bg-accent", desc: "核心利润来源，保证经营健康", width: "w-[50%]" },
  { type: "形象款", ratio: "20%", color: "bg-primary", desc: "品牌调性展示，提升品牌溢价", width: "w-[20%]" },
  { type: "搭配款", ratio: "15%", color: "bg-emerald-500", desc: "提升连带率，拉高客单价", width: "w-[15%]" },
];

const stylePlanTable = [
  { name: "少女型", traffic: "20%", profit: "45%", image: "20%", match: "15%" },
  { name: "优雅型", traffic: "15%", profit: "55%", image: "15%", match: "15%" },
  { name: "浪漫型", traffic: "10%", profit: "50%", image: "25%", match: "15%" },
  { name: "少年型", traffic: "20%", profit: "45%", image: "15%", match: "20%" },
  { name: "时尚型", traffic: "18%", profit: "48%", image: "18%", match: "16%" },
  { name: "古典型", traffic: "12%", profit: "55%", image: "18%", match: "15%" },
  { name: "自然型", traffic: "15%", profit: "50%", image: "15%", match: "20%" },
  { name: "戏剧型", traffic: "10%", profit: "40%", image: "30%", match: "20%" },
];

const colorPlan = [
  { type: "基础色", ratio: "40%", desc: "黑/白/灰/藏青等中性色，百搭实穿，保障基础销量", color: "bg-gray-600" },
  { type: "主题色", ratio: "35%", desc: "当季主题色系，体现品牌风格定位与季节感", color: "bg-primary" },
  { type: "点缀色", ratio: "15%", desc: "小面积亮色点缀，提升视觉层次与搭配丰富度", color: "bg-accent" },
  { type: "流行色", ratio: "10%", desc: "当季潮流色彩，吸引眼球，展现品牌时尚度", color: "bg-rose-500" },
];

const priceBands = [
  { band: "入门款", range: "99-199元", ratio: "20%", strategy: "低价引流，降低新客决策门槛", margin: "20-25%" },
  { band: "主销款", range: "199-399元", ratio: "45%", strategy: "量价平衡，贡献核心销量与利润", margin: "35-45%" },
  { band: "品质款", range: "399-699元", ratio: "25%", strategy: "提升品牌形象，拉高客单价", margin: "45-55%" },
  { band: "旗舰款", range: "699元以上", ratio: "10%", strategy: "品牌标杆，彰显品牌实力与调性", margin: "55-65%" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function PlanningPage() {
  return (
    <>
      {/* Breadcrumb */}
      <nav className="bg-muted/60 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
            首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary font-medium">商品企划</span>
        </div>
      </nav>

      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-4">
              <PieChart className="w-4 h-4" />
              科学企划，利润最大化
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              商品企划
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              从数据输入到企划输出再到执行跟踪，全流程科学规划商品结构、色彩、价格与节奏，
              帮助品牌实现利润最大化与库存最优化。
            </p>
          </motion.div>
        </div>
      </section>

      {/* ====== Full Flow ====== */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              企划全流程
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              商品企划全流程
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              从数据到决策，从规划到执行，形成闭环的企划管理体系
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {flowSteps.map((step, i) => (
              <motion.div key={step.title} variants={fadeUp} custom={i}>
                <div className="flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                      <step.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-accent font-semibold">STEP {i + 1}</span>
                      <h3 className="text-lg font-bold text-primary">{step.title}</h3>
                    </div>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {step.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Product Structure ====== */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              商品结构
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              商品结构规划
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              科学分配四大商品类型占比，实现引流与利润的最佳平衡
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {productStructure.map((item, i) => (
              <motion.div key={item.type} variants={fadeUp} custom={i}>
                <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className={`w-full h-3 rounded-full ${item.color} mb-6`} />
                  <div className="text-4xl font-bold text-primary">{item.ratio}</div>
                  <div className="mt-2 text-lg font-semibold text-primary">{item.type}</div>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Visual bar */}
          <motion.div
            className="mt-10 rounded-2xl bg-white p-6 shadow-sm border border-gray-100"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">商品结构占比分布</h3>
            <div className="flex h-8 rounded-full overflow-hidden">
              <div className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium" style={{ width: "15%" }}>
                15%
              </div>
              <div className="bg-accent flex items-center justify-center text-white text-xs font-medium" style={{ width: "50%" }}>
                50%
              </div>
              <div className="bg-primary flex items-center justify-center text-white text-xs font-medium" style={{ width: "20%" }}>
                20%
              </div>
              <div className="bg-emerald-500 flex items-center justify-center text-white text-xs font-medium" style={{ width: "15%" }}>
                15%
              </div>
            </div>
            <div className="flex mt-3 gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500" /> 引流款</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-accent" /> 利润款</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary" /> 形象款</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> 搭配款</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== Style Planning Table ====== */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              风格企划
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              八大风格企划商品结构
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              不同风格的商品结构差异化配置，精准匹配各风格客群消费特征
            </p>
          </motion.div>

          <motion.div
            className="overflow-x-auto rounded-2xl bg-white shadow-sm border border-gray-100"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={fadeUp}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="px-6 py-4 text-left font-semibold">风格类型</th>
                  <th className="px-6 py-4 text-center font-semibold">引流款</th>
                  <th className="px-6 py-4 text-center font-semibold">利润款</th>
                  <th className="px-6 py-4 text-center font-semibold">形象款</th>
                  <th className="px-6 py-4 text-center font-semibold">搭配款</th>
                </tr>
              </thead>
              <tbody>
                {stylePlanTable.map((row, i) => (
                  <tr
                    key={row.name}
                    className={`border-b border-gray-50 hover:bg-accent/5 transition-colors ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="px-6 py-4 font-semibold text-primary whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent" />
                        {row.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">{row.traffic}</td>
                    <td className="px-6 py-4 text-center font-semibold text-primary">{row.profit}</td>
                    <td className="px-6 py-4 text-center">{row.image}</td>
                    <td className="px-6 py-4 text-center">{row.match}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ====== Color Planning Matrix ====== */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              色彩企划
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              色彩企划矩阵
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              科学规划色彩结构，让每一季的色彩组合既实用又时尚
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {colorPlan.map((item, i) => (
              <motion.div key={item.type} variants={fadeUp} custom={i}>
                <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className={`w-16 h-16 rounded-2xl ${item.color} mb-4 shadow-sm`} />
                  <div className="text-3xl font-bold text-primary">{item.ratio}</div>
                  <div className="mt-1 text-lg font-semibold text-primary">{item.type}</div>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Visual color bar */}
          <motion.div
            className="mt-10 rounded-2xl bg-white p-6 shadow-sm border border-gray-100"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">色彩占比分布</h3>
            <div className="flex h-8 rounded-full overflow-hidden">
              <div className="bg-gray-600 flex items-center justify-center text-white text-xs font-medium" style={{ width: "40%" }}>
                40% 基础色
              </div>
              <div className="bg-primary flex items-center justify-center text-white text-xs font-medium" style={{ width: "35%" }}>
                35% 主题色
              </div>
              <div className="bg-accent flex items-center justify-center text-white text-xs font-medium" style={{ width: "15%" }}>
                15%
              </div>
              <div className="bg-rose-500 flex items-center justify-center text-white text-xs font-medium" style={{ width: "10%" }}>
                10%
              </div>
            </div>
            <div className="flex mt-3 gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-600" /> 基础色</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary" /> 主题色</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-accent" /> 点缀色</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-rose-500" /> 流行色</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== Price Band Planning ====== */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              价格企划
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              价格带企划
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              四档价格带科学分布，覆盖不同消费层级，实现利润与流量的最优组合
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {priceBands.map((item, i) => (
              <motion.div key={item.band} variants={fadeUp} custom={i}>
                <div className="flex flex-col h-full p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                      {item.band}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.ratio}</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">{item.range}</div>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                    {item.strategy}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">毛利率</span>
                      <span className="font-semibold text-accent">{item.margin}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Quarterly Plan Template ====== */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              企划模板
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              季度企划书模板
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              标准化企划流程，一键生成季度企划书，让企划有据可循
            </p>
          </motion.div>

          <motion.div
            className="max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
          >
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              {/* Template header */}
              <div className="bg-primary text-white px-8 py-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-accent" />
                  <div>
                    <h3 className="text-lg font-bold">2025年第三季度商品企划书</h3>
                    <p className="text-white/60 text-sm mt-1">基于数据驱动的商品规划方案</p>
                  </div>
                </div>
              </div>

              {/* Template sections */}
              <div className="p-8">
                <div className="space-y-6">
                  {[
                    { title: "一、市场分析与趋势预判", items: ["行业趋势分析", "竞品动态监测", "消费者洞察报告"] },
                    { title: "二、商品结构规划", items: ["品类结构占比", "风格结构分布", "价格带规划"] },
                    { title: "三、色彩与面料企划", items: ["主题色系定义", "面料材质规划", "图案元素方向"] },
                    { title: "四、上货节奏与波段规划", items: ["上新波段安排", "爆款追单计划", "促销节点配合"] },
                    { title: "五、预算与采购计划", items: ["采购预算分配", "供应商对接方案", "交期与质检要求"] },
                  ].map((section, i) => (
                    <div key={section.title} className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10 text-accent font-bold text-sm shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-primary">{section.title}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {section.items.map((item) => (
                            <span
                              key={item}
                              className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 text-xs text-muted-foreground border border-gray-100"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    完整企划书模板包含12个模块，50+数据分析维度
                  </p>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
                  >
                    获取模板 <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-16 lg:py-24 bg-white">
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
                获取商品企划工具
              </h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                从经验企划到数据企划，一键生成季度企划书。立即获取专业商品企划工具，开启科学企划之旅。
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  获取企划工具
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/hot-picks"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  查看爆款货盘
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
