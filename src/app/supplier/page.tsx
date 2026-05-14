"use client";
import { PaywallModal } from "@/components/PaywallModal";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  Shield,
  Award,
  FileCheck,
  Factory,
  Headphones,
  Landmark,
  Star,
  Upload,
  ArrowRight,
  CheckCircle2,
  Building2,
  Package,
} from "lucide-react";
import { useState } from "react";

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
const entryStandards = [
  {
    icon: FileCheck,
    title: "营业执照",
    desc: "合法有效的企业营业执照，经营范围涵盖服装生产或销售",
  },
  {
    icon: Shield,
    title: "质检报告",
    desc: "提供近一年内第三方权威机构出具的产品质检合格报告",
  },
  {
    icon: Factory,
    title: "产能证明",
    desc: "具备稳定的生产能力，年产能满足平台最低合作标准",
  },
  {
    icon: Headphones,
    title: "售后体系",
    desc: "建立完善的售后服务体系，7天无理由退换，48小时响应",
  },
  {
    icon: Landmark,
    title: "保证金",
    desc: "按分级缴纳相应金额的履约保证金，保障交易安全",
  },
];

const supplierLevels = [
  {
    level: "A",
    label: "核心供应商",
    color: "from-amber-500 to-yellow-400",
    borderColor: "border-amber-400",
    bgLight: "bg-amber-50",
    textColor: "text-amber-700",
    benefits: [
      "优先展示与推荐权重",
      "专属客户经理1对1服务",
      "新品首发绿色通道",
      "大促活动优先入选",
      "平台数据看板权限",
    ],
    threshold: "年供货额≥500万，综合评分≥90",
  },
  {
    level: "B",
    label: "补充供应商",
    color: "from-slate-400 to-slate-300",
    borderColor: "border-slate-300",
    bgLight: "bg-slate-50",
    textColor: "text-slate-700",
    benefits: [
      "常规展示位",
      "在线客服支持",
      "活动备选资格",
      "基础数据报表",
    ],
    threshold: "年供货额≥100万，综合评分≥75",
  },
  {
    level: "C",
    label: "备用供应商",
    color: "from-orange-400 to-orange-300",
    borderColor: "border-orange-300",
    bgLight: "bg-orange-50",
    textColor: "text-orange-700",
    benefits: [
      "基础展示",
      "自主运营后台",
      "待升级观察期",
    ],
    threshold: "年供货额＜100万，综合评分≥60",
  },
];

