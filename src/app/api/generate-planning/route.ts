import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { COLOR_SEASONS_PRO } from "@/lib/styles";

/* ============ 辅助函数：查询店铺VIP画像+购买数据 ============ */
async function fetchStoreInsights(storeId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("stores").select("*").eq("id", storeId).single();

  const storeData = (data as any)?.business_data || {};
  let memberStats: Record<string, any> = (data as any)?.member_stats || {};

  try {
    const { data: vipList } = await supabase
      .from("vip_customers")
      .select("id, full_name, color_season, style_result, total_spent, purchase_count, last_purchase_date, vip_level, created_at")
      .eq("store_id", storeId)
      .order("total_spent", { ascending: false })
      .limit(100);

    const { data: styleTests } = await supabase
      .from("style_test_results")
      .select("style_result, color_season, created_at")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(200);

    const { data: colorAnalysis } = await supabase
      .from("color_analyses")
      .select("season_type, sub_type, created_at")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(200);

    const { data: salesData } = await supabase
      .from("weekly_sales_analysis")
      .select("*")
      .eq("store_id", storeId)
      .order("week_start", { ascending: false })
      .limit(12);

    const { data: inventoryData } = await supabase
      .from("inventory")
      .select("category, quantity, unit_cost, sold_count")
      .eq("store_id", storeId)
      .limit(200);

    if (vipList && vipList.length > 0) {
      const colorSeasonMap: Record<string, { count: number; totalSpent: number; purchaseCount: number }> = {};
      const styleMap: Record<string, { count: number; totalSpent: number; purchaseCount: number }> = {};
      const vipLevelMap: Record<string, number> = {};
      let totalRevenue = 0;
      let totalPurchases = 0;
      const spendingBands = { "低频低额": 0, "低频高额": 0, "高频低额": 0, "高频高额": 0 };

      for (const vip of vipList) {
        const cs = vip.color_season || "未测试";
        if (!colorSeasonMap[cs]) colorSeasonMap[cs] = { count: 0, totalSpent: 0, purchaseCount: 0 };
        colorSeasonMap[cs].count++;
        colorSeasonMap[cs].totalSpent += (vip.total_spent || 0);
        colorSeasonMap[cs].purchaseCount += (vip.purchase_count || 0);

        const st = vip.style_result || "未测试";
        if (!styleMap[st]) styleMap[st] = { count: 0, totalSpent: 0, purchaseCount: 0 };
        styleMap[st].count++;
        styleMap[st].totalSpent += (vip.total_spent || 0);
        styleMap[st].purchaseCount += (vip.purchase_count || 0);

        vipLevelMap[vip.vip_level || "基础"] = (vipLevelMap[vip.vip_level || "基础"] || 0) + 1;
        totalRevenue += (vip.total_spent || 0);
        totalPurchases += (vip.purchase_count || 0);

        const spent = (vip.total_spent || 0);
        const count = (vip.purchase_count || 0);
        if (count < 3 && spent < 3000) spendingBands["低频低额"]++;
        else if (count < 3 && spent >= 3000) spendingBands["低频高额"]++;
        else if (count >= 3 && spent < 3000) spendingBands["高频低额"]++;
        else spendingBands["高频高额"]++;
      }

      const styleTestStats: Record<string, number> = {};
      if (styleTests) {
        for (const test of styleTests) {
          if (test.style_result) styleTestStats[test.style_result] = (styleTestStats[test.style_result] || 0) + 1;
        }
      }

      const colorAnalysisStats: Record<string, number> = {};
      if (colorAnalysis) {
        for (const ca of colorAnalysis) {
          if (ca.season_type) {
            const label = ca.sub_type ? `${ca.season_type}${ca.sub_type}` : ca.season_type;
            colorAnalysisStats[label] = (colorAnalysisStats[label] || 0) + 1;
          }
        }
      }

      const categorySales: Record<string, { qty: number; revenue: number }> = {};
      if (inventoryData) {
        for (const inv of inventoryData) {
          const cat = inv.category || "其他";
          if (!categorySales[cat]) categorySales[cat] = { qty: 0, revenue: 0 };
          categorySales[cat].qty += (inv.sold_count || 0);
          categorySales[cat].revenue += (inv.sold_count || 0) * (inv.unit_cost || 0);
        }
      }

      memberStats = {
        tested_vip_count: vipList.filter((v: any) => v.color_season || v.style_result).length,
        total_vip_count: vipList.length,
        color_season_distribution: Object.fromEntries(
          Object.entries(colorSeasonMap).map(([k, v]) => [k, {
            percentage: Math.round(v.count / vipList.length * 100),
            count: v.count,
            avgSpent: Math.round(v.totalSpent / v.count),
            avgPurchases: Math.round(v.purchaseCount / v.count * 10) / 10,
          }])
        ),
        style_distribution: Object.fromEntries(
          Object.entries(styleMap).map(([k, v]) => [k, {
            percentage: Math.round(v.count / vipList.length * 100),
            count: v.count,
            avgSpent: Math.round(v.totalSpent / v.count),
            avgPurchases: Math.round(v.purchaseCount / v.count * 10) / 10,
          }])
        ),
        vip_level_distribution: vipLevelMap,
        spending_bands: spendingBands,
        total_revenue: totalRevenue,
        total_purchases: totalPurchases,
        avg_vip_spent: Math.round(totalRevenue / vipList.length),
        avg_vip_purchases: Math.round(totalPurchases / vipList.length * 10) / 10,
        style_test_stats: styleTestStats,
        color_analysis_stats: colorAnalysisStats,
        category_sales: Object.fromEntries(
          Object.entries(categorySales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10)
        ),
        recent_sales_trend: (salesData || []).slice(0, 4).map((s: any) => ({
          week: s.week_start,
          revenue: s.total_revenue,
          orders: s.order_count,
        })),
      };
    }
  } catch (e: any) {
    console.error("[generate-planning] VIP数据查询失败:", e.message);
  }

  return { storeData, memberStats };
}

