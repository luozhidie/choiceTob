"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Palette, ArrowLeftRight, BarChart3, Users } from "lucide-react";
import Link from "next/link";

// 复用色彩季型数据
const colorSeasons = [
  { value: "light_warm", label: "浅暖型", group: "春", desc: "轻浅、明亮、暖色调" },
  { value: "warm_bright", label: "暖亮型", group: "春", desc: "暖色调、轻浅、亮丽" },
  { value: "clear_warm", label: "净暖型", group: "春", desc: "明亮、艳丽、分明" },
  { value: "light_cool", label: "浅冷型", group: "夏", desc: "轻浅、柔和、淡雅" },
  { value: "soft_cool", label: "柔冷型", group: "夏", desc: "柔和淡雅、冷色调" },
  { value: "cool_soft", label: "冷柔型", group: "夏", desc: "冷色调、浅淡、柔和" },
  { value: "warm_soft", label: "暖柔型", group: "秋", desc: "暖色调、色泽浓重" },
  { value: "soft_warm", label: "柔暖型", group: "秋", desc: "深厚、低饱和、暖色调" },
  { value: "deep_warm", label: "深暖型", group: "秋", desc: "浓郁、厚重" },
  { value: "clear_cool", label: "净冷型", group: "冬", desc: "艳丽明亮、深沉浓烈" },
  { value: "cool_bright", label: "冷亮型", group: "冬", desc: "深沉、明亮、极端" },
  { value: "deep_cool", label: "深冷型", group: "冬", desc: "浓郁、艳丽、冷色调" },
];

