import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { COLOR_SEASONS_PRO } from "@/lib/styles";

/**
 * POST /api/generate-planning
 * 调用 DeepSeek API 生成商品企划初稿
 *
 * 支持 store_id：从 stores 表读取经营数据+会员聚合统计，注入 AI prompt
 * 支持的 provider: deepseek（默认）、openai
 * 环境变量: DEEPSEEK_API_KEY 或 OPENAI_API_KEY
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      brandName,
      season,
      colorPref,
      colorLabel,
      marketStyle,
      styleLabel,
      priceBand,
      targetAge,
      shopSize,
      notes,
      storeId,
    } = body;

    // ---- 如果传了 storeId，从数据库读取店铺数据 ----
    let storeData: Record<string, any> | null = null;
    let memberStats: Record<string, any> | null = null;

    if (storeId) {
      const supabase = await createClient();
      const { data } = await supabase.from("stores").select("*").eq("id", storeId).single();
      if (data) {
        storeData = (data as any).business_data || {};
        memberStats = (data as any).member_stats || {};
      }
    }

    // ---- 检查 API Key ----
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!deepseekKey && !openaiKey) {
      return NextResponse.json({
        source: "mock",
        report: generateMockReport(brandName, season, colorLabel, styleLabel, priceBand),
      });
    }

    // ---- 构建 system prompt ----
    const systemPrompt = `你是一位资深的时尚商品企划顾问，擅长为服装零售品牌制定季节性商品企划方案。你的核心能力是基于店铺经营数据和核心会员画像，生成差异化的商品企划方案，帮助店铺在供过于求的市场中通过精准选品和会员服务获得竞争优势。

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
    {
      "mainStyle": "主风格名称（只能是一个风格名，如：古典）",
      "subStyle": "偏风格名称（只能是一个风格名，如：浪漫）",
      "styleCombo": "风格组合名（如：古典偏浪漫）",
      "gender": "女士/男士",
      "occasions": ["上班职场", "社交礼仪"],
      "vibe": ["知性风", "职业风"],
      "trafficRatio": "占比",
      "profitRatio": "占比"
    }
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
    "colorImages": [
      "2026夏季 驼色连衣裙 深暖型配色 知性通勤穿搭",
      "color palette winter camel coat outfit 2026"
    ],
    "styleImages": [
      "优雅型女士 夏季真丝衬衫 职场通勤搭配",
      "women elegant summer blouse office outfit 2026"
    ],
    "waveImages": [
      {"wave": 1, "keywords": ["2026夏季第一波新品 连衣裙上市 店铺陈列", "summer new arrival dress display boutique"]},
      {"wave": 2, "keywords": ["2026夏季主推款 通勤套装 热卖陈列", "summer key items commute set bestseller"]}
    ]
  }
}
|JSON_END|`;

    // ---- 构建用户提示词 ----
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

    // 如果有店铺经营数据，注入
    if (storeData && Object.keys(storeData).length > 0) {
      userPrompt += `

【店铺经营数据】
- 月租金：${storeData.monthly_rent ? `¥${storeData.monthly_rent}` : "未填写"}
- 保本点：${storeData.break_even_point ? `¥${storeData.break_even_point}/月` : "未填写"}
- 毛利率：${storeData.gross_margin_rate ? `${(storeData.gross_margin_rate * 100).toFixed(0)}%` : "未填写"}
- 净利率：${storeData.net_margin_rate ? `${(storeData.net_margin_rate * 100).toFixed(0)}%` : "未填写"}
- 月进店数：${storeData.foot_traffic || "未填写"}
- 成交率：${storeData.conversion_rate ? `${(storeData.conversion_rate * 100).toFixed(0)}%` : "未填写"}
- 连带率：${storeData.attach_rate || "未填写"}
- 均件单价：${storeData.avg_item_price ? `¥${storeData.avg_item_price}` : "未填写"}
- 月营业额：${storeData.monthly_revenue ? `¥${storeData.monthly_revenue}` : "未填写"}
- 流量渠道：${storeData.traffic_channels?.length ? storeData.traffic_channels.join("、") : "未填写"}
- 当前流行趋势：${storeData.current_trends?.length ? storeData.current_trends.join("、") : "未填写"}`;
    }

    // 如果有会员聚合统计，注入
    if (memberStats && memberStats.tested_vip_count > 0) {
      const colorDist = memberStats.color_season_distribution || {};
      const styleDist = memberStats.style_distribution || {};
      const COLOR_LABELS: Record<string, string> = Object.fromEntries(
        [...COLOR_SEASONS_PRO].map(c => [c.value, `${c.label.replace(/型$/, '')}${c.group}`])
      );

      userPrompt += `

【核心会员色彩季型分布】（已测试${memberStats.tested_vip_count}人，总VIP ${memberStats.total_vip_count}人）
${Object.entries(colorDist).map(([key, val]: [string, any]) =>
  `- ${COLOR_LABELS[key] || key}：${val.percentage}%（${val.count}人）`
).join("\n")}

【核心会员风格分布】
${Object.entries(styleDist).map(([key, val]: [string, any]) =>
  `- ${key}：${val.percentage}%（${val.count}人）`
).join("\n")}`;
    }

    userPrompt += `

【企划要求】
1. colorPlan 至少4组，比例加起来=100%${memberStats?.tested_vip_count > 0 ? "。色彩占比应与会员色彩季型分布吻合，主力色系对应会员占比最高的季型" : ""}
2. stylePlan 列出4-6个主流风格组合，每个必须包含：
   - mainStyle: 只能是单个风格名称（女士：少女/优雅/浪漫/少年/时尚/古典/自然/戏剧；男士：时尚/浪漫/古典/自然/戏剧），严禁包含场合、风情、性别等其他信息
   - subStyle: 只能是单个风格名称，从同性别其他风格中选
   - styleCombo: 组合名如「古典偏浪漫」「自然偏少年」
   - gender: 女士/男士
   - occasions: 适用场合数组（上班职场/逛街约会/出行旅游/社交礼仪）
   - vibe: 风情标签数组（知性风/韩系清新/运动休闲/职业风/复古港风/潮牌风/新中式/休闲风/波西米亚）
   - trafficRatio/profitRatio: 占比
   用户选择的风格占比最高${memberStats?.tested_vip_count > 0 ? "。风格占比应与会员风格分布吻合" : ""}
3. productStructure 4类（引流款15%、利润款50%、形象款20%、搭配款15%）${storeData?.conversion_rate ? "。结合成交率数据优化引流款和利润款比例" : ""}
4. pricePlan 必须严格基于用户输入的「主力价格带」拆分为4档，比例加起来=100%。
   拆分规则：以用户价格带的最小值为入门款起点，最大值为旗舰款上限，中间均匀拆分为主销款和品质款。
   例如用户价格带600-3000元，应拆为：入门款600-1200元、主销款1200-1800元、品质款1800-2500元、旗舰款2500-3000元。
   绝对不能输出与用户价格带无关的默认价格（如99元、199元等）。
5. quartersPlan 3个波段，每波4个事项
6. imageKeywords 字段必须输出，且每个关键词必须基于实际风格组合生成：
   - colorImages：4个关键词，基于colorPlan中的具体颜色，格式「季节+颜色+品类+风格+场景」，如「2026冬季 驼色羊毛大衣 古典偏浪漫 职场通勤穿搭」
   - styleImages：6个关键词，每个对应一个stylePlan中的风格组合，格式「主风格+偏风格+季节+品类+场合」，如「古典偏浪漫 女士 冬季大衣 上班职场搭配」「自然偏少年 女士 冬季棉服 出行旅游穿搭」
   - waveImages：每个波段3个关键词，格式「季节+波段+主风格+品类+陈列场景」，如「2026冬季第一波 古典偏浪漫 大衣新品 店铺橱窗陈列」
7. 内容要具体、专业、可落地${storeData ? "，基于店铺实际经营数据制定" : ""}`;

    // ---- 调用 AI API ----
    const useDeepseek = !!deepseekKey;
    const apiKey = useDeepseek ? deepseekKey! : openaiKey!;
    const apiUrl = useDeepseek
      ? "https://api.deepseek.com/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    const model = useDeepseek ? "deepseek-chat" : "gpt-4o-mini";

    console.log("[generate-planning] Calling AI API, priceBand:", priceBand);

    const aiRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[generate-planning] AI API error:", aiRes.status, errText);
      return NextResponse.json({
        source: "mock_fallback",
        report: generateMockReport(brandName, season, colorLabel, styleLabel, priceBand),
      });
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let report;
    try {
      // 先尝试用 |JSON_START| / |JSON_END| 标记提取
      let jsonStr = "";
      const startIdx = content.indexOf("|JSON_START|");
      const endIdx = content.indexOf("|JSON_END|");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        jsonStr = content.substring(startIdx + 12, endIdx).trim();
      } else {
        // fallback: 找第一个 { 和最后一个 }
        const firstBrace = content.indexOf("{");
        const lastBrace = content.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = content.substring(firstBrace, lastBrace + 1);
        }
      }
      if (!jsonStr) throw new Error("无法提取 JSON 内容");
      report = JSON.parse(jsonStr);
      console.log("[generate-planning] AI report parsed, pricePlan:", report.pricePlan);
    } catch (err: any) {
      console.error("[generate-planning] JSON parse failed:", content.slice(0, 300));
      return NextResponse.json({
        source: "mock_fallback",
        report: generateMockReport(brandName, season, colorLabel, styleLabel, priceBand),
      });
    }

    return NextResponse.json({ source: "ai", report });
  } catch (err: any) {
    console.error("[generate-planning] API error:", err);
    return NextResponse.json(
      { error: err.message || "服务异常" },
      { status: 500 }
    );
  }
}

/* ---- 价格带解析辅助 ---- */
function buildMockPricePlan(priceBand?: string) {
  const DEFAULT = [
    { band: "入门款", range: "99-199元", ratio: "20%", strategy: "低价引流，降低新客决策门槛" },
    { band: "主销款", range: "199-399元", ratio: "45%", strategy: "量价平衡，贡献核心销量与利润" },
    { band: "品质款", range: "399-699元", ratio: "25%", strategy: "提升品牌形象，拉高客单价" },
    { band: "旗舰款", range: "699元+", ratio: "10%", strategy: "品牌标杆，彰显品牌实力与调性" },
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
    { band: "入门款", range: `${s(min)}-${s(min + diff / 4)}元`, ratio: "20%", strategy: "低价引流，降低新客决策门槛" },
    { band: "主销款", range: `${s(min + diff / 4)}-${s(min + diff / 2)}元`, ratio: "45%", strategy: "量价平衡，贡献核心销量与利润" },
    { band: "品质款", range: `${s(min + diff / 2)}-${s(min + diff * 0.75)}元`, ratio: "25%", strategy: "提升品牌形象，拉高客单价" },
    { band: "旗舰款", range: `${s(min + diff * 0.75)}-${max}元`, ratio: "10%", strategy: "品牌标杆，彰显品牌实力与调性" },
  ];
}

