"use client";

import { useState, useEffect } from "react";
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
  History,
  Search,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 12季色彩季型（行业标准叫法）
const colorSeasons = [
  // 春季型（暖色调、高明度、高艳度）
  { value: "light_warm", label: "浅暖型", group: "春", desc: "轻浅、明亮、暖色调", examples: "浅金黄、桃粉、象牙白" },
  { value: "warm_bright", label: "暖亮型", group: "春", desc: "暖色调、轻浅、亮丽", examples: "珊瑚色、金黄、南蛇藤色" },
  { value: "clear_warm", label: "净暖型", group: "春", desc: "明亮、艳丽、分明", examples: "亮粉、鲜绿、西瓜红" },
  // 夏季型（冷色调、高明度、低艳度）
  { value: "light_cool", label: "浅冷型", group: "夏", desc: "轻浅、柔和、淡雅", examples: "柔白、雾粉、奶柔色" },
  { value: "soft_cool", label: "柔冷型", group: "夏", desc: "柔和淡雅、浅淡、冷色调", examples: "绿玉色、宝石蓝、灰玫瑰色" },
  { value: "cool_soft", label: "冷柔型", group: "夏", desc: "冷色调、浅淡、柔和", examples: "玫瑰粉、石青色、玫瑰红" },
  // 秋季型（暖色调、低明度、低艳度）
  { value: "warm_soft", label: "暖柔型", group: "秋", desc: "暖色调、色泽浓重、中等深度", examples: "驼色、橄榄绿、砖红" },
  { value: "soft_warm", label: "柔暖型", group: "秋", desc: "深厚、色泽饱和度低、暖色调", examples: "卡其、咖啡、铁锈红" },
  { value: "deep_warm", label: "深暖型", group: "秋", desc: "浓郁、厚重", examples: "深棕、墨绿、酒红" },
  // 冬季型（冷色调、低明度、高艳度）
  { value: "clear_cool", label: "净冷型", group: "冬", desc: "艳丽明亮、深沉浓烈", examples: "纯黑、正红、电光蓝" },
  { value: "cool_bright", label: "冷亮型", group: "冬", desc: "深沉、明亮、极端", examples: "黑白、藏蓝、冰粉" },
  { value: "deep_cool", label: "深冷型", group: "冬", desc: "浓郁、艳丽、冷色调", examples: "纯白、深海军蓝、木莓红" },
];

// 8大女士风格类型（专业术语 + 市场名标注）
const femaleStyleTypes = [
  { value: "shao_nv", label: "少女型", marketLabel: "淑女风", contour: "曲线型", size: "小版型", features: "可爱、迷糊、善良、天真", typical: "娃娃脸", styleRef: "甜美风、淑女风、日系风" },
  { value: "you_ya", label: "优雅型", marketLabel: "知性风", contour: "曲线型", size: "小版型", features: "小女人、温柔、妩媚、贤淑、雅致、内敛、文静", typical: "小女人味", styleRef: "通勤风、简约风、知性风" },
  { value: "lang_man_f", label: "浪漫型", marketLabel: "名媛风", contour: "曲线型", size: "大版型", features: "大女人、成熟、性感、妖娆、有风情、华丽、双眼含情", typical: "青春期身型发育比同龄人早", styleRef: "名媛风、御姐风、复古风" },
  { value: "shao_nian_f", label: "少年型", marketLabel: "中性风", contour: "直线型", size: "小版型", features: "帅气、率真、清爽、古灵精怪、眉宇间有种英气", typical: "比同龄人要显年轻", styleRef: "中性风、简约风、街头风" },
  { value: "shi_shang_f", label: "时尚型", marketLabel: "潮牌风", contour: "直线型", size: "小版型", features: "个性、摩登、百变、特立独行、标新立异", typical: "没特点、可塑性强", styleRef: "街头风、潮牌风、设计师款" },
  { value: "gu_dian_f", label: "古典型", marketLabel: "职业风", contour: "直线型", size: "大版型", features: "贵气、稳重、端庄、上品、高贵、经典、规矩、不怒而威", typical: "八大女士风格中打扮正确最显气质", styleRef: "通勤风、职业风、简约风" },
  { value: "zi_ran_f", label: "自然型", marketLabel: "休闲风", contour: "直线型", size: "大版型", features: "自然、潇洒、飘逸、大方、随意淳朴、有异域风情、亲切随和", typical: "视觉身高看起来比实际身高要矮", styleRef: "休闲风、森系风、棉麻风" },
  { value: "xi_ju_f", label: "戏剧型", marketLabel: "大牌风", contour: "直线型", size: "大版型", features: "气派、夸张、醒目、张扬华丽、女王级别、视觉冲击力强、百变、有存在感", typical: "视觉身高看起来比实际身高要高", styleRef: "御姐风、名媛风、大牌风" },
];

