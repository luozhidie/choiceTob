"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Save,
  Palette,
  Sparkles,
  User,
  Phone,
  MessageCircle,
  Loader2,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 12季色彩季型
const colorSeasons = [
  { value: "deep_autumn", label: "深秋型", group: "秋", desc: "深沉浓郁，暖色调为主" },
  { value: "warm_autumn", label: "暖秋型", group: "秋", desc: "温暖醇厚，大地色系" },
  { value: "soft_autumn", label: "柔秋型", group: "秋", desc: "柔和含蓄，低饱和暖色" },
  { value: "deep_winter", label: "深冬型", group: "冬", desc: "深邃冷艳，高对比冷色" },
  { value: "cool_winter", label: "冷冬型", group: "冬", desc: "冷冽纯净，蓝基调为主" },
  { value: "clear_winter", label: "净冬型", group: "冬", desc: "清透鲜明，高饱和冷色" },
  { value: "light_spring", label: "浅春型", group: "春", desc: "明亮清新，浅暖色调" },
  { value: "warm_spring", label: "暖春型", group: "春", desc: "温暖明快，黄基调暖色" },
  { value: "clear_spring", label: "净春型", group: "春", desc: "鲜艳透亮，高饱和暖色" },
  { value: "light_summer", label: "浅夏型", group: "夏", desc: "柔和淡雅，浅冷色调" },
  { value: "cool_summer", label: "冷夏型", group: "夏", desc: "清冷朦胧，蓝基调冷色" },
  { value: "soft_summer", label: "柔夏型", group: "夏", desc: "沉静内敛，低饱和冷色" },
];

// 风格类型
const styleTypes = [
  { value: "shao_nv", label: "少女型", gender: "female" },
  { value: "shao_nian", label: "少年型", gender: "female" },
  { value: "you_ya", label: "优雅型", gender: "female" },
  { value: "lang_man", label: "浪漫型", gender: "female" },
  { value: "xi_ju", label: "戏剧型", gender: "both" },
  { value: "gu_dian", label: "古典型", gender: "both" },
  { value: "zi_ran", label: "自然型", gender: "both" },
  { value: "qian_wei", label: "前卫型", gender: "both" },
  { value: "shi_shang", label: "时尚型", gender: "male" },
];

