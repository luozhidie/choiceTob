"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Languages, CreditCard, ExternalLink, KeyRound, Copy, ArrowRight, Mail, MessageCircle, Sparkles, QrCode } from "lucide-react";

const CONTACT = { name: "骆芷蝶", email: "luozhidie@live.cn", wechat: "luozhidie666" };

type Lang = "zh" | "en";
const I18N: Record<Lang, any> = {
  zh: {
    brand: "骆芷蝶智选",
    market: "词元市场",
    heroTitle: "把十年选品判断力，封装成可调用的 API",
    heroSub: "不是卖数据，是卖「判断」。跨境卖家 / 平台 / 买手团队，按调用量付费，秒获「推荐 / 观望 / 放弃」结论。",
    badge: "IP 保护 · 仅返回结论 · 不暴露底层逻辑",
    ctaBuy: "购买调用额度",
    ctaContact: "私有授权咨询",
    scrollPricing: "查看定价",
    trust1: "按次计费",
    trust2: "双语输出",
    trust3: "微信支付安全收款",
    pricingTitle: "API 调用额度",
    pricingSub: "美元计价，微信扫码按等值人民币支付。支付后自动激活 API Key。",
    calls: "次调用",
    buy: "微信支付购买",
    buying: "生成二维码…",
    mostPopular: "最受欢迎",
    noteBuy: "支付后自动激活 API Key，仅显示一次，请妥善保存。",
    yourKey: "你的 API Key（已激活）",
    saveKey: "请立即复制保存，此页面刷新后不再显示",
    copy: "复制",
    copied: "已复制",
    capabilityTitle: "在售词元能力",
    capabilitySub: "每个词元都是一段可复用的行业判断逻辑，可单独调用，也可组合成工作流。",
    empty: "暂无上架词元。",
    loading: "加载中…",
    howTitle: "三步开始使用",
    how1: "购买额度",
    how1sub: "选套餐微信支付，秒得 API Key",
    how2: "发送商品信息",
    how2sub: "POST 一个商品描述，指定行业领域",
    how3: "获取判断结论",
    how3sub: "AI 按词元逻辑给出推荐/观望/放弃 + 理由",
    privateTitle: "需要批量授权、私有部署或 OEM？",
    privateSub: "大卖家 / 供应链平台 / SaaS 厂商可谈年度授权、定制词元、白标接入。",
    privateBtn: "微信 / 邮件联系",
    docsTitle: "开发者 API 文档",
    docsSub: "技术团队可直连调用。仅返回 AI 结论，底层逻辑不外露。",
    scanTitle: "微信扫码支付",
    scanTip: "打开微信 → 扫一扫 → 支付后自动显示 Key",
    polling: "等待支付确认…",
  },
  en: {
    brand: "Luo Zhidie Choice",
    market: "Token Market",
    heroTitle: "Ten years of buying judgment, packaged as an API",
    heroSub: "We don't sell data — we sell decisions. Cross-border sellers, platforms, and buying teams pay per call for instant Recommend / Watch / Pass verdicts.",
    badge: "IP Protected · Verdicts Only · No Logic Leaked",
    ctaBuy: "Buy API Credits",
    ctaContact: "Enterprise Licensing",
    scrollPricing: "See Pricing",
    trust1: "Pay-per-call",
    trust2: "Bilingual",
    trust3: "Secure WeChat Pay",
    pricingTitle: "API Call Credits",
    pricingSub: "Priced in USD, paid via WeChat in equivalent RMB. Key activates automatically after payment.",
    calls: "calls",
    buy: "Buy with WeChat",
    buying: "Generating QR…",
    mostPopular: "Most Popular",
    noteBuy: "Key activates automatically after payment. Shown once — save it.",
    yourKey: "Your API Key (activated)",
    saveKey: "Copy and keep it safe. It won't show again after refresh.",
    copy: "Copy",
    copied: "Copied",
    capabilityTitle: "Available Token Capabilities",
    capabilitySub: "Each token is a reusable piece of industry judgment logic. Use standalone or compose into workflows.",
    empty: "No tokens listed yet.",
    loading: "Loading…",
    howTitle: "Start in 3 Steps",
    how1: "Buy Credits",
    how1sub: "Pick a package, pay via WeChat, get an API Key instantly",
    how2: "Send Product Info",
    how2sub: "POST a product description with domain",
    how3: "Get Verdict",
    how3sub: "AI returns Recommend / Watch / Pass with reasoning",
    privateTitle: "Need bulk licensing, private deployment, or OEM?",
    privateSub: "Large sellers, supply-chain platforms, and SaaS vendors can inquire about annual licensing, custom tokens, and white-label access.",
    privateBtn: "Contact via WeChat / Email",
    docsTitle: "Developer API Docs",
    docsSub: "Technical teams can call directly. Only AI verdicts returned; underlying logic stays private.",
    scanTitle: "Scan to Pay with WeChat",
    scanTip: "Open WeChat → Scan → Key appears automatically after payment",
    polling: "Waiting for payment…",
  },
};

