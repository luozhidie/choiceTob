"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Home, ChevronRight, ShoppingBag, Clock, Star, Diamond, Crown, Gem, Check, Info,
  Layers, Shirt, PenTool, Scissors, MessageCircle, ArrowRight
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

import { HotProductsSection } from "./hot-products-section";

/* ============ Tab 定义 ============ */
type TabKey = "hot" | "buyer" | "rental" | "designer" | "collocation" | "cooperation";

const tabs: { key: TabKey; label: string }[] = [
  { key: "hot", label: "爆款样衣" },
  { key: "buyer", label: "买手爆款样衣" },
  { key: "rental", label: "样衣租赁" },
  { key: "designer", label: "设计稿服务" },
  { key: "collocation", label: "搭配稿服务" },
  { key: "cooperation", label: "合作模式" },
];

/* ============ 买手爆款样衣套餐 ============ */
const buyerPackages = [
  {
    season: "春夏",
    name: "买手爆款样衣·春夏套餐",
    price: 39000,
    count: 50,
    unitPrice: 780,
    period: "不超过12个月",
    features: [
      "买手总监亲自对接风格品类需求",
      "3天内可看版选样衣",
      "国内外加广杭两地市场流行趋势",
      "每周定期提供最新爆款选择",
      "前两季销售数据分析",
      "相当于拥有50人以上的专业买手团队淘爆款",
      "多·快·好·省",
    ],
    tag: "春夏特惠",
  },
  {
    season: "秋冬",
    name: "买手爆款样衣·秋冬套餐",
    price: 69000,
    count: 50,
    unitPrice: 1380,
    period: "不超过12个月",
    features: [
      "买手总监亲自对接风格品类需求",
      "3天内可看版选样衣",
      "国内外加广杭两地市场流行趋势",
      "每周定期提供最新爆款选择",
      "前两季销售数据分析",
      "相当于拥有50人以上的专业买手团队淘爆款",
      "多·快·好·省",
    ],
    tag: "秋冬特惠",
  },
];

/* ============ 样衣租赁套餐 ============ */
const rentalPackages = [
  { name: "体验套餐", price: 54800, count: 220, period: "12个月", periodMonths: 12, icon: Star, highlight: false },
  { name: "黄金套餐", price: 88000, count: 400, period: "24个月", periodMonths: 24, icon: Diamond, highlight: false },
  { name: "钻石套餐", price: 168000, count: 840, period: "36个月", periodMonths: 36, icon: Gem, highlight: true },
  { name: "至尊套餐", price: 388000, count: 2580, period: "48个月", periodMonths: 48, icon: Crown, highlight: false },
];

/* ============ 设计稿服务 - 品类价格表 ============ */
const categoryPrices = [
  { category: "T恤/卫衣/毛衣", unit: "件", basePrice: 550, withPattern: 650, withSample: 750 },
  { category: "衬衫/针织衫", unit: "件", basePrice: 550, withPattern: 650, withSample: 800 },
  { category: "连衣裙/半裙/裤装", unit: "件", basePrice: 550, withPattern: 700, withSample: 850 },
  { category: "外套/风衣/大衣", unit: "件", basePrice: 650, withPattern: 800, withSample: 1000 },
  { category: "羽绒服/棉服", unit: "件", basePrice: 880, withPattern: 680, withSample: 800 },
  { category: "礼服/高定", unit: "件", basePrice: 880, withPattern: 1500, withSample: 2000 },
];

