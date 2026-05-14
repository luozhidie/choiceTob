"use client";

import { motion } from "framer-motion";
import {
  ChevronRight,
  Home,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Send,
  Globe,
  CheckCircle2,
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
const contactCards = [
  {
    icon: Phone,
    label: "咨询热线",
    value: "400-888-9527",
    desc: "周一至周六 9:00-18:00",
    color: "bg-blue-50 text-primary",
  },
  {
    icon: Mail,
    label: "商务邮箱",
    value: "biz@lzdzhixuan.com",
    desc: "24小时内回复",
    color: "bg-amber-50 text-accent",
  },
  {
    icon: MessageCircle,
    label: "微信客服",
    value: "LZDZhixuan",
    desc: "扫码添加专属客服",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: MapPin,
    label: "公司地址",
    value: "深圳市南山区科技园",
    desc: "欢迎预约来访",
    color: "bg-purple-50 text-purple-600",
  },
];

const socialLinks = [
  { label: "微信公众号", icon: "微" },
  { label: "微博", icon: "博" },
  { label: "抖音", icon: "抖" },
  { label: "小红书", icon: "红" },
];

const consultTypes = [
  "平台入驻咨询",
  "商品合作",
  "品牌授权",
  "技术对接",
  "培训服务",
  "其他",
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    type: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: "", phone: "", email: "", type: "", message: "" });
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <>
      {/* Toast */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 right-6 z-50 flex items-center gap-3 px-6 py-4 bg-green-600 text-white rounded-xl shadow-2xl"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">留言提交成功！</p>
            <p className="text-sm text-white/80">
              我们将在24小时内与您取得联系。
            </p>
          </div>
        </motion.div>
      )}

      {/* Breadcrumb */}
      <div className="bg-muted border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <a href="/" className="hover:text-primary transition-colors">
              <Home className="w-4 h-4" />
            </a>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary font-medium">联系我们</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
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
              <Phone className="w-4 h-4" />
              联系我们
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              与我们<span className="text-accent">取得联系</span>
            </h1>
            <p className="mt-6 text-lg text-white/80 leading-relaxed">
              无论是平台入驻、商品合作还是品牌授权，我们的专业团队随时为您提供支持。
            </p>
          </motion.div>
        </div>
      </section>

      {/* ====== Contact Cards ====== */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {contactCards.map((card, i) => (
              <motion.div
                key={card.label}
                variants={fadeUp}
                custom={i}
                className="group p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300 text-center"
              >
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${card.color} mb-4`}
                >
                  <card.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-primary text-lg">{card.label}</h3>
                <p className="mt-2 text-primary font-semibold">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Message Form & Map ====== */}
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
              在线留言
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              给我们留言
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              填写以下信息，我们的专属顾问将尽快与您联系。
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
            >
              <form
                onSubmit={handleSubmit}
                className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm"
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">
                        姓名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                        placeholder="请输入您的姓名"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">
                        电话 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                        placeholder="请输入联系电话"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      邮箱
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                      placeholder="请输入邮箱地址"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      咨询类型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm bg-white"
                    >
                      <option value="">请选择咨询类型</option>
                      {consultTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      留言内容 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm resize-none"
                      placeholder="请描述您的需求或问题..."
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-8 w-full py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  提交留言
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>

            {/* Map Placeholder */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="flex flex-col gap-6"
            >
              <div className="flex-1 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden min-h-[400px] relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 flex flex-col items-center justify-center">
                  <MapPin className="w-12 h-12 text-primary/30 mb-3" />
                  <p className="text-primary/50 font-semibold text-lg">
                    地图加载区域
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    深圳市南山区科技园
                  </p>
                </div>
              </div>

              {/* Social Links */}
              <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-accent" />
                  关注我们
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {socialLinks.map((s) => (
                    <div
                      key={s.label}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-accent/5 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-white font-bold text-sm">
                        {s.icon}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
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
              <h2 className="text-3xl sm:text-4xl font-bold">
                期待与您携手共赢
              </h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                骆芷蝶智选致力于构建高效协同的服装供应链生态，期待您的加入。
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="tel:4008889527"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  <Phone className="w-5 h-5" />
                  拨打热线 400-888-9527
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
