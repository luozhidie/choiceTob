import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * 爆款合集 + 搭配生成API
 * POST /api/trend/generate-collection
 * body: { keyword: string }
 *
 * 默认用 DeepSeek AI 生成真实爆款推荐 + 搭配方案
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const APP_KEY = process.env.TAOBAO_APP_KEY || "";
const APP_SECRET = process.env.TAOBAO_APP_SECRET || "";

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

async function aiCollection(keyword: string): Promise<any> {
  if (!DEEPSEEK_API_KEY) throw new Error("AI未配置");
  const now = new Date();
  const season = now.getMonth() >= 5 && now.getMonth() <= 8 ? "夏季" : now.getMonth() >= 9 && now.getMonth() <= 11 ? "秋季" : "春季";
  const seed = Math.random().toString(36).slice(2, 6);

  const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: `你是资深时尚买手。当前${season}，针对「${keyword}」推荐8款当季爆款商品。
返回纯JSON（不要markdown）：
{
  "hotItems":[
    {"title":"具体商品标题（含品牌/面料/款式关键词，如'法式收腰V领碎花连衣裙 天丝棉'）","price":"价格数字如199","pic_url":"","match_tip":"一句话搭配建议"},
    ...共8个
  ],
  "outfitPlan":"3套搭配方案，每套：上装+下装+鞋履+配饰+理由"
}
种子:${seed}` }],
      max_tokens: 1500,
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
    const { keyword } = await request.json();
    if (!keyword) return NextResponse.json({ error: "请提供关键词" }, { status: 400 });

    // 有淘宝key → 搜索淘宝
    if (APP_KEY && APP_SECRET) {
      const items: any[] = [];
      for (let p = 1; p <= 2; p++) {
        try {
          const d = await callTB("taobao.tbk.dg.material.optional", { q: keyword, page_no: p, page_size: 20, sort: "total_sales_des" });
          if (!d.error_response) items.push(...(d.tbk_dg_material_optional_response?.result_list?.map_data || []));
        } catch {}
      }
      if (items.length === 0) return NextResponse.json({ error: "未找到相关商品" });

      const hotItems = items.slice(0, 20).map((i: any) => ({
        id: i.item_id, title: i.title, price: i.zk_final_price, volume: parseInt(i.volume||0),
        pic: i.pict_url, url: i.item_url, shop: i.shop_title,
      }));

      // AI搭配
      let outfit = null;
      try {
        const names = hotItems.slice(0, 5).map(i => i.title).join("、");
        const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DEEPSEEK_API_KEY}` },
          body: JSON.stringify({ model: "deepseek-chat", messages: [{
            role: "user", content: `基于这些「${keyword}」爆款商品：${names}\n设计3套专业搭配（每套：上装+下装+鞋+配饰+理由），简洁中文`
          }], max_tokens: 800 }),
        });
        outfit = (await r.json()).choices?.[0]?.message?.content || null;
      } catch {}

      return NextResponse.json({ success: true, products: hotItems, outfitPlan: outfit, source: "taobao" });
    }

    // AI模式
    const ai = await aiCollection(keyword);
    const products = (ai.hotItems || []).map((item: any, idx: number) => ({
      id: `ai-${Date.now()}-${idx}`,
      title: item.title || `${keyword}爆款推荐${idx+1}`,
      price: item.price || "0",
      image: item.pic_url || "",
      matchSuggestion: item.match_tip || "",
    }));

    return NextResponse.json({
      success: true,
      products,
      outfitPlan: ai.outfitPlan || null,
      source: "ai",
    });

  } catch (e: any) {
    console.error("[Generate Collection]", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