/* ============ 辅助函数：构建VIP数据prompt段 ============ */
function buildVipPromptSection(memberStats: Record<string, any>): string {
  if (!memberStats || !memberStats.total_vip_count) return "";

  const COLOR_LABELS: Record<string, string> = Object.fromEntries(
    [...COLOR_SEASONS_PRO].map(c => [c.value, `${c.label.replace(/型$/, '')}${c.group}`])
  );

  const colorDist = memberStats.color_season_distribution || {};
  const styleDist = memberStats.style_distribution || {};

  // 找消费力最强的色彩季型
  const topColorBySpend = Object.entries(colorDist).sort((a: any[], b: any[]) => (b[1] as any).avgSpent - (a[1] as any).avgSpent)[0];
  const topStyleBySpend = Object.entries(styleDist).sort((a: any[], b: any[]) => (b[1] as any).avgSpent - (a[1] as any).avgSpent)[0];

  const colorLines = Object.entries(colorDist)
    .sort((a: any[], b: any[]) => (b[1] as any).percentage - (a[1] as any).percentage)
    .map(([key, val]: [string, any]) =>
      `- ${COLOR_LABELS[key] || key}：${val.percentage}%（${val.count}人），人均消费¥${val.avgSpent}，人均购买${val.avgPurchases}次`
    ).join("\n");

  const styleLines = Object.entries(styleDist)
    .sort((a: any[], b: any[]) => (b[1] as any).percentage - (a[1] as any).percentage)
    .map(([key, val]: [string, any]) =>
      `- ${key}：${val.percentage}%（${val.count}人），人均消费¥${val.avgSpent}，人均购买${val.avgPurchases}次`
    ).join("\n");

  const categoryLines = Object.entries(memberStats.category_sales || {})
    .map(([cat, data]: [string, any]) => `- ${cat}：销售${data.qty}件，营收¥${data.revenue}`)
    .join("\n");

  const styleTestLines = Object.entries(memberStats.style_test_stats || {})
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(([style, count]) => `- ${style}：${count}人`)
    .join("\n");

  const colorAnalysisLines = Object.entries(memberStats.color_analysis_stats || {})
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(([season, count]) => `- ${season}：${count}人`)
    .join("\n");

  let section = `
【核心VIP画像数据】（总VIP ${memberStats.total_vip_count}人，已测色彩/风格 ${memberStats.tested_vip_count}人）

一、色彩季型分布（决定色系企划方向）：
${colorLines}
关键洞察：${topColorBySpend ? `消费力最强的季型是${COLOR_LABELS[topColorBySpend[0]] || topColorBySpend[0]}（人均¥${(topColorBySpend[1] as any).avgSpent}），企划应重点匹配该季型配色` : ''}

二、风格分布（决定风格企划方向）：
${styleLines}
关键洞察：${topStyleBySpend ? `消费力最强的风格是${topStyleBySpend[0]}（人均¥${(topStyleBySpend[1] as any).avgSpent}），stylePlan中该风格占比应最高` : ''}

三、VIP购买行为分析：
- VIP人均消费：¥${memberStats.avg_vip_spent || 0}
- VIP人均购买次数：${memberStats.avg_vip_purchases || 0}次
- 购买行为分布：${JSON.stringify(memberStats.spending_bands || {})}
${memberStats.spending_bands?.["高频高额"] > 0 ? `- 高频高额客户${memberStats.spending_bands["高频高额"]}人，是利润款/形象款的核心购买力` : ""}

四、品类销售排名（决定品类企划方向）：
${categoryLines}`;

  if (styleTestLines) {
    section += `\n\n五、风格测试结论汇总：\n${styleTestLines}`;
  }
  if (colorAnalysisLines) {
    section += `\n\n六、色彩分析结论汇总：\n${colorAnalysisLines}`;
  }

  section += `

⚠ 企划必须与VIP数据强对齐：
1. 色彩占比严格按色彩季型分布配比 — 占比最高的季型对应最多SKU
2. 风格占比严格按风格分布配比 — 消费力最强的风格占最大比例
3. 价格带参考VIP人均消费能力 — 主销款价格应匹配VIP人均消费区间
4. 品类SKU数量参考品类销售排名 — 畅销品类多配SKU，滞销品类少配`;

  return section;
}