// AI选品建议（根据色彩季型+风格生成）
const aiRecommendations: Record<string, { colors: string[]; styles: string[]; fabrics: string[]; tips: string }> = {
  deep_autumn: {
    colors: ["酒红", "墨绿", "咖啡棕", "深金", "砖红", "橄榄绿"],
    styles: ["大衣", "西装外套", "阔腿裤", "针织衫", "风衣"],
    fabrics: ["羊绒", "丝绒", "皮革", "粗花呢", "真丝"],
    tips: "深秋型适合浓郁深沉的色彩，搭配高对比度造型更显气场。避免浅淡柔和的色调。",
  },
  warm_autumn: {
    colors: ["焦糖色", "暖橙", "芥末黄", "红棕", "苔绿", "奶油白"],
    styles: ["针织开衫", "A字裙", "休闲西装", "长款衬衫", "百褶裙"],
    fabrics: ["棉麻", "灯芯绒", "羊毛", "麂皮", "粗针织"],
    tips: "暖秋型最适合大地色系，温暖醇厚的色调让你散发亲和力。避免冷蓝色调。",
  },
  soft_autumn: {
    colors: ["米色", "驼色", "灰粉", "豆沙绿", "浅棕", "暖灰"],
    styles: ["柔软毛衣", "半身裙", "衬衫裙", "休闲裤", "轻薄外套"],
    fabrics: ["细针织", "雪纺", "柔软棉", "薄纱", "丝绵混纺"],
    tips: "柔秋型适合低饱和暖色，柔和不刺眼。避免高对比度搭配和过于鲜艳的色彩。",
  },
  deep_winter: {
    colors: ["纯黑", "深蓝", "酒红", "纯白", "玫红", "墨紫"],
    styles: ["修身西装", "皮衣", "直筒裤", "高领毛衣", "连衣裙"],
    fabrics: ["皮革", "真丝", "缎面", "精纺羊毛", "金属感面料"],
    tips: "深冬型适合高对比度搭配，黑白对比或深色撞色效果出众。避免浑浊的中性色。",
  },
  cool_winter: {
    colors: ["宝蓝", "冰蓝", "松石绿", "洋红", "纯白", "银灰"],
    styles: ["西装套装", "铅笔裙", "衬衫", "大衣", "旗袍"],
    fabrics: ["真丝", "缎面", "精纺羊毛", "雪纺", "亮面皮革"],
    tips: "冷冬型适合冷艳清冽的色调，蓝基调的色彩最能衬托气质。避免暖黄基调。",
  },
  clear_winter: {
    colors: ["正红", "宝蓝", "翠绿", "明黄", "纯白", "亮紫"],
    styles: ["廓形外套", "亮色单品", "几何图案", "对比搭配", "剪裁利落的套装"],
    fabrics: ["真丝缎面", "皮革", "金属感面料", "精细羊毛", "亮片"],
    tips: "净冬型适合高饱和纯色，越鲜明越出众。避免灰调低饱和色彩。",
  },
  light_spring: {
    colors: ["浅粉", "鹅黄", "天蓝", "浅绿", "珊瑚色", "奶油白"],
    styles: ["雪纺衫", "短裙", "轻薄针织", "连衣裙", "小香风外套"],
    fabrics: ["雪纺", "真丝", "细棉", "轻薄针织", "蕾丝"],
    tips: "浅春型适合明亮清新的浅色调，像春日花朵般温柔。避免深暗沉闷的色彩。",
  },
  warm_spring: {
    colors: ["橙红", "金棕", "草绿", "杏色", "蜜桃粉", "暖白"],
    styles: ["印花连衣裙", "短外套", "阔腿短裤", "荷叶边上衣", "针织衫"],
    fabrics: ["棉质", "亚麻", "细针织", "轻薄羊毛", "丝棉"],
    tips: "暖春型适合温暖明快的黄基调色彩，活力四射。避免冷蓝基调和暗沉色。",
  },
  clear_spring: {
    colors: ["正红", "亮橙", "翠绿", "明黄", "湖蓝", "暖白"],
    styles: ["亮色单品", "印花衬衫", "短裤套装", "撞色搭配", "活力运动风"],
    fabrics: ["丝光棉", "真丝", "精细针织", "亮面材质", "透气亚麻"],
    tips: "净春型适合鲜艳明亮的纯色，像阳光一样耀眼。避免灰暗浑浊的色彩。",
  },
  light_summer: {
    colors: ["薰衣草紫", "灰蓝", "玫瑰粉", "雾绿", "浅灰", "柔白"],
    styles: ["垂感衬衫", "百褶裙", "针织开衫", "阔腿裤", "飘逸连衣裙"],
    fabrics: ["雪纺", "真丝", "细针织", "薄纱", "柔软棉"],
    tips: "浅夏型适合柔和淡雅的浅冷色调，如水彩画般温柔。避免浓烈深暗的色彩。",
  },
  cool_summer: {
    colors: ["灰蓝", "梅紫", "玫瑰粉", "薄荷绿", "冷灰", "柔白"],
    styles: ["衬衫", "铅笔裙", "西装外套", "直筒裤", "简约连衣裙"],
    fabrics: ["精纺羊毛", "真丝", "棉混纺", "雪纺", "细针织"],
    tips: "冷夏型适合清冷朦胧的蓝基调色彩，自带高级感。避免暖黄基调和大红大绿。",
  },
  soft_summer: {
    colors: ["灰粉", "雾霾蓝", "灰紫", "鼠尾草绿", "灰棕", "米白"],
    styles: ["基础款T恤", "休闲西装", "宽松毛衣", "直筒牛仔裤", "简约风衣"],
    fabrics: ["棉麻混纺", "水洗牛仔", "柔软针织", "磨毛面料", "轻薄羊毛"],
    tips: "柔夏型适合低饱和冷色调，沉静内敛不张扬。避免高饱和亮色和高对比搭配。",
  },
};

