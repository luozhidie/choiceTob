import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 淘宝商品爬虫 API（骨架版本）
 * 
 * ⚠️ 骨架说明：
 * 实际淘宝爬虫需要代理池 + Cookie池 + 验证码处理
 * 本代码为完整骨架，包含数据结构、频率控制、数据库写入
 * 实际HTTP请求部分已注释，运行前需接入真实爬虫服务
 * 
 * 请求体：{ keyword: string, page?: number, minPrice?: number, maxPrice?: number }
 * 返回：{ success: boolean, data: any[], count: number, message?: string }
 */

// 频率控制：内存计数器（生产环境应使用Redis）
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // 每IP每天100次
const RATE_WINDOW = 24 * 60 * 60 * 1000; // 24小时

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

// 模拟淘宝商品数据（骨架版本，实际应发HTTP请求到淘宝）
function mockTaobaoProducts(keyword: string, page: number): any[] {
  const mockProducts = [];
  const baseId = (page - 1) * 20;
  for (let i = 0; i < 20; i++) {
    const id = baseId + i + 1;
    mockProducts.push({
      source_id: `TB${String(id).padStart(10, '0')}`,
      title: `${keyword} 2026新款 女装 ${['连衣裙', '上衣', '外套', '裤子'][id % 4]} 时尚百搭`,
      price: Math.round((50 + Math.random() * 450) * 100) / 100,
      sales_volume: Math.floor(Math.random() * 10000),
      image_urls: [
        `https://img.alicdn.com/imgextra/i${id}/O1CN01mock${id}_1.jpg`,
      ],
      shop_name: `${['优衣库', 'ZARA', 'HM', 'ONLY', 'VERO MODA'][id % 5]}旗舰店`,
      shop_id: `SHOP${String(id % 100).padStart(6, '0')}`,
      detail_url: `https://item.taobao.com/item.htm?id=TB${String(id).padStart(10, '0')}`,
    });
  }
  return mockProducts;
}

// 将淘宝商品数据转换为bao_kuan_cases表结构
function transformToBaoKuanCase(product: any, keyword: string): any {
  return {
    source_platform: 'taobao',
    source_url: product.detail_url,
    source_id: product.source_id,
    title: product.title,
    price: product.price,
    sales_volume: product.sales_volume,
    image_urls: product.image_urls,
    attr_fabric: null, // 由AI后续识别
    attr_cut: null,
    attr_pattern: null,
    attr_season_color: null,
    attr_rule: null,
    ai_report_text: null,
    ai_report_table: null,
    ai_suggestion: null,
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
        { error: '频率超限，每IP每天限100次', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }

    const { keyword, page = 1, minPrice, maxPrice } = await request.json();

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: '请提供搜索关键词' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ⚠️ 骨架：实际应发HTTP请求到淘宝搜索页
    // 真实实现需要用 puppeteer/playwright 或代理池 + fetch
    // 这里使用模拟数据进行演示
    const products = mockTaobaoProducts(keyword, page);

    // 过滤价格区间
    const filtered = products.filter(p => {
      if (minPrice && p.price < minPrice) return false;
      if (maxPrice && p.price > maxPrice) return false;
      return true;
    });

    // 写入bao_kuan_cases表
    const casesToInsert = filtered.map(p => transformToBaoKuanCase(p, keyword));
    const { data: insertedCases, error: insertError } = await supabase
      .from('bao_kuan_cases')
      .upsert(casesToInsert, { onConflict: 'source_platform,source_id' })
      .select('id, case_id, title');

    if (insertError) {
      console.error('Insert bao_kuan_cases error:', insertError);
      // 继续执行，不影响返回
    }

    // 记录爬虫日志
    const { error: logError } = await supabase
      .from('crawl_log')
      .insert({
        platform: 'taobao',
        crawl_type: 'product_search',
        keyword,
        status: 'success',
        items_count: filtered.length,
        error_message: null,
      });

    if (logError) {
      console.error('Insert crawl_log error:', logError);
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      count: filtered.length,
      inserted: insertedCases?.length || 0,
      message: '骨架版本：使用模拟数据，实际运行需接入真实淘宝爬虫',
      note: '⚠️ 此为骨架代码，淘宝反爬强，建议使用淘宝开放平台API或第三方数据服务',
    });

  } catch (error: any) {
    console.error('Taobao crawl API error:', error);

    // 记录失败日志
    try {
      const supabase = await createClient();
      await supabase.from('crawl_log').insert({
        platform: 'taobao',
        crawl_type: 'product_search',
        keyword: '',
        status: 'failed',
        items_count: 0,
        error_message: error.message,
      });
    } catch (logErr) {
      // 忽略日志写入失败
    }

    return NextResponse.json(
      { error: error.message || '淘宝爬虫失败' },
      { status: 500 }
    );
  }
}

// GET方法：查询已爬取的淘宝商品（从数据库）
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
      .eq('source_platform', 'taobao');

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
