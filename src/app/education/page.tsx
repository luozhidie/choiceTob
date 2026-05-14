"use client";
import { useState } from "react";
import { PaywallModal } from "@/components/PaywallModal";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  GraduationCap,
  BookOpen,
  Award,
  Building2,
  Palette,
  Eye,
  Lightbulb,
  Rocket,
  RefreshCw,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Home,
  Star,
  BadgeCheck,
  Users,
  MapPin,
  Layers,
  PenTool,
  SwatchBook,
  Type,
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
const courseLevels = [
  {
    icon: BookOpen,
    level: "入门课",
    price: "¥199",
    target: "服装行业新手/转型店主",
    content: "行业认知、选品基础、客户思维",
    duration: "7天线上课程",
    highlight: "零基础可学，完成即获选品入门证书",
    color: "from-blue-400 to-blue-600",
  },
  {
    icon: GraduationCap,
    level: "进阶课",
    price: "¥9,999",
    target: "有1-3年经验的店主/买手",
    content: "数据选品、商品企划、VIP运营、营销策划",
    duration: "30天线上+3天线下",
    highlight: "实战项目驱动，结业即能落地",
    color: "from-primary to-primary/80",
  },
  {
    icon: Award,
    level: "顾问认证",
    price: "¥19,800",
    target: "资深从业者/培训师/顾问",
    content: "全链路方法论、诊断技术、培训体系、品牌授权",
    duration: "60天线上+7天线下集训",
    highlight: "通过认证获官方顾问资质+品牌授权",
    color: "from-accent to-accent/80",
  },
  {
    icon: Building2,
    level: "门店全案",
    price: "¥39,800",
    target: "品牌创始人/连锁门店负责人",
    content: "品牌定位+运营体系搭建+团队培训+全年陪跑",
    duration: "90天深度交付",
    highlight: "从0到1搭建完整运营体系",
    color: "from-yellow-600 to-yellow-800",
  },
];

const entryCourseSyllabus = [
  { day: "Day 1", title: "行业全景认知", desc: "服装行业产业链全貌、ToB模式解析、骆芷蝶智选平台价值定位" },
  { day: "Day 2", title: "买手思维启蒙", desc: "什么是买手思维、从销售到选品的心态转变、客户需求洞察方法" },
  { day: "Day 3", title: "选品基础入门", desc: "八大风格体系概述、品类结构ABC、首单选品5步法" },
  { day: "Day 4", title: "数据选品初探", desc: "平台数据工具介绍、热销趋势解读、选品数据维度入门" },
  { day: "Day 5", title: "陈列搭配入门", desc: "店铺陈列5大原则、搭配连带逻辑、视觉动线规划基础" },
  { day: "Day 6", title: "客户运营启蒙", desc: "VIP客户分层思维、复购率提升3要素、私域运营入门" },
  { day: "Day 7", title: "实战演练与考核", desc: "模拟选品方案制作、平台实操演练、入门课结业考核" },
];

const empowerLoop = [
  { icon: BookOpen, title: "学习", desc: "系统化课程学习，构建专业认知体系" },
  { icon: CheckCircle2, title: "掌握", desc: "实战演练验证，确保核心技能内化" },
  { icon: Users, title: "注册平台", desc: "成为骆芷蝶智选平台认证用户" },
  { icon: Lightbulb, title: "使用工具", desc: "运用平台数据工具，提升决策效率" },
  { icon: Rocket, title: "经营", desc: "将方法论与工具融入日常经营" },
  { icon: BarChart3, title: "反馈", desc: "跟踪经营数据，发现优化空间" },
  { icon: RefreshCw, title: "优化", desc: "基于数据持续迭代经营策略" },
  { icon: Star, title: "新案例", desc: "沉淀成功案例，进入下一轮成长" },
];

const brandAuth = [
  {
    icon: BadgeCheck,
    title: "认证店",
    requirements: ["完成顾问认证课程", "通过实操考核", "店铺年流水≥50万", "签署品牌授权协议"],
    rights: ["使用骆芷蝶智选品牌标识", "平台优先选品权", "官方培训支持", "联合营销推广"],
    color: "from-primary to-primary/80",
  },
  {
    icon: MapPin,
    title: "城市合伙人",
    requirements: ["完成门店全案课程", "3年以上行业经验", "团队规模≥5人", "签署城市独家协议"],
    rights: ["城市独家经营权", "全品类供应链支持", "培训师资质授权", "年度返佣激励"],
    color: "from-accent to-accent/80",
  },
];

