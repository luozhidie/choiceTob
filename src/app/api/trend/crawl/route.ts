import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/trend/crawl
 * 爆款数据采集 API - 本地模板生成 + 爬虫补充
 * 
 * 核心策略：本地模板保证100%有数据，爬虫补充真实数据
 */

interface CrawledItem {
  name: string;
  platform: string;
  category: string;
  price_range: string;
  colors: string[];
  style: string;
  heat_score: number;
  sales_volume: string;
  trend_type: string;
  source_url: string;
  image_url: string;
  keywords: string[];
  description: string;
}

// Unsplash 免费时尚图片（永久有效，无需API Key）
const FASHION_IMAGES = [
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-5f2316217b87?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1581044777550-4cfa60707998?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1495385794356-15371f348c31?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1469334031218-a4d79b8705b2?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1479064555644-1b586bce4ac5?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1548625149-fc6a3d2cec3d?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1520975681451-8a24e4ce195e?w=400&h=600&fit=crop",
];

// 预置爆款模板库
const TEMPLATES: Array<(kw: string, imgIdx: number) => CrawledItem> = [
  (kw, imgIdx) => ({
    name: `2026夏季${kw}法式复古碎花款 高腰显瘦设计`,
    platform: "淘宝/天猫", category: kw, price_range: "¥168-268",
    colors: ["粉色", "米白", "浅蓝"], style: "法式",
    heat_score: 94, sales_volume: "月销3.2w+", trend_type: "全网爆款",
    source_url: "https://s.taobao.com/search?q=" + encodeURIComponent(kw + "法式"),
    image_url: FASHION_IMAGES[imgIdx % FASHION_IMAGES.length],
    keywords: [kw, "碎花", "法式"],
    description: "高腰A字版型显瘦遮胯，碎花元素本季热度上升45%，小红书笔记量破10w"
  }),
  (kw, imgIdx) => ({
    name: `${kw}韩系极简风 高级感纯色通勤款`,
    platform: "淘宝/天猫", category: kw, price_range: "¥129-199",
    colors: ["黑色", "白色", "驼色"], style: "韩系",
    heat_score: 89, sales_volume: "月销2.8w+", trend_type: "全网爆款",
    source_url: "https://s.taobao.com/search?q=" + encodeURIComponent(kw + "韩系"),
    image_url: FASHION_IMAGES[imgIdx % FASHION_IMAGES.length],
    keywords: [kw, "极简", "通勤"],
    description: "极简剪裁+高级面料，职场穿搭首选，复购率高达38%"
  }),
  (kw, imgIdx) => ({
    name: `${kw}国潮新中式 盘扣立领改良款`,
    platform: "小红书", category: kw, price_range: "¥259-399",
    colors: ["墨绿", "酒红", "藏青"], style: "国潮",
    heat_score: 91, sales_volume: "已售5.8万件", trend_type: "全网爆款",
    source_url: "https://www.xiaohongshu.com/search_result?keyword=" + encodeURIComponent(kw + "新中式"),
    image_url: FASHION_IMAGES[imgIdx % FASHION_IMAGES.length],
    keywords: [kw, "国潮", "新中式"],
    description: "新中式热度持续走高，盘扣立领设计兼顾传统与时尚，抖音带货GMV Top3"
  }),
  (kw, imgIdx) => ({
    name: `${kw}甜美少女风 蝴蝶结泡泡袖款`,
    platform: "抖音", category: kw, price_range: "¥89-159",
    colors: ["粉色", "白色", "淡紫"], style: "甜美",
    heat_score: 86, sales_volume: "月销4.1w+", trend_type: "潜在爆款",
    source_url: "https://www.douyin.com/search/" + encodeURIComponent(kw + "甜美"),
    image_url: FASHION_IMAGES[imgIdx % FASHION_IMAGES.length],
    keywords: [kw, "少女", "甜美"],
    description: "蝴蝶结+泡泡袖设计击中少女心，18-25岁客群占比62%"
  }),
  (kw, imgIdx) => ({
    name: `${kw}复古港风 垫肩收腰设计感款`,
    platform: "小红书", category: kw, price_range: "¥199-329",
    colors: ["焦糖", "墨绿", "酒红"], style: "复古",
    heat_score: 83, sales_volume: "月销1.9w+", trend_type: "潜在爆款",
    source_url: "https://www.xiaohongshu.com/search_result?keyword=" + encodeURIComponent(kw + "港风"),
    image_url: FASHION_IMAGES[imgIdx % FASHION_IMAGES.length],
    keywords: [kw, "港风", "复古"],
    description: "90年代港风回潮，垫肩收腰设计显气质，拍照出片率高"
  }),
  (kw, imgIdx) => ({
    name: `${kw}运动休闲风 速干透气户外款`,
    platform: "淘宝/天猫", category: kw, price_range: "¥139-229",
    colors: ["灰色", "黑色", "军绿"], style: "运动",
    heat_score: 80, sales_volume: "月销2.5w+", trend_type: "潜在爆款",
    source_url: "https://s.taobao.com/search?q=" + encodeURIComponent(kw + "运动"),
    image_url: FASHION_IMAGES[imgIdx % FASHION_IMAGES.length],
    keywords: [kw, "运动", "户外"],
    description: "Athflow风格持续流行，速干面料适合多场景穿搭"
  }),
  (kw, imgIdx) => ({
    name: `${kw}轻奢小众设计 不规则剪裁艺术款`,
    platform: "1688", category: kw, price_range: "¥298-498",
    colors: ["米白", "黑色", "驼色"], style: "轻奢",
    heat_score: 78, sales_volume: "批发拿货3000+件", trend_type: "潜在爆款",
    source_url: "https://www.1688.com/cha?keyword=" + encodeURIComponent(kw + "小众"),
    image_url: FASHION_IMAGES[imgIdx % FASHION_IMAGES.length],
    keywords: [kw, "小众", "设计"],
    description: "不规则剪裁+艺术感设计，客单价高利润空间大，二批市场走货快"
  }),
  (kw, imgIdx) => ({
    name: `${kw}OL通勤风 西装领干练气质款`,
    platform: "淘宝/天猫", category: kw, price_range: "¥189-299",
    colors: ["黑色", "藏青", "灰色"], style: "通勤",
    heat_score: 87, sales_volume: "月销3.6w+", trend_type: "全网爆款",
    source_url: "https://s.taobao.com/search?q=" + encodeURIComponent(kw + "通勤"),
    image_url: FASHION_IMAGES[imgIdx % FASHION_IMAGES.length],
    keywords: [kw, "OL", "通勤"],
    description: "西装领设计干练显气质，25-35岁职场女性首选，连带销售率高"
  }),
  (kw, imgIdx) => ({
    name: `${kw}街头潮流风 撞色拼接oversize款`,
    platform: "抖音", category: kw, price_range: "¥119-199",
    colors: ["黑色", "橙色", "荧光绿"], style: "街头",
    heat_score: 82, sales_volume: "月销2.1w+", trend_type: "潜在爆款",
    source_url: "https://www.douyin.com/search/" + encodeURIComponent(kw + "街头"),
    image_url: FASHION_IMAGES[imgIdx % FASHION_IMAGES.length],
    keywords: [kw, "街头", "潮流"],
    description: "撞色拼接+oversize版型，Z世代客群追捧，社交媒体传播力强"
  }),
  (kw, imgIdx) => ({
    name: `${kw}日系文艺风 棉麻宽松舒适款`,
    platform: "微博", category: kw, price_range: "¥99-168",
    colors: ["米白", "卡其", "淡蓝"], style: "文艺",
    heat_score: 76, sales_volume: "月销1.5w+", trend_type: "爆款微调款",
    source_url: "https://s.weibo.com/weibo?q=" + encodeURIComponent(kw + "日系"),
    image_url: FASHION_IMAGES[imgIdx % FASHION_IMAGES.length],
    keywords: [kw, "日系", "棉麻"],
    description: "棉麻面料透气舒适，宽松版型不挑身材，30-45岁客群稳定"
  }),
  (kw, imgIdx) => ({
    name: `${kw}法式茶歇风 V领系带收腰款`,
    platform: "小红书", category: kw, price_range: "¥159-249",
    colors: ["红色", "白色", "藏青"], style: "法式",
    heat_score: 90, sales_volume: "已售8.2万件", trend_type: "全网爆款",
    source_url: "https://www.xiaohongshu.com/search_result?keyword=" + encodeURIComponent(kw + "茶歇"),
    image_url: FASHION_IMAGES[imgIdx % FASHION_IMAGES.length],
    keywords: [kw, "茶歇", "V领"],
    description: "V领+系带收腰设计显身材，茶歇裙品类热度持续TOP1"
  }),
  (kw, imgIdx) => ({
    name: `2026早秋${kw}针织拼接假两件款`,
    platform: "1688", category: kw, price_range: "¥68-128",
    colors: ["灰色", "黑色", "杏色"], style: "通勤",
    heat_score: 79, sales_volume: "批发走货5000+件", trend_type: "潜在爆款",
    source_url: "https://www.1688.com/cha?keyword=" + encodeURIComponent(kw + "针织"),
    image_url: FASHION_IMAGES[imgIdx % FASHION_IMAGES.length],
    keywords: [kw, "针织", "假两件"],
    description: "假两件设计省去搭配烦恼，工厂直供利润空间大，二批市场热销"
  }),
  (kw, imgIdx) => ({
    name: `${kw}辣妹风 露腰短款紧身款`,
    platform: "抖音", category: kw, price_range: "¥79-139",
    colors: ["黑色", "白色", "粉色"], style: "辣妹",
    heat_score: 85, sales_volume: "月销5.6w+", trend_type: "全网爆款",
    source_url: "https://www.douyin.com/search/" + encodeURIComponent(kw + "辣妹"),
    image_url: FASHION_IMAGES[imgIdx % FASHION_IMAGES.length],
    keywords: [kw, "辣妹", "露腰"],
    description: "短款露腰设计击中辣妹审美，18-28岁客群占比75%，短视频传播裂变快"
  }),
  (kw, imgIdx) => ({
    name: `${kw}优雅名媛风 珍珠装饰蕾丝款`,
    platform: "淘宝/天猫", category: kw, price_range: "¥328-599",
    colors: ["白色", "香槟", "淡粉"], style: "优雅",
    heat_score: 81, sales_volume: "月销1.2w+", trend_type: "潜在爆款",
    source_url: "https://s.taobao.com/search?q=" + encodeURIComponent(kw + "名媛"),
    image_url: FASHION_IMAGES[imgIdx % FASHION_IMAGES.length],
    keywords: [kw, "名媛", "蕾丝"],
    description: "珍珠装饰+蕾丝面料显高级，约会/宴会场景穿搭，客单价高利润好"
  }),
  (kw, imgIdx) => ({
    name: `${kw}工装机能风 多口袋拉链款`,
    platform: "微博", category: kw, price_range: "¥149-259",
    colors: ["军绿", "黑色", "卡其"], style: "工装",
    heat_score: 77, sales_volume: "月销1.8w+", trend_type: "爆款微调款",
    source_url: "https://s.weibo.com/weibo?q=" + encodeURIComponent(kw + "工装"),
    image_url: FASHION_IMAGES[imgIdx % FASHION_IMAGES.length],
    keywords: [kw, "工装", "机能"],
    description: "多口袋+拉链设计实用性强，机能风热度回升，男女通穿客群广"
  }),
];

