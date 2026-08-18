"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Store,
  Tag,
  QrCode,
  Wallet,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Percent,
} from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Store,
    title: "认证或预存",
    desc: "免费认证店铺即可看批发价；预存货款 6000 起拿 2.8 折，一次性充 5 万 / 10 万 / 30 万 解锁 5% / 10% / 20% 分级退换额度。",
  },
  {
    n: "02",
    icon: Tag,
    title: "设价 · 转发",
    desc: "在工作台给商品设「对客卖价」，把专属链接 / 二维码发给客户。",
  },
  {
    n: "03",
    icon: Wallet,
    title: "客户下单 · 你赚差价",
    desc: "客户按你设的价付款，我们发货。差价自动进你余额，随时提现。",
  },
];

const tiers = [
  { name: "认证店主", deposit: "免费", discount: "看批发价", returnRate: "无退换", tag: "轻起步" },
  { name: "入门代理", deposit: "6000", discount: "2.8 折", returnRate: "无退换", tag: "首充" },
  { name: "预存代理", deposit: "5 万", discount: "2.8 折", returnRate: "5% 退换", tag: "主力", popular: true },
  { name: "战略代理", deposit: "10 万", discount: "2.8 折", returnRate: "10% 退换", tag: "深度" },
  { name: "钻石代理", deposit: "30 万", discount: "2.6 折", returnRate: "20% 退换", tag: "顶级" },
];

const faqs = [
  { q: "客户会看到批发价吗？", a: "不会。客户通过你的链接只看到你设的「对客卖价」，看不到批发价，也不知道你赚多少。" },
  { q: "差价怎么给我？", a: "客户付款后我们发货（钱货两清），系统自动把（卖价 − 批发成本）的差价结算进你的可提现余额，可申请提现。" },
  { q: "要压货吗？", a: "不用。客户先试穿再下单，我们一件代发，你无需囤货。" },
  { q: "举例能赚多少？", a: "某款零售价 ¥199，你的批发成本约 ¥56（2.8 折）。你设卖价 ¥199 卖给客户，赚 ¥143/件；设 ¥259 卖，赚 ¥203/件。" },
];

export default function AgentRecruitPage() {
  return (
    <div className="min-h-screen bg-[#2d1b2e] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#C9A24B]/10 -translate-y-1/3 translate-x-1/3 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:py-24 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A24B]/50 text-[#C9A24B] text-sm font-medium">
            <TrendingUp className="w-4 h-4" /> 代理方式
          </div>
          <h1 className="mt-5 text-4xl sm:text-5xl font-bold leading-tight">
            转发就能卖货，<span className="text-[#C9A24B]">差价自动到账</span>
          </h1>
          <p className="mt-4 text-white/65 max-w-2xl mx-auto text-lg">
            你是我们的批发客户 / 认证店主。给商品设个卖价，把链接发给客户——客户看不到批发价，
            每卖出一件，差价自动进你余额。
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/agent"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#C9A24B] text-[#2d1b2e] font-bold rounded-xl hover:bg-[#b8945a] transition-colors"
            >
              登录代理工作台 <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/store-certify"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/15 rounded-xl font-semibold hover:bg-white/15 transition-colors"
            >
              认证店铺 / 预存货款
            </Link>
          </div>
        </div>
      </section>

      {/* 三步 */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-white/5 border border-[#C9A24B]/20 p-6"
            >
              <div className="text-[#C9A24B]/40 text-3xl font-bold">{s.n}</div>
              <s.icon className="w-8 h-8 text-[#C9A24B] mt-3" />
              <h3 className="text-xl font-bold mt-3">{s.title}</h3>
              <p className="text-white/60 text-sm mt-2 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 亮点 */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="grid sm:grid-cols-3 gap-4">
          <Highlight icon={ShieldCheck} title="客户看不到批发价" desc="只显示你设的卖价，利润空间在你手里" />
          <Highlight icon={QrCode} title="专属链接 + 二维码" desc="一键生成，发微信 / 朋友圈即可" />
          <Highlight icon={Wallet} title="差价自动结算" desc="卖出即入账，随时提现，不压货" />
        </div>
      </section>

      {/* 档级 */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">代理档级</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`rounded-2xl p-6 border ${
                t.popular ? "bg-white/10 border-[#C9A24B] shadow-xl" : "bg-white/5 border-[#C9A24B]/20"
              }`}
            >
              {t.popular && (
                <span className="inline-block px-3 py-1 rounded-full bg-[#C9A24B] text-[#2d1b2e] text-xs font-bold mb-3">
                  推荐
                </span>
              )}
              <h3 className="text-xl font-bold">{t.name}</h3>
              <div className="mt-3 text-sm text-white/60">预存货款</div>
              <div className="text-2xl font-extrabold text-[#C9A24B]">{t.deposit}</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60">拿货折扣</span>
                  <span className="font-bold flex items-center gap-1"><Percent className="w-3.5 h-3.5" />{t.discount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">退换额度</span>
                  <span className="font-bold">{t.returnRate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8">常见问题</h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl bg-white/5 border border-[#C9A24B]/15 p-5">
              <div className="flex items-start gap-2 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-[#C9A24B] shrink-0 mt-0.5" />
                {f.q}
              </div>
              <p className="text-white/60 text-sm mt-2 pl-7 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Highlight({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-[#C9A24B]/20 p-5">
      <Icon className="w-7 h-7 text-[#C9A24B]" />
      <h3 className="font-bold mt-3">{title}</h3>
      <p className="text-white/60 text-sm mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}
