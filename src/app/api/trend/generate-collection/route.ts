import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * 爆款合集 + 搭配生成API
 * POST /api/trend/generate-collection
 * body: { keyword: string, include_outfit?: boolean }
 * 
 * 返回：爆款商品合集 + 搭配方案（可选）
 */

const API_GATEWAY = "https://eco.taobao.com/router/rest";
const APP_KEY = process.env.TAOBAO_APP_KEY || "";
const APP_SECRET = process.env.TAOBAO_APP_SECRET || "";
const ADZONE_ID = process.env.TAOBAO_ADZONE_ID || "";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

function generateSign(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  let signStr = APP_SECRET;
  for (const key of sortedKeys) {
    signStr += key + params[key];
  }
  signStr += APP_SECRET;
  return crypto.createHash("md5").update(signStr, "utf8").digest("hex").toUpperCase();
}

/** 淘宝API时间戳格式: yyyy-MM-dd HH:mm:ss */
function formatTaobaoTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function callTaobaoAPI(method: string, bizParams: Record<string, any>): Promise<any> {
  const timestamp = formatTaobaoTimestamp(new Date());
  const sysParams: Record<string, string> = {
    method, app_key: APP_KEY, timestamp, format: "json", v: "2.0", sign_method: "md5",
  };
  const allParams: Record<string, string> = { ...sysParams };
  for (const [k, v] of Object.entries(bizParams)) {
    if (v !== undefined && v !== null && v !== "") {
      allParams[k] = typeof v === "string" ? v : String(v);
    }
  }
  sysParams.sign = generateSign(allParams);
  const url = new URL(API_GATEWAY);
  for (const [k, v] of Object.entries(sysParams)) url.searchParams.append(k, v);
  for (const [k, v] of Object.entries(bizParams)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.append(k, typeof v === "string" ? v : String(v));
    }
  }
  const resp = await fetch(url.toString(), { method: "GET", signal: AbortSignal.timeout(10000) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

/** 调用DeepSeek生成搭配方案 */
async function generateOutfitWithAI(keyword: string, items: any[]): Promise<string> {
  if (!DEEPSEEK_API_KEY) return "AI搭配功能未配置";

  const itemNames = items.slice(0, 5).map(i => i.title || i.name).join("、");
  const prompt = `你是一位资深时尚搭配师。关键词"${keyword}"的爆款商品包括：${itemNames}。请为这些爆款设计3套搭配方案，每套包含：上装、下装、鞋履、配饰，并说明搭配理由。用中文回答，简洁专业。`;

  try {
    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
      }),
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "生成失败";
  } catch (e: any) {
    console.error("[DeepSeek] 调用失败:", e.message);
    return "AI搭配生成失败";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, include_outfit = true } = body;

    if (!keyword) {
      return NextResponse.json({ error: "请提供关键词" }, { status: 400 });
    }

    if (!APP_KEY || !APP_SECRET) {
      return NextResponse.json({ error: "淘宝API未配置" }, { status: 401 });
    }

    // 1. 搜索爆款商品（取前2页，40条）
    const allItems: any[] = [];
    for (let page = 1; page <= 2; page++) {
      try {
        const bizParams: Record<string, any> = {
          q: keyword,
          page_no: page,
          page_size: 20,
          sort: "total_sales_des",
        };
        if (ADZONE_ID) bizParams.adzone_id = ADZONE_ID;

        const data = await callTaobaoAPI("taobao.tbk.dg.material.optional", bizParams);
        if (data.error_response) continue;
        const items = data.tbk_dg_material_optional_response?.result_list?.map_data || [];
        allItems.push(...items);
      } catch (e: any) {
        console.warn(`[Generate Collection] 第${page}页失败:`, e.message);
      }
    }

    if (allItems.length === 0) {
      return NextResponse.json({ error: "未找到相关商品" }, { status: 404 });
    }

    // 2. 整理爆款合集
    const hotItems = allItems.slice(0, 20).map((item: any) => ({
      item_id: item.item_id || "",
      title: item.title || "",
      price: item.zk_final_price || "",
      volume: parseInt(item.volume || "0"),
      pic_url: item.pict_url || "",
      item_url: item.item_url || "",
      shop_title: item.shop_title || "",
    }));

    // 3. 分析爆款特征
    const features = analyzeHotItems(hotItems);

    // 4. 生成搭配方案（可选）
    let outfitPlan = null;
    if (include_outfit) {
      outfitPlan = await generateOutfitWithAI(keyword, hotItems);
    }

    return NextResponse.json({
      success: true,
      keyword,
      collection: {
        name: `${keyword}爆款合集`,
        itemCount: hotItems.length,
        hotItems,
        features,
        generatedAt: new Date().toISOString(),
      },
      outfitPlan,
    });

  } catch (error: any) {
    console.error("[Generate Collection] 错误:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** 分析爆款特征 */
function analyzeHotItems(items: any[]) {
  const priceRange = {
    min: Math.min(...items.map(i => parseFloat(i.price) || 0)),
    max: Math.max(...items.map(i => parseFloat(i.price) || 0)),
    avg: items.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0) / items.length,
  };

  const volumeRange = {
    min: Math.min(...items.map(i => i.volume)),
    max: Math.max(...items.map(i => i.volume)),
    avg: items.reduce((sum, i) => sum + i.volume, 0) / items.length,
  };

  // 提取高频店铺
  const shopCount: Record<string, number> = {};
  items.forEach(i => {
    const shop = i.shop_title || "未知";
    shopCount[shop] = (shopCount[shop] || 0) + 1;
  });
  const topShops = Object.entries(shopCount)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5)
    .map(([shop, count]) => ({ shop, count }));

  return {
    priceRange: {
      min: priceRange.min.toFixed(2),
      max: priceRange.max.toFixed(2),
      avg: priceRange.avg.toFixed(2),
    },
    volumeRange: {
      min: volumeRange.min,
      max: volumeRange.max,
      avg: Math.floor(volumeRange.avg),
    },
    topShops,
    insight: `爆款价格区间¥${priceRange.min.toFixed(0)}-¥${priceRange.max.toFixed(0)}，平均销量${Math.floor(volumeRange.avg)}件/30天`,
  };
}