const seasonDetails: Record<string, {
  tone: string; brightness: string; saturation: string;
  bestColors: string[]; avoidColors: string[];
  bestFabrics: string[]; bestPatterns: string[];
  matchingStyles: string[];
}> = {
  light_warm: { tone: "暖", brightness: "高明度", saturation: "高艳度", bestColors: ["浅金黄", "桃粉", "象牙白", "鹅黄", "浅杏"], avoidColors: ["深棕", "墨绿", "纯黑"], bestFabrics: ["雪纺", "真丝", "细棉", "蕾丝"], bestPatterns: ["小碎花", "圆点", "细条纹"], matchingStyles: ["少女型", "优雅型"] },
  warm_bright: { tone: "暖", brightness: "高明度", saturation: "高艳度", bestColors: ["珊瑚色", "金黄", "南蛇藤色", "橙红", "草绿"], avoidColors: ["灰蓝", "灰紫", "冷灰"], bestFabrics: ["棉质", "亚麻", "丝棉"], bestPatterns: ["花卉", "几何", "波普"], matchingStyles: ["少女型", "时尚型"] },
  clear_warm: { tone: "暖", brightness: "中高明度", saturation: "高艳度", bestColors: ["亮粉", "鲜绿", "西瓜红", "正红", "明黄"], avoidColors: ["卡其", "灰粉", "雾霾蓝"], bestFabrics: ["丝光棉", "亮面材质", "精细针织"], bestPatterns: ["大花", "撞色", "色块"], matchingStyles: ["戏剧型", "时尚型"] },
  light_cool: { tone: "冷", brightness: "高明度", saturation: "低艳度", bestColors: ["柔白", "雾粉", "奶柔色", "薰衣草紫", "灰蓝"], avoidColors: ["正红", "亮橙", "鲜绿"], bestFabrics: ["雪纺", "薄纱", "柔软棉"], bestPatterns: ["水彩风", "渐变", "淡雅印花"], matchingStyles: ["优雅型", "少年型"] },
  soft_cool: { tone: "冷", brightness: "中高明度", saturation: "低艳度", bestColors: ["绿玉色", "宝石蓝", "灰玫瑰色", "梅紫", "薄荷绿"], avoidColors: ["大红", "金黄", "草绿"], bestFabrics: ["精纺羊毛", "真丝", "棉混纺"], bestPatterns: ["暗纹", "提花", "素色"], matchingStyles: ["古典型", "优雅型"] },
  cool_soft: { tone: "冷", brightness: "中明度", saturation: "低艳度", bestColors: ["玫瑰粉", "石青色", "玫瑰红", "灰粉", "雾霾蓝"], avoidColors: ["橙红", "芥末黄", "焦糖"], bestFabrics: ["棉麻混纺", "柔软针织", "磨毛面料"], bestPatterns: ["抽象", "水墨风", "素色"], matchingStyles: ["自然型", "古典型"] },
  warm_soft: { tone: "暖", brightness: "中低明度", saturation: "低艳度", bestColors: ["驼色", "橄榄绿", "砖红", "焦糖色", "暖橙"], avoidColors: ["纯白", "宝蓝", "电光蓝"], bestFabrics: ["棉麻", "灯芯绒", "羊毛"], bestPatterns: ["格纹", "民族风", "大地色系"], matchingStyles: ["自然型", "优雅型"] },
  soft_warm: { tone: "暖", brightness: "低明度", saturation: "低艳度", bestColors: ["卡其", "咖啡", "铁锈红", "米色", "深棕"], avoidColors: ["亮粉", "鲜绿", "天蓝"], bestFabrics: ["粗针织", "丝绒", "皮革"], bestPatterns: ["粗花呢", "编织纹", "深色格纹"], matchingStyles: ["自然型", "古典型"] },
  deep_warm: { tone: "暖", brightness: "低明度", saturation: "中艳度", bestColors: ["深棕", "墨绿", "酒红", "深金", "咖啡棕"], avoidColors: ["浅粉", "天蓝", "鹅黄"], bestFabrics: ["羊绒", "丝绒", "粗花呢"], bestPatterns: ["大格纹", "动物纹", "深色花纹"], matchingStyles: ["戏剧型", "浪漫型"] },
  clear_cool: { tone: "冷", brightness: "低明度", saturation: "高艳度", bestColors: ["纯黑", "正红", "电光蓝", "宝蓝", "翠绿"], avoidColors: ["卡其", "驼色", "米色"], bestFabrics: ["真丝缎面", "皮革", "金属感面料"], bestPatterns: ["色块", "几何", "高对比"], matchingStyles: ["戏剧型", "时尚型"] },
  cool_bright: { tone: "冷", brightness: "低明度", saturation: "高艳度", bestColors: ["黑白", "藏蓝", "冰粉", "宝蓝", "松石绿"], avoidColors: ["焦糖", "暖橙", "芥末黄"], bestFabrics: ["皮革", "真丝", "缎面"], bestPatterns: ["极简", "撞色", "条纹"], matchingStyles: ["古典型", "戏剧型"] },
  deep_cool: { tone: "冷", brightness: "低明度", saturation: "高艳度", bestColors: ["纯白", "深海军蓝", "木莓红", "酒红", "玫红"], avoidColors: ["浅黄", "暖橙", "焦糖"], bestFabrics: ["精纺羊毛", "缎面", "亮面皮革"], bestPatterns: ["暗纹", "提花", "低调奢华"], matchingStyles: ["古典型", "浪漫型"] },
};