/* ============ 设计稿服务 - L1-L5 套餐 ============ */
const serviceTiers = [
  { level: "L1", name: "原创设计图稿", desc: "纯设计图，适合有板房/工厂配合打板的客户", price: "¥550-880/件", features: ["原创设计图稿（含款式图+工艺说明+面料建议）", "1轮修改", "源文件交付"], highlight: false },
  { level: "L2", name: "设计图稿 + 纸样", desc: "适合有板房或工厂的客户", price: "¥650-1500/件", features: ["L1全部内容", "工业纸样（含放码）", "纸样审核"], highlight: false },
  { level: "L3", name: "设计图稿 + 纸样 + 成品样衣", desc: "适合没有供应链配合的客户", price: "¥750-2000/件", features: ["L2全部内容", "白胚样衣制作", "成品样衣制作", "样衣瑕疵修复"], highlight: true },
  { level: "L4", name: "原创样衣设计 + FOB生产供货", desc: "适合没有供应链的电商/外省客户", price: "面议", features: ["L3全部内容", "FOB生产供货", "大货跟单", "质检服务"], highlight: false },
  { level: "L5", name: "产品顾问（外聘设计总监）", desc: "适合自有设计团队但能力弱的客户", price: "面议", features: ["L4全部内容", "外聘设计总监1v1服务", "季度商品企划", "设计团队培训"], highlight: false },
];

/* ============ 搭配稿服务 - 春夏价格 ============ */
const springSummer = {
  collocation: [
    { name: "搭配稿尊享包", desc: "100套搭配", price: 30000, count: 100, unitPrice: 300, period: "不超过12个月" },
    { name: "搭配稿尊享特惠包", desc: "100套搭配+20款爆款样衣", price: 74600, count: 120, unitPrice: 622, period: "不超过12个月" },
    { name: "搭配稿至尊包", desc: "200个设计稿", price: 100000, count: 200, unitPrice: 500, period: "不超过24个月" },
    { name: "纸样体验包", desc: "68个设计稿+8款纸样", price: 66600, count: 68, unitPrice: 980, period: "不超过6个月" },
    { name: "纸样VIP包", desc: "100个设计稿+100款纸样", price: 93000, count: 100, unitPrice: 930, period: "不超过12个月" },
    { name: "胚样体验包", desc: "68款胚样", price: 93800, count: 68, unitPrice: 1380, period: "不超过6个月" },
    { name: "胚样钻石包", desc: "100个设计稿+100款纸样+100款胚样", price: 128000, count: 100, unitPrice: 1280, period: "不超过12个月" },
  ],
  sample: [
    { name: "样衣体验包", desc: "30款样衣", price: 78000, count: 30, unitPrice: 2600, period: "不超过3个月" },
    { name: "样衣黄金包", desc: "68款样衣", price: 170000, count: 68, unitPrice: 2500, period: "不超过6个月" },
    { name: "样衣钻石包", desc: "100款样衣", price: 238000, count: 100, unitPrice: 2380, period: "不超过12个月" },
  ],
};

/* ============ 搭配稿服务 - 秋冬价格 ============ */
const autumnWinter = {
  collocation: [
    { name: "搭配稿尊享包", desc: "100套搭配", price: 35000, count: 100, unitPrice: 350, period: "不超过12个月" },
    { name: "搭配稿尊享特惠包", desc: "100套搭配+20款爆款样衣", price: 85000, count: 120, unitPrice: 708, period: "不超过12个月" },
    { name: "搭配稿至尊包", desc: "200个设计稿", price: 120000, count: 200, unitPrice: 600, period: "不超过24个月" },
    { name: "纸样体验包", desc: "68个设计稿+8款纸样", price: 75000, count: 68, unitPrice: 1103, period: "不超过6个月" },
    { name: "纸样VIP包", desc: "100个设计稿+100款纸样", price: 110000, count: 100, unitPrice: 1100, period: "不超过12个月" },
    { name: "胚样体验包", desc: "68款胚样", price: 105000, count: 68, unitPrice: 1544, period: "不超过6个月" },
    { name: "胚样钻石包", desc: "100个设计稿+100款纸样+100款胚样", price: 145000, count: 100, unitPrice: 1450, period: "不超过12个月" },
  ],
  sample: [
    { name: "样衣体验包", desc: "30款样衣", price: 88000, count: 30, unitPrice: 2933, period: "不超过3个月" },
    { name: "样衣黄金包", desc: "68款样衣", price: 195000, count: 68, unitPrice: 2868, period: "不超过6个月" },
    { name: "样衣钻石包", desc: "100款样衣", price: 275000, count: 100, unitPrice: 2750, period: "不超过12个月" },
  ],
};

