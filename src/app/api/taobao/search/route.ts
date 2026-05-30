import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * 淘宝联盟API - 商品搜索接入
 * 
 * 环境变量：
 *   TAOBAO_APP_KEY     - 淘宝联盟App Key
 *   TAOBAO_APP_SECRET  - 淘宝联盟App Secret
 *   TAOBAO_ADZONE_ID   - 淘宝联盟推广位ID（可选，有的话佣金更高）
 * 
 * API文档：https://open.taobao.com/doc.htm?docId=1&docType=17
 * 接口：taobao.tbk.dg.material.optional（淘宝客-推广者-物料搜索）
 */

// ============ 配置 ============
const API_GATEWAY = "https://eco.taobao.com/router/rest";
const APP_KEY = process.env.TAOBAO_APP_KEY || "";
const APP_SECRET = process.env.TAOBAO_APP_SECRET || "";
const ADZONE_ID = process.env.TAOBAO_ADZONE_ID || "";

// ============ 工具函数 ============

/** 生成淘宝标准MD5签名 */
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

/** 发起淘宝API请求 */
async function callTaobaoAPI(method: string, bizParams: Record<string, any>): Promise<any> {
  const timestamp = new Date().toISOString().replace(/\..+/, "") + "+08:00"; // 淘宝要求ISO格式时间戳
  
  // 公共参数
  const sysParams: Record<string, string> = {
    method,
    app_key: APP_KEY,
    timestamp,
    format: "json",
    v: "2.0",
    sign_method: "md5",
  };
  
  // 生成签名（系统参数 + 业务参数一起签名）
  const allParams: Record<string, string> = { ...sysParams };
  for (const [k, v] of Object.entries(bizParams)) {
    if (v !== undefined && v !== null && v !== "") {
      allParams[k] = typeof v === "string" ? v : String(v);
    }
  }
  sysParams.sign = generateSign(allParams);
  
  // 构造请求URL
  const url = new URL(API_GATEWAY);
  for (const [k, v] of Object.entries(sysParams)) {
    url.searchParams.append(k, v);
  }
  for (const [k, v] of Object.entries(bizParams)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.append(k, typeof v === "string" ? v : String(v));
    }
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

// ============ 淘宝商品搜索 ============

interface TaobaoItem {
  item_id: string;
  title: string;
  pict_url: string;
  zk_final_price: string;
  reserve_price: string;
  volume: number; // 30天销量
  category_id: number;
  provcity: string;
  item_url: string;
  shop_title: string;
  user_type: number; // 0=集市，1=天猫
  commission_rate: string; // 佣金率
  coupon_amount?: number; // 优惠券金额
  coupon_info?: string;
  short_title?: string;
}

/** 搜索淘宝商品 */
async function searchTaobaoItems(keyword: string, page = 1, pageSize = 20): Promise<TaobaoItem[]> {
  if (!APP_KEY || !APP_SECRET) {
    console.warn("[Taobao] App Key/Secret未配置，跳过API调用");
    return [];
  }
  
  try {
    const bizParams: Record<string, any> = {
      q: keyword,
      page_no: page,
      page_size: pageSize,
      has_coupon: "true", // 优先有优惠券的商品（更可能是爆款）
      sort: "total_sales_des", // 按销量降序
    };
    
    // 如果有推广位ID，加上
    if (ADZONE_ID) {
      bizParams.adzone_id = ADZONE_ID;
    }
    
    const data = await callTaobaoAPI("taobao.tbk.dg.material.optional", bizParams);
    
    // 检查错误
    if (data.error_response) {
      const error = data.error_response;
      console.error("[Taobao] API错误:", error.sub_msg || error.msg);
      return [];
    }
    
    // 解析结果
    const result = data.tbk_dg_material_optional_response?.result_list?.map_data || [];
    return result.map((item: any) => ({
      item_id: item.item_id || "",
      title: item.title || "",
      pict_url: item.pict_url || "",
      zk_final_price: item.zk_final_price || "",
      reserve_price: item.reserve_price || "",
      volume: parseInt(item.volume || "0"),
      category_id: item.category_id || 0,
      provcity: item.provcity || "",
      item_url: item.item_url || `https://item.taobao.com/item.htm?id=${item.item_id}`,
      shop_title: item.shop_title || "",
      user_type: item.user_type || 0,
      commission_rate: item.commission_rate || "",
      coupon_amount: item.coupon_amount || 0,
      coupon_info: item.coupon_info || "",
      short_title: item.short_title || "",
    }));
  } catch (error: any) {
    console.error("[Taobao] 搜索失败:", error.message);
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
        error: "淘宝联盟API未配置，请在环境变量中设置 TAOBAO_APP_KEY 和 TAOBAO_APP_SECRET",
        help: "申请地址：https://open.taobao.com/ → 创建应用 → 淘宝联盟",
      }, { status: 401 });
    }
    
    const startTime = Date.now();
    const items = await searchTaobaoItems(keyword, page, pageSize);
    const duration = Date.now() - startTime;
    
    // 转换为统一格式
    const formattedItems = items.map((item) => ({
      id: `tb_${item.item_id}`,
      name: item.short_title || item.title,
      platform: item.user_type === 1 ? "天猫" : "淘宝",
      category: keyword,
      price_range: `¥${item.zk_final_price}${item.coupon_amount ? ` (券后)` : ""}`,
      colors: [],
      style: "",
      heat_score: Math.min(100, Math.floor(60 + Math.min(item.volume / 100, 40))), // 销量越高热度越高
      sales_volume: item.volume > 0 ? `${(item.volume / 10000).toFixed(1)}万+` : "",
      trend_type: item.volume > 10000 ? "全网爆款" : item.volume > 5000 ? "潜在爆款" : "爆款微调款",
      source_url: item.item_url,
      image_url: item.pict_url,
      keywords: [keyword, item.shop_title],
      description: `${item.shop_title} | ${item.provcity}${item.coupon_amount ? ` | 优惠${item.coupon_amount}元` : ""}`,
      // 扩展字段
      supplier_name: item.shop_title,
      original_price: item.reserve_price,
      commission_rate: item.commission_rate,
      coupon_amount: item.coupon_amount,
      item_id: item.item_id,
    }));
    
    return NextResponse.json({
      success: true,
      keyword,
      items: formattedItems,
      count: formattedItems.length,
      page,
      pageSize,
      duration_ms: duration,
      dataSource: "taobao_api",
    });
    
  } catch (error: any) {
    console.error("[Taobao] API错误:", error);
    return NextResponse.json({
      error: error.message || "淘宝API调用失败",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    }, { status: 500 });
  }
}

/** 健康检查 & 配置检查 */
export async function GET(request: NextRequest) {
  const configured = !!(APP_KEY && APP_SECRET);
  return NextResponse.json({
    service: "taobao-api",
    configured,
    appKeyMasked: APP_KEY ? `${APP_KEY.substring(0, 4)}...${APP_KEY.substring(APP_KEY.length - 4)}` : null,
    adzoneConfigured: !!ADZONE_ID,
    gateway: API_GATEWAY,
    help: configured ? null : "请在Vercel环境变量中设置 TAOBAO_APP_KEY 和 TAOBAO_APP_SECRET",
  });
}