export default function ColorAnalysisPage() {
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_wechat: "",
    gender: "female",
    color_season: "",
    main_style: "",
    sub_style: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const supabase = createClient();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!form.customer_name.trim()) {
      alert("请填写客户姓名");
      return;
    }
    setSaving(true);
    try {
      // 1. 保存/更新 VIP 客户
      const { data: existingCustomer } = await supabase
        .from("vip_customers")
        .select("id")
        .eq("phone", form.customer_phone.trim())
        .maybeSingle();

      if (existingCustomer) {
        await supabase
          .from("vip_customers")
          .update({
            color_season: form.color_season || null,
            main_style: form.main_style || null,
            sub_style: form.sub_style || null,
            notes: form.notes || null,
          })
          .eq("id", existingCustomer.id);
      } else {
        await supabase.from("vip_customers").insert([
          {
            name: form.customer_name.trim(),
            phone: form.customer_phone.trim() || null,
            wechat: form.customer_wechat.trim() || null,
            gender: form.gender,
            color_season: form.color_season || null,
            main_style: form.main_style || null,
            sub_style: form.sub_style || null,
            notes: form.notes || null,
          },
        ]);
      }

      // 2. 保存风格测试结果（manual source）
      if (form.color_season || form.main_style) {
        await supabase.from("style_test_results").insert([
          {
            gender: form.gender,
            answers: {},
            main_style: form.main_style || form.color_season,
            source: "manual",
            customer_name: form.customer_name.trim(),
            customer_phone: form.customer_phone.trim() || null,
            customer_wechat: form.customer_wechat.trim() || null,
            notes: form.notes || null,
          },
        ]);
      }

      showToast("success", "客户色彩数据已保存！");
      if (form.color_season) {
        setShowResult(true);
      }
    } catch (err: any) {
      showToast("error", "保存失败：" + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateDelivery = async () => {
    if (!form.color_season || !form.customer_name.trim()) return;

    const season = colorSeasons.find((s) => s.value === form.color_season);
    const rec = aiRecommendations[form.color_season];
    if (!rec) return;

    const styleLabel = styleTypes.find((s) => s.value === form.main_style)?.label || "";
    const deliveryTitle = `${form.customer_name} - ${season?.label}${styleLabel ? " + " + styleLabel : ""} 选品方案`;

    const deliveryData = {
      color_season: form.color_season,
      color_season_label: season?.label,
      main_style: form.main_style,
      main_style_label: styleLabel,
      recommendations: rec,
    };

    const priceMap: Record<string, number> = {
      select: 29800,    // ¥298
      display: 39800,   // ¥398
      planning: 59800,  // ¥598
      full: 99800,      // ¥998
    };

    // 自动生成3个交付方案
    const plans = [
      {
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim() || null,
        customer_wechat: form.customer_wechat.trim() || null,
        service_type: "select",
        title: `${deliveryTitle} - 选品方案`,
        description: `基于${season?.label}${styleLabel ? "+" + styleLabel : ""}分析的精准选品推荐`,
        delivery_data: deliveryData,
        price: priceMap.select,
        status: "draft",
        notes: `色彩季型：${season?.label}\n主风格：${styleLabel || "未设定"}\n推荐色彩：${rec.colors.join("、")}\n推荐款式：${rec.styles.join("、")}\n推荐面料：${rec.fabrics.join("、")}`,
      },
      {
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim() || null,
        customer_wechat: form.customer_wechat.trim() || null,
        service_type: "display",
        title: `${deliveryTitle} - 陈列方案`,
        description: `基于${season?.label}${styleLabel ? "+" + styleLabel : ""}的店铺陈列搭配方案`,
        delivery_data: deliveryData,
        price: priceMap.display,
        status: "draft",
        notes: `陈列主色调：${rec.colors.slice(0, 3).join("、")}\n陈列风格：${rec.tips}`,
      },
      {
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim() || null,
        customer_wechat: form.customer_wechat.trim() || null,
        service_type: "planning",
        title: `${deliveryTitle} - 企划方案`,
        description: `基于${season?.label}${styleLabel ? "+" + styleLabel : ""}的商品企划报告`,
        delivery_data: deliveryData,
        price: priceMap.planning,
        status: "draft",
        notes: `企划方向：基于${season?.label}的色彩趋势\n重点品类：${rec.styles.slice(0, 3).join("、")}\n核心面料：${rec.fabrics.slice(0, 2).join("、")}`,
      },
    ];

    for (const plan of plans) {
      await supabase.from("delivery_plans").insert([plan]);
    }

    showToast("success", "已自动生成3个交付方案！请到「交付方案」页面查看");
  };

  const selectedSeason = colorSeasons.find((s) => s.value === form.color_season);
  const recommendation = form.color_season ? aiRecommendations[form.color_season] : null;

  const filteredStyles = styleTypes.filter(
    (s) => s.gender === form.gender || s.gender === "both"
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-primary" : "bg-red-500"}`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-primary">色彩季型录入 & AI分析</h1>
        <p className="text-sm text-muted-foreground mt-1">
          录入VIP客户色彩季型和风格数据，AI自动生成选品/陈列/企划方案
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              客户信息
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">客户姓名 *</label>
                <input
                  type="text"
                  required
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="客户姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value, main_style: "", sub_style: "" })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="female">女</option>
                  <option value="male">男</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                <input
                  type="tel"
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="手机号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">微信号</label>
                <input
                  type="text"
                  value={form.customer_wechat}
                  onChange={(e) => setForm({ ...form, customer_wechat: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="微信号"
                />
              </div>
            </div>
          </div>

          {/* Color Season Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              色彩季型诊断
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {["春", "夏", "秋", "冬"].map((group) => (
                <div key={group} className="col-span-2 sm:col-span-3">
                  <div className="text-xs font-semibold text-muted-foreground mb-2 mt-2">{group}季型</div>
                  <div className="grid grid-cols-3 gap-2">
                    {colorSeasons
                      .filter((s) => s.group === group)
                      .map((season) => (
                        <button
                          key={season.value}
                          onClick={() => setForm({ ...form, color_season: season.value })}
                          className={`p-3 rounded-xl text-left transition-all duration-200 ${
                            form.color_season === season.value
                              ? "bg-accent/10 border-2 border-accent shadow-sm"
                              : "bg-gray-50 border-2 border-transparent hover:border-primary/20 hover:bg-primary/5"
                          }`}
                        >
                          <div className={`font-bold text-sm ${form.color_season === season.value ? "text-accent" : "text-primary"}`}>
                            {season.label}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {season.desc}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              风格定位
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">主风格</label>
                <div className="flex flex-wrap gap-2">
                  {filteredStyles.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setForm({ ...form, main_style: style.value })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        form.main_style === style.value
                          ? "bg-accent text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">副风格（选填）</label>
                <div className="flex flex-wrap gap-2">
                  {filteredStyles
                    .filter((s) => s.value !== form.main_style)
                    .map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setForm({ ...form, sub_style: form.sub_style === style.value ? "" : style.value })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          form.sub_style === style.value
                            ? "bg-primary/10 text-primary border border-primary/30"
                            : "bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100"
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              placeholder="补充信息，如客户偏好、特殊需求等..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存客户数据
            </button>
            <button
              onClick={handleGenerateDelivery}
              disabled={!form.color_season || !form.customer_name.trim()}
              className="btn-accent inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
            >
              <BookOpen className="w-4 h-4" />
              AI生成交付方案
            </button>
          </div>
        </div>

        {/* Right: AI Analysis Preview */}
        <div className="space-y-4">
          {selectedSeason && recommendation ? (
            <>
              {/* Color Season Card */}
              <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl p-6">
                <div className="text-xs text-white/60 mb-1">色彩季型</div>
                <div className="text-2xl font-bold">{selectedSeason.label}</div>
                <div className="text-sm text-white/70 mt-1">{selectedSeason.desc}</div>
              </div>

              {/* Recommended Colors */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-primary mb-3">🎨 推荐色彩</h3>
                <div className="flex flex-wrap gap-2">
                  {recommendation.colors.map((color) => (
                    <span key={color} className="px-3 py-1.5 bg-accent/10 text-accent text-xs rounded-full font-medium">
                      {color}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended Styles */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-primary mb-3">👗 推荐款式</h3>
                <div className="flex flex-wrap gap-2">
                  {recommendation.styles.map((style) => (
                    <span key={style} className="px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                      {style}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended Fabrics */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-primary mb-3">🧵 推荐面料</h3>
                <div className="flex flex-wrap gap-2">
                  {recommendation.fabrics.map((fabric) => (
                    <span key={fabric} className="px-3 py-1.5 bg-purple-50 text-purple-600 text-xs rounded-full font-medium">
                      {fabric}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                <h3 className="text-sm font-bold text-amber-700 mb-2">💡 搭配建议</h3>
                <p className="text-xs text-amber-600 leading-relaxed">{recommendation.tips}</p>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <Palette className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">选择色彩季型后<br />AI将自动生成分析建议</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