/* ============ 合作模式 - L1-L5 合作模式 ============ */
const cooperationModes = [
  { level: "L1", name: "原创设计图稿", price: "¥550-880/件", desc: "纯设计图，适合有板房/工厂配合打板的客户", features: ["原创设计图稿（含款式图+工艺说明+面料建议）", "1轮修改", "源文件交付"], suitable: "有自设板房或有工厂配合打板、车板的客户，比较节省成本", color: "bg-blue-50 border-blue-200", badgeColor: "bg-blue-500" },
  { level: "L2", name: "设计图稿 + 纸样", price: "¥650-1500/件", desc: "适合有板房或工厂的客户", features: ["L1全部内容", "工业纸样（含放码）", "纸样审核"], suitable: "适合只有车板师的或有工厂配合车板车板的客户，比较节省成本", color: "bg-green-50 border-green-200", badgeColor: "bg-green-500" },
  { level: "L3", name: "设计图稿 + 纸样 + 成品样衣", price: "¥750-2000/件", desc: "适合没有供应链配合的客户", features: ["L2全部内容", "白胚样衣制作", "成品样衣制作", "样衣瑕疵修复"], suitable: "适合没有供应链协助打板车板的客户，直接看到样衣比较直观", color: "bg-orange-50 border-orange-200", badgeColor: "bg-orange-500" },
  { level: "L4", name: "原创样衣设计 + FOB生产供货", price: "面议", desc: "适合没有供应链的电商/外省客户", features: ["L3全部内容", "FOB生产供货", "大货跟单", "质检服务"], suitable: "适合没有供应链协助的、如电商、外省供应链缺乏的客户，对生产速度和品质有要求的客户", color: "bg-purple-50 border-purple-200", badgeColor: "bg-purple-500" },
  { level: "L5", name: "产品顾问（外聘设计总监）", price: "面议", desc: "适合自有设计团队但能力弱的客户", features: ["L4全部内容", "外聘设计总监1v1服务", "季度商品企划", "设计团队培训"], suitable: "适合自有设计团队，但研发能力比较弱、部门配合度不够默契、管理不好、浪费严重的客户", color: "bg-red-50 border-red-200", badgeColor: "bg-red-500" },
];

/* ============ 合作模式 - 合作流程 ============ */
const flowSteps = [
  { title: "客户需求", desc: "明确风格定位、品类需求、预算范围" },
  { title: "清晰沟通", desc: "一对一沟通，确认设计方向和服务内容" },
  { title: "签约合作", desc: "签订合同，明确交付标准和时间节点" },
  { title: "确认无忧", desc: "支付定金，正式启动设计项目" },
  { title: "研发方案", desc: "设计师团队制定详细设计方案" },
  { title: "定向设计", desc: "根据方案进行原创设计开发" },
  { title: "满意交付", desc: "客户确认，交付最终设计成果" },
  { title: "客户选款", desc: "从设计方案中挑选满意款式" },
];

