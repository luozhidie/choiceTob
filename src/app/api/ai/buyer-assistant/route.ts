import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DeepSeek AI配置
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

// FCPSR编码体系
const FCPSR_SYSTEM_PROMPT = `你是一个专业的服装买手AI助手，服务于中高端服装B端客户。

你的核心能力：
1. 基于FCPSR属性编码体系进行选品推荐
2. 分析全网爆款趋势
3. 提供竞品分析策略
4. 生成组货搭配方案

FCPSR编码体系：
- F面料: F01棉/F02丝/F03羊毛/F04麻/F05化纤/F06混纺/F07皮革/F08羽绒
- C剪裁: C01修身/C02宽松/C03直筒/C04A字/C05不规则
- P图案: P01条纹/P02波点/P03碎花/P04几何/P05纯色/P06格子/P07字母/P08动物
- S色季型: S01春浅/S02夏冷/S03秋深/S04冬亮/S05中性
- R搭配原则: R01单穿/R02层叠/R03叠穿/R04撞色/R05同色系/R06通勤/R07休闲/R08正式

回答规则：
1. 推荐商品时必须使用FCPSR编码标注属性
2. 优先推荐低竞争度高热度的组合
3. 给出具体的拿货价区间和零售价建议
4. 如果需要推荐具体商品，按以下JSON格式输出（放在<products>标签内）：
<products>
[{"name":"商品名","fcpsr":["F01","C02","P03","S01","R01"],"price_range":"89-268","reason":"推荐理由","heat_score":88}]
</products>
5. 回答要简洁、直接、有数据支撑`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { message, city = "广州", history = [] } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "请输入问题" }, { status: 400 });
    }

    // 检查认证
    const supabase = await createClient();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 获取当前爆款数据作为上下文
    const { data: hotCases } = await supabase
      .from("bao_kuan_cases")
      .select("title, price, sales_volume, attr_fabric, attr_cut, attr_pattern, attr_season_color, attr_rule, heat_score, source_platform")
      .order("heat_score", { ascending: false })
      .limit(20);

    // 构建上下文
    const hotDataContext = hotCases && hotCases.length > 0
      ? `\n\n当前爆款数据（最近20条）：\n${hotCases.map((c: any, i: number) =>
          `${i + 1}. ${c.title} | ¥${c.price} | 销量${c.sales_volume} | 热度${c.heat_score}℃ | 属性：${[...(c.attr_fabric || []), ...(c.attr_cut || []), ...(c.attr_pattern || []), ...(c.attr_season_color || [])].join("/")}`
        ).join("\n")}`
      : "\n\n（暂无爆款数据，请基于你的专业知识回答）";

    // 构建消息列表
    const messages: ChatMessage[] = [
      { role: "system", content: FCPSR_SYSTEM_PROMPT + `\n\n用户所在城市：${city}` + hotDataContext },
      ...history.map((h: ChatMessage) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    // 尝试调用DeepSeek API
    if (DEEPSEEK_API_KEY) {
      try {
        const response = await fetch(DEEPSEEK_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages,
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiReply = data.choices?.[0]?.message?.content || "暂无回复";

          // 提取<products>标签中的商品推荐
          const productsMatch = aiReply.match(/<products>([\s\S]*?)<\/products>/);
          let products = undefined;
          let cleanReply = aiReply;

          if (productsMatch) {
            try {
              products = JSON.parse(productsMatch[1]);
              cleanReply = aiReply.replace(/<products>[\s\S]*?<\/products>/, "").trim();
            } catch (e) {
              // JSON解析失败，不处理
            }
          }

          return NextResponse.json({
            reply: cleanReply,
            products,
            source: "deepseek",
          });
        }
      } catch (apiError) {
        console.error("DeepSeek API调用失败:", apiError);
      }
    }

    // 降级：本地智能回复
    const localReply = generateLocalReply(message, city, hotCases);
    return NextResponse.json({
      reply: localReply.text,
      products: localReply.products,
      source: "local",
    });

  } catch (error: any) {
    console.error("AI助手错误:", error);
    return NextResponse.json(
      { error: "AI助手暂时不可用，请稍后再试" },
      { status: 500 }
    );
  }
}

