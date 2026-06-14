import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * 明星同款搜索API - 纯后端处理
 * POST /api/celebrity
 * body: { keyword: string } 或 { celebrity: string }
 * 
 * 默认用 DeepSeek AI 生成明星同款推荐
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const APP_KEY = process.env.TAOBAO_APP_KEY || "";
const APP_SECRET = process.env.TAOBAO_APP_SECRET || "";
const ADZONE_ID = process.env.TAOBAO_ADZONE_ID || "";

const CELEBRITIES: Record<string, string[]> = {
  "杨幂": ["杨幂同款连衣裙", "杨幂穿搭外套", "杨幂同款半身裙"],
  "迪丽热巴": ["迪丽热巴同款", "热巴穿搭裙装"],
  "刘亦菲": ["刘亦菲同款风衣", "刘亦菲仙气裙"],
  "Angelababy": ["杨颖同款", "Angelababy穿搭"],
  "赵丽颖": ["赵丽颖同款", "赵丽颖连衣裙"],
  "唐嫣": ["唐嫣同款", "唐嫣法式穿搭"],
  "刘诗诗": ["刘诗诗同款", "刘诗诗新中式"],
  "倪妮": ["倪妮同款", "倪妮极简穿搭"],
  "宋茜": ["宋茜同款", "宋茜设计感单品"],
  "杨紫": ["杨紫同款", "杨紫甜酷风"],
};

function genSign(params: Record<string, string>, secret: string): string {
  const sortedKeys = Object.keys(params).sort();
  let s = secret;
  for (const k of sortedKeys) s += k + params[k];
  s += secret;
  return crypto.createHash("md5").update(s, "utf8").digest("hex").toUpperCase();
}

function fmtTS(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

async function callTB(method: string, biz: any): Promise<any> {
  const ts = fmtTS(new Date());
  const sys: Record<string, string> = { method, app_key: APP_KEY, timestamp: ts, format: "json", v: "2.0", sign_method: "md5" };
  const all: Record<string, string> = { ...sys };
  for (const [k, v] of Object.entries(biz)) {
    if (v !== undefined && v !== null && v !== "") all[k] = typeof v === "string" ? v : String(v);
  }
  sys.sign = genSign(all, APP_SECRET);
  const u = new URL("https://eco.taobao.com/router/rest");
  for (const [k, v] of Object.entries(sys)) u.searchParams.append(k, v);
  for (const [k, v] of Object.entries(biz)) {
    if (v !== undefined && v !== null && v !== "") u.searchParams.append(k, typeof v === "string" ? v : String(v));
  }
  const r = await fetch(u.toString(), { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`HTTP${r.status}`);
  return r.json();
}

function getDefaultCelebrityItems(celebrity: string) {
  const categories = ["连衣裙", "风衣外套", "半身裙", "针织衫", "西装外套", "阔腿裤", "衬衫", "卫衣"];
  return categories.map((cat, i) => ({
    title: `${celebrity}同款${cat} 时尚穿搭推荐`,
    price: String(Math.floor(Math.random() * 500 + 99)),
    pic_url: "",
    shop_name: "时尚买手推荐",
    style_tag: "热门",
    match_tip: `${celebrity}近期${cat}穿搭风格推荐`,
  }));
}

async function aiCelebrity(celebrity: string): Promise<any[]> {
  if (!DEEPSEEK_API_KEY) throw new Error("AI服务未配置");

  const now = new Date();
  const seed = Math.random().toString(36).slice(2, 6);

  const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{
        role: "user",
        content: `你是时尚买手助手。为明星「${celebrity}」推荐8个代表性同款单品。
当前时间：${now.toLocaleDateString("zh-CN")}。
返回纯JSON数组（不要markdown代码块，不要任何额外文字）：
[
  {"title":"具体商品标题","price":"299","pic_url":"","shop_name":"品牌或店铺名","style_tag":"风格标签","match_tip":"搭配建议"},
  ...共8个
]
要求：title要具体可搜索，包含明星名+品类+风格关键词。种子:${seed}`
      }],
      max_tokens: 1500,
      temperature: 0.75,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`AI请求失败(${resp.status}): ${errText.slice(0, 100)}`);
  }

  const d = await resp.json();
  let c = (d.choices?.[0]?.message?.content || "").trim();
  if (c.startsWith("```")) c = c.replace(/^```\w*\s*\n?/, "").replace(/\n?```\s*$/, "");

  try {
    return JSON.parse(c);
  } catch (e) {
    console.error("[Celebrity AI] 解析失败:", c.slice(0, 200));
    return getDefaultCelebrityItems(celebrity);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const keyword = body.keyword || body.celebrity || "";

    if (!keyword) {
      return NextResponse.json({ error: "请提供明星名称" }, { status: 400 });
    }

    console.log(`[Celebrity] 搜索: ${keyword}`);

    // 有淘宝key → 搜索淘宝
    if (APP_KEY && APP_SECRET && ADZONE_ID) {
      try {
        const q = `${keyword}同款`;
        const data = await callTB("taobao.tbk.dg.material.optional", {
          q, page_no: 1, page_size: 20, sort: "total_sales_des", adzone_id: ADZONE_ID,
        });
        if (!data.error_response) {
          const items = (data.tbk_dg_material_optional_response?.result_list?.map_data || []).map((i: any) => ({
            id: i.item_id,
            title: i.title,
            price_range: i.zk_final_price ? `¥${i.zk_final_price}` : "",
            image_url: i.pict_url || "",
            sales_volume: parseInt(i.volume || "0"),
            name: i.title,
            zk_final_price: parseFloat(i.zk_final_price || "0") * 100,
            shop_name: i.shop_title || "",
          }));
          if (items.length > 0) {
            return NextResponse.json({ success: true, celebrity: keyword, items, count: items.length, source: "taobao" });
          }
        }
      } catch (e: any) {
        console.error("[Celebrity] 淘宝API失败，回退AI:", e.message);
      }
    }

    // AI模式（默认）
    let aiItems;
    try {
      aiItems = await aiCelebrity(keyword);
    } catch (aiErr: any) {
      console.error("[Celebrity] AI失败，用默认数据:", aiErr.message);
      aiItems = getDefaultCelebrityItems(keyword);
    }

    const items = (aiItems || []).map((item: any, idx: number) => ({
      id: `ai-${Date.now()}-${idx}`,
      title: item.title || `${keyword}同款推荐${idx + 1}`,
      price_range: item.price ? `¥${item.price}` : "",
      image_url: item.pic_url || "",
      sales_volume: Math.floor(Math.random() * 10000),
      name: item.title || "",
      zk_final_price: item.price ? (typeof item.price === "number" ? item.price * 100 : parseFloat(item.price) * 100) : 0,
      styleTag: item.style_tag || "",
      matchTip: item.match_tip || "",
      shop_name: item.shop_name || "AI推荐",
    }));

    return NextResponse.json({
      success: true,
      celebrity: keyword,
      items,
      count: items.length,
      source: "ai",
    });

  } catch (e: any) {
    console.error("[Celebrity] 未捕获错误:", e.message);
    return NextResponse.json({ error: e.message || "搜索失败" }, { status: 500 });
  }
}

export async function GET() {
  const list = Object.keys(CELEBRITIES).map(name => ({ name, keywords: CELEBRITIES[name] }));
  return NextResponse.json({ celebrities: list });
}