const supplierShowcase = [
  { name: "锦程服饰", category: "女装/连衣裙", rating: 4.9 },
  { name: "瑞丰纺织", category: "面料/真丝", rating: 4.8 },
  { name: "华锦成衣", category: "女装/外套", rating: 4.7 },
  { name: "锦瑟工坊", category: "女装/旗袍", rating: 4.9 },
  { name: "优品针织", category: "针织/毛衣", rating: 4.6 },
  { name: "雅致服饰", category: "女装/衬衫", rating: 4.8 },
  { name: "尚品皮具", category: "配饰/皮包", rating: 4.5 },
  { name: "丝路供应链", category: "女装/裤装", rating: 4.7 },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function SupplierPage() {
  const [form, setForm] = useState({
    company: "",
    contact: "",
    phone: "",
    category: "",
    brand: "",
    capacity: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

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
      {/* Breadcrumb */}
      <div className="bg-muted border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary font-medium">供应商中心</span>
          </nav>
        </div>
      </div>

      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-6">
              <Building2 className="w-4 h-4" />
              优质供应商招募
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              供应商<span className="text-accent">中心</span>
            </h1>
            <p className="mt-6 text-lg text-white/80 leading-relaxed">
              携手优质供应商，共建高效协同的服装供应链体系。
              严格准入标准、科学分级管理，保障品质与交付，实现共赢增长。
            </p>
          </motion.div>
        </div>
      </section>

      {/* ====== Entry Standards ====== */}
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
              准入标准
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              供应商入驻标准
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              严格的准入体系确保平台供应商品质，为品牌方提供可靠货源保障。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {entryStandards.map((item, i) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                custom={i}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted border border-gray-100 hover:border-accent/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-4">
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-primary text-lg">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Supplier Levels ====== */}
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
              分级体系
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              供应商分级管理
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              科学的三级分类体系，激励供应商持续提升服务品质与供应能力。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {supplierLevels.map((item, i) => (
              <motion.div
                key={item.level}
                variants={fadeUp}
                custom={i}
                className={`relative overflow-hidden rounded-2xl bg-white border ${item.borderColor} shadow-sm hover:shadow-xl transition-all duration-300`}
              >
                <div
                  className={`h-2 bg-gradient-to-r ${item.color}`}
                />
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${item.color} text-white text-xl font-bold`}
                    >
                      {item.level}
                    </span>
                    <div>
                      <h3 className="font-bold text-primary text-lg">
                        {item.label}
                      </h3>
                      <p className="text-xs text-muted-foreground">{item.threshold}</p>
                    </div>
                  </div>
                  <ul className="space-y-3 mt-6">
                    {item.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Application Form ====== */}
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
              入驻申请
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              申请入驻骆芷蝶智选
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              填写以下信息，我们将在3个工作日内与您联系。
            </p>
          </motion.div>

          <motion.div
            className="max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
          >
            <form
              onSubmit={handleSubmit}
              className="p-8 sm:p-10 rounded-2xl bg-muted border border-gray-100"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    公司名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.company}
                    onChange={(e) =>
                      setForm({ ...form, company: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                    placeholder="请输入公司全称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    联系人 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.contact}
                    onChange={(e) =>
                      setForm({ ...form, contact: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                    placeholder="请输入联系人姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    联系电话 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                    placeholder="请输入手机号码"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    主营品类 <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm bg-white"
                  >
                    <option value="">请选择主营品类</option>
                    <option value="女装">女装</option>
                    <option value="男装">男装</option>
                    <option value="童装">童装</option>
                    <option value="面料">面料</option>
                    <option value="配饰">配饰</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    品牌名称
                  </label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) =>
                      setForm({ ...form, brand: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                    placeholder="请输入品牌名称（如有）"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    年产能
                  </label>
                  <input
                    type="text"
                    value={form.capacity}
                    onChange={(e) =>
                      setForm({ ...form, capacity: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                    placeholder="如：50万件/年"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-primary mb-2">
                  上传资质文件
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-accent/50 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    点击或拖拽上传营业执照、质检报告等资质文件
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    支持 PDF、JPG、PNG 格式，单个文件不超过10MB
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="mt-8 w-full py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                提交入驻申请
                <ArrowRight className="w-4 h-4" />
              </button>

              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <span className="text-sm text-green-700">
                    申请已提交成功！我们将在3个工作日内与您联系。
                  </span>
                </motion.div>
              )}
            </form>
          </motion.div>
        </div>
      </section>

      {/* ====== Supplier Showcase ====== */}
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
              优质伙伴
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              已入驻供应商
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              众多优质供应商已入驻平台，覆盖全品类服装供应链资源。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {supplierShowcase.map((s, i) => (
              <motion.div
                key={s.name}
                variants={fadeUp}
                custom={i}
                className="group p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                  <Building2 className="w-8 h-8 text-primary/60" />
                </div>
                <h3 className="font-bold text-primary text-lg">{s.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{s.category}</p>
                <div className="flex items-center gap-1 mt-3">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-primary">
                    {s.rating}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">评分</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Submit Entry ====== */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="p-8 sm:p-12 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white flex flex-col lg:flex-row items-center gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <div className="flex-1">
              <h3 className="text-2xl sm:text-3xl font-bold">
                供应商商品提交
              </h3>
              <p className="mt-3 text-white/80 leading-relaxed">
                已入驻供应商可在此提交商品信息，包括色彩季型、风格定位、价格库存等，快速上架平台。
              </p>
            </div>
            <Link
              href="/supplier/submit"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20 shrink-0"
            >
              <Package className="w-5 h-5" />
              提交商品
              <ArrowRight className="w-4 h-4" />
            </Link>
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
              <h2 className="text-3xl sm:text-4xl font-bold">
                加入骆芷蝶智选供应商体系
              </h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                与5000+品牌建立合作，共享平台数据与流量，实现供应链高效协同与业务增长。
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="#"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  立即入驻
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  咨询详情
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
