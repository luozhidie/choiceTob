"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  ShieldCheck, ArrowRight, ChevronRight, Sparkles,
  Eye, Loader2, Gift, TrendingUp, Camera, Store,
  User, MessageCircle, MapPin, Tag, Palette, Receipt, BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ==================== 选项（与小程序完全一致，确保电脑端/手机端数据同步） ==================== */
const SHOP_TYPES = ["实体店", "档口", "工作室", "网店", "社群团购", "其他"];
const SHOP_SIZES = ["<30㎡", "30-50㎡", "50-80㎡", "80-120㎡", "120-200㎡", ">200㎡"];
const MARKETS = ["广州", "杭州", "深圳", "上海", "常熟", "其他"];
const FREQ_OPTIONS = ["每月1~2次", "每月3~4次", "每周2~3次", "隔天一次", "每天"];
const CATEGORIES = ["女装", "男装", "童装", "配饰", "内衣/家居服"];
const STYLES = ["淑女风", "知性风", "名媛风", "中性风", "潮牌风", "职业风", "休闲风", "大牌风"];
const PRICES = ["100元以下", "100~300元", "300~500元", "500~1000元", "1000元以上"];
const AGES = ["18-25岁", "26-35岁", "36-45岁", "46-55岁", "全年龄"];
const COLORS = [
  "大地色/大地色系", "莫兰迪色系", "多巴胺色", "美拉德色", "新中式/国潮",
  "黑白灰极简", "马卡龙/糖果色", "撞色/对比色", "韩系清新", "法式优雅", "其他",
];

type CertStep = "intro" | "identity" | "profile" | "extra" | "done";