const brandDesign = [
  {
    icon: Type,
    title: "品牌VI体系",
    items: [
      "品牌标志设计规范（主标/辅标/组合标志）",
      "标准色彩体系（主色/辅色/应用色）",
      "标准字体规范（中英文/标题/正文）",
      "基础应用规范（名片/信封/工牌/包装）",
      "空间应用规范（门头/橱窗/收银台）",
    ],
  },
  {
    icon: Layers,
    title: "风格定位体系",
    items: [
      "目标客群画像（年龄/职业/消费力/偏好）",
      "品牌风格关键词（3-5个核心风格词）",
      "八大风格坐标定位（少女/优雅/浪漫/少年/时尚/古典/自然/戏剧）",
      "竞品差异化定位矩阵",
      "品牌调性指南（语言风格/服务风格/视觉风格）",
    ],
  },
  {
    icon: SwatchBook,
    title: "色彩体系",
    items: [
      "品牌主色调定义与色值规范",
      "季度色彩趋势与选品指引",
      "陈列配色方案（对比/渐变/同色系）",
      "店铺空间色彩规划",
      "营销素材色彩模板",
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function EducationPage() {
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
            <span className="text-white/90">知识付费赋能</span>
          </nav>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-6">
              <GraduationCap className="w-4 h-4" />
              系统赋能，从学到用
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl font-bold leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            知识付费<span className="text-accent">赋能体系</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg text-white/80 leading-relaxed max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            从入门到精通的四阶课程体系，学以致用的赋能闭环，品牌授权的双轨模式，助力每一位从业者成为行业专家。
          </motion.p>
        </div>
      </section>

      {/* ====== 4级课程体系 ====== */}
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
              Course System
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              四级课程体系
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              从零基础到行业专家，四阶递进式成长路径，每一步都有清晰的目标与收获。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {courseLevels.map((course, i) => (
              <motion.div key={course.level} variants={fadeUp} custom={i}>
                <div className="group flex flex-col h-full rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className={`bg-gradient-to-r ${course.color} p-6 text-white`}>
                    <course.icon className="w-8 h-8 mb-3" />
                    <h3 className="text-xl font-bold">{course.level}</h3>
                    <p className="text-3xl font-bold mt-2">{course.price}</p>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="space-y-3 flex-1">
                      <div>
                        <p className="text-xs text-muted-foreground">适合人群</p>
                        <p className="text-sm text-gray-700 mt-1">{course.target}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">核心内容</p>
                        <p className="text-sm text-gray-700 mt-1">{course.content}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">学习周期</p>
                        <p className="text-sm text-gray-700 mt-1">{course.duration}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm font-medium text-accent">{course.highlight}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== 入门课7天大纲 ====== */}
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
              Entry Course
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              入门课7天大纲
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              从行业认知到实战演练，7天系统入门，学完即可上手。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {entryCourseSyllabus.map((day, i) => (
              <motion.div key={day.day} variants={fadeUp} custom={i}>
                <div className="group relative flex flex-col h-full p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-accent/30 hover:shadow-md transition-all duration-300">
                  <div className="absolute top-4 right-4 text-4xl font-bold text-gray-100 group-hover:text-accent/10 transition-colors">
                    {i + 1}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded bg-primary/5 text-primary text-xs font-bold w-fit mb-3">
                    {day.day}
                  </span>
                  <h4 className="font-bold text-primary text-sm">{day.title}</h4>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed flex-1">{day.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== 赋能闭环流程图 ====== */}
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
              Empowerment Loop
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              赋能闭环流程
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              从学习到实践再到优化的完整闭环，持续成长，持续精进。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {empowerLoop.map((step, i) => (
              <motion.div key={step.title} variants={fadeUp} custom={i}>
                <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted border border-gray-100 hover:border-accent/30 transition-colors">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent mb-4">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold mb-2">
                    {i + 1}
                  </span>
                  <h4 className="font-bold text-primary">{step.title}</h4>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Loop indicator */}
          <motion.div
            className="flex items-center justify-center mt-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-accent/10 text-accent">
              <RefreshCw className="w-5 h-5" />
              <span className="text-sm font-medium">持续循环，螺旋上升</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== 品牌授权模式 ====== */}
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
              Brand Authorization
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              品牌授权模式
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              双轨授权模式，从认证店到城市合伙人，共享品牌红利，共创行业未来。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {brandAuth.map((auth, i) => (
              <motion.div key={auth.title} variants={fadeUp} custom={i}>
                <div className="flex flex-col h-full rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                  <div className={`bg-gradient-to-r ${auth.color} p-6 text-white`}>
                    <div className="flex items-center gap-3">
                      <auth.icon className="w-8 h-8" />
                      <h3 className="text-2xl font-bold">{auth.title}</h3>
                    </div>
                  </div>
                  <div className="p-6 flex-1 grid sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-bold text-primary mb-4">准入要求</h4>
                      <ul className="space-y-3">
                        {auth.requirements.map((req) => (
                          <li key={req} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-primary mb-4">授权权益</h4>
                      <ul className="space-y-3">
                        {auth.rights.map((right) => (
                          <li key={right} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Star className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                            {right}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== 品牌形象设计定位 ====== */}
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
              Brand Design
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              品牌形象设计定位
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              从VI规范到风格定位到色彩体系，构建完整的品牌视觉与调性体系。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {brandDesign.map((section, i) => (
              <motion.div key={section.title} variants={fadeUp} custom={i}>
                <div className="flex flex-col h-full p-8 rounded-2xl bg-muted border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/5 text-primary">
                      <section.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-primary">{section.title}</h3>
                  </div>
                  <ul className="space-y-3 flex-1">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
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

      {/* ====== Login Prompt ====== */}
      <section className="py-20 lg:py-28 bg-white">
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
              <h2 className="text-3xl sm:text-4xl font-bold">立即报名课程</h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                从199元入门课开始，踏上服装行业专业成长之路。系统学习，实战驱动，让知识真正转化为经营能力。
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  立即报名课程
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/vip"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  了解VIP权益
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
