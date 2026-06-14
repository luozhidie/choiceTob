import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * 爆款预测API
 * POST /api/trend/predict
 * body: { keyword: string, category?: string, days?: number }
 *
 * 策略：
 * - 有淘宝API Key → 搜索淘宝商品，从数据中提取趋势
 * - 无淘宝API Key → 用 DeepSeek AI 生成趋势（主要模式）
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const APP_KEY = process.env.TAOBAO_APP_KEY || "";
const APP_SECRET = process.env.TAOBAO_APP_SECRET || "";
const ADZONE_ID = process.env.TAOBAO_ADZONE_ID || "";

function generateSign(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  let signStr = APP_SECRET;
  for (const key of sortedKeys) signStr += key + params[key];
  signStr += APP_SECRET;
  return crypto.createHash("md5").update(signStr, "utf8").digest("hex").toUpperCase();
}

function formatTaobaoTS(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

async function callTaobao(method: string, biz: Record<string, any>): Promise<any> {
  const ts = formatTaobaoTS(new Date());
  const sys: Record<string, string> = { method, app_key: APP_KEY, timestamp: ts, format: "json", v: "2.0", sign_method: "md5" };
  const all: Record<string, string> = { ...sys };
  for (const [k, v] of Object.entries(biz)) { if (v !== undefined && v !== null && v !== "") all[k] = typeof v === "string" ? v : String(v); }
  sys.sign = generateSign(all);
  const url = new URL("https://eco.taobao.com/router/rest");
  for (const [k, v] of Object.entries(sys)) url.searchParams.append(k, v);
  for (const [k, v] of Object.entries(biz)) { if (v !== undefined && v !== null && v !== "") url.searchParams.append(k, typeof v === "string" ? v : String(v)); }
  const r = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/** 用DeepSeek AI生成动态趋势数据 */
async function predictWithAI(keyword: string): Promise<any> {
  if (!DEEPSEEK_API_KEY) throw new Error("AI服务未配置，请联系管理员");

  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const season = month >= 3 && month <= 5 ? "春季" : month >= 6 && month <= 8 ? "夏季" : month >= 9 && month <= 11 ? "秋季" : "冬季";

  // 每次加入时间戳种子，确保不同结果
  const seed = Math.random().toString(36).slice(2, 8);

  const prompt = `你是时尚数据分析专家。当前时间：${now.toLocaleDateString("zh-CN")}，季节：${season}。
针对服装品类「${keyword}」，基于当前${season}时尚趋势和电商平台实时热销数据，输出分析结果。

要求：纯JSON格式（不要markdown代码块），字段如下：

{
  "colors": [
    {"name":"具体色名（如雾霾蓝、珊瑚橘、奶油白、焦糖棕）","score":85-100的热度分数,"direction":"up|stable|down"},
    ...共10个
  ],
  "fabrics": [
    {"name":"面料名（如天丝棉、醋酸缎面、重磅真丝）","score":80-98},
    ...共10个  
  ],
  "styles": [
    {"name":"款式风格（如法式收腰、美式复古、极简廓形）","score":75-95},
    ...共10个
  ],
  "cuts": [
    {"name":"剪裁设计特征（如不规则下摆、垫肩设计、镂空细节）","score":70-92},
    ...共10个
  ]
}

规则：
- 所有name必须是具体的时尚术语，不要泛泛的词
- score必须按降序排列
- direction根据${season}特性判断
- 加入随机种子${seed}使每次结果略有不同`;

  const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.7, // 增加随机性
    }),
  });
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "";

  // 解析JSON
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  try {
    return JSON.parse(jsonStr);
  } catch {
    console.error("[Predict] AI解析失败:", content.slice(0, 300));
    throw new Error("AI返回数据解析失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, category = "", days = 7 } = body;
    if (!keyword) return NextResponse.json({ error: "请提供搜索关键词" }, { status: 400 });

    // 策略选择：有淘宝key就用淘宝，否则用AI
    if (APP_KEY && APP_SECRET) {
      // 淘宝模式
      const items: any[] = [];
      for (let p = 1; p <= 3; p++) {
        try {
          const d = await callTaobao("taobao.tbk.dg.material.optional", {
            q: keyword, page_no: p, page_size: 20, sort: "total_sales_des",
            ...(ADZONE_ID ? { adzone_id: ADZONE_ID } : {}),
          });
          if (!d.error_response) items.push(...(d.tbk_dg_material_optional_response?.result_list?.map_data || []));
        } catch {}
      }
      if (items.length === 0) return NextResponse.json({ success: false, error: "未获取到商品数据" });

      // 从标题提取趋势
      const colorKw = ["黑色","白色","红色","蓝色","绿色","米色","灰色","棕色","粉色","紫色","橙色","卡其","藏青","酒红","墨绿","雾霾蓝","珊瑚粉","奶油白","杏色"];
      const fabricKw = ["棉","麻","丝","羊毛","羊绒","涤纶","牛仔","雪纺","针织","毛呢","灯芯绒","绸缎","真丝","缎面","天丝","醋酸","皮革"];
      const styleKw = ["修身","宽松","韩版","欧美","复古","街头","休闲","运动","甜美","优雅","法式","学院","波西米亚","极简","轻奢","oversize"];
      const patternKw = ["条纹","格子","碎花","波点","印花","刺绣","拼接","蕾丝","荷叶边","镂空","不对称","露背"];

      const cMap: Record<string, number> = {}, fMap: Record<string, number> = {}, sMap: Record<string, number> = {}, pMap: Record<string, number> = {};
      for (const item of items) {
        const t = (item.title || "").toLowerCase();
        colorKw.forEach(k => { if (t.includes(k.toLowerCase())) cMap[k] = (cMap[k] || 0) + parseInt(item.volume||0) + 5; });
        fabricKw.forEach(k => { if (t.includes(k.toLowerCase())) fMap[k] = (fMap[k] || 0) + parseInt(item.volume||0) + 3; });
        styleKw.forEach(k => { if (t.includes(k.toLowerCase())) sMap[k] = (sMap[k] || 0) + parseInt(item.volume||0) + 4; });
        patternKw.forEach(k => { if (t.includes(k.toLowerCase())) pMap[k] = (pMap[k] || 0) + parseInt(item.volume||0) + 2; });
      }
      const sort = (m: Record<string, number>) => Object.entries(m).sort((a,b) => b[1]-a[1]).slice(0,10).map(([n,s]) => ({ name:n, score: Math.min(100, Math.round(s/3)), direction:"up" as const }));

      return NextResponse.json({ success: true, data: { color: sort(cMap), fabric: sort(fMap), style: sort(sMap), cut: sort(pMap) } });
    }

    // AI模式（默认）
    const aiResult = await predictWithAI(keyword);

    // 确保每个数组都有direction字段
    const fixDir = (arr: any[]) => arr.map((item: any) => ({
      name: item.name,
      score: Math.min(100, Math.max(1, Number(item.score) || 50)),
      direction: item.direction || ["up", "stable", "down"][Math.floor(Math.random() * 3)],
    }));

    return NextResponse.json({
      success: true,
      data: {
        color: fixDir(aiResult.colors || []),
        fabric: fixDir(aiResult.fabrics || []),
        style: fixDir(aiResult.styles || []),
        cut: fixDir(aiResult.cuts || []),
      },
      source: "ai",
    });

  } catch (error: any) {
    console.error("[Trend Predict]", error.message);
    return NextResponse.json({ error: error.message || "预测失败，请稍后重试" }, { status: 500 });
  }
}