export default function ColorComparePage() {
  const [season1, setSeason1] = useState("");
  const [season2, setSeason2] = useState("");
  const [customerStats, setCustomerStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const { data } = await supabase.from("vip_customers").select("color_season");
    const stats: Record<string, number> = {};
    (data || []).forEach((c: any) => {
      if (c.color_season) {
        stats[c.color_season] = (stats[c.color_season] || 0) + 1;
      }
    });
    setCustomerStats(stats);
    setLoading(false);
  };

  const detail1 = season1 ? seasonDetails[season1] : null;
  const detail2 = season2 ? seasonDetails[season2] : null;
  const season1Info = colorSeasons.find((s) => s.value === season1);
  const season2Info = colorSeasons.find((s) => s.value === season2);

  // 对比差异
  const getDiff = () => {
    if (!detail1 || !detail2) return null;
    const diffs: string[] = [];
    if (detail1.tone !== detail2.tone) diffs.push(`色调：${detail1.tone}调 vs ${detail2.tone}调`);
    if (detail1.brightness !== detail2.brightness) diffs.push(`明度：${detail1.brightness} vs ${detail2.brightness}`);
    if (detail1.saturation !== detail2.saturation) diffs.push(`艳度：${detail1.saturation} vs ${detail2.saturation}`);
    return diffs;
  };

  const diff = getDiff();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-primary">色彩季型对比分析</h1>
        <p className="text-sm text-muted-foreground mt-1">
          对比不同色彩季型的差异，辅助选品和陈列决策 · 行业差异化工具
        </p>
      </div>

      {/* Customer Distribution */}
      <div className="max-w-6xl mx-auto mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          客户色彩季型分布
        </h2>
        {Object.keys(customerStats).length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无客户色彩数据，请先在"色彩季型录入"中录入客户信息</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {colorSeasons.map((season) => {
              const count = customerStats[season.value] || 0;
              if (count === 0) return null;
              return (
                <div key={season.value} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
                  <span className="text-xs text-muted-foreground">{season.group}季</span>
                  <span className="font-bold text-sm text-primary">{season.label}</span>
                  <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full font-medium">{count}人</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compare Selector */}
      <div className="max-w-6xl mx-auto mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5" />
          季型对比选择
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">季型 A</label>
            <select value={season1} onChange={(e) => setSeason1(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">请选择</option>
              {colorSeasons.map((s) => (
                <option key={s.value} value={s.value}>{s.group}季 - {s.label}（{s.desc}）</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">季型 B</label>
            <select value={season2} onChange={(e) => setSeason2(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">请选择</option>
              {colorSeasons.map((s) => (
                <option key={s.value} value={s.value}>{s.group}季 - {s.label}（{s.desc}）</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Result */}
      {detail1 && detail2 && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Diff Summary */}
          {diff && diff.length > 0 && (
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
              <h3 className="text-sm font-bold text-amber-700 mb-3">⚡ 核心差异</h3>
              <div className="flex flex-wrap gap-3">
                {diff.map((d, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white text-amber-600 text-xs rounded-lg font-medium border border-amber-200">{d}</span>
                ))}
              </div>
              {detail1.tone !== detail2.tone && (
                <p className="mt-3 text-xs text-amber-600 leading-relaxed">
                  💡 暖调与冷调客户在选品方向上差异最大。暖调客户偏好大地色系、黄基调；冷调客户偏好蓝基调、灰色调。陈列时应分区展示，避免混淆。
                </p>
              )}
            </div>
          )}

          {/* Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Season A */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="text-xs text-muted-foreground mb-1">{season1Info?.group}季</div>
              <h3 className="text-xl font-bold text-primary mb-4">{season1Info?.label}</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">特征</div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{detail1.tone}调</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{detail1.brightness}</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{detail1.saturation}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">最佳色彩</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail1.bestColors.map((c) => (
                      <span key={c} className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">避免色彩</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail1.avoidColors.map((c) => (
                      <span key={c} className="px-2 py-1 bg-red-50 text-red-400 text-xs rounded-full line-through">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">推荐面料</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail1.bestFabrics.map((f) => (
                      <span key={f} className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">适配风格</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail1.matchingStyles.map((s) => (
                      <span key={s} className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Season B */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="text-xs text-muted-foreground mb-1">{season2Info?.group}季</div>
              <h3 className="text-xl font-bold text-primary mb-4">{season2Info?.label}</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">特征</div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{detail2.tone}调</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{detail2.brightness}</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{detail2.saturation}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">最佳色彩</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail2.bestColors.map((c) => (
                      <span key={c} className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">避免色彩</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail2.avoidColors.map((c) => (
                      <span key={c} className="px-2 py-1 bg-red-50 text-red-400 text-xs rounded-full line-through">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">推荐面料</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail2.bestFabrics.map((f) => (
                      <span key={f} className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">适配风格</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail2.matchingStyles.map((s) => (
                      <span key={s} className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Common Colors (for mixed display planning) */}
          {detail1 && detail2 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                陈列建议：混合色系通用色
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                当同一区域需要服务多种色彩季型客户时，以下色彩可作为通用陈列色：
              </p>
              <div className="flex flex-wrap gap-2">
                {detail1.bestColors.filter((c) => detail2.bestColors.includes(c) || detail2.bestColors.some((c2) => {
                  const commonWords = ["白", "灰", "米", "蓝", "粉"];
                  return commonWords.some((w) => c.includes(w) && c2.includes(w));
                })).map((c) => (
                  <span key={c} className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-lg font-medium">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