// 根据关键词智能匹配模板
function generateLocalItems(keyword: string): CrawledItem[] {
  const items = TEMPLATES.map((fn, i) => fn(keyword, i));
  
  // 根据关键词调整热度和描述
  return items.map(item => {
    const adjusted = { ...item };
    // 随机微调热度分，让数据看起来真实
    adjusted.heat_score = Math.min(98, Math.max(60, item.heat_score + Math.floor(Math.random() * 10) - 5));
    return adjusted;
  });
}

// ==================== 真实API调用 ====================

async function fetchFromTaobao(keyword: string): Promise<CrawledItem[]> {
  const appKey = process.env.TAOBAO_APP_KEY;
  if (!appKey) return [];
  try {
    const resp = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/taobao/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword, pageSize: 15 }),
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.items || []).map((item: any) => ({
      name: item.name,
      platform: item.platform || "淘宝",
      category: item.category || keyword,
      price_range: item.price_range || "",
      colors: item.colors || [],
      style: item.style || "",
      heat_score: item.heat_score || 70,
      sales_volume: item.sales_volume || "",
      trend_type: item.trend_type || "潜在爆款",
      source_url: item.source_url || "",
      image_url: item.image_url || "",
      keywords: item.keywords || [keyword],
      description: item.description || "",
    }));
  } catch (e) {
    console.error("[Crawl] 淘宝API失败:", e);
    return [];
  }
}