/* ============ 辅助函数：构建市场数据prompt段 ============ */
function buildMarketPromptSection(marketResearch: Record<string, any>): string {
  if (!marketResearch || !marketResearch.totalItems) return "";

  const topColors = (marketResearch.topColors || []).slice(0, 6).map((c: any) => `${c.color}(${c.count}次)`).join("、");
  const topStyles = (marketResearch.topStyles || []).slice(0, 5).map((s: any) => `${s.style}(${s.count}次)`).join("、");
  const topCategories = (marketResearch.topCategories || []).slice(0, 5).map((c: any) => `${c.category}(${c.count}次)`).join("、");

  let section = `
【📊 互联网真实市场数据】（采集时间：${marketResearch.crawledAt}，共${marketResearch.totalItems}条数据）

- 市场均价：¥${marketResearch.priceAnalysis?.avg || "未知"}
- 价格区间：¥${marketResearch.priceAnalysis?.min || "?"} - ¥${marketResearch.priceAnalysis?.max || "?"}
- 价格分布：${JSON.stringify(marketResearch.priceAnalysis?.distribution || {})}
- 市场热门颜色排行：${topColors}
- 市场热门风格排行：${topStyles}
- 市场热门品类排行：${topCategories}
- 数据来源分布：${JSON.stringify(marketResearch.sourceDistribution || {})}`;

  if (marketResearch.marketInsight) {
    section += `\n\n【市场洞察】\n${marketResearch.marketInsight}`;
  }

  section += `

⚠ 重要：以上为真实互联网数据，企划方案必须与市场数据对齐：
1. colorPlan 中的颜色选择应参考市场热门颜色
2. stylePlan 中的风格定位应参考市场热门风格
3. pricePlan 中的价格带应参考市场均价和分布
4. 如果店铺数据与市场数据有差异，以市场数据为主，店铺数据为辅`;

  return section;
}

/* ============ 辅助函数：采集市场数据 ============ */
async function fetchMarketResearch(keyword: string, season: string, style: string, priceBand: string) {
  try {
    const researchResp = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/planning/market-research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword, season, style, priceBand }),
      signal: AbortSignal.timeout(20000),
    });
    if (researchResp.ok) {
      const data = await researchResp.json();
      console.log("[generate-planning] 市场数据采集完成:", data?.totalItems, "条");
      return data;
    }
  } catch (e: any) {
    console.error("[generate-planning] 市场数据采集失败（不影响主流程）:", e.message);
  }
  return null;
}

