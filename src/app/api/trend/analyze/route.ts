import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/trend/analyze
 * 爆款数据分析报告生成（本地生成，不依赖外部API）
 */

export async function POST(req: NextRequest) {
  try {
    const { keyword, items, stats } = await req.json();
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "没有数据可分析" }, { status: 400 });
    }

    // 基于本地数据生成分析报告
    const analysis = generateAnalysisReport(keyword, items, stats);
    return NextResponse.json({ analysis });

  } catch (err: any) {
    console.error("AI分析错误:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function generateAnalysisReport(keyword: string, items: any[], stats: any): string {
  const total = stats?.total || items.length;
  const avgHeat = stats?.avgHeat || Math.round(items.reduce((s, i) => s + (i.heat_score || 0), 0) / items.length);
  const byPlatform = stats?.byPlatform || {};
  const byType = stats?.byType || {};
  const topStyles = stats?.topStyles || [];
  const topColors = stats?.topColors || [];

  // 价格区间分析
  const prices = items.map(i => i.price_range).filter(Boolean);
  const priceRanges = analyzePriceRanges(prices);

  // 提取Top5商品
  const topItems = items.slice(0, 5);

  return `## 📊 「${keyword}」爆款趋势分析报告

---

### 一、整体热度评估

| 指标 | 数值 | 解读 |
|------|------|------|
| 采集总数 | ${total}条 | ${total >= 15 ? '数据量充足，分析可信度高' : '数据量偏少，建议扩大关键词范围'} |
| 平均热度 | ${avgHeat}/100 | ${avgHeat >= 85 ? '🔥 整体热度极高，属于当红品类' : avgHeat >= 70 ? '⚡ 热度较高，有爆款潜力' : '💡 热度中等，需差异化突围'} |
| 全网爆款 | ${byType['全网爆款'] || 0}条 | 头部商品占比${Math.round((byType['全网爆款'] || 0) / total * 100)}% |
| 潜在爆款 | ${byType['潜在爆款'] || 0}条 | 腰部商品储备充足 |

**平台覆盖**：${Object.entries(byPlatform).map(([k, v]) => `${k}(${v}条)`).join('、') || '多平台聚合'}

---

### 二、🔥 爆款类型分析

**全网爆款特征**：
${topItems.filter(i => i.trend_type === '全网爆款').map(i => `- **${i.name}**：热度${i.heat_score}，${i.sales_volume}，核心卖点${i.description?.substring(0, 50) || '设计独特'}`).join('\n') || '- 当前全网爆款数量较少，建议关注潜在爆款的转化'}

**潜在爆款识别**：
${items.filter(i => i.trend_type === '潜在爆款').slice(0, 3).map(i => `- **${i.name}**：热度${i.heat_score}，${i.style}风格，${i.colors?.join('/')}色系`).join('\n') || '- 潜在爆款储备充足'}

---

### 三、🎨 风格趋势

| 排名 | 风格 | 商品数 | 趋势判断 |
|------|------|--------|----------|
${topStyles.slice(0, 5).map((item: any, i: number) => `| ${i + 1} | ${item[0]} | ${item[1]}条 | ${i === 0 ? '🔥 本季主导风格' : i === 1 ? '⚡ 上升最快' : '💡 稳定需求'} |`).join('\n') || '| 1 | 多风格并存 | - | 市场分化明显 |'}

**风格融合机会**：
${topStyles.length >= 2 ? `- ${topStyles[0][0]} + ${topStyles[1][0]} 混搭是当前最具差异化的方向` : '- 建议关注跨风格混搭设计'}

---

### 四、🌈 色彩趋势

| 排名 | 颜色 | 出现次数 | 搭配建议 |
|------|------|----------|----------|
${topColors.slice(0, 8).map((item: any, i: number) => `| ${i + 1} | ${item[0]} | ${item[1]}次 | ${getColorAdvice(item[0])} |`).join('\n')}

**下季色彩预测**：${topColors.slice(0, 3).map((item: any) => item[0]).join('、')} 将持续主导，建议提前备货。

---

### 五、💰 价格带分析

| 价格区间 | 商品数 | 占比 | 建议 |
|----------|--------|------|------|
${priceRanges.map(r => `| ${r.range} | ${r.count}条 | ${r.percent}% | ${r.advice} |`).join('\n')}

**最优定价建议**：根据数据分布，${priceRanges.sort((a, b) => b.count - a.count)[0]?.range || '¥100-200'} 是竞争最激烈也是销量最大的价格带。建议差异化定价避开红海。

---

### 六、💡 爆款微调建议（核心）

${generateSuggestions(items, topStyles, topColors)}

---

### 七、🔮 下季预测

**风格方向**：${topStyles[0]?.[0] || '多元化'} 风格将持续火热，${topStyles[1]?.[0] || '新风格'} 正在崛起。

**品类机会**：${keyword}品类下，${items.filter(i => i.heat_score >= 85).length >= 3 ? '差异化设计款' : '基础百搭款'} 是切入最佳方向。

**风险提示**：
- 同质化竞争加剧，避免跟风爆款
- 价格战风险：${priceRanges[0]?.range || '中低价格带'} 竞争最激烈
- 库存风险：${topColors[0]?.[0] || '主流色'} 备货量控制在60%以内，预留40%给新色

---

> 📌 **报告说明**：本报告基于${total}条互联网爆款数据分析生成，数据来源于多平台聚合。建议结合实地市场考察验证。
`;
}

function analyzePriceRanges(prices: string[]): Array<{range: string; count: number; percent: string; advice: string}> {
  const ranges = [
    { min: 0, max: 100, label: '¥0-100', advice: '入门级价格，走量为主' },
    { min: 100, max: 200, label: '¥100-200', advice: '主流价格带，竞争激烈' },
    { min: 200, max: 300, label: '¥200-300', advice: '品质升级带，利润空间好' },
    { min: 300, max: 500, label: '¥300-500', advice: '中高端定位，需强设计支撑' },
    { min: 500, max: 9999, label: '¥500+', advice: '高端小众，客群精准' },
  ];

  const counts = ranges.map(r => ({ ...r, count: 0 }));
  
  for (const priceStr of prices) {
    const num = parseInt(priceStr.replace(/[^\d]/g, ''));
    if (!Number.isNaN(num)) {
      for (const range of counts) {
        if (num >= range.min && num < range.max) {
          range.count++;
          break;
        }
      }
    }
  }

  const total = counts.reduce((s, r) => s + r.count, 0) || 1;
  return counts.filter(r => r.count > 0).map(r => ({
    range: r.label,
    count: r.count,
    percent: Math.round(r.count / total * 100).toString(),
    advice: r.advice,
  }));
}

function getColorAdvice(color: string): string {
  const adviceMap: Record<string, string> = {
    '黑色': '百搭基础色，必备货',
    '白色': '春夏主力，注意透色问题',
    '粉色': '少女心驱动，18-28岁客群',
    '蓝色': '冷静高级感，职场通勤首选',
    '绿色': '自然治愈系，今年上升明显',
    '红色': '节庆/约会场景，销量爆发性强',
    '灰色': '极简高级，复购率高',
    '驼色': '秋冬经典，耐看不出错',
    '卡其': '工装/休闲风标配',
    '米白': '温柔气质，搭配空间大',
  };
  return adviceMap[color] || '流行色系，关注搭配效果';
}

function generateSuggestions(items: any[], topStyles: [string, number][], topColors: [string, number][]): string {
  const suggestions: string[] = [];
  
  // 基于Top商品生成建议
  const topItem = items[0];
  if (topItem) {
    suggestions.push(`1. **基于「${topItem.name}」微调**\n   - 方向：在${topItem.style || '现有'}风格基础上，增加${topColors[1]?.[0] || '新色'}选项\n   - 面料：升级为更舒适的面料（如天丝/冰丝混纺）\n   - 溢价空间：+15-25%\n   - 目标客群：${topItem.heat_score >= 90 ? '18-30岁追求时尚的年轻女性' : '25-40岁注重品质的职场女性'}`);
  }

  const secondItem = items[1];
  if (secondItem) {
    suggestions.push(`2. **「${secondItem.name}」改良版**\n   - 方向：缩小版型修身度，适配更多体型\n   - 细节：增加隐藏口袋/可调节腰带等实用设计\n   - 溢价空间：+10-20%\n   - 目标客群：追求舒适与美观平衡的大众客群`);
  }

  suggestions.push(`3. **跨风格融合款**\n   - 方向：${topStyles[0]?.[0] || '主流风格'} + ${topStyles[1]?.[0] || '新兴风格'} 混搭\n   - 设计：保留${topStyles[0]?.[0]}的${topColors[0]?.[0] || '主色'}基调，融入${topStyles[1]?.[0]}的剪裁元素\n   - 溢价空间：+20-35%（差异化定价）\n   - 目标客群：追求个性化的25-35岁客群`);

  suggestions.push(`4. **色彩迭代款**\n   - 方向：将${topColors[0]?.[0] || '主流色'}与${topColors[2]?.[0] || '新色'}做撞色设计\n   - 细节：小面积撞色（领口/袖口/腰带）降低风险\n   - 溢价空间：+15%\n   - 目标客群：时尚敏感度高的18-28岁客群`);

  const lowHeatItem = items.find(i => i.heat_score < 80);
  if (lowHeatItem) {
    suggestions.push(`5. **「${lowHeatItem.name}」潜力挖掘**\n   - 方向：当前热度${lowHeatItem.heat_score}偏低，通过面料升级提升质感\n   - 改良：改用高支棉/真丝混纺，提升触感\n   - 溢价空间：+30-50%\n   - 目标客群：注重品质的中高端客群`);
  } else {
    suggestions.push(`5. **价格带下探**\n   - 方向：推出${lowHeatItem?.name || '基础款'}的简化版（减少装饰细节）\n   - 定价：比原版低30-40%，抢占价格敏感客群\n   - 溢价空间：走量为主，利润率保持15-20%\n   - 目标客群：学生党/初入职场年轻客群`);
  }

  return suggestions.join('\n\n');
}