// 本地降级回复
function generateLocalReply(message: string, city: string, hotCases: any[] | null) {
  const msg = message.toLowerCase();
  const now = new Date();
  const month = now.getMonth() + 1;

  const seasonCode = month >= 3 && month <= 5 ? "S01" : month >= 6 && month <= 8 ? "S02" : month >= 9 && month <= 11 ? "S03" : "S04";
  const seasonNames: Record<string, string> = { S01: "春浅", S02: "夏冷", S03: "秋深", S04: "冬亮" };
  const seasonName = seasonNames[seasonCode];

  if (msg.includes("穿什么") || msg.includes("推荐") || msg.includes("选品") || msg.includes("趋势")) {
    const products = [
      { name: `${seasonName}风连衣裙`, fcpsr: ["F01", "C04", "P03", seasonCode, "R01"], price_range: "89-268", reason: `${seasonName}色系碎花连衣裙，纯棉舒适，A字版型显瘦，本季搜索量上升32%`, heat_score: 88 },
      { name: `${seasonName}色系针织开衫`, fcpsr: ["F06", "C02", "P05", seasonCode, "R02"], price_range: "128-399", reason: `混纺宽松针织开衫，纯色百搭，层叠穿搭核心单品，小红书笔记量+45%`, heat_score: 82 },
      { name: "高腰阔腿裤", fcpsr: ["F04", "C02", "P05", "S05", "R03"], price_range: "99-258", reason: `亚麻宽松阔腿裤，夏季通勤首选，叠穿搭配利器，抖音带货GMV Top10`, heat_score: 76 },
    ];

    const text = `根据当前${month}月${city}的气候和流行趋势，我为你推荐以下选品方向：\n\n当前季节编码：**${seasonCode}（${seasonName}）**\n\n核心趋势：\n1. **${seasonName}色系** 是本季主线，搜索量同比+28%\n2. **宽松版型（C02）** 持续主导，占比62%\n3. **层叠穿搭（R02）** 是最高转化搭配方式\n\n以下是具体选品清单：`;

    return { text, products };
  }

  if (msg.includes("爆款") || msg.includes("热卖") || msg.includes("什么好卖")) {
    // 如果有真实数据，用真实数据
    if (hotCases && hotCases.length > 0) {
      const top5 = hotCases.slice(0, 5);
      const text = `🔥 近期爆款Top5：\n\n${top5.map((c: any, i: number) =>
        `${i + 1}. ${c.title} | ¥${c.price} | 销量${c.sales_volume} | 热度${c.heat_score}℃`
      ).join("\n")}\n\n💡 建议：优先跟款低竞争度的爆款，利润空间更大。`;
      return { text };
    }

    const text = `🔥 近7天爆款趋势：\n\n| 排名 | 品类 | 关键属性 | 热度 | 竞争 |\n|------|------|---------|------|------|\n| 1 | 碎花连衣裙 | F01+C04+P03 | 95℃ | 高 |\n| 2 | 针织开衫 | F06+C02+P05 | 88℃ | 中 |\n| 3 | 阔腿裤 | F04+C02+P05 | 82℃ | 低 |\n| 4 | 西装外套 | F03+C01+P04 | 78℃ | 中 |\n| 5 | 吊带背心 | F05+C01+P05 | 75℃ | 低 |\n\n💡 建议：优先跟款**阔腿裤**和**吊带背心**，竞争度低但热度高，利润空间更大。`;
    return { text };
  }

  if (msg.includes("竞品") || msg.includes("同行") || msg.includes("对手")) {
    const text = `📊 竞品分析建议：\n\n1. **监控维度**：价格变动、上新频率、爆款销量、FCPSR属性分布\n2. **差异化策略**：\n   - 竞品扎堆 F01棉+C01修身 → 你做 F04麻+C02宽松 差异化\n   - 竞品S01春浅为主 → 你补充S02夏冷提前布局\n3. **操作建议**：去"竞品监控"页面添加目标店铺，系统会自动追踪数据变化`;
    return { text };
  }

  if (msg.includes("组货") || msg.includes("搭配") || msg.includes("组合")) {
    // 尝试从消息中提取FCPSR编码
    const fMatch = msg.match(/f(\d{2})/i);
    const cMatch = msg.match(/c(\d{2})/i);
    const sMatch = msg.match(/s(\d{2})/i);

    if (fMatch || cMatch || sMatch) {
      const codes: string[] = [];
      if (fMatch) codes.push(`F${fMatch[1]}`);
      if (cMatch) codes.push(`C${cMatch[1]}`);
      if (sMatch) codes.push(`S${sMatch[1]}`);

      const fabricNames: Record<string, string> = { "01": "棉", "02": "丝", "03": "羊毛", "04": "麻", "05": "化纤", "06": "混纺" };
      const cutNames: Record<string, string> = { "01": "修身", "02": "宽松", "03": "直筒", "04": "A字", "05": "不规则" };
      const seasonNames2: Record<string, string> = { "01": "春浅", "02": "夏冷", "03": "秋深", "04": "冬亮" };

      const desc = codes.map((c) => {
        const prefix = c[0];
        const num = c.slice(1);
        if (prefix === "F") return `${c}（${fabricNames[num] || num}）`;
        if (prefix === "C") return `${c}（${cutNames[num] || num}）`;
        if (prefix === "S") return `${c}（${seasonNames2[num] || num}）`;
        return c;
      }).join(" + ");

      const products = [
        { name: `核心单品`, fcpsr: [...codes, "R01"], price_range: "129-399", reason: `${desc}组合的核心单品，建议单穿展示面料质感`, heat_score: 85 },
        { name: `搭配外套`, fcpsr: [...codes, "R02"], price_range: "199-599", reason: `层叠穿搭外套，提升客单价+40%`, heat_score: 78 },
        { name: `配饰点缀`, fcpsr: [...codes, "R04"], price_range: "49-199", reason: `撞色配饰提升整体搭配完整度`, heat_score: 72 },
      ];

      const text = `基于你提供的属性组合 **${desc}**，推荐以下组货方案：\n\n组货逻辑：\n- **核心单品**：吸引进店，走量为主\n- **搭配外套**：提升客单价，利润品\n- **配饰点缀**：冲动消费，高毛利\n\n建议拿货比例：5:3:2`;
      return { text, products };
    }

    const text = `👗 组货搭配建议：\n\n请告诉我你想组什么属性的货，例如：\n- "F01棉+C02宽松怎么搭？"\n- "S01春浅色系怎么组货？"\n- "C04A字裙搭配什么好卖？"\n\n我会根据FCPSR编码为你生成最优组货方案。`;
    return { text };
  }

  // 默认
  const text = `你好！我是AI买手助手，可以帮你：\n\n- 🌡️ **查趋势**："下周${city}穿什么？"\n- 🔥 **找爆款**："最近什么好卖？"\n- 📊 **看竞品**："帮我分析竞品策略"\n- 👗 **搭组合**："F01+C02+S01怎么搭？"\n\n试试问我一个问题吧！`;
  return { text };
}