/* 生成与小程序相同的 base64url token {uid}，避免改动已验证的接口 */
function makeAuthToken(uid: string): string {
  const json = JSON.stringify({ uid });
  let b64: string;
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    const bytes = new TextEncoder().encode(json);
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    b64 = window.btoa(bin);
  } else {
    b64 = Buffer.from(json).toString("base64");
  }
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default function CertifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, refreshProfile, isCertifiedStoreOwner } = useAuth();

  const [step, setStep] = useState<CertStep>("intro");

  /* ── Step 1: 店铺身份（全必填 *） ── */
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [wechat, setWechat] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [shopTypeIndex, setShopTypeIndex] = useState(-1);
  const [shopSizeIndex, setShopSizeIndex] = useState(-1);

  /* ── Step 2: 经营画像（全必填 *） ── */
  const [marketCheck, setMarketCheck] = useState<boolean[]>(
    Array(MARKETS.length).fill(false)
  );
  const [freqIndex, setFreqIndex] = useState(-1);
  const [categoryCheck, setCategoryCheck] = useState<boolean[]>(
    Array(CATEGORIES.length).fill(false)
  );
  const [styleCheck, setStyleCheck] = useState<boolean[]>(
    Array(STYLES.length).fill(false)
  );
  const [priceIndex, setPriceIndex] = useState(-1);
  const [ageIndex, setAgeIndex] = useState(-1);

  /* ── Step 3: 补充信息（全必填 *） ── */
  const [address, setAddress] = useState("");
  const [colorIndex, setColorIndex] = useState(-1);
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null); // base64 data url
  const [interiorPhoto, setInteriorPhoto] = useState<string | null>(null);
  const [purchaseOrder, setPurchaseOrder] = useState<string | null>(null); // 拿货单（必填）
  /* ── 经营数据（选填） ── */
  const [monthlyRent, setMonthlyRent] = useState("");
  const [breakEven, setBreakEven] = useState("");
  const [grossMargin, setGrossMargin] = useState("");
  const [netMargin, setNetMargin] = useState("");
  const [onlineExposure, setOnlineExposure] = useState("");
  const [footTraffic, setFootTraffic] = useState("");
  const [conversionRate, setConversionRate] = useState("");
  const [attachRate, setAttachRate] = useState("");
  const [avgItemPrice, setAvgItemPrice] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [trafficChannels, setTrafficChannels] = useState("");
  const [notes, setNotes] = useState("");

  /* ── 提交状态 ── */
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const frontInputRef = useRef<HTMLInputElement>(null);
  const interiorInputRef = useRef<HTMLInputElement>(null);
  const purchaseInputRef = useRef<HTMLInputElement>(null);

  // 已认证 → 直接展示完成态
  useEffect(() => {
    if (isCertifiedStoreOwner) setStep("done");
  }, [isCertifiedStoreOwner]);

  // 从 ?redirect= 回跳
  const redirectTo = searchParams.get("redirect") || "/buyer";

  /* ── 多选切换 ── */
  const toggleArr = (
    setter: React.Dispatch<React.SetStateAction<boolean[]>>,
    idx: number
  ) => setter((prev) => prev.map((v, i) => (i === idx ? !v : v)));

  /* ── 步骤间回退 ── */
  const goBackStep = () => {
    if (step === "identity") setStep("intro");
    else if (step === "profile") setStep("identity");
    else if (step === "extra") setStep("profile");
    else if (step === "done") setStep("extra");
  };

  /* ── Step1 → Step2 校验 ── */
  const goProfile = () => {
    if (!name.trim()) return toast("请填写店铺名称");
    if (!contact.trim()) return toast("请填写联系人");
    if (!phone.trim()) return toast("请填写联系电话");
    if (!wechat.trim()) return toast("请填写微信号");
    if (!city.trim()) return toast("请填写所在城市");
    if (shopTypeIndex < 0) return toast("请选择经营模式");
    if (shopSizeIndex < 0) return toast("请选择店铺面积");
    setStep("profile");
  };

  /* ── Step2 → Step3 校验 ── */
  const goExtra = () => {
    if (!marketCheck.some(Boolean)) return toast("请至少选择1个拿货市场");
    if (freqIndex < 0) return toast("请选择月均拿货频次");
    if (!categoryCheck.some(Boolean)) return toast("请至少选择1个主营品类");
    if (!styleCheck.some(Boolean)) return toast("请至少选择1个风格偏好");
    if (priceIndex < 0) return toast("请选择价格带");
    if (ageIndex < 0) return toast("请选择目标年龄层");
    setStep("extra");
  };

  const toast = (msg: string) => {
    setSubmitError(msg);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── 照片读取 ── */
  const readPhoto = (file: File, setter: (v: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };
  const onFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) readPhoto(e.target.files[0], setFrontPhoto);
  };
  const onInteriorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) readPhoto(e.target.files[0], setInteriorPhoto);
  };
  const onPurchaseOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) readPhoto(e.target.files[0], setPurchaseOrder);
  };

  /* ── 提交认证 ── */
  const submitCertify = async () => {
    if (submitting) return;

    if (!address.trim()) return toast("请填写店铺地址");
    if (colorIndex < 0) return toast("请选择店铺主要色系");
    if (!frontPhoto) return toast("请上传店铺门头照");
    if (!interiorPhoto) return toast("请上传店内陈列照");
    if (!purchaseOrder) return toast("请上传拿货单");

    if (!user) {
      router.push(`/login?redirect=/certify?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const selMarkets = MARKETS.filter((_, i) => marketCheck[i]);
    const selCats = CATEGORIES.filter((_, i) => categoryCheck[i]);
    const selStyles = STYLES.filter((_, i) => styleCheck[i]);

    const store = {
      name: name.trim(),
      contact_person: contact.trim() || null,
      phone: phone.trim() || null,
      wechat: wechat.trim() || null,
      city: city.trim() || null,
      district: district.trim() || null,
      shop_size: shopSizeIndex >= 0 ? SHOP_SIZES[shopSizeIndex] : null,
      style_position: selStyles.length > 0 ? selStyles.join(",") : null,
      target_age: ageIndex >= 0 ? AGES[ageIndex] : null,
      price_range: priceIndex >= 0 ? PRICES[priceIndex] : null,
      business_data: {
        shop_type: shopTypeIndex >= 0 ? SHOP_TYPES[shopTypeIndex] : null,
        wholesale_markets: selMarkets.join(","),
        purchase_frequency: freqIndex >= 0 ? FREQ_OPTIONS[freqIndex] : null,
        main_categories: selCats.join(","),
        store_color_system: colorIndex >= 0 ? COLORS[colorIndex] : null,
        store_address: address.trim(),
        source: "web_certify",
        notes: notes || null,
        front_photo_base64: frontPhoto, // 门头照
        interior_photo_base64: interiorPhoto, // 陈列照
        purchase_order_base64: purchaseOrder, // 拿货单
        /* 经营数据（选填，有值才传） */
        monthly_rent: monthlyRent ? Number(monthlyRent) : null,
        break_even_point: breakEven ? Number(breakEven) : null,
        gross_margin_rate: grossMargin ? Number(grossMargin) : null,
        net_margin_rate: netMargin ? Number(netMargin) : null,
        online_exposure: onlineExposure ? Number(onlineExposure) : null,
        foot_traffic: footTraffic ? Number(footTraffic) : null,
        conversion_rate: conversionRate ? Number(conversionRate) : null,
        attach_rate: attachRate ? Number(attachRate) : null,
        avg_item_price: avgItemPrice ? Number(avgItemPrice) : null,
        monthly_revenue: monthlyRevenue ? Number(monthlyRevenue) : null,
        traffic_channels: trafficChannels.trim() || null,
      },
      notes: notes || null,
    };

    try {
      const res = await fetch("/api/auth/store-certify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: makeAuthToken(user.id), store }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "提交失败");

      await refreshProfile();
      setStep("done");
      window.scrollTo({ top: 0 });
    } catch (err: any) {
      setSubmitError(err.message || "提交失败，请重试");
      window.scrollTo({ top: 0 });
    } finally {
      setSubmitting(false);
    }
  };

  const gotoBuyer = () => router.push(redirectTo);

  /* ==================== 渲染 ==================== */

  // 已认证完成
  if (step === "done") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-5 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-primary mb-2">认证成功！🎉</h1>
          <p className="text-sm text-muted-foreground mb-6">
            批发价已开启 · 信息已同步至后台
            {profile?.certified_at && (
              <>
                <br />认证时间：{new Date(profile.certified_at).toLocaleDateString("zh-CN")}
              </>
            )}
            {profile?.certified_style && (
              <>
                <br />常拿风格：<span className="font-medium">{profile.certified_style}</span>
              </>
            )}
          </p>
          <div className="space-y-3">
            <button onClick={gotoBuyer} className="w-full py-3 bg-accent text-white font-semibold rounded-xl hover:brightness-110 transition-all">
              去看款拿货
            </button>
            <Link href="/my" className="block w-full py-3 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl text-center hover:bg-gray-50">
              返回个人中心
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const benefits = [
    { icon: Eye, title: "批发价查看权", desc: "认证即可查看所有商品批发价" },
    { icon: Gift, title: "退换额度", desc: "充值后享阶梯退换额度" },
    { icon: Sparkles, title: "新款抢先看", desc: "当季新品提前浏览推荐" },
    { icon: TrendingUp, title: "精准推荐", desc: "基于店铺画像匹配款式" },
  ];

  const stepMeta: Record<string, { n: string; title: string }> = {
    identity: { n: "1/4", title: "店铺基本信息" },
    profile: { n: "2/4", title: "经营画像" },
    extra: { n: "3/4", title: "补充信息" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-accent/5 to-white">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {step !== "intro" && (
            <button onClick={goBackStep} className="text-sm text-gray-500 hover:text-primary">
              ← 上一步
            </button>
          )}
          {stepMeta[step] && (
            <span className="text-sm font-medium text-primary">
              {stepMeta[step].n} {stepMeta[step].title}
            </span>
          )}
          <div className="ml-auto" />
          {!user && (
            <Link href={`/login?redirect=/certify`} className="text-sm text-primary font-medium hover:underline">
              登录
            </Link>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* ── Step 1: 开场 ── */}
        {step === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-lg mx-auto px-4 pt-12 pb-8"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg mb-5">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-primary leading-snug mb-3">填写店铺信息，即刻开通批发价</h1>
              <p className="text-base text-gray-600 leading-relaxed">
                认证店主可查看批发价、享退换额度，<br />并基于店铺画像获得精准款式推荐
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 space-y-4">
              {benefits.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep("identity")}
              className="w-full py-4 bg-accent text-white text-lg font-bold rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-accent/25 flex items-center justify-center gap-2"
            >
              开始填写
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* ── Step 2: 店铺身份 ── */}
        {step === "identity" && (
          <motion.div
            key="identity"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="max-w-lg mx-auto px-4 pt-6 pb-8"
          >
            {submitError && <ErrBar msg={submitError} />}
            <SectionCard icon={Store} title="基本信息" hint="全项必填 *">
              <Field label="店铺名称" required>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="联系人" required>
                  <input className={inputCls} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="" />
                </Field>
                <Field label="联系电话" required>
                  <input className={inputCls} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="" />
                </Field>
                <Field label="微信号" required>
                  <input className={inputCls} value={wechat} onChange={(e) => setWechat(e.target.value)} placeholder="" />
                </Field>
                <Field label="所在城市" required>
                  <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="" />
                </Field>
              </div>
              <Field label="商圈/地段" required>
                <input className={inputCls} value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="" />
              </Field>
              <Field label="经营模式" required>
                <Select value={shopTypeIndex} options={SHOP_TYPES} onChange={setShopTypeIndex} placeholder="请选择 ▾" />
              </Field>
              <Field label="店铺面积" required>
                <Select value={shopSizeIndex} options={SHOP_SIZES} onChange={setShopSizeIndex} placeholder="请选择 ▾" />
              </Field>
            </SectionCard>

            <button onClick={goProfile} className={btnPrimary}>
              下一步：经营画像
              <ChevronRight className="w-4 h-4 inline ml-1" />
            </button>
          </motion.div>
        )}

        {/* ── Step 3: 经营画像 ── */}
        {step === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="max-w-lg mx-auto px-4 pt-6 pb-8"
          >
            {submitError && <ErrBar msg={submitError} />}
            <SectionCard icon={MapPin} title="主要拿货市场" hint="至少选1个 *">
              <TagGroup options={MARKETS} check={marketCheck} onToggle={(i) => toggleArr(setMarketCheck, i)} />
            </SectionCard>

            <SectionCard icon={TrendingUp} title="月均拿货频次" hint="*">
              <Select value={freqIndex} options={FREQ_OPTIONS} onChange={setFreqIndex} placeholder="请选择 ▾" />
            </SectionCard>

            <SectionCard icon={Tag} title="主营品类" hint="至少选1个 *">
              <TagGroup options={CATEGORIES} check={categoryCheck} onToggle={(i) => toggleArr(setCategoryCheck, i)} />
            </SectionCard>

            <SectionCard icon={Palette} title="风格偏好" hint="至少选1个 *">
              <TagGroup options={STYLES} check={styleCheck} onToggle={(i) => toggleArr(setStyleCheck, i)} />
            </SectionCard>

            <SectionCard icon={User} title="目标客群" hint="*">
              <Field label="目标年龄层" required>
                <Select value={ageIndex} options={AGES} onChange={setAgeIndex} placeholder="请选择 ▾" />
              </Field>
              <Field label="价格带" required>
                <Select value={priceIndex} options={PRICES} onChange={setPriceIndex} placeholder="请选择 ▾" />
              </Field>
            </SectionCard>

            <button onClick={goExtra} className={btnPrimary}>
              下一步：补充信息
              <ChevronRight className="w-4 h-4 inline ml-1" />
            </button>
          </motion.div>
        )}

        {/* ── Step 4: 补充信息 ── */}
        {step === "extra" && (
          <motion.div
            key="extra"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="max-w-lg mx-auto px-4 pt-6 pb-8"
          >
            {submitError && <ErrBar msg={submitError} />}
            <SectionCard icon={MapPin} title="店铺位置" hint="*">
              <Field label="详细地址" required>
                <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="" />
              </Field>
              <Field label="当前店铺主要色系" required>
                <Select value={colorIndex} options={COLORS} onChange={setColorIndex} placeholder="请选择 ▾" />
              </Field>
            </SectionCard>

            <SectionCard icon={Camera} title="店铺照片" hint="各1张 *">
              <PhotoBox label="* 店铺门头照" tip="展示招牌/店招" onClick={() => frontInputRef.current?.click()}
                src={frontPhoto} fallbackIcon="📸" />
              <input ref={frontInputRef} type="file" accept="image/*" className="hidden" onChange={onFrontChange} />

              <PhotoBox label="* 店内陈列照" tip="展示店内陈列/货架" onClick={() => interiorInputRef.current?.click()}
                src={interiorPhoto} fallbackIcon="🏪" />
              <input ref={interiorInputRef} type="file" accept="image/*" className="hidden" onChange={onInteriorChange} />
            </SectionCard>

            {/* 拿货单上传（必填） */}
            <SectionCard icon={Receipt} title="拿货单" hint="*">
              <PhotoBox label="* 上传拿货单（必填）" tip="拍照或相册选取近期拿货单据" onClick={() => purchaseInputRef.current?.click()}
                src={purchaseOrder} fallbackIcon="🧾" />
              <input ref={purchaseInputRef} type="file" accept="image/*" className="hidden" onChange={onPurchaseOrderChange} />
            </SectionCard>

            {/* 经营数据（选填） */}
            <SectionCard icon={BarChart3} title="经营数据" hint="选填">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["月租金（元）", monthlyRent, setMonthlyRent, "如：8000"],
                  ["保本点（元/月）", breakEven, setBreakEven, "如：30000"],
                  ["毛利率", grossMargin, setGrossMargin, "如 0.55 表示55%"],
                  ["净利率", netMargin, setNetMargin, "如 0.55 表示55%"],
                  ["线上曝光人数/月", onlineExposure, setOnlineExposure, "如：5000"],
                  ["月进店数", footTraffic, setFootTraffic, "如：300"],
                  ["成交率", conversionRate, setConversionRate, "如 0.55 表示55%"],
                  ["连带率", attachRate, setAttachRate, "如：2.5"],
                  ["均件单价（元）", avgItemPrice, setAvgItemPrice, "如：280"],
                ].map(([label, val, setter, ph]) => (
                  <Field key={label as string} label={label as string}>
                    <input className={`${inputCls} text-sm`} type="text"
                      value={val as string}
                      onChange={(e) => setter!(e.target.value)}
                      placeholder={ph as string} />
                  </Field>
                ))}
              </div>
              <Field label="月营业额（元）">
                <input className={inputCls} type="text" value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(e.target.value)} placeholder="" />
              </Field>
              <Field label="流量渠道（逗号分隔）">
                <input className={inputCls} value={trafficChannels}
                  onChange={(e) => setTrafficChannels(e.target.value)}
                  placeholder="" />
              </Field>
            </SectionCard>

            <SectionCard icon={MessageCircle} title="备注 / 需求说明" hint="选填">
              <textarea className={textareaCls} value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="" rows={3} />
            </SectionCard>

            <button
              onClick={submitCertify}
              disabled={submitting}
              className={`${btnPrimary} ${submitting ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 inline animate-spin" /> 提交中...</>
              ) : (
                <>提交认证，开通批发价 🛡</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-16 md:hidden" />
    </div>
  );
}

/* ==================== 子组件 & 样式 ==================== */
const inputCls =
  "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent";
const textareaCls =
  "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none";
const btnPrimary =
  "w-full mt-5 py-3.5 bg-accent text-white font-semibold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2";

function ErrBar({ msg }: { msg: string }) {
  return (
    <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center">
      {msg}
    </div>
  );
}

function SectionCard({
  icon: Icon, title, hint, children,
}: {
  icon: any; title: string; hint: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-gray-900">{title}</span>
        <span className="ml-auto text-xs text-red-500 font-medium">{hint}</span>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label, required, children,
}: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Select({
  value, options, onChange, placeholder,
}: {
  value: number; options: string[]; onChange: (i: number) => void; placeholder: string;
}) {
  return (
    <select
      value={value < 0 ? "" : value}
      onChange={(e) => onChange(e.target.value === "" ? -1 : Number(e.target.value))}
      className={`${inputCls} appearance-none bg-white ${value < 0 ? "text-gray-400" : "text-gray-900"}`}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((o, i) => (
        <option key={o} value={i}>{o}</option>
      ))}
    </select>
  );
}

function TagGroup({
  options, check, onToggle,
}: {
  options: string[]; check: boolean[]; onToggle: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          onClick={() => onToggle(i)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            check[i]
              ? "border-accent bg-accent/10 text-accent"
              : "border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function PhotoBox({
  label, tip, onClick, src, fallbackIcon,
}: {
  label: string; tip: string; onClick: () => void; src: string | null; fallbackIcon: string;
}) {
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={onClick}
        className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-accent hover:text-accent transition-all"
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={label} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <>
            <span className="text-3xl">{fallbackIcon}</span>
            <span className="text-sm">{tip}</span>
          </>
        )}
      </button>
      <p className="text-xs text-red-500 mt-1.5">{label}</p>
    </div>
  );
}