async function fetchFrom1688(keyword: string): Promise<CrawledItem[]> {
  const appKey = process.env.ALI1688_APP_KEY;
  if (!appKey) return [];
  try {
    const resp = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/1688/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword, pageSize: 10 }),
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.items || []).map((item: any) => ({
      name: item.name,
      platform: item.platform || "1688",
      category: item.category || keyword,
      price_range: item.price_range || "",
      colors: item.colors || [],
      style: item.style || "",
      heat_score: item.heat_score || 70,
      sales_volume: item.sales_volume || "",
      trend_type: item.trend_type || "爆款微调款",
      source_url: item.source_url || "",
      image_url: item.image_url || "",
      keywords: item.keywords || [keyword],
      description: item.description || "",
    }));
  } catch (e) {
    console.error("[Crawl] 1688 API失败:", e);
    return [];
  }
}

// ==================== 主接口 ====================
export async function POST(req: NextRequest) {
  try {
    const { keyword, sources } = await req.json();
    if (!keyword || !keyword.trim()) {
      return NextResponse.json({ error: "请输入关键词" }, { status: 400 });
    }

    const kw = keyword.trim();
    console.log(`[Crawl] 开始采集: "${kw}"`);

    // 优先调用真实API
    let allItems: CrawledItem[] = [];
    let dataSource: "demo" | "real" = "demo";

    const hasTaobao = !!process.env.TAOBAO_APP_KEY;
    const has1688 = !!process.env.ALI1688_APP_KEY;

    if (hasTaobao) {
      console.log("[Crawl] 调用淘宝API...");
      const taobaoItems = await fetchFromTaobao(kw);
      if (taobaoItems.length > 0) {
        allItems.push(...taobaoItems);
        dataSource = "real";
        console.log(`[Crawl] 淘宝API返回 ${taobaoItems.length} 条`);
      }
    }

    if (has1688) {
      console.log("[Crawl] 调用1688 API...");
      const items1688 = await fetchFrom1688(kw);
      if (items1688.length > 0) {
        allItems.push(...items1688);
        dataSource = "real";
        console.log(`[Crawl] 1688 API返回 ${items1688.length} 条`);
      }
    }

    // 尝试淘宝页面爬虫（需要芝麻代理Key）
    const hasZhiMaProxy = !!process.env.ZHIMA_PROXY_KEY;
    if (hasZhiMaProxy) {
      console.log("[Crawl] 调用淘宝页面爬虫（芝麻代理）...");
      try {
        const proxyResp = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/crawl/taobao-page`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: kw, maxPages: 1 }),
          signal: AbortSignal.timeout(30000),
        });
        if (proxyResp.ok) {
          const proxyData = await proxyResp.json();
          if (proxyData.items?.length > 0) {
            allItems.push(...proxyData.items.map((item: any) => ({
              name: item.name,
              platform: item.platform || "淘宝",
              category: item.category || kw,
              price_range: item.price_range || "",
              colors: item.colors || [],
              style: item.style || "",
              heat_score: item.heat_score || 70,
              sales_volume: item.sales_volume || "",
              trend_type: item.trend_type || "潜在爆款",
              source_url: item.source_url || "",
              image_url: item.image_url || "",
              keywords: item.keywords || [kw],
              description: item.description || "",
            })));
            dataSource = "real";
            console.log(`[Crawl] 淘宝页面爬虫返回 ${proxyData.items.length} 条`);
          }
        }
      } catch (e: any) {
        console.error("[Crawl] 淘宝页面爬虫失败:", e.message);
      }
    }

    // 如果真实数据没有返回，回退到模板
    if (allItems.length === 0) {
      console.log("[Crawl] 无真实API数据，使用模板...");
      allItems = generateLocalItems(kw);
      dataSource = "demo";
      console.log(`[Crawl] 本地模板生成 ${allItems.length} 条`);
    }

    // 去重（按名称前15字）
    const seen = new Set<string>();
    const deduped = allItems.filter(item => {
      const key = item.name.substring(0, 15).trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 按热度排序
    deduped.sort((a, b) => b.heat_score - a.heat_score);

    // 统计分析
    const stats = {
      total: deduped.length,
      byPlatform: deduped.reduce((acc, item) => {
        acc[item.platform] = (acc[item.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: deduped.reduce((acc, item) => {
        acc[item.trend_type] = (acc[item.trend_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      topStyles: Object.entries(
        deduped.filter(i => i.style).reduce((acc, item) => {
          acc[item.style] = (acc[item.style] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topColors: Object.entries(
        deduped.flatMap(i => i.colors).reduce((acc, c) => {
          acc[c] = (acc[c] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1]).slice(0, 8),
      avgHeat: deduped.length > 0
        ? Math.round(deduped.reduce((s, i) => s + i.heat_score, 0) / deduped.length)
        : 0,
    };

    console.log(`[Crawl] 返回 ${deduped.length} 条, 平均热度 ${stats.avgHeat}`);

    return NextResponse.json({
      keyword: kw,
      items: deduped,
      stats,
      crawledAt: new Date().toISOString(),
      dataSource,  // "demo" 或 "real"
      source: dataSource === "real" ? "api" : "local_template",
    });

  } catch (err: any) {
    console.error("[Crawl] API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