/* ============ 主页面 ============ */
export default function HotPicksPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("hot");
  const [designerSubTab, setDesignerSubTab] = useState<"pricing" | "tiers">("pricing");
  const [collocationSeason, setCollocationSeason] = useState<"ss" | "aw">("ss");
  const { user, isHotPicksMember } = useAuth();

  // 统一微信支付函数
  const handleWechatPay = async (productId: string, price: number) => {
    if (!user) {
      alert('请先登录');
      window.location.href = '/login?redirect=/hot-picks';
      return;
    }
    try {
      const response = await fetch('/api/wechat-pay/unified-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          total_fee: price,
          platform: 'mp',
          openid: user.id || '',
        }),
      });
      const result = await response.json();
      if (result.prepay_id || result.package) {
        if (typeof window !== 'undefined' && (window as any).WeixinJSBridge) {
          (window as any).WeixinJSBridge.invoke('getBrandWCPayRequest', {
            appId: result.appId,
            timeStamp: result.timeStamp,
            nonceStr: result.nonceStr,
            package: result.package || `prepay_id=${result.prepay_id}`,
            signType: result.signType || 'MD5',
            paySign: result.paySign,
          }, function(res: any) {
            if (res.err_msg === "get_brand_wcpay_request:ok") {
              alert('支付成功！已开通会员');
              window.location.reload();
            } else if (res.err_msg === "get_brand_wcpay_request:cancel") {
              alert('支付已取消');
            } else {
              alert('支付失败：' + res.err_msg);
            }
          });
        } else {
          alert('请在微信中打开此页面进行支付');
        }
      } else {
        alert('支付发起失败：' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('[wechat pay]', error);
      alert('支付发起失败，请稍后重试');
    }
  };

  const collocationData = collocationSeason === "ss" ? springSummer : autumnWinter;

  return (
    <div className="min-h-screen bg-white">
      {/* ====== Breadcrumb ====== */}
      <nav className="bg-muted/60 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" /> 首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary font-medium">爆款样衣</span>
        </div>
      </nav>

      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-4">
              <ShoppingBag className="w-4 h-4" />
              专业爆款样衣
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              爆款样衣
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              大数据选款 + 专业买手团队，为您提供市场最新爆款样衣
            </p>
          </div>
        </div>
      </section>

      {/* ====== Tab切换 ====== */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-accent text-accent"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 爆款样衣 ====== */}
      {activeTab === "hot" && (
        <>
          {/* 未登录/未开通 → 引导横幅 */}
          {!isHotPicksMember && (
            <section className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <Crown className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-800 text-sm">
                        {user ? "开通爆款样衣会员，解锁全部爆款" : "登录后开通爆款样衣会员"}
                      </p>
                      <p className="text-xs text-amber-600">¥998/月，查看高清图片、价格与商品详情</p>
                    </div>
                  </div>
                  {user ? (
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/wechat-pay/unified-order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              product_id: 'hotpicks_monthly',
                              total_fee: 99800, // ¥998 = 99800分
                              platform: 'mp', // 网站用公众号JSAPI
                              openid: user.id || ''
                            })
                          });
                          const result = await response.json();
                          if (result.prepay_id) {
                            // 网页端调起微信支付
                            if (typeof window !== 'undefined' && (window as any).WeixinJSBridge) {
                              (window as any).WeixinJSBridge.invoke('getBrandWCPayRequest', {
                                appId: result.appId,
                                timeStamp: result.timeStamp,
                                nonceStr: result.nonceStr,
                                package: result.package,
                                signType: result.signType,
                                paySign: result.paySign
                              }, function(res: any) {
                                if (res.err_msg === "get_brand_wcpay_request:ok") {
                                  alert('支付成功！已开通会员');
                                  window.location.reload();
                                } else if (res.err_msg === "get_brand_wcpay_request:cancel") {
                                  alert('支付已取消');
                                } else {
                                  alert('支付失败：' + res.err_msg);
                                }
                              });
                            } else {
                              alert('请在微信中打开此页面进行支付');
                            }
                          } else {
                            alert('支付发起失败：' + (result.error || '未知错误'));
                          }
                        } catch (error) {
                          console.error('[wechat pay]', error);
                          alert('支付发起失败，请稍后重试');
                        }
                      }}
                      className="px-5 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors shrink-0"
                    >
                      微信支付开通
                    </button>
                  ) : (
                    <Link href="/login?redirect=/hot-picks" className="px-5 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors shrink-0">
                      登录 / 注册
                    </Link>
                  )}
                </div>
              </div>
            </section>
          )}
          <HotProductsSection />
        </>
      )}

      {/* ====== 买手爆款样衣 ====== */}
      {activeTab === "buyer" && (
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-accent font-semibold text-sm tracking-widest uppercase">
                Buyer Sample
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
                买手爆款样衣套餐
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                50人+专业买手团队，为您淘遍全网爆款
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {buyerPackages.map((pkg, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-2xl border-2 p-8 transition-shadow hover:shadow-lg ${
                    pkg.season === "春夏"
                      ? "border-green-200 bg-green-50/30"
                      : "border-orange-200 bg-orange-50/30"
                  }`}
                >
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1.5 rounded-full ${
                    pkg.season === "春夏" ? "bg-green-500" : "bg-orange-500"
                  }`}>
                    {pkg.tag}
                  </div>

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-primary mb-2">{pkg.name}</h3>
                    <div className="text-4xl font-bold text-accent mb-1">
                      ¥{pkg.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {pkg.count}款 · 平均¥{pkg.unitPrice}/款 · {pkg.period}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button onClick={() => handleWechatPay('buyer_spring', buyerPackages[0]?.price || 39000)} className="block w-full py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 transition-colors text-center">
                    立即开通
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====== 样衣租赁 ====== */}
      {activeTab === "rental" && (
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-accent font-semibold text-sm tracking-widest uppercase">
                Sample Rental
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
                样衣租赁套餐
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                海量爆款样衣库，随时挑选最新款，保持展厅不低于1000款样衣在线
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {rentalPackages.map((pkg, idx) => {
                const Icon = pkg.icon;
                return (
                  <div
                    key={idx}
                    className={`relative rounded-2xl border-2 p-6 transition-shadow hover:shadow-lg ${
                      pkg.highlight
                        ? "border-accent bg-white shadow-md"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    {pkg.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                        推荐
                      </div>
                    )}

                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 ${
                        pkg.highlight ? "bg-accent/10" : "bg-gray-100"
                      }`}>
                        <Icon className={`w-6 h-6 ${pkg.highlight ? "text-accent" : "text-gray-500"}`} />
                      </div>
                      <h3 className="font-bold text-primary text-lg mb-2">{pkg.name}</h3>
                      <div className={`text-3xl font-bold mb-1 ${pkg.highlight ? "text-accent" : "text-primary"}`}>
                        ¥{pkg.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 mb-6">
                        {pkg.count}款 · 有效期{pkg.period}
                      </div>
                    </div>

                    <button onClick={() => handleWechatPay('rental_trial', pkg.price)} className={`block w-full py-2.5 rounded-xl text-sm font-semibold transition-colors text-center ${
                      pkg.highlight
                        ? "bg-accent text-white hover:bg-accent/90"
                        : "bg-gray-100 text-primary hover:bg-gray-200"
                    }`}>
                      立即开通
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 样衣来源说明 */}
            <div className="mt-12 bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-primary">样衣来源</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
                <div>
                  <div className="font-semibold text-primary mb-2">1. 设计款样衣</div>
                  <p>根据时尚资讯、最新资源、自主研发的新品样衣</p>
                </div>
                <div>
                  <div className="font-semibold text-primary mb-2">2. 数据样衣</div>
                  <p>智能科技大数据分析 + 人为筛选的全网爆款、潜在爆款、爆款微调款</p>
                </div>
                <div>
                  <div className="font-semibold text-primary mb-2">3. 线下批发市场爆款样衣</div>
                  <p>通过国内外知名买手全球采购，实时收集批发市场、买手店、小众品牌、轻奢品牌的爆款、设计师款和原创款</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ====== 设计稿服务 ====== */}
      {activeTab === "designer" && (
        <div>
          {/* 设计稿服务 Hero */}
          <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white py-16 sm:py-20">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
            </div>
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-4">
                  <Layers className="w-4 h-4" />
                  原创设计师平台
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                  专业设计团队
                  <br />
                  按需定制
                </h1>
                <p className="mt-4 text-lg text-white/80 leading-relaxed">
                  从设计图稿到成品样衣，从单款设计到季度企划，专业设计师团队为您提供一站式服务
                </p>
              </div>
            </div>
          </section>

          {/* 设计稿服务 Tab切换 */}
          <section className="bg-white border-b border-gray-100">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex gap-1">
                <button
                  onClick={() => setDesignerSubTab("pricing")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    designerSubTab === "pricing"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  按品类定价
                </button>
                <button
                  onClick={() => setDesignerSubTab("tiers")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    designerSubTab === "tiers"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  套餐服务 L1-L5
                </button>
              </div>
            </div>
          </section>

          {/* 按品类定价 */}
          {designerSubTab === "pricing" && (
            <section className="py-12 md:py-16">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <span className="text-accent font-semibold text-sm tracking-widest uppercase">
                    Category Pricing
                  </span>
                  <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
                    按品类定价
                  </h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                    根据服装品类复杂度定价，支持灵活选择服务内容
                  </p>
                </div>

                {/* 移动端：卡片列表 */}
                <div className="block md:hidden space-y-4">
                  {categoryPrices.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-primary">{item.category}</div>
                          <div className="text-xs text-gray-400 mt-1">单位：{item.unit}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">¥{item.basePrice}</div>
                          <div className="text-xs text-gray-400">起/件</div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-gray-500">仅设计稿</div>
                          <div className="font-semibold text-primary mt-1">¥{item.basePrice}</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-blue-600">+纸样</div>
                          <div className="font-semibold text-blue-600 mt-1">¥{item.withPattern}</div>
                        </div>
                        <div className="text-center p-2 bg-accent/10 rounded">
                          <div className="text-accent">+样衣</div>
                          <div className="font-semibold text-accent mt-1">¥{item.withSample}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 桌面端：表格 */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">品类</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">单位</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">仅设计稿</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">+纸样</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">+样衣</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryPrices.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="px-4 py-4 font-medium text-primary">{item.category}</td>
                          <td className="px-4 py-4 text-center text-gray-600">{item.unit}</td>
                          <td className="px-4 py-4 text-center font-semibold text-primary">¥{item.basePrice}</td>
                          <td className="px-4 py-4 text-center font-semibold text-blue-600">¥{item.withPattern}</td>
                          <td className="px-4 py-4 text-center font-semibold text-accent">¥{item.withSample}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 text-center text-sm text-gray-400">
                  <Info className="w-4 h-4 inline mr-1" />
                  价格仅供参考，具体以设计师报价为准。大货订单可享设计费减免。
                </div>
              </div>
            </section>
          )}

          {/* 套餐服务 L1-L5 */}
          {designerSubTab === "tiers" && (
            <section className="py-12 md:py-16 bg-gray-50/50">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <span className="text-accent font-semibold text-sm tracking-widest uppercase">
                    Service Tiers
                  </span>
                  <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
                    套餐服务 L1-L5
                  </h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                    从纯设计稿到产品顾问，覆盖不同客户的不同需求阶段
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {serviceTiers.map((tier) => (
                    <div
                      key={tier.level}
                      className={`relative rounded-2xl border-2 p-6 transition-shadow hover:shadow-lg ${
                        tier.highlight
                          ? "border-accent bg-white shadow-md"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      {tier.highlight && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                          推荐
                        </div>
                      )}
                      <div className="text-center">
                        <div className={`text-3xl font-bold mb-2 ${
                          tier.highlight ? "text-accent" : "text-primary"
                        }`}>
                          {tier.level}
                        </div>
                        <div className="font-semibold text-primary mb-1">{tier.name}</div>
                        <div className="text-sm text-gray-500 mb-4">{tier.desc}</div>
                        <div className={`text-2xl font-bold mb-6 ${
                          tier.highlight ? "text-accent" : "text-primary"
                        }`}>
                          {tier.price}
                        </div>
                      </div>
                      <ul className="space-y-3 mb-6">
                        {tier.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => handleWechatPay('designer_trial', 9900)}
                        className={`block w-full py-2.5 rounded-xl text-sm font-semibold transition-colors text-center ${
                          tier.highlight
                            ? "bg-accent text-white hover:bg-accent/90"
                            : "bg-gray-100 text-primary hover:bg-gray-200"
                        }`}
                      >
                        咨询详情
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 设计稿服务 CTA */}
          <section className="py-12 md:py-16 bg-primary text-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                需要定制化设计服务？
              </h2>
              <p className="text-white/70 mb-8 max-w-xl mx-auto">
                联系我们的设计顾问，为您量身定制最适合的设计方案
              </p>
              <div className="flex justify-center gap-4">
                <button onClick={() => handleWechatPay('designer_custom', 9900)} className="px-8 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-colors">
                  立即开通
                </button>
                <Link
                  href="/contact"
                  className="px-8 py-3 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
                >
                  联系我们
                </Link>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ====== 搭配稿服务 ====== */}
      {activeTab === "collocation" && (
        <div>
          {/* 搭配稿服务 Hero */}
          <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white py-16 sm:py-20">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
            </div>
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-4">
                  <Layers className="w-4 h-4" />
                  专业搭配服务
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                  搭配稿设计
                </h1>
                <p className="mt-4 text-lg text-white/80 leading-relaxed">
                  从搭配方案到样衣成品，为您的品牌打造完整的产品线
                </p>
              </div>
            </div>
          </section>

          {/* 搭配稿服务 季节切换 */}
          <section className="bg-white border-b border-gray-100">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex gap-1 justify-center">
                <button
                  onClick={() => setCollocationSeason("ss")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    collocationSeason === "ss"
                      ? "border-accent text-accent"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  春夏款
                </button>
                <button
                  onClick={() => setCollocationSeason("aw")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    collocationSeason === "aw"
                      ? "border-accent text-accent"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  秋冬款
                </button>
              </div>
            </div>
          </section>

          {/* 搭配稿套餐 */}
          <section className="py-12 md:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="text-accent font-semibold text-sm tracking-widest uppercase">
                  Collocation Draft
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
                  搭配稿套餐
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  从搭配方案到设计稿、纸样、胚样，灵活选择服务内容
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {collocationData.collocation.map((pkg, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow bg-white">
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-5 h-5 text-accent" />
                      <h3 className="font-bold text-primary text-lg">{pkg.name}</h3>
                    </div>
                    <p className="text-gray-500 text-sm mb-6">{pkg.desc}</p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-bold text-accent">¥{pkg.price.toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-gray-400 mb-6">
                      共{pkg.count}款 · 平均¥{pkg.unitPrice}/款 · {pkg.period}
                    </div>
                    <button onClick={() => handleWechatPay('collocation_pkg', pkg.price)} className="block w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors text-center">
                      立即开通
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 样衣套餐 */}
          <section className="py-12 md:py-16 bg-gray-50/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="text-accent font-semibold text-sm tracking-widest uppercase">
                  Sample Package
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
                  样衣套餐
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  从设计稿到成品样衣，一站式解决您的产品开发需求
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {collocationData.sample.map((pkg, idx) => (
                  <div key={idx} className="border-2 border-accent/20 rounded-2xl p-6 hover:shadow-lg transition-shadow bg-white relative">
                    <div className="absolute -top-3 right-4 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                      样衣
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <Diamond className="w-5 h-5 text-accent" />
                      <h3 className="font-bold text-primary text-lg">{pkg.name}</h3>
                    </div>
                    <p className="text-gray-500 text-sm mb-6">{pkg.desc}</p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-bold text-accent">¥{pkg.price.toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-gray-400 mb-6">
                      共{pkg.count}款 · 平均¥{pkg.unitPrice}/款 · {pkg.period}
                    </div>
                    <button onClick={() => handleWechatPay('collocation_pkg2', pkg.price)} className="block w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors text-center">
                      立即开通
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 备注 */}
          <section className="py-8 bg-gray-100">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-primary">购买须知</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    客人如选用数量大于以上任意一款套餐，则超出适用套餐部分产品的价格按所适用套餐的平均单价计算
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    所有合同期限均为选款无期限，实际选款周期不超过标注时间
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    样衣套餐均为工艺、航管产品，具体工艺要求可咨询客服
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 搭配稿服务 CTA */}
          <section className="py-12 md:py-16 bg-primary text-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                需要定制搭配方案？
              </h2>
              <p className="text-white/70 mb-8 max-w-xl mx-auto">
                联系我们的设计顾问，为您量身定制最适合的搭配方案
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleWechatPay('collocation_custom', 9900)}
                  className="px-8 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-colors"
                >
                  立即开通
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ====== 合作模式 ====== */}
      {activeTab === "cooperation" && (
        <div>
          {/* 合作模式 Hero */}
          <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white py-16 sm:py-20">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
            </div>
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-4">
                  <MessageCircle className="w-4 h-4" />
                  专业合作模式
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                  合作模式
                </h1>
                <p className="mt-4 text-lg text-white/80 leading-relaxed">
                  从纯设计图稿到全案服务，5种合作模式满足不同阶段客户需求
                </p>
              </div>
            </div>
          </section>

          {/* L1-L5 合作模式 */}
          <section className="py-12 md:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="text-accent font-semibold text-sm tracking-widest uppercase">
                  Service Tiers
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
                  五大合作模式
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  根据您的供应链能力和需求阶段，选择最适合的合作方式
                </p>
              </div>

              <div className="space-y-6">
                {cooperationModes.map((mode, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border-2 p-6 md:p-8 ${mode.color} transition-shadow hover:shadow-lg`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      {/* 左侧：等级+价格 */}
                      <div className="md:w-48 flex-shrink-0">
                        <div className={`inline-block ${mode.badgeColor} text-white text-sm font-bold px-3 py-1 rounded-full mb-3`}>
                          {mode.level}
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-2">{mode.name}</h3>
                        <div className="text-2xl font-bold text-accent mb-2">{mode.price}</div>
                        <div className="text-sm text-gray-500">{mode.desc}</div>
                      </div>

                      {/* 中间：服务内容 */}
                      <div className="flex-1">
                        <div className="font-semibold text-primary mb-3">服务内容</div>
                        <ul className="space-y-2">
                          {mode.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 右侧：适合客户 */}
                      <div className="md:w-64 flex-shrink-0">
                        <div className="font-semibold text-primary mb-3">适合客户</div>
                        <div className="text-sm text-gray-600 bg-white/60 rounded-xl p-4">
                          {mode.suitable}
                        </div>
                        <button onClick={() => handleWechatPay('cooperation_mode', 9900)} className="block w-full mt-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors text-center">
                          立即咨询
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 合作流程 */}
          <section className="py-12 md:py-16 bg-gray-50/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="text-accent font-semibold text-sm tracking-widest uppercase">
                  Cooperation Process
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
                  合作流程
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  简单、高效、专业、省心的设计服务合作流程
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {flowSteps.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className="bg-white border border-gray-200 rounded-xl p-5 text-center hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 mx-auto rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-lg mb-3">
                        {idx + 1}
                      </div>
                      <h4 className="font-semibold text-primary mb-1">{step.title}</h4>
                      <p className="text-xs text-gray-500">{step.desc}</p>
                    </div>
                    {idx < flowSteps.length - 1 && idx % 4 !== 3 && (
                      <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2">
                        <ArrowRight className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 合作模式 CTA */}
          <section className="py-12 md:py-16 bg-primary text-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                不知道选哪种合作模式？
              </h2>
              <p className="text-white/70 mb-8 max-w-xl mx-auto">
                联系我们的顾问，根据您的实际情况推荐最适合的合作方案
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleWechatPay('cooperation_free', 0)}
                  className="px-8 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-colors"
                >
                  免费咨询
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ====== 公共 CTA (仅买手爆款样衣和样衣租赁显示) ====== */}
      {(activeTab === "hot" || activeTab === "buyer" || activeTab === "rental") && (
        <section className="py-12 md:py-16 bg-primary text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              需要爆款样衣服务？
            </h2>
            <p className="text-white/70 mb-8 max-w-xl mx-auto">
              联系我们的买手团队，为您挑选最适合的爆款样衣
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleWechatPay('hotpicks_cta', 99800)}
                className="px-8 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-colors"
              >
                立即咨询
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
