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
  RefreshCw,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Home,
  Star,
  BadgeCheck,
  Users,
  MapPin,
  Lightbulb,
  Rocket,
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
    price: "入门级",
    target: "服装行业新手/转型店主",
    content: "行业认知、选品基础、客户思维",
    duration: "7天线上课程",
    highlight: "低门槛起步",
    color: "from-blue-400 to-blue-600",
  },
  {
    icon: GraduationCap,
    level: "进阶课",
    price: "进阶级",
    target: "有1-3年经验的店主/买手",
    content: "数据选品、商品企划、VIP运营、营销策划",
    duration: "30天线上+3天线下",
    highlight: "实战驱动成长",
    color: "from-primary to-primary/80",
  },
  {
    icon: Award,
    level: "顾问认证",
    price: "专业级",
    target: "资深从业者/培训师/顾问",
    content: "全链路方法论、诊断技术、培训体系、品牌授权",
    duration: "60天线上+7天线下集训",
    highlight: "认证授权赋能",
    color: "from-accent to-accent/80",
  },
  {
    icon: Building2,
    level: "门店全案",
    price: "全案级",
    target: "品牌创始人/连锁门店负责人",
    content: "品牌定位+运营体系搭建+团队培训+全年陪跑",
    duration: "90天深度交付",
    highlight: "深度交付陪伴",
    color: "from-yellow-600 to-yellow-800",
  },
];

const courseCases = [
  { style: "行业认知课程", label: "从零到一的入门之路", color: "from-blue-100 to-blue-50" },
  { style: "选品实战课程", label: "数据驱动的选品方法论", color: "from-green-100 to-green-50" },
  { style: "运营精进课程", label: "VIP运营与营销策划", color: "from-purple-100 to-purple-50" },
  { style: "顾问认证课程", label: "从学到教的专业跃迁", color: "from-amber-100 to-amber-50" },
];

const empowerLoop = [
  { icon: BookOpen, title: "学习", desc: "系统化课程学习" },
  { icon: CheckCircle2, title: "掌握", desc: "实战演练验证" },
  { icon: Users, title: "注册平台", desc: "成为认证用户" },
  { icon: Lightbulb, title: "使用工具", desc: "提升决策效率" },
  { icon: Rocket, title: "经营", desc: "方法论融入经营" },
  { icon: BarChart3, title: "反馈", desc: "发现优化空间" },
  { icon: RefreshCw, title: "优化", desc: "持续迭代策略" },
  { icon: Star, title: "新案例", desc: "进入下一轮成长" },
];

const brandAuth = [
  {
    icon: BadgeCheck,
    title: "认证店",
    requirements: ["完成顾问认证课程", "通过实操考核", "经营规模达标", "签署品牌授权协议"],
    rights: ["使用品牌标识", "平台优先选品权", "官方培训支持", "联合营销推广"],
    color: "from-primary to-primary/80",
  },
  {
    icon: MapPin,
    title: "城市合伙人",
    requirements: ["完成门店全案课程", "3年以上行业经验", "团队规模达标", "签署城市独家协议"],
    rights: ["城市独家经营权", "全品类供应链支持", "培训师资质授权", "年度返佣激励"],
    color: "from-accent to-accent/80",
  },
];

const brandDesignCases = [
  { style: "品牌VI体系", label: "视觉识别全案设计", color: "from-indigo-100 to-indigo-50" },
  { style: "风格定位体系", label: "精准客群与风格定位", color: "from-rose-100 to-rose-50" },
  { style: "色彩体系", label: "品牌色彩与空间规划", color: "from-teal-100 to-teal-50" },
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

      {/* ====== Breadcrumb ====== */}
      <nav className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" /> 首页
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-primary">智识培训</span>
          </div>
        </div>
      </nav>

      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
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
            智识培训<span className="text-accent">赋能体系</span>
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

      {/* ====== 四级课程体系 ====== */}
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

      {/* ====== 课程案例展示 ====== */}
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
              Course Cases
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              课程案例展示
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              精选课程案例，覆盖从入门到认证的完整成长路径。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {courseCases.map((item, i) => (
              <motion.div
                key={item.style}
                variants={fadeUp}
                custom={i}
                className="group cursor-pointer"
                onClick={() => setShowPaywall(true)}
              >
                <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:shadow-lg transition-shadow overflow-hidden relative`}>
                  <div className="text-6xl opacity-40">📚</div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      查看详情
                    </span>
                  </div>
                </div>
                <h4 className="font-semibold text-primary">{item.style}</h4>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-10 text-center">
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              查看完整课程
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== 赋能闭环流程 ====== */}
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

          <div className="mt-10 text-center">
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              查看完整方案
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== 品牌设计案例展示 ====== */}
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
              品牌设计案例展示
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              从VI规范到风格定位到色彩体系，构建完整的品牌视觉与调性体系。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {brandDesignCases.map((item, i) => (
              <motion.div
                key={item.style}
                variants={fadeUp}
                custom={i}
                className="group cursor-pointer"
                onClick={() => setShowPaywall(true)}
              >
                <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:shadow-lg transition-shadow overflow-hidden relative`}>
                  <div className="text-6xl opacity-40">📚</div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      查看详情
                    </span>
                  </div>
                </div>
                <h4 className="font-semibold text-primary">{item.style}</h4>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-10 text-center">
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              查看完整方案
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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
              <button
                onClick={() => setShowPaywall(true)}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                查看完整内容
                <ChevronRight className="w-4 h-4" />
              </button>
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
                从入门课开始，踏上服装行业专业成长之路。系统学习，实战驱动，让知识真正转化为经营能力。
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
