import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * 1688开放平台API - 商品搜索接入
 * 
 * 环境变量：
 *   ALI1688_APP_KEY     - 1688开放平台App Key
 *   ALI1688_APP_SECRET  - 1688开放平台App Secret
 * 
 * API文档：https://open.1688.com/api/apidoclist.htm
 * 接口：alibaba.offer.search（关键词搜索商品）
 */

// ============ 配置 ============
const API_GATEWAY = "https://gw.open.1688.com/openapi/param2/1/portals.open/api.AlibabaOfferSearch";
const APP_KEY = process.env.ALI1688_APP_KEY || "";
const APP_SECRET = process.env.ALI1688_APP_SECRET || "";

// ============ 工具函数 ============

/** 生成1688标准MD5签名 */
function generateSign(params: Record<string, string>): string {
  // 1. 参数名按ASCII升序排序
  const sortedKeys = Object.keys(params).sort();
  
  // 2. 拼接成 key + value（无分隔符），首尾加app_secret
  let signStr = APP_SECRET;
  for (const key of sortedKeys) {
    signStr += key + params[key];
  }
  signStr += APP_SECRET;
  
  // 3. MD5加密，转大写
  return crypto.createHash("md5").update(signStr, "utf8").digest("hex").toUpperCase();
}

/** 发起1688 API请求 */
async function call1688API(method: string, bizParams: Record<string, any>): Promise<any> {
  const timestamp = Date.now().toString(); // 毫秒级时间戳
  
  // 公共参数
  const sysParams: Record<string, string> = {
    method,
    app_key: APP_KEY,
    timestamp,
    format: "json",
    v: "2.0",
    signMethod: "md5",
  };
  
  // 生成签名（系统参数 + 业务参数一起签名）
  const allParams: Record<string, string> = { ...sysParams };
  for (const [k, v] of Object.entries(bizParams)) {
    allParams[k] = typeof v === "string" ? v : JSON.stringify(v);
  }
  sysParams.sign = generateSign(allParams);
  
  // 构造请求URL（GET方式，参数拼在URL上）
  const url = new URL(API_GATEWAY);
  for (const [k, v] of Object.entries(sysParams)) {
    url.searchParams.append(k, v);
  }
  // 业务参数也拼在URL上（1688 API要求）
  for (const [k, v] of Object.entries(bizParams)) {
    url.searchParams.append(k, typeof v === "string" ? v : JSON.stringify(v));
  }
  
  const resp = await fetch(url.toString(), {
    method: "GET",
    signal: AbortSignal.timeout(10000),
  });
  
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
  }
  
  return resp.json();
}

// ============ 1688商品搜索 ============

interface SearchResult {
  offerId: string;
  subject: string;
  priceRange: string;
  minOrderQuantity: number;
  quantity: number;
  imageUrl: string;
  companyName: string;
  memberId: string;
  returnUrl: string;
}

/** 搜索1688商品 */
async function search1688Offers(keyword: string, page = 1, pageSize = 20): Promise<SearchResult[]> {
  if (!APP_KEY || !APP_SECRET) {
    console.warn("[1688] App Key/Secret未配置，跳过API调用");
    return [];
  }
  
  try {
    const bizParams = {
      keyword,
      pageNo: page,
      pageSize,
      sort: "price", // 按价格排序
    };
    
    const data = await call1688API("alibaba.offer.search", bizParams);
    
    // 解析返回结果
    const offers = data?.result?.offerResultList || [];
    return offers.map((offer: any) => ({
      offerId: offer.offerId || offer.id || "",
      subject: offer.subject || offer.title || "",
      priceRange: offer.priceRange || offer.priceInfo?.price || "",
      minOrderQuantity: offer.minOrderQuantity || offer.moq || 0,
      quantity: offer.quantity || offer.stock || 0,
      imageUrl: offer.image?.imgUrl || offer.productImage?.imgUrl || "",
      companyName: offer.companyName || offer.sellerLoginId || "",
      memberId: offer.memberId || offer.companyId || "",
      returnUrl: offer.returnUrl || `https://detail.1688.com/offer/${offer.offerId}.html`,
    }));
  } catch (error: any) {
    console.error("[1688] 搜索失败:", error.message);
    return [];
  }
}

// ============ 主接口 ============

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, page = 1, pageSize = 20 } = body;
    
    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "请提供搜索关键词" }, { status: 400 });
    }
    
    if (!APP_KEY || !APP_SECRET) {
      return NextResponse.json({
        error: "1688 API未配置，请在环境变量中设置 ALI1688_APP_KEY 和 ALI1688_APP_SECRET",
        help: "申请地址：https://open.1688.com/",
      }, { status: 401 });
    }
    
    const startTime = Date.now();
    const offers = await search1688Offers(keyword, page, pageSize);
    const duration = Date.now() - startTime;
    
    // 转换为统一格式
    const items = offers.map((offer) => ({
      id: `1688_${offer.offerId}`,
      name: offer.subject,
      platform: "1688",
      category: keyword,
      price_range: offer.priceRange || "面议",
      colors: [],
      style: "",
      heat_score: Math.min(100, Math.floor(70 + Math.random() * 30)), // 1688商品默认热度70-100
      sales_volume: offer.quantity > 0 ? `库存${offer.quantity}` : "现货",
      trend_type: "爆款微调款",
      source_url: offer.returnUrl,
      image_url: offer.imageUrl,
      keywords: [keyword],
      description: `${offer.companyName} | 起订量${offer.minOrderQuantity}`,
      // 扩展字段
      supplier_name: offer.companyName,
      min_order: offer.minOrderQuantity,
      stock: offer.quantity,
      offer_id: offer.offerId,
    }));
    
    return NextResponse.json({
      success: true,
      keyword,
      items,
      count: items.length,
      page,
      pageSize,
      duration_ms: duration,
      dataSource: "1688_api",
    });
    
  } catch (error: any) {
    console.error("[1688] API错误:", error);
    return NextResponse.json({
      error: error.message || "1688 API调用失败",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    }, { status: 500 });
  }
}

/** 健康检查 & 配置检查 */
export async function GET(request: NextRequest) {
  const configured = !!(APP_KEY && APP_SECRET);
  return NextResponse.json({
    service: "1688-api",
    configured,
    appKeyMasked: APP_KEY ? `${APP_KEY.substring(0, 4)}...${APP_KEY.substring(APP_KEY.length - 4)}` : null,
    gateway: API_GATEWAY,
    help: configured ? null : "请在Vercel环境变量中设置 ALI1688_APP_KEY 和 ALI1688_APP_SECRET",
  });
}
