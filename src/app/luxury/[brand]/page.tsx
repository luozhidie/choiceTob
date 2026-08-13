"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Shirt, Scissors, Gem, Heart } from "lucide-react";

const FALLBACK_DATA: Record<string, any> = {
  "chanel": {
    name_cn: "香奈儿", name_en: "Chanel", year: 1910, country: "法国",
    profile: "以简约优雅、斜纹软呢、珍珠元素著称，现代女性时尚的奠基者。",
    classics: [
      { type: "classic_style", title: "斜纹软呢外套", desc: "Chanel 最具标志性的外套，源自1950s，永恒优雅。", attrs: { colors: ["黑色","米色"], styles: ["经典"] } },
      { type: "classic_style", title: "255 手袋", desc: "1955年推出的翻盖包，菱格纹 + 金属链。", attrs: { colors: ["黑色"], styles: ["经典"] } },
      { type: "brand_element", title: "双色鞋", desc: "米色鞋身 + 黑色鞋尖，拉长脚型。", attrs: { colors: ["米色","黑色"] } },
      { type: "runway_look", title: "2024 早秋", desc: "向 Mademoiselle 私人公寓致敬。", attrs: { colors: ["金色","黑色"] } },
    ],
  },
  "dior": {
    name_cn: "迪奥", name_en: "Dior", year: 1946, country: "法国",
    profile: "新风貌（New Look）开创者，优雅奢华的代名词。",
    classics: [
      { type: "classic_style", title: "Bar Jacket 收腰外套", desc: "1947 新风貌核心单品，收腰 + 阔摆。", attrs: { cuts: ["收腰"] } },
      { type: "classic_style", title: "Lady Dior 戴妃包", desc: "1995 年赠予戴安娜王妃得名的菱格纹包。", attrs: { patterns: ["菱格"] } },
      { type: "brand_element", title: "Oblique 老花", desc: "Dior 标志性 monogram 图案。", attrs: { patterns: ["monogram"] } },
    ],
  },
  "ysl": {
    name_cn: "圣罗兰", name_en: "Saint Laurent", year: 1961, country: "法国",
    profile: "颠覆传统，倡导女性西装与中性风。",
    classics: [
      { type: "classic_style", title: "Le Smoking 吸烟装", desc: "1966 年首推女性燕尾服。", attrs: { styles: ["中性"] } },
      { type: "brand_element", title: "YSL 金扣", desc: "Cassandre 设计的黄金字母扣。", attrs: { patterns: ["logo"] } },
    ],
  },
  "loewe": {
    name_cn: "罗意威", name_en: "Loewe", year: 1846, country: "西班牙",
    profile: "百年皮具世家，Jonathan Anderson 注入艺术先锋感。",
    classics: [
      { type: "classic_style", title: "Puzzle 拼图包", desc: "几何解构主义代表作。", attrs: { styles: ["解构"] } },
      { type: "brand_element", title: "Anagram 字母扣", desc: "Loewe 交织字母 L 标志。", attrs: { patterns: ["字母"] } },
    ],
  },
  "valentino": {
    name_cn: "华伦天奴", name_en: "Valentino", year: 1960, country: "意大利",
    profile: "以 Valentino Red 正红和仙女裙著称。",
    classics: [
      { type: "classic_style", title: "Valentino Red 正红礼服", desc: "品牌标志性正红高定礼服。", attrs: { colors: ["红色"], styles: ["高定"] } },
      { type: "brand_element", title: "Rockstud 铆钉", desc: "金字塔形铆钉装饰。", attrs: { patterns: ["铆钉"] } },
    ],
  },
};

export default function LuxuryBrandPage() {
  const params = useParams();
  const router = useRouter();
  const brandKey = params.brand as string;

  const [brand, setBrand] = useState<any>(null);
  const [classics, setClassics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/luxury/brands?key=${brandKey}`);
        const data = await res.json();
        if (!cancelled) {
          setBrand(data.brand || null);
          setClassics(data.classics || []);
        }
      } catch {
        // 降级使用本地数据
        if (!cancelled) {
          const fb = FALLBACK_DATA[brandKey];
          if (fb) {
            setBrand({
              brand_key: brandKey,
              brand_name_cn: fb.name_cn,
              brand_name_en: fb.name_en,
              founded_year: fb.year,
              origin_country: fb.country,
              brand_profile: fb.profile,
            });
            setClassics(fb.classics.map((c: any, i: number) => ({ ...c, id: i })));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [brandKey]);

  const typeLabel = (t: string) => {
    if (t === "classic_style") return "经典款式";
    if (t === "brand_element") return "品牌元素";
    if (t === "runway_look") return "走秀造型";
    return t;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-gray-400">品牌不存在</p>
        <Link href="/luxury" className="text-sm text-primary hover:underline">返回奢品库 →</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部面包屑 */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary">首页</Link>
            <span>/</span>
            <Link href="/luxury" className="hover:text-primary">奢品参考库</Link>
            <span>/</span>
            <span className="text-primary font-medium">{brand.brand_name_cn}</span>
          </nav>
        </div>
      </div>

      {/* 品牌 Hero */}
      <section className="bg-gradient-to-r from-primary to-accent text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{brand.brand_name_cn}</h1>
          <p className="text-white/80 text-sm mb-1">{brand.brand_name_en} · {brand.origin_country} · {brand.founded_year}年创立</p>
          <p className="text-white/70 max-w-2xl mt-3 leading-relaxed">{brand.brand_profile}</p>
        </div>
      </section>

      {/* 经典款 + 品牌元素 */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold text-primary mb-6">经典款式 · 品牌元素</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classics.map((item: any, idx: number) => (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    item.item_type === "classic_style" ? "bg-primary/10 text-primary" :
                    item.item_type === "brand_element" ? "bg-accent/10 text-accent" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {typeLabel(item.item_type)}
                  </span>
                </div>
                <h3 className="font-bold text-primary mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">{item.description}</p>
                {item.attributes && (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(item.attributes).map(([k, v]: [string, any]) =>
                      v && Array.isArray(v) && v.length > 0 && v.map((val: string) => (
                        <span key={`${k}-${val}`} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          {val}
                        </span>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 如何使用参考 */}
      <section className="pb-12">
        <div className="container mx-auto px-4">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 md:p-6">
            <h3 className="text-sm font-bold text-amber-800 mb-2">💡 如何将奢品元素融入您的商品开发</h3>
            <ul className="text-xs text-amber-700 space-y-1 ml-4 list-disc">
              <li>分析该品牌的经典色彩搭配，提取应用到您的爆款开发</li>
              <li>参考品牌标志性剪裁方式，结合目标客群做适应性改良</li>
              <li>关注品牌近3年走秀趋势，预判下一季流行方向</li>
              <li>将品牌元素（如五金扣型、图案）融入您的设计，提升质感</li>
            </ul>
            <Link href="/members" className="mt-3 inline-flex items-center gap-1 text-xs text-accent font-medium hover:underline">
              前往会员中心，使用爆款预测分析功能 →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