interface PubToken {
  id: string;
  title: string;
  domain: string;
  category: string;
  layer: string;
  summary: string;
  metric: string;
  usageCount: number;
  price: number;
  unit: string;
  note: string;
  comboCount: number;
}

interface Pkg {
  key: string;
  nameZh: string;
  nameEn: string;
  calls: number;
  amount: number;
  cny: number;
  descZh: string;
  descEn: string;
}

export default function PublicMarketPage() {
  const [lang, setLang] = useState<Lang>("zh");
  const [tokens, setTokens] = useState<PubToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const t = I18N[lang];

  const [packages, setPackages] = useState<Pkg[]>([]);
  const [testMode, setTestMode] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [revealKey, setRevealKey] = useState<string | null>(null);
  const [revealPkg, setRevealPkg] = useState<string>("");
  const [revealCalls, setRevealCalls] = useState<number>(0);
  const [revealErr, setRevealErr] = useState<string | null>(null);

  const [wx, setWx] = useState<{ order_no: string; qr: string; cny: number; usd: number; calls: number } | null>(null);
  const [wxErr, setWxErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/tokens")
      .then((r) => r.json())
      .then((d) => {
        setTokens(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/billing/packages")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setPackages(d.packages || []);
          setTestMode(!!d.testMode);
        }
      })
      .catch(() => {});

    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session_id");
    if (sid) {
      setRevealErr(null);
      fetch("/api/billing/retrieve?session_id=" + encodeURIComponent(sid))
        .then((r) => r.json())
        .then((d) => {
          if (d.ok && d.paid && d.api_key) {
            setRevealKey(d.api_key);
            setRevealPkg(d.package);
            setRevealCalls(d.calls);
          } else if (d.ok && !d.paid) {
            setRevealErr(lang === "zh" ? "支付尚未完成，稍后回到本页刷新重试。" : "Payment not completed yet. Come back and refresh.");
          }
        })
        .catch(() => setRevealErr(lang === "zh" ? "查询失败，请稍后重试。" : "Lookup failed, retry later."));
      window.history.replaceState({}, "", "/tokens-market");
    }
  }, [lang]);

  // 轮询微信支付状态，支付成功后取回 key
  useEffect(() => {
    if (!wx) return;
    let timer: any;
    const checkPaid = async () => {
      try {
        const q = await fetch("/api/wechat-pay/query?order_no=" + encodeURIComponent(wx.order_no)).then((r) => r.json());
        if (q.is_paid) {
          if (timer) clearInterval(timer);
          const d = await fetch("/api/billing/wechat/retrieve?order_no=" + encodeURIComponent(wx.order_no)).then((r) => r.json());
          if (d.ok && d.paid && d.api_key) {
            setRevealKey(d.api_key);
            setRevealPkg(d.package);
            setRevealCalls(d.calls);
            sessionStorage.removeItem("tk_pending_order");
            setWx(null);
          }
        }
      } catch {
        /* ignore */
      }
    };
    timer = setInterval(checkPaid, 2500);
    // 移动端后台标签会挂起定时器：切回前台 / 获焦时立即复查，避免卡在"等待支付确认"
    const onVisible = () => { if (document.visibilityState === "visible") checkPaid(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", checkPaid);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", checkPaid);
    };
  }, [wx]);

  // 刷新 / 重新打开页面时，若有待支付订单且已支付，直接取回 key
  useEffect(() => {
    const pending = typeof window !== "undefined" ? sessionStorage.getItem("tk_pending_order") : null;
    if (!pending) return;
    fetch("/api/billing/wechat/retrieve?order_no=" + encodeURIComponent(pending))
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.paid && d.api_key) {
          setRevealKey(d.api_key);
          setRevealPkg(d.package);
          setRevealCalls(d.calls);
          sessionStorage.removeItem("tk_pending_order");
        }
      })
      .catch(() => { /* ignore */ });
  }, []);

  const copyContact = () => {
    const text = `${CONTACT.name} · ${CONTACT.email} · WeChat:${CONTACT.wechat}`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const buy = async (pkgKey: string) => {
    setBuying(pkgKey);
    setRevealErr(null);
    setWxErr(null);
    try {
      const res = await fetch("/api/billing/wechat/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: pkgKey }),
      });
      const d = await res.json();
      if (d.ok && d.qr) {
        sessionStorage.setItem("tk_pending_order", d.order_no);
        setWx({ order_no: d.order_no, qr: d.qr, cny: d.cny, usd: d.usd, calls: d.calls });
        setBuying(null);
      } else {
        setWxErr(d.error || (lang === "zh" ? "下单失败" : "Order failed"));
        setBuying(null);
      }
    } catch (e: any) {
      setWxErr(lang === "zh" ? "下单异常" : "Order error");
      setBuying(null);
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Luo Zhidie Choice · Token Market",
    description: "Callable buying-expertise tokens delivered via API for cross-border fashion sellers. Pay-per-call, only AI verdicts returned.",
    provider: { "@type": "Person", name: "骆芷蝶", email: "luozhidie@live.cn" },
    areaServed: "Worldwide",
    url: "https://colour-choice.art/tokens-market",
    offers: [
      { "@type": "Offer", name: "Trial", price: "9.00", priceCurrency: "USD", description: "50 API calls" },
      { "@type": "Offer", name: "Starter", price: "29.00", priceCurrency: "USD", description: "200 API calls" },
      { "@type": "Offer", name: "Pro", price: "99.00", priceCurrency: "USD", description: "1000 API calls" },
      { "@type": "Offer", name: "Trial", price: "65.00", priceCurrency: "CNY", description: "50 API calls" },
      { "@type": "Offer", name: "Starter", price: "209.00", priceCurrency: "CNY", description: "200 API calls" },
      { "@type": "Offer", name: "Pro", price: "713.00", priceCurrency: "CNY", description: "1000 API calls" },
    ],
  };

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <header className="border-b sticky top-0 z-20 bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="font-bold text-primary text-lg">{t.brand}</a>
          <button
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            <Languages className="w-4 h-4" /> {lang === "zh" ? "EN" : "中"}
          </button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs md:text-sm mb-6">
              <Sparkles className="w-4 h-4 text-amber-300" />
              {t.badge}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-5">{t.heroTitle}</h1>
            <p className="text-base md:text-lg text-indigo-100 max-w-2xl mx-auto mb-8">{t.heroSub}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={scrollToPricing} className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-semibold hover:bg-gray-100 flex items-center gap-2">
                {t.ctaBuy} <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={copyContact} className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> {t.ctaContact}
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-indigo-200">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {t.trust1}</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {t.trust2}</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {t.trust3}</span>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-14 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">{t.pricingTitle}</h2>
              <p className="text-muted-foreground">{t.pricingSub}</p>
            </div>

            {revealKey ? (
              <div className="max-w-xl mx-auto bg-green-50 border border-green-200 rounded-2xl p-5">
                <p className="text-green-800 font-semibold flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {t.yourKey}</p>
                <div className="flex items-center gap-2 mt-3">
                  <code className="flex-1 bg-white px-3 py-2.5 rounded-lg text-sm break-all border border-green-200">{revealKey}</code>
                  <button onClick={() => copy(revealKey)} className="px-3 py-2 bg-white border border-green-200 rounded-lg text-sm flex items-center gap-1"><Copy className="w-4 h-4" /> {t.copy}</button>
                </div>
                <p className="text-xs text-gray-500 mt-2">{t.saveKey}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packages.map((pk, idx) => {
                  const popular = pk.key === "starter";
                  return (
                    <div key={pk.key} className={`relative rounded-2xl p-6 bg-white border ${popular ? "border-indigo-500 shadow-lg" : "border-gray-200"}`}>
                      {popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-xs rounded-full">{t.mostPopular}</span>}
                      <div className="text-sm text-muted-foreground font-medium">{lang === "zh" ? pk.nameZh : pk.nameEn}</div>
                      <div className="text-4xl font-bold text-primary mt-2">${(pk.amount / 100).toFixed(2)}</div>
                      <div className="text-sm text-gray-500 mt-1">≈ ¥{(pk.cny / 100).toFixed(0)} · {pk.calls} {t.calls}</div>
                      <p className="text-sm text-muted-foreground mt-4 min-h-[40px]">{lang === "zh" ? pk.descZh : pk.descEn}</p>
                      <button
                        onClick={() => buy(pk.key)}
                        disabled={!!buying}
                        className={`mt-5 w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 ${popular ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                      >
                        {buying === pk.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                        {buying === pk.key ? t.buying : t.buy}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {wxErr && <p className="text-center text-sm text-red-600 mt-4">{wxErr}</p>}
            {revealErr && <p className="text-center text-sm text-red-600 mt-4">{revealErr}</p>}
            {!revealKey && !wx && <p className="text-center text-xs text-gray-500 mt-4">{t.noteBuy}</p>}
          </div>
        </section>

        {/* Capabilities */}
        <section className="py-14">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">{t.capabilityTitle}</h2>
              <p className="text-muted-foreground">{t.capabilitySub}</p>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin inline" /> {t.loading}</div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-2xl">{t.empty}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tokens.map((p) => (
                  <div key={p.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-primary text-lg">{p.title}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{p.domain}</span>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{p.category}</span>
                          {p.layer && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">{p.layer}</span>}
                        </div>
                      </div>
                    </div>
                    {p.summary && <p className="text-sm text-muted-foreground mt-4">{p.summary}</p>}
                    <div className="flex items-center flex-wrap gap-4 mt-4 text-xs text-gray-500">
                      <span>{p.metric || "—"}</span>
                      <span>{t.trust1}: {p.usageCount}</span>
                      {p.comboCount > 0 && <span className="text-indigo-600">{lang === "zh" ? "组合" : "Combo"}: {p.comboCount}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* How it works */}
        <section className="py-14 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-10">{t.howTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { n: "01", title: t.how1, sub: t.how1sub, icon: KeyRound },
                { n: "02", title: t.how2, sub: t.how2sub, icon: ExternalLink },
                { n: "03", title: t.how3, sub: t.how3sub, icon: CheckCircle2 },
              ].map((s) => (
                <div key={s.n} className="bg-white rounded-2xl p-6 border border-gray-100">
                  <div className="text-3xl font-bold text-indigo-200 mb-3">{s.n}</div>
                  <s.icon className="w-6 h-6 text-indigo-600 mb-3" />
                  <h3 className="font-semibold text-primary mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Private licensing CTA */}
        <section className="py-14">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-primary mb-3">{t.privateTitle}</h2>
            <p className="text-muted-foreground mb-6">{t.privateSub}</p>
            <button onClick={copyContact} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 flex items-center gap-2 mx-auto">
              <Mail className="w-4 h-4" /> {t.privateBtn}
            </button>
            {copied && <p className="text-sm text-green-600 mt-3 flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4" /> {t.copied}</p>}
            <p className="text-sm text-gray-500 mt-3">{CONTACT.name} · {CONTACT.email} · WeChat: {CONTACT.wechat}</p>
          </div>
        </section>

        {/* Developer docs (collapsed, not front-and-center) */}
        <section className="py-8 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4">
            <details className="bg-white border border-gray-200 rounded-2xl p-5">
              <summary className="cursor-pointer font-medium text-primary flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> {t.docsTitle}
              </summary>
              <p className="text-sm text-muted-foreground mt-3">{t.docsSub}</p>
              <pre className="mt-3 bg-slate-900 text-gray-100 text-xs rounded-xl p-4 overflow-x-auto"><code>{`curl -X POST https://colour-choice.art/api/tokens/api-select \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: tk_YOUR_KEY" \\
  -d '{"domain":"服装","product":"法式碎花连衣裙 168元 25-35职场女性"}'`}</code></pre>
            </details>
          </div>
        </section>
      </main>

      {/* 微信支付二维码弹层 */}
      {wx && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" onClick={() => setWx(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-primary flex items-center gap-2"><QrCode className="w-5 h-5 text-green-600" /> {t.scanTitle}</h3>
              <button onClick={() => setWx(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={wx.qr} alt="wechat pay qr" className="w-56 h-56 mx-auto" />
            </div>
            <p className="mt-3 font-semibold text-lg">¥{(wx.cny / 100).toFixed(2)} <span className="text-sm text-gray-400 font-normal">≈ ${(wx.usd / 100).toFixed(2)}</span></p>
            <p className="text-sm text-gray-500 mt-1">{wx.calls} {t.calls}</p>
            <p className="text-xs text-gray-400 mt-3 flex items-center justify-center gap-1"><Loader2 className="w-3 h-3 inline animate-spin" /> {t.polling}</p>
            <p className="text-xs text-gray-400 mt-2">{t.scanTip}</p>
          </div>
        </div>
      )}
    </div>
  );
}
