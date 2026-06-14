import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * 爆款预测API
 * POST /api/trend/predict
 * body: { keyword: string, category?: string, days?: number }
 * 
 * 返回：预测爆款的颜色/面料/款式/图案趋势
 */

const API_GATEWAY = "https://eco.taobao.com/router/rest";
const APP_KEY = process.env.TAOBAO_APP_KEY || "";
const APP_SECRET = process.env.TAOBAO_APP_SECRET || "";
const ADZONE_ID = process.env.TAOBAO_ADZONE_ID || "";

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
    method,
    app_key: APP_KEY,
    timestamp,
    format: "json",
    v: "2.0",
    sign_method: "md5",
  };
  const allParams: Record<string, string> = { ...sysParams };
  for (const [k, v] of Object.entries(bizParams)) {
    if (v !== undefined && v !== null && v !== "") {
      allParams[k] = typeof v === "string" ? v : String(v);
    }
  }
  sysParams.sign = generateSign(allParams);
  const url = new URL(API_GATEWAY);
  for (const [k, v] of Object.entries(sysParams)) {
    url.searchParams.append(k, v);
  }
  for (const [k, v] of Object.entries(bizParams)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.append(k, typeof v === "string" ? v : String(v));
    }
  }
  const resp = await fetch(url.toString(), { method: "GET", signal: AbortSignal.timeout(10000) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

/** 从商品标题中提取颜色关键词 */
function extractColors(title: string): string[] {
  const colorKeywords = [
    "黑色", "白色", "红色", "蓝色", "绿色", "黄色", "紫色", "粉色", "灰色", "棕色", "米色",
    "橙色", "青色", "金色", "银色", "卡其色", "藏青色", "酒红色", "墨绿色", "雾霾蓝", "珊瑚粉",
    "black", "white", "red", "blue", "green", "yellow", "purple", "pink", "gray", "brown",
  ];
  return colorKeywords.filter(c => title.toLowerCase().includes(c.toLowerCase()));
}

/** 从商品标题中提取面料关键词 */
function extractFabrics(title: string): string[] {
  const fabricKeywords = [
    "棉", "麻", "丝", "羊毛", "羊绒", "涤纶", "尼龙", "皮革", "牛仔", "灯芯绒",
    "绸缎", "雪纺", "针织", "毛呢", "法兰绒", "牛仔布", "pu", "pvc",
  ];
  return fabricKeywords.filter(f => title.toLowerCase().includes(f.toLowerCase()));
}

/** 从商品标题中提取款式关键词 */
function extractStyles(title: string): string[] {
  const styleKeywords = [
    "修身", "宽松", "oversize", "韩版", "欧美", "复古", "街头", "商务", "休闲", "运动",
    "甜美", "性感", "优雅", "朋克", "学院", "宫廷", "波西米亚", "极简", "轻奢",
  ];
  return styleKeywords.filter(s => title.toLowerCase().includes(s.toLowerCase()));
}

/** 从商品标题中提取图案关键词 */
function extractPatterns(title: string): string[] {
  const patternKeywords = [
    "条纹", "格子", "碎花", "波点", "印花", "刺绣", "拼接", "渐变", "迷彩", "动物纹",
    "字母", "logo", "卡通", "几何", "抽象", "民族风", "荷叶边", "蕾丝",
  ];
  return patternKeywords.filter(p => title.toLowerCase().includes(p.toLowerCase()));
}

/** 计算趋势分数 */
function calculateTrendScore(items: any[]): {
  colors: { name: string; score: number; count: number }[];
  fabrics: { name: string; score: number; count: number }[];
  styles: { name: string; score: number; count: number }[];
  patterns: { name: string; score: number; count: number }[];
} {
  const colorMap: Record<string, { count: number; totalSales: number }> = {};
  const fabricMap: Record<string, { count: number; totalSales: number }> = {};
  const styleMap: Record<string, { count: number; totalSales: number }> = {};
  const patternMap: Record<string, { count: number; totalSales: number }> = {};

  for (const item of items) {
    const title = item.title || "";
    const sales = parseInt(item.volume || "0");

    extractColors(title).forEach(c => {
      if (!colorMap[c]) colorMap[c] = { count: 0, totalSales: 0 };
      colorMap[c].count++;
      colorMap[c].totalSales += sales;
    });

    extractFabrics(title).forEach(f => {
      if (!fabricMap[f]) fabricMap[f] = { count: 0, totalSales: 0 };
      fabricMap[f].count++;
      fabricMap[f].totalSales += sales;
    });

    extractStyles(title).forEach(s => {
      if (!styleMap[s]) styleMap[s] = { count: 0, totalSales: 0 };
      styleMap[s].count++;
      styleMap[s].totalSales += sales;
    });

    extractPatterns(title).forEach(p => {
      if (!patternMap[p]) patternMap[p] = { count: 0, totalSales: 0 };
      patternMap[p].count++;
      patternMap[p].totalSales += sales;
    });
  }

  const toSortedList = (map: Record<string, { count: number; totalSales: number }>) =>
    Object.entries(map)
      .map(([name, { count, totalSales }]) => ({
        name,
        count,
        score: Math.min(100, Math.floor((count * 10) + (totalSales / 1000))),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

  return {
    colors: toSortedList(colorMap),
    fabrics: toSortedList(fabricMap),
    styles: toSortedList(styleMap),
    patterns: toSortedList(patternMap),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, category = "", days = 7 } = body;

    if (!keyword) {
      return NextResponse.json({ error: "请提供搜索关键词" }, { status: 400 });
    }

    if (!APP_KEY || !APP_SECRET) {
      return NextResponse.json({
        error: "淘宝API未配置",
        help: "请设置 TAOBAO_APP_KEY 和 TAOBAO_APP_SECRET",
      }, { status: 401 });
    }

    // 搜索淘宝商品（取前3页，每页20条，共60条样本）
    const allItems: any[] = [];
    for (let page = 1; page <= 3; page++) {
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
        console.warn(`[Trend Predict] 第${page}页获取失败:`, e.message);
      }
    }

    if (allItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: "未获取到商品数据，无法预测",
      }, { status: 404 });
    }

    // 计算趋势
    const trend = calculateTrendScore(allItems);

    // 生成预测结论
    const prediction = {
      keyword,
      category,
      days,
      sampleSize: allItems.length,
      predictedAt: new Date().toISOString(),
      trend,
      summary: {
        topColor: trend.colors[0]?.name || "未知",
        topFabric: trend.fabrics[0]?.name || "未知",
        topStyle: trend.styles[0]?.name || "未知",
        topPattern: trend.patterns[0]?.name || "未知",
      },
    };

    return NextResponse.json({
      success: true,
      prediction,
    });

  } catch (error: any) {
    console.error("[Trend Predict] 错误:", error);
    return NextResponse.json({
      error: error.message || "预测失败",
    }, { status: 500 });
  }
}
