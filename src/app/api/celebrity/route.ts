import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * 明星同款搜索API
 * POST /api/celebrity
 * body: { celebrity: string }
 *
 * 默认用 DeepSeek AI 生成明星同款推荐（含真实商品链接建议）
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const APP_KEY = process.env.TAOBAO_APP_KEY || "";
const APP_SECRET = process.env.TAOBAO_APP_SECRET || "";

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

function genSign(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  let s = APP_SECRET;
  for (const k of sortedKeys) s += k + params[k];
  s += APP_SECRET;
  return crypto.createHash("md5").update(s).utf8().digest("hex").toUpperCase();
}

function fmtTS(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

async function callTB(method: string, biz: any): Promise<any> {
  const ts = fmtTS(new Date());
  const sys: Record<string, string> = { method, app_key: APP_KEY, timestamp: ts, format: "json", v: "2.0", sign_method: "md5" };
  const all = { ...sys };
  for (const [k, v] of Object.entries(biz)) if (v) all[k] = typeof v === "string" ? v : String(v);
  sys.sign = genSign(all);
  const u = new URL("https://eco.taobao.com/router/rest");
  for (const [k, v] of Object.entries(sys)) u.searchParams.append(k, v);
  for (const [k, v] of Object.entries(biz)) if (v) u.searchParams.append(k, typeof v === "string" ? v : String(v));
  const r = await fetch(u.toString(), { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`HTTP${r.status}`);
  return r.json();
}

async function aiCelebrity(celebrity: string): Promise<any> {
  if (!DEEPSEEK_API_KEY) throw new Error("AI未配置");

  const now = new Date();
  const seed = Math.random().toString(36).slice(2, 6);

  const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: `你是时尚买手助手。为明星「${celebrity}」推荐8个代表性同款单品。
返回纯JSON（不要markdown）：
[
  {"title":"具体商品标题（如'杨幂同款 法式收腰碎花茶歇裙'）","price":"预估价格数字如299","pic_url":"","shop_name":"品牌或店铺名","style_tag":"风格标签","match_tip":"一句话搭配建议"},
  ...共8个
]
要求：title要具体可搜索，包含明星名+品类+风格关键词。种子:${seed}` }],
      max_tokens: 1200,
      temperature: 0.75,
    }),
  });
  const d = await resp.json();
  let c = (d.choices?.[0]?.message?.content || "").trim();
  if (c.startsWith("```")) c = c.replace(/^```\w*\s*\n?/, "").replace(/\n?```\s*$/, "");
  return JSON.parse(c);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { celebrity } = body;

    if (!celebrity) return NextResponse.json({ error: "请提供明星名称" }, { status: 400 });

    // 有淘宝key → 搜索淘宝
    if (APP_KEY && APP_SECRET) {
      const q = `${celebrity}同款`;
      const data = await callTB("taobao.tbk.dg.material.optional", { q, page_no: 1, page_size: 20, sort: "total_sales_des" });
      if (data.error_response) return NextResponse.json({ error: `搜索失败：${data.error_response.sub_msg || data.error_response.msg}` });

      const items = (data.tbk_dg_material_optional_response?.result_list?.map_data || []).map((i: any) => ({
        id: i.item_id,
        title: i.title,
        price: i.zk_final_price,
        volume: parseInt(i.volume || "0"),
        pic: i.pict_url,
        url: i.item_url,
        shop: i.shop_title,
        coupon: i.coupon_amount || 0,
      }));

      return NextResponse.json({
        success: true,
        celebrity,
        items,
        count: items.length,
        suggestedKeywords: CELEBRITIES[celebrity] || [`${celebrity}同款`],
        celebrityList: Object.keys(CELEBRITIES),
        source: "taobao",
      });
    }

    // AI模式
    const aiItems = await aiCelebrity(celebrity);

    const items = (aiItems || []).map((item: any, idx: number) => ({
      id: `ai-${Date.now()}-${idx}`,
      title: item.title || `${celebrity}同款推荐${idx+1}`,
      price: item.price || "0",
      volume: 0,
      pic: item.pic_url || "",
      url: "",
      shop: item.shop_name || "AI推荐",
      coupon: 0,
      matchTip: item.match_tip || "",
      styleTag: item.style_tag || "",
    }));

    return NextResponse.json({
      success: true,
      celebrity,
      items,
      count: items.length,
      suggestedKeywords: CELEBRITIES[celebrity] || [`${celebrity}同款`],
      celebrityList: Object.keys(CELEBRITIES),
      source: "ai",
    });

  } catch (e: any) {
    console.error("[Celebrity]", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const list = Object.keys(CELEBRITIES).map(name => ({ name, keywords: CELEBRITIES[name] }));
  return NextResponse.json({ celebrities: list });
}
