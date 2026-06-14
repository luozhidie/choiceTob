import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * 明星同款搜索API
 * POST /api/celebrity
 * body: { celebrity: string, keyword?: string, page?: number, page_size?: number }
 * 
 * 返回：明星同款商品列表
 */

const API_GATEWAY = "https://eco.taobao.com/router/rest";
const APP_KEY = process.env.TAOBAO_APP_KEY || "";
const APP_SECRET = process.env.TAOBAO_APP_SECRET || "";
const ADZONE_ID = process.env.TAOBAO_ADZONE_ID || "";

// 明星常用搜索关键词映射
const CELEBRITY_KEYWORDS: Record<string, string[]> = {
  "杨幂": ["杨幂同款", "杨幂穿搭", "杨幂同款连衣裙", "杨幂同款外套"],
  "迪丽热巴": ["迪丽热巴同款", "迪丽热巴穿搭", "迪丽热巴同款"],
  "刘亦菲": ["刘亦菲同款", "刘亦菲穿搭", "刘亦菲同款"],
  "Angelababy": ["Angelababy同款", "杨颖同款", "Angelababy穿搭"],
  "赵丽颖": ["赵丽颖同款", "赵丽颖穿搭", "赵丽颖同款"],
  "唐嫣": ["唐嫣同款", "唐嫣穿搭", "唐嫣同款"],
  "刘诗诗": ["刘诗诗同款", "刘诗诗穿搭", "刘诗诗同款"],
  "倪妮": ["倪妮同款", "倪妮穿搭", "倪妮同款"],
  "宋茜": ["宋茜同款", "宋茜穿搭", "宋茜同款"],
  "杨紫": ["杨紫同款", "杨紫穿搭", "杨紫同款"],
  "热巴": ["迪丽热巴同款", "热巴同款", "热巴穿搭"],
  "幂幂": ["杨幂同款", "幂幂穿搭"],
};

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { celebrity, keyword, page = 1, page_size = 20 } = body;

    if (!celebrity) {
      return NextResponse.json({ error: "请提供明星名称" }, { status: 400 });
    }

    if (!APP_KEY || !APP_SECRET) {
      return NextResponse.json({ error: "淘宝API未配置" }, { status: 401 });
    }

    // 构建搜索关键词：优先用用户指定的keyword，否则用明星默认关键词
    const searchKeyword = keyword || `${celebrity}同款`;

    // 搜索淘宝
    const bizParams: Record<string, any> = {
      q: searchKeyword,
      page_no: page,
      page_size: Math.min(page_size, 100),
      sort: "total_sales_des",
    };
    if (ADZONE_ID) bizParams.adzone_id = ADZONE_ID;

    const data = await callTaobaoAPI("taobao.tbk.dg.material.optional", bizParams);

    if (data.error_response) {
      const err = data.error_response;
      return NextResponse.json({
        success: false,
        error: `[${err.sub_code || err.code}] ${err.sub_msg || err.msg}`,
      }, { status: 500 });
    }

    const result = data.tbk_dg_material_optional_response?.result_list?.map_data || [];
    const items = result.map((item: any) => ({
      item_id: item.item_id || "",
      title: item.title || "",
      price: item.zk_final_price || "",
      volume: parseInt(item.volume || "0"),
      pic_url: item.pict_url || "",
      item_url: item.item_url || "",
      shop_title: item.shop_title || "",
      commission_rate: item.commission_rate || "",
      coupon_amount: item.coupon_amount || 0,
    }));

    // 获取该明星的其他推荐搜索词
    const suggestedKeywords = CELEBRITY_KEYWORDS[celebrity] || [
      `${celebrity}同款`,
      `${celebrity}穿搭`,
      `${celebrity}同款衣服`,
    ];

    return NextResponse.json({
      success: true,
      celebrity,
      searchKeyword,
      items,
      count: items.length,
      suggestedKeywords: suggestedKeywords.slice(0, 5),
      celebrityList: Object.keys(CELEBRITY_KEYWORDS),
    });

  } catch (error: any) {
    console.error("[Celebrity] 错误:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** 获取明星列表 */
export async function GET(request: NextRequest) {
  const celebrities = Object.keys(CELEBRITY_KEYWORDS).map(name => ({
    name,
    keywords: CELEBRITY_KEYWORDS[name],
  }));
  return NextResponse.json({ celebrities });
}