/* ============ 主接口 ============ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandName, season, colorPref, colorLabel, marketStyle, styleLabel, priceBand, targetAge, shopSize, notes, storeId } = body;

    // 1. 获取店铺数据+VIP画像
    let storeData: Record<string, any> | null = null;
    let memberStats: Record<string, any> | null = null;
    if (storeId) {
      const insights = await fetchStoreInsights(storeId);
      storeData = insights.storeData;
      memberStats = insights.memberStats;
    }

    // 2. 采集市场数据
    const researchKeyword = [brandName, season, styleLabel].filter(Boolean).join(" ") || "女装 2025";
    const marketResearch = await fetchMarketResearch(researchKeyword, season || "", styleLabel || "", priceBand || "");

    // 3. 检查API Key
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!deepseekKey && !openaiKey) {
      return NextResponse.json({ source: "mock", report: generateMockReport(brandName, season, colorLabel, styleLabel, priceBand) });
    }

    // 4. 构建system prompt
    const systemPrompt = `你是一位资深的时尚商品企划顾问，擅长为服装零售品牌制定季节性商品企划方案。你的核心能力是基于真实市场数据和店铺核心VIP画像，生成差异化的商品企划方案。

你必须严格按照以下 JSON 格式输出。输出时不要有任何额外文字、markdown代码块标记或解释，直接在 |JSON_START| 和 |JSON_END| 标记之间输出纯 JSON：

|JSON_START|
{
  "brandName": "品牌名",
  "season": "季节",
  "summary": "企划概要（200字以内）",
  "colorPlan": [
    {"type": "基础色", "ratio": "40%", "colors": ["色1", "色2"]},
    {"type": "主题色", "ratio": "35%", "colors": ["色1", "色2"]},
    {"type": "点缀色", "ratio": "15%", "colors": ["色1", "色2"]},
    {"type": "流行色", "ratio": "10%", "colors": ["色1", "色2"]}
  ],
  "stylePlan": [
    {"mainStyle": "主风格名", "subStyle": "偏风格名", "styleCombo": "组合名", "gender": "女士/男士", "occasions": ["场合1"], "vibe": ["风情1"], "trafficRatio": "占比", "profitRatio": "占比"}
  ],
  "productStructure": [
    {"type": "引流款/利润款/形象款/搭配款", "ratio": "占比", "desc": "简述"}
  ],
  "pricePlan": [
    {"band": "价格带名", "range": "价格范围", "ratio": "占比", "strategy": "策略说明"}
  ],
  "quartersPlan": [
    {"phase": "波段名", "items": ["事项1", "事项2"]}
  ],
  "imageKeywords": {
    "colorImages": ["关键词1", "关键词2"],
    "styleImages": ["关键词1", "关键词2"],
    "waveImages": [{"wave": 1, "keywords": ["关键词1"]}]
  }
}
|JSON_END|`;

    // 5. 构建用户提示词
    let userPrompt = `请为以下品牌生成${season}商品企划初稿：

【品牌基本信息】
- 品牌名：${brandName || "未指定"}
- 季节：${season}
- 色系偏好：${colorLabel || "未指定"}
- 风格定位：${styleLabel || "未指定"}
- 主力价格带：${priceBand || "199-399元"}
- 目标客群年龄段：${targetAge || "25-40岁"}
- 店铺面积：${shopSize || "未指定"}
- 补充说明：${notes || "无"}`;

    if (storeData && Object.keys(storeData).length > 0) {
      userPrompt += `\n\n【店铺经营数据】
- 月租金：${storeData.monthly_rent ? `¥${storeData.monthly_rent}` : "未填写"}
- 保本点：${storeData.break_even_point ? `¥${storeData.break_even_point}/月` : "未填写"}
- 毛利率：${storeData.gross_margin_rate ? `${(storeData.gross_margin_rate * 100).toFixed(0)}%` : "未填写"}
- 净利率：${storeData.net_margin_rate ? `${(storeData.net_margin_rate * 100).toFixed(0)}%` : "未填写"}
- 月进店数：${storeData.foot_traffic || "未填写"}
- 成交率：${storeData.conversion_rate ? `${(storeData.conversion_rate * 100).toFixed(0)}%` : "未填写"}
- 连带率：${storeData.attach_rate || "未填写"}
- 均件单价：${storeData.avg_item_price ? `¥${storeData.avg_item_price}` : "未填写"}
- 月营业额：${storeData.monthly_revenue ? `¥${storeData.monthly_revenue}` : "未填写"}`;
    }

    // 注入VIP画像数据
    const vipSection = buildVipPromptSection(memberStats || {});
    if (vipSection) userPrompt += "\n" + vipSection;

    // 注入市场数据
    const marketSection = buildMarketPromptSection(marketResearch || {});
    if (marketSection) userPrompt += "\n" + marketSection;

    // 企划要求
    const hasVip = memberStats?.tested_vip_count > 0;
    const hasMarket = marketResearch?.totalItems > 0;

    userPrompt += `

【企划要求】
1. colorPlan 至少4组，比例加起来=100%。${hasVip ? "色彩占比必须与VIP色彩季型分布严格对齐" : hasMarket ? "色彩选择必须参考市场热门颜色数据" : ""}
2. stylePlan 列出4-6个主流风格组合，每个包含mainStyle/subStyle/styleCombo/gender/occasions/vibe/trafficRatio/profitRatio。${hasVip ? "风格占比必须与VIP风格分布对齐" : hasMarket ? "参考市场热门风格数据" : ""}
3. productStructure 4类（引流款15%、利润款50%、形象款20%、搭配款15%）
4. pricePlan 必须严格基于用户输入的「主力价格带」拆分为4档，比例加起来=100%。${memberStats?.avg_vip_spent ? `参考VIP人均消费¥${memberStats.avg_vip_spent}。` : ""}${marketResearch?.priceAnalysis?.avg ? `参考市场均价¥${marketResearch.priceAnalysis.avg}。` : ""}绝对不能输出与用户价格带无关的默认价格。
5. quartersPlan 3个波段，每波4个事项
6. imageKeywords 必须基于实际风格组合生成
7. 内容要具体、专业、可落地
${hasVip && hasMarket ? `8. 双数据源对齐原则（最重要）：色彩/风格以VIP数据为主（服务现有客户），市场数据为辅（发现增量机会）` : ""}`;

    // 6. 调用AI API
    const useDeepseek = !!deepseekKey;
    const apiKey = useDeepseek ? deepseekKey! : openaiKey!;
    const apiUrl = useDeepseek ? "https://api.deepseek.com/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
    const model = useDeepseek ? "deepseek-chat" : "gpt-4o-mini";

    const aiRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], temperature: 0.7, max_tokens: 4000 }),
    });

    if (!aiRes.ok) {
      console.error("[generate-planning] AI API error:", aiRes.status);
      return NextResponse.json({ source: "mock_fallback", report: generateMockReport(brandName, season, colorLabel, styleLabel, priceBand) });
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let report;
    try {
      let jsonStr = "";
      const startIdx = content.indexOf("|JSON_START|");
      const endIdx = content.indexOf("|JSON_END|");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        jsonStr = content.substring(startIdx + 12, endIdx).trim();
      } else {
        const firstBrace = content.indexOf("{");
        const lastBrace = content.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = content.substring(firstBrace, lastBrace + 1);
        }
      }
      if (!jsonStr) throw new Error("无法提取 JSON");
      report = JSON.parse(jsonStr);
    } catch (err: any) {
      console.error("[generate-planning] JSON parse failed:", content.slice(0, 300));
      return NextResponse.json({ source: "mock_fallback", report: generateMockReport(brandName, season, colorLabel, styleLabel, priceBand) });
    }

    return NextResponse.json({ source: "ai", report });
  } catch (err: any) {
    console.error("[generate-planning] API error:", err);
    return NextResponse.json({ error: err.message || "服务异常" }, { status: 500 });
  }
}

/* ============ 辅助函数 ============ */
function buildMockPricePlan(priceBand?: string) {
  const DEFAULT = [
    { band: "入门款", range: "99-199元", ratio: "20%", strategy: "低价引流" },
    { band: "主销款", range: "199-399元", ratio: "45%", strategy: "量价平衡" },
    { band: "品质款", range: "399-699元", ratio: "25%", strategy: "拉高客单价" },
    { band: "旗舰款", range: "699元+", ratio: "10%", strategy: "品牌标杆" },
  ];
  if (!priceBand) return DEFAULT;
  const nums = priceBand.match(/\d+/g);
  if (!nums || nums.length < 2) return DEFAULT;
  const min = parseInt(nums[0], 10);
  const max = parseInt(nums[1], 10);
  if (min >= max || min <= 0) return DEFAULT;
  const diff = max - min;
  const s = (n: number) => Math.round(n);
  return [
    { band: "入门款", range: `${s(min)}-${s(min + diff / 4)}元`, ratio: "20%", strategy: "低价引流" },
    { band: "主销款", range: `${s(min + diff / 4)}-${s(min + diff / 2)}元`, ratio: "45%", strategy: "量价平衡" },
    { band: "品质款", range: `${s(min + diff / 2)}-${s(min + diff * 0.75)}元`, ratio: "25%", strategy: "拉高客单价" },
    { band: "旗舰款", range: `${s(min + diff * 0.75)}-${max}元`, ratio: "10%", strategy: "品牌标杆" },
  ];
}

