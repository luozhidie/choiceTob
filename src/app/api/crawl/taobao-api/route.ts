import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import crypto from "crypto";

/**
 * 淘宝联盟官方API - 商品搜索
 * 
 * 环境变量：
 *   TAOBAO_APP_KEY     - 淘宝联盟AppKey
 *   TAOBAO_APP_SECRET  - 淘宝联盟AppSecret
 *   TAOBAO_ADZONE_ID   - 推广位ID（可选，没有则提示创建）
 * 
 * 使用方式：
 *   POST /api/crawl/taobao-api
 *   body: { keyword: string, pageNo?: number, pageSize?: number }
 */

const APP_KEY = process.env.TAOBAO_APP_KEY || "";
const APP_SECRET = process.env.TAOBAO_APP_SECRET || "";
const ADZONE_ID = process.env.TAOBAO_ADZONE_ID || "";

// 淘宝TOP API 签名（MD5）
function sign(params: Record<string, string>, appSecret: string): string {
  const sortedKeys = Object.keys(params).sort();
  let signStr = appSecret;
  for (const key of sortedKeys) {
    signStr += key + params[key];
  }
  signStr += appSecret;
  return crypto.createHash("md5").update(signStr).digest("hex").toUpperCase();
}

// 调用淘宝TOP API
async function callTaobaoAPI(apiName: string, params: Record<string, string>) {
  const commonParams: Record<string, string> = {
    method: apiName,
    app_key: APP_KEY,
    timestamp: new Date().toISOString().replace(/T/, " ").replace(/\..+/, ""),
    format: "json",
    v: "2.0",
    sign_method: "md5",
  };

  const allParams = { ...commonParams, ...params };
  const signValue = sign(allParams, APP_SECRET);

  const url = "https://eco.taobao.com/router/rest";
  const query = new URLSearchParams({ ...allParams, sign: signValue });

  const resp = await axios.get(url, {
    params: Object.fromEntries(query),
    timeout: 15000,
  });

  return resp.data;
}

interface TaobaoItem {
  title: string;
  price: string;
  picUrl: string;
  sales: string;
  shopName: string;
  itemUrl: string;
  category: string;
}

/** 搜索淘宝商品（淘宝联盟物料搜索API） */
async function searchTaobaoItems(keyword: string, pageNo = 1, pageSize = 20, existingIds?: string[]): Promise<{ items: TaobaoItem[]; total: number; error?: string }> {
  if (!APP_KEY || !APP_SECRET) {
    return { items: [], total: 0, error: "淘宝API未配置，请先设置 TAOBAO_APP_KEY 和 TAOBAO_APP_SECRET" };
  }

  try {
    const params: Record<string, string> = {
      q: keyword,
      page_no: String(pageNo),
      page_size: String(Math.min(pageSize, 100)),
      has_coupon: "false",
      sort: "total_sales_des", // 按销量降序
    };

    // 如果有推广位ID，加上
    if (ADZONE_ID) {
      params.adzone_id = ADZONE_ID;
    }

    const data = await callTaobaoAPI("taobao.tbk.dg.material.optional", params);

    // 检查错误
    if (data.error_response) {
      const err = data.error_response;
      return {
        items: [],
        total: 0,
        error: `[${err.sub_code || err.code}] ${err.sub_msg || err.msg}`,
      };
    }

    const result = data.tbk_dg_material_optional_response?.result_list?.map_data ||
                   data.tbk_dg_material_optional_response?.result_list || [];

    // 去重：过滤掉已存在的商品ID
    const existingSet = new Set(existingIds || []);
    const filtered = result.filter((item: any) => !existingSet.has(String(item.num_iid || item.item_id)));

    const items: TaobaoItem[] = filtered.map((item: any) => ({
      title: item.title || "",
      price: item.zk_final_price || item.reserve_price || "",
      picUrl: item.pict_url || "",
      sales: item.volume || "0",
      shopName: item.shop_title || item.nick || "",
      itemUrl: item.item_url || `https://item.taobao.com/item.htm?id=${item.num_iid || item.item_id}`,
      category: item.category || "",
    }));

    return { items, total: items.length };
  } catch (error: any) {
    console.error("[淘宝API] 调用失败:", error.message);
    return { items: [], total: 0, error: error.message };
  }
}

// ============ 主接口 ============

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, pageNo = 1, pageSize = 20, existing_ids } = body;

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "请提供搜索关键词" }, { status: 400 });
    }

    if (!APP_KEY || !APP_SECRET) {
      return NextResponse.json({
        error: "淘宝API未配置",
        help: "请设置环境变量 TAOBAO_APP_KEY 和 TAOBAO_APP_SECRET",
      }, { status: 401 });
    }

    const startTime = Date.now();
    const { items, total, error } = await searchTaobaoItems(keyword, pageNo, pageSize, existing_ids);
    const duration = Date.now() - startTime;

    if (error) {
      return NextResponse.json({
        success: false,
        keyword,
        error,
        help: error.includes("adzone_id") || error.includes("推广位")
          ? "缺少推广位ID，请在淘宝联盟后台创建推广位，并设置环境变量 TAOBAO_ADZONE_ID"
          : null,
      }, { status: 500 });
    }

    // 转换为统一格式
    const formattedItems = items.map((item, i) => ({
      id: `tb_api_${Date.now()}_${i}`,
      name: item.title,
      platform: "淘宝",
      category: keyword,
      price_range: `¥${item.price}`,
      colors: [],
      style: item.category || "",
      heat_score: Math.min(100, Math.floor(60 + Math.min(parseInt(item.sales) / 100, 40))),
      sales_volume: parseInt(item.sales) > 0 ? `${(parseInt(item.sales) / 10000).toFixed(1)}万+` : "",
      trend_type: parseInt(item.sales) > 10000 ? "全网爆款" : parseInt(item.sales) > 5000 ? "潜在爆款" : "爆款微调款",
      source_url: item.itemUrl,
      image_url: item.picUrl,
      keywords: [keyword, item.shopName],
      description: `${item.shopName} | 销量:${item.sales}`,
    }));

    return NextResponse.json({
      success: true,
      keyword,
      items: formattedItems,
      count: formattedItems.length,
      total,
      duration_ms: duration,
      dataSource: "taobao_official_api",
      apiUsed: "taobao.tbk.dg.material.optional",
    });

  } catch (error: any) {
    console.error("[淘宝API] 错误:", error);
    return NextResponse.json({
      error: error.message || "淘宝API调用失败",
    }, { status: 500 });
  }
}

/** 健康检查 */
export async function GET(request: NextRequest) {
  const configured = !!(APP_KEY && APP_SECRET);
  return NextResponse.json({
    service: "taobao-official-api",
    configured,
    appKeyConfigured: !!APP_KEY,
    appSecretConfigured: !!APP_SECRET,
    adzoneIdConfigured: !!ADZONE_ID,
    help: configured
      ? ADZONE_ID
        ? "API已配置，可直接使用"
        : "API已配置，但缺少推广位ID（TAOBAO_ADZONE_ID），部分API可能受限"
      : "请设置环境变量 TAOBAO_APP_KEY 和 TAOBAO_APP_SECRET",
  });
}