/* ---- Mock 生成（fallback）---- */
function generateMockReport(
  brandName: string,
  season: string,
  colorLabel: string,
  styleLabel: string,
  priceBand?: string
) {
  const mainStyleName = styleLabel
    ? styleLabel.replace(/型$/, "").split("(")[0].trim()
    : "古典";
  return {
    brandName: brandName || "示例品牌",
    season,
    summary: `基于${colorLabel || "综合"}偏好和${styleLabel || "百搭"}定位，为${brandName || "贵品牌"}量身定制的${season}商品企划初稿。本企划结合市场趋势与品牌调性，可作为选品与铺货的参考框架。\n\n（提示：此为基础初稿，如需结合店铺实际数据定制完整方案，可申请人工企划服务）`,
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
      { mainStyle: "时尚", subStyle: "戏剧", styleCombo: "时尚偏戏剧", gender: "女士", occasions: ["逛街约会", "社交礼仪"], vibe: ["潮牌风", "复古港风"], trafficRatio: "8%", profitRatio: "4%" },
      { mainStyle: "戏剧", subStyle: "时尚", styleCombo: "戏剧偏时尚", gender: "男士", occasions: ["上班职场", "社交礼仪"], vibe: ["职业风", "潮牌风"], trafficRatio: "8%", profitRatio: "5%" },
      { mainStyle: "古典", subStyle: "自然", styleCombo: "古典偏自然", gender: "男士", occasions: ["上班职场", "出行旅游"], vibe: ["知性风", "休闲风"], trafficRatio: "7%", profitRatio: "4%" },
    ],
    productStructure: [
      { type: "引流款", ratio: "15%", desc: "低毛利高流量，吸引新客进店" },
      { type: "利润款", ratio: "50%", desc: "核心利润来源，保证经营健康" },
      { type: "形象款", ratio: "20%", desc: "品牌调性展示，提升品牌溢价" },
      { type: "搭配款", ratio: "15%", desc: "提升连带率，拉高客单价" },
    ],
    pricePlan: buildMockPricePlan(priceBand),
    quartersPlan: [
      { phase: "第一波段（上半月）", items: [`${styleLabel || "主力"}风格商品结构规划`, `${colorLabel || "主题"}色彩企划矩阵`, "价格带分布策略", "核心品类确定"] },
      { phase: "第二波段（下半月）", items: ["爆款预测与选品参考", "门店陈列建议", "库存周转提示", "营销活动建议"] },
      { phase: "第三波段（次月补充）", items: ["销售跟踪建议", "补货追单参考", "滞销款处理建议", "下一季企划预研"] },
    ],
    imageKeywords: {
      colorImages: [
        `${colorLabel || "中性"} 驼色大衣 ${season}配色 知性通勤穿搭`,
        `camel coat ${season} color palette elegant office outfit 2026`,
        `${season}流行色 米白衬衫 深暖型 职场搭配`,
        `warm tone ${season} blouse outfit women professional 2026`,
      ],
      styleImages: [
        `${mainStyleName}偏浪漫 女士 ${season}大衣 职场通勤搭配`,
        `women ${mainStyleName} romantic ${season} coat office look 2026`,
        `优雅偏少女 女士 ${season}连衣裙 逛街约会穿搭`,
        `elegant girlie ${season} dress date outfit women 2026`,
        `自然偏少年 女士 ${season}休闲装 出行旅游搭配`,
        `natural boyish ${season} casual travel outfit women 2026`,
      ],
      waveImages: [
        { wave: 1, keywords: [`${season}第一波新品 大衣上市 店铺陈列设计`, `boutique ${season} new arrival coat display`, "新品橱窗陈列"] },
        { wave: 2, keywords: [`${season}主推款 通勤套装 热卖陈列`, `bestseller commute set ${season} display`, "核心款搭配展示"] },
        { wave: 3, keywords: [`${season}补充款 追单上衣 清仓陈列`, `reorder blouse ${season} clearance display`, "季末促销活动"] },
      ],
    },
  };
}
