"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen, Globe } from "lucide-react";
import AdBanner from "@/components/AdBanner";

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

const heroArticle = {
  tag: "封面故事",
  title: "2026早春系列：数字薰衣草与科技面料的完美邂结合",
  desc: "从米兰到巴黎，从上海到东京，全球四大时装周传递出的信号惊人一致——舒适、治愈、可持续。本文深度解析2026早春系列背后的设计逻辑与商业机会。",
  date: "2026-05-15",
};

const articles = [
  {
    tag: "流行趋势",
    title: "Z世代消费报告：谁来定义新中式的未来？",
    excerpt: "从汉服圈到主流市场，新中式用了不到五年时间完成从小众审美到百亿赛道的跨越。",
    date: "2026-05-14",
    color: "from-pink-100 to-purple-100",
    emoji: "🌸",
  },
  {
    tag: "面料科技",
    title: "石墨烯保暖面料实测：黑科技还是营销噱头？",
    excerpt: "联合第三方实验室进行导热系数、透气性、耐洗涤性等六大维度测试。",
    date: "2026-05-13",
    color: "from-blue-100 to-cyan-100",
    emoji: "🧪",
  },
  {
    tag: "搭配灵感",
    title: "小个子显高指南：买手私藏搭配公式",
    excerpt: "首席买手公开私藏搭配公式，腰线打造、色彩呼应、材质对比。",
    date: "2026-05-12",
    color: "from-amber-100 to-orange-100",
    emoji: "👗",
  },
  {
    tag: "品牌故事",
    title: "从档口到品牌：三个女孩的十年逆袭",
    excerpt: "从广州十三行档口起家，到如今年销三亿的新锐女装品牌。",
    date: "2026-05-11",
    color: "from-green-100 to-teal-100",
    emoji: "💪",
  },
];

export default function MagazinePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <motion.div
            className="max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium backdrop-blur-sm border border-accent/30 mb-4">
              <BookOpen className="w-4 h-4" />
              骆芷蝶时尚杂志
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mt-2">
              时尚·洞察·未来
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              汇聚全球时尚资讯、流行趋势深度分析与搭配灵感
            </p>
          </motion.div>
        </div>
      </section>

      {/* Hero Article */}
      <section className="py-12 lg:py-16 bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
          >
            {/* Cover Image Placeholder */}
            <div className="relative aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden">
              <div className="text-9xl opacity-30">📖</div>
              <span className="absolute top-4 left-4 px-3 py-0.5 rounded-full bg-accent text-white text-xs font-semibold">
                {heroArticle.tag}
              </span>
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <span>📅</span>
                  {heroArticle.date}
                </span>
                <span>·</span>
                <span>12分钟阅读</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-primary leading-snug">
                {heroArticle.title}
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {heroArticle.desc}
              </p>
              <div className="mt-6">
                <Link
                  href="/admin/magazine"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  阅读全文
                  <Globe className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, i) => (
              <motion.div
                key={article.title}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                className="group cursor-pointer"
              >
                <div
                  className={`aspect-[16/10] rounded-xl bg-gradient-to-br ${article.color || "from-primary/10 to-accent/10"} flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow overflow-hidden relative`}
                >
                  <div className="text-6xl opacity-40">{article.emoji || "🖼️"}</div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      查看详情
                    </span>
                  </div>
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-accent text-white text-xs font-medium">
                    {article.tag}
                  </span>
                </div>
                <h4 className="font-semibold text-primary group-hover:text-accent transition-colors line-clamp-2">
                  {article.title}
                </h4>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="mt-2 text-xs text-gray-400">
                  {article.date}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ad Banner */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <AdBanner position="inline" />
      </div>
    </>
  );
}