// 5大男士风格类型（专业术语 + 市场名标注）
const maleStyleTypes = [
  { value: "xi_ju_m", label: "戏剧型", marketLabel: "气场型男", features: "气派、华丽、张扬、国王级别、有权威感、明显的男子气概、有存在感", typical: "视觉身高看起来比实际身高要高" },
  { value: "zi_ran_m", label: "自然型", marketLabel: "随性达人", features: "潇洒随意、简洁大气、有男人味、亲切、随和、阳刚、有朝气", typical: "视觉身高看起来比实际身高要高矮" },
  { value: "gu_dian_m", label: "古典型", marketLabel: "精英绅士", features: "严谨、稳重、端正、中规中矩、正统、高级上品、含蓄大方、严肃、四平八稳", typical: "含蓄" },
  { value: "lang_man_m", label: "浪漫型", marketLabel: "优雅先生", features: "柔美、有才情、儒雅、温柔、阴柔、花哨、华丽", typical: "穿衣范围最广的男士风格" },
  { value: "shi_shang_m", label: "时尚型", marketLabel: "潮流先锋", features: "年轻有活力、有个性、有创意、灵动、多变", typical: "男士风格中最显年轻" },
];

// AI选品建议（根据色彩季型+风格生成）
const aiRecommendations: Record<string, { colors: string[]; styles: string[]; fabrics: string[]; tips: string }> = {
  // 春季型
  light_warm: {
    colors: ["浅金黄", "桃粉", "象牙白", "浅杏", "鹅黄", "淡绿"],
    styles: ["雪纺衫", "短裙", "轻薄针织", "连衣裙", "小香风外套"],
    fabrics: ["雪纺", "真丝", "细棉", "轻薄针织", "蕾丝"],
    tips: "浅暖型适合轻浅明亮的暖色调，像春日花朵般温柔。避免深暗沉闷的色彩。",
  },
  warm_bright: {
    colors: ["珊瑚色", "金黄", "南蛇藤色", "橙红", "草绿", "杏色"],
    styles: ["印花连衣裙", "短外套", "阔腿短裤", "荷叶边上衣", "针织衫"],
    fabrics: ["棉质", "亚麻", "细针织", "轻薄羊毛", "丝棉"],
    tips: "暖亮型适合温暖亮丽的暖色调，活力四射。避免冷蓝基调和暗沉色。",
  },
  clear_warm: {
    colors: ["亮粉", "鲜绿", "西瓜红", "正红", "明黄", "暖白"],
    styles: ["亮色单品", "印花衬衫", "短裤套装", "撞色搭配", "活力运动风"],
    fabrics: ["丝光棉", "真丝", "精细针织", "亮面材质", "透气亚麻"],
    tips: "净暖型适合鲜艳明亮的纯色，越鲜明越出众。避免灰暗浑浊的色彩。",
  },
  // 夏季型
  light_cool: {
    colors: ["柔白", "雾粉", "奶柔色", "薰衣草紫", "灰蓝", "浅灰"],
    styles: ["垂感衬衫", "百褶裙", "针织开衫", "阔腿裤", "飘逸连衣裙"],
    fabrics: ["雪纺", "真丝", "细针织", "薄纱", "柔软棉"],
    tips: "浅冷型适合柔和淡雅的浅冷色调，如水彩画般温柔。避免浓烈深暗的色彩。",
  },
  soft_cool: {
    colors: ["绿玉色", "宝石蓝", "灰玫瑰色", "梅紫", "薄荷绿", "冷灰"],
    styles: ["衬衫", "铅笔裙", "西装外套", "直筒裤", "简约连衣裙"],
    fabrics: ["精纺羊毛", "真丝", "棉混纺", "雪纺", "细针织"],
    tips: "柔冷型适合柔和淡雅的冷色调，自带高级感。避免暖黄基调和大红大绿。",
  },
  cool_soft: {
    colors: ["玫瑰粉", "石青色", "玫瑰红", "灰粉", "雾霾蓝", "米白"],
    styles: ["基础款T恤", "休闲西装", "宽松毛衣", "直筒牛仔裤", "简约风衣"],
    fabrics: ["棉麻混纺", "水洗牛仔", "柔软针织", "磨毛面料", "轻薄羊毛"],
    tips: "冷柔型适合冷色调中浅淡柔和的色彩，沉静内敛不张扬。避免高饱和亮色。",
  },
  // 秋季型
  warm_soft: {
    colors: ["驼色", "橄榄绿", "砖红", "焦糖色", "暖橙", "苔绿"],
    styles: ["针织开衫", "A字裙", "休闲西装", "长款衬衫", "百褶裙"],
    fabrics: ["棉麻", "灯芯绒", "羊毛", "麂皮", "粗针织"],
    tips: "暖柔型适合暖色调中色泽浓重的色彩，温暖有亲和力。避免冷蓝色调。",
  },
  soft_warm: {
    colors: ["卡其", "咖啡", "铁锈红", "米色", "深棕", "暖灰"],
    styles: ["柔软毛衣", "半身裙", "衬衫裙", "休闲裤", "轻薄外套"],
    fabrics: ["细针织", "雪纺", "柔软棉", "薄纱", "丝绵混纺"],
    tips: "柔暖型适合深厚饱和度低的暖色调，低调内敛。避免高对比度搭配和过于鲜艳的色彩。",
  },
  deep_warm: {
    colors: ["深棕", "墨绿", "酒红", "深金", "咖啡棕", "橄榄绿"],
    styles: ["大衣", "西装外套", "阔腿裤", "针织衫", "风衣"],
    fabrics: ["羊绒", "丝绒", "皮革", "粗花呢", "真丝"],
    tips: "深暖型适合浓郁厚重的色彩，搭配高对比度造型更显气场。避免浅淡柔和的色调。",
  },
  // 冬季型
  clear_cool: {
    colors: ["纯黑", "正红", "电光蓝", "宝蓝", "翠绿", "亮紫"],
    styles: ["廓形外套", "亮色单品", "几何图案", "对比搭配", "剪裁利落的套装"],
    fabrics: ["真丝缎面", "皮革", "金属感面料", "精细羊毛", "亮片"],
    tips: "净冷型适合艳丽明亮的深沉色彩，越鲜明越出众。避免灰调低饱和色彩。",
  },
  cool_bright: {
    colors: ["黑白", "藏蓝", "冰粉", "宝蓝", "松石绿", "洋红"],
    styles: ["修身西装", "皮衣", "直筒裤", "高领毛衣", "连衣裙"],
    fabrics: ["皮革", "真丝", "缎面", "精纺羊毛", "金属感面料"],
    tips: "冷亮型适合深沉明亮的极端色彩，高对比度搭配效果出众。避免浑浊的中性色。",
  },
  deep_cool: {
    colors: ["纯白", "深海军蓝", "木莓红", "酒红", "玫红", "墨紫"],
    styles: ["西装套装", "铅笔裙", "衬衫", "大衣", "旗袍"],
    fabrics: ["真丝", "缎面", "精纺羊毛", "雪纺", "亮面皮革"],
    tips: "深冷型适合浓郁艳丽的冷色调，冷艳高贵。避免暖黄基调。",
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
    store_id: "" as string,
  });
  const [saving, setSaving] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [storeOptions, setStoreOptions] = useState<{ id: string; name: string; city: string | null }[]>([]);

  // 历史记录相关状态
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [showHistory, setShowHistory] = useState(true);

  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
  }, [supabase]);

  // 获取色彩季型历史记录
  const fetchHistory = async () => {
    setHistoryLoading(true);
    const { data } = await supabase
      .from("vip_customers")
      .select("*")
      .not("color_season", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);
    setHistoryList((data || []) as any[]);
    setHistoryLoading(false);
  };

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
      // 1. 使用 RPC 保存/更新 VIP 客户（带店铺关联+自动聚合刷新）
      await supabase.rpc("upsert_customer_with_store", {
        p_name: form.customer_name.trim(),
        p_phone: form.customer_phone.trim() || null,
        p_wechat: form.customer_wechat.trim() || null,
        p_gender: form.gender,
        p_color_season: form.color_season || null,
        p_main_style: form.main_style || null,
        p_company: null,
        p_store_id: form.store_id || null,
        p_source: "manual_color_analysis",
      });

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

      showToast("success", form.store_id ? "客户色彩数据已保存，店铺聚合统计已更新！" : "客户色彩数据已保存！");
      if (form.color_season) {
        setShowResult(true);
      }
      // 刷新历史记录
      fetchHistory();
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

    const allStyles = [...femaleStyleTypes, ...maleStyleTypes];
    const styleLabel = allStyles.find((s) => s.value === form.main_style)?.label || "";
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

  const filteredStyles = form.gender === "female" ? femaleStyleTypes : maleStyleTypes;

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
              {/* Store Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关联店铺</label>
                <select
                  value={form.store_id}
                  onChange={(e) => setForm({ ...form, store_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">未关联店铺</option>
                  {storeOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ""}</option>
                  ))}
                </select>
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
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {season.desc}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {season.examples}
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
                <div className="grid grid-cols-2 gap-2">
                  {filteredStyles.map((style: any) => (
                    <button
                      key={style.value}
                      onClick={() => setForm({ ...form, main_style: style.value })}
                      className={`p-3 rounded-xl text-left transition-all ${
                        form.main_style === style.value
                          ? "bg-accent/10 border-2 border-accent"
                          : "bg-gray-50 border-2 border-transparent hover:border-primary/20"
                      }`}
                    >
                      <div className={`font-bold text-sm ${form.main_style === style.value ? "text-accent" : "text-primary"}`}>
                        {style.label}
                        <span className="text-xs text-accent/70 font-normal ml-1">({style.marketLabel})</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {style.features}
                      </div>
                      {style.styleRef && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {style.styleRef}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">副风格（选填）</label>
                <div className="flex flex-wrap gap-2">
                  {filteredStyles
                    .filter((s: any) => s.value !== form.main_style)
                    .map((style: any) => (
                      <button
                        key={style.value}
                        onClick={() => setForm({ ...form, sub_style: form.sub_style === style.value ? "" : style.value })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          form.sub_style === style.value
                            ? "bg-primary/10 text-primary border border-primary/30"
                            : "bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100"
                        }`}
                      >
                        {style.label}<span className="text-accent/60 ml-0.5">·{style.marketLabel}</span>
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

      {/* 历史记录列表 */}
      <div className="max-w-5xl mx-auto mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          {/* 标题栏 */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-primary flex items-center gap-2 cursor-pointer" onClick={() => setShowHistory(!showHistory)}>
              <History className="w-5 h-5" />
              已录入色彩季型记录
              <span className="text-xs font-normal text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">{historyList.length}条</span>
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="搜索姓名/手机号..."
                  className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-48"
                />
              </div>
            </div>
          </div>

          {showHistory && (
            <div className="divide-y divide-gray-50">
              {historyLoading ? (
                <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /><p className="text-sm text-muted-foreground mt-2">加载中...</p></div>
              ) : historyList.length === 0 ? (
                <div className="p-12 text-center"><Palette className="w-10 h-10 mx-auto text-gray-200 mb-2" /><p className="text-sm text-muted-foreground">暂无色彩季型记录</p><p className="text-xs text-gray-400 mt-1">录入客户数据后记录将显示在这里</p></div>
              ) : (
                historyList
                  .filter((item) =>
                    !historySearch ||
                    (item.name || "").toLowerCase().includes(historySearch.toLowerCase()) ||
                    (item.phone || "").includes(historySearch)
                  )
                  .map((item) => {
                    const season = colorSeasons.find((s) => s.value === item.color_season);
                    return (
                      <div key={item.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-medium text-sm text-primary truncate">{item.name}</span>
                              {season && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  season.group === "春" ? "bg-green-50 text-green-600" :
                                  season.group === "夏" ? "bg-blue-50 text-blue-600" :
                                  season.group === "秋" ? "bg-orange-50 text-orange-600" :
                                  "bg-purple-50 text-purple-600"
                                }`}>
                                  {season.label}
                                </span>
                              )}
                              {item.main_style && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-pink-50 text-pink-600">
                                  {item.main_style}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {(item.phone || item.wechat) && (
                                <span>{item.phone ? `📱 ${item.phone}` : ""}{item.wechat ? ` 💬 ${item.wechat}` : ""}</span>
                              )}
                              {item.store_name && <span>🏪 {item.store_name}</span>}
                              <span>📅 {item.created_at ? new Date(item.created_at).toLocaleDateString("zh-CN") : "未知"}</span>
                            </div>
                          </div>
                          {season && recommendation && (item.color_season) && (
                            <div className="hidden sm:flex flex-wrap gap-1 max-w-[240px]">
                              {(aiRecommendations[item.color_season]?.colors || []).slice(0, 5).map((c: string) => (
                                <span key={c} className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] rounded">{c}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