function generateMockReport(brandName: string, season: string, colorLabel: string, styleLabel: string, priceBand?: string) {
  const mainStyleName = styleLabel ? styleLabel.replace(/型$/, "").split("(")[0].trim() : "古典";
  return {
    brandName: brandName || "示例品牌",
    season,
    summary: `基于${colorLabel || "综合"}偏好和${styleLabel || "百搭"}定位的${season}企划初稿。`,
    colorPlan: [
      { type: "基础色", ratio: "40%", colors: ["黑", "白", "灰", "藏青"] },
      { type: "主题色", ratio: "35%", colors: [(colorLabel || "中性") + "主调", "米白", "灰粉"] },
      { type: "点缀色", ratio: "15%", colors: ["珊瑚橘", "丁香紫"] },
      { type: "流行色", ratio: "10%", colors: ["数字薰衣草", "薄荷绿"] },
    ],
    stylePlan: [
      { mainStyle: mainStyleName, subStyle: "浪漫", styleCombo: `${mainStyleName}偏浪漫`, gender: "女士", occasions: ["上班职场", "社交礼仪"], vibe: ["知性风", "职业风"], trafficRatio: "30%", profitRatio: "60%" },
      { mainStyle: "优雅", subStyle: "少女", styleCombo: "优雅偏少女", gender: "女士", occasions: ["逛街约会", "社交礼仪"], vibe: ["韩系清新", "知性风"], trafficRatio: "12%", profitRatio: "8%" },
      { mainStyle: "自然", subStyle: "少年", styleCombo: "自然偏少年", gender: "女士", occasions: ["出行旅游", "逛街约会"], vibe: ["休闲风", "运动休闲"], trafficRatio: "10%", profitRatio: "6%" },
    ],
    productStructure: [
      { type: "引流款", ratio: "15%", desc: "低毛利高流量" },
      { type: "利润款", ratio: "50%", desc: "核心利润来源" },
      { type: "形象款", ratio: "20%", desc: "品牌调性展示" },
      { type: "搭配款", ratio: "15%", desc: "提升连带率" },
    ],
    pricePlan: buildMockPricePlan(priceBand),
    quartersPlan: [
      { phase: "第一波段", items: ["风格商品结构规划", "色彩企划矩阵", "价格带分布策略", "核心品类确定"] },
      { phase: "第二波段", items: ["爆款预测与选品", "门店陈列建议", "库存周转提示", "营销活动建议"] },
      { phase: "第三波段", items: ["销售跟踪", "补货追单参考", "滞销款处理", "下季企划预研"] },
    ],
    imageKeywords: {
      colorImages: [`${season} ${colorLabel || "中性"}配色 知性通勤穿搭`],
      styleImages: [`${mainStyleName}偏浪漫 ${season}大衣 职场通勤搭配`],
      waveImages: [{ wave: 1, keywords: [`${season}第一波新品 大衣上市 店铺陈列`] }],
    },
  };
}
