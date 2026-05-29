import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 1688批发爬虫 API（骨架版本）
 *
 * ⚠️ 骨架说明：
 * 1688反爬极强，实际爬虫需要：
 * 1. 企业级代理池（建议阿布云/快代理）
 * 2. 登录态Cookie池（需定期刷新）
 * 3. 验证码识别服务（2captcha/超级鹰）
 * 本代码为完整骨架，数据结构、频率控制、DB写入均完整
 *
 * 请求体：{ keyword: string, page?: number, minOrder?: number }
 * 返回：{ success: boolean, data: any[], count: number }
 */

// 频率控制
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 50; // 1688限制更严，每IP每天50次
const RATE_WINDOW = 24 * 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

// 模拟1688批发商品数据（骨架版本）
function mock1688Products(keyword: string, page: number, minOrder?: number): any[] {
  const mockProducts = [];
  const baseId = (page - 1) * 20;
  const factories = [
    { name: '广州白马服装批发市场', location: '广东广州' },
    { name: '杭州四季青服装市场', location: '浙江杭州' },
    { name: '东莞虎门富民时装城', location: '广东东莞' },
    { name: '常熟服装城', location: '江苏常熟' },
    { name: '即墨服装市场', location: '山东青岛' },
  ];

  for (let i = 0; i < 20; i++) {
    const id = baseId + i + 1;
    const factory = factories[id % factories.length];
    const wholesalePrice = Math.round((15 + Math.random() * 80) * 100) / 100;
    const minOrderQty = [50, 100, 200, 500][id % 4];
    const samplePrice = Math.round(wholesalePrice * 1.5 * 100) / 100;

    // 过滤起订量
    if (minOrder && minOrderQty < minOrder) continue;

    mockProducts.push({
      source_id: `AL${String(id).padStart(10, '0')}`,
      title: `${keyword} ${['厂家直销', '现货批发', '支持拿样', '可定制'][id % 4]} ${factory.location}货源`,
      wholesale_price: wholesalePrice, // 批发价
      sample_price: samplePrice, // 样品价
      min_order_qty: minOrderQty, // 起订量
      stock_qty: Math.floor(Math.random() * 5000) + 100, // 库存
      image_urls: [
        `https://cbu01.alicdn.com/img/ibank/${id}_1.jpg`,
      ],
      factory_name: factory.name,
      factory_location: factory.location,
      factory_id: `FAC${String(id % 100).padStart(6, '0')}`,
      detail_url: `https://detail.1688.com/offer/${id}.html`,
      seller_type: ['厂家', '档口', '代理商'][id % 3],
      is_gold: id % 3 === 0, // 是否金牌供应商
      response_rate: Math.round(85 + Math.random() * 15), // 响应率
    });
  }
  return mockProducts;
}

// 将1688数据转换为bao_kuan_cases表结构
function transform1688ToBaoKuanCase(product: any, keyword: string): any {
  return {
    source_platform: '1688',
    source_url: product.detail_url,
    source_id: product.source_id,
    title: product.title,
    price: product.wholesale_price, // 批发价作为price
    sales_volume: null, // 1688不公开销量
    image_urls: product.image_urls,
    attr_fabric: null,
    attr_cut: null,
    attr_pattern: null,
    attr_season_color: null,
    attr_rule: null,
    ai_report_text: null,
    ai_report_table: null,
    ai_suggestion: JSON.stringify({
      wholesale_price: product.wholesale_price,
      sample_price: product.sample_price,
      min_order_qty: product.min_order_qty,
      factory_name: product.factory_name,
      factory_location: product.factory_location,
      is_gold: product.is_gold,
    }),
    heat_score: null,
    competition_level: null,
    crawled_at: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    // 频率控制
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: '频率超限，每IP每天限50次（1688反爬限制）', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }

    const { keyword, page = 1, minOrder } = await request.json();

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: '请提供搜索关键词' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ⚠️ 骨架：实际应发HTTP请求到1688搜索页
    // 真实实现方案：
    // 1. 使用Puppeteer/Playwright模拟浏览器（需代理）
    // 2. 或使用1688开放平台API（需企业认证）
    // 3. 或使用第三方数据服务（如：搜款网、货捕头）
    const products = mock1688Products(keyword, page, minOrder);

    // 写入bao_kuan_cases表
    const casesToInsert = products.map(p => transform1688ToBaoKuanCase(p, keyword));
    const { data: insertedCases, error: insertError } = await supabase
      .from('bao_kuan_cases')
      .upsert(casesToInsert, { onConflict: 'source_platform,source_id' })
      .select('id, case_id, title');

    if (insertError) {
      console.error('Insert bao_kuan_cases (1688) error:', insertError);
    }

    // 记录爬虫日志
    await supabase.from('crawl_log').insert({
      platform: '1688',
      crawl_type: 'wholesale_search',
      keyword,
      status: 'success',
      items_count: products.length,
      error_message: null,
    }).then(({ error }) => {
      if (error) console.error('Insert crawl_log (1688) error:', error);
    });

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      inserted: insertedCases?.length || 0,
      message: '骨架版本：使用模拟数据，实际运行需接入真实1688爬虫',
      warning: '⚠️ 1688反爬极强，建议使用：1)1688开放平台API 2)搜款网/货捕头等第三方数据服务 3)企业级爬虫服务',
    });

  } catch (error: any) {
    console.error('1688 crawl API error:', error);

    try {
      const supabase = await createClient();
      await supabase.from('crawl_log').insert({
        platform: '1688',
        crawl_type: 'wholesale_search',
        keyword: '',
        status: 'failed',
        items_count: 0,
        error_message: error.message,
      });
    } catch (logErr) { /* ignore */ }

    return NextResponse.json(
      { error: error.message || '1688爬虫失败' },
      { status: 500 }
    );
  }
}

// GET方法：查询已爬取的1688商品
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = 20;

    const supabase = await createClient();

    let query = supabase
      .from('bao_kuan_cases')
      .select('*', { count: 'exact' })
      .eq('source_platform', '1688');

    if (keyword) {
      query = query.ilike('title', `%${keyword}%`);
    }

    query = query
      .order('crawled_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      pageSize,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '查询失败' },
      { status: 500 }
    );
  }
}
