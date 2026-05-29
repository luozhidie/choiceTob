import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 爬虫日志查询 API
 * 
 * GET 参数：
 * - platform?: 'taobao'|'1688'|'douyin'|'xiaohongshu' 按平台筛选
 * - status?: 'success'|'failed'|'blocked' 按状态筛选
 * - startDate?: string 开始日期 (YYYY-MM-DD)
 * - endDate?: string 结束日期 (YYYY-MM-DD)
 * - keyword?: string 搜索关键词
 * - page?: number 页码（默认1）
 * - pageSize?: number 每页数量（默认20）
 * 
 * 返回：{ success, data, total, page, pageSize }
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const keyword = searchParams.get('keyword');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    if (page < 1) return NextResponse.json({ error: 'page必须大于0' }, { status: 400 });
    if (pageSize > 100) return NextResponse.json({ error: 'pageSize最大100' }, { status: 400 });

    const supabase = await createClient();

    let query = supabase
      .from('crawl_log')
      .select('*', { count: 'exact' });

    // 筛选条件
    if (platform) {
      query = query.eq('platform', platform);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59`);
    }
    if (keyword) {
      query = query.ilike('keyword', `%${keyword}%`);
    }

    // 排序 + 分页
    query = query
      .order('created_at', { ascending: false })
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
      filters: { platform, status, startDate, endDate, keyword },
    });

  } catch (error: any) {
    console.error('Crawl log GET error:', error);
    return NextResponse.json(
      { error: error.message || '查询失败' },
      { status: 500 }
    );
  }
}

/**
 * POST 创建爬虫日志（供内部调用）
 * 
 * 请求体：{
 *   platform: string,
 *   crawl_type: string,
 *   keyword?: string,
 *   status: 'success'|'failed'|'blocked',
 *   items_count: number,
 *   error_message?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, crawl_type, keyword, status, items_count, error_message } = body;

    if (!platform || !crawl_type || !status) {
      return NextResponse.json(
        { error: '缺少必填字段：platform, crawl_type, status' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('crawl_log')
      .insert({
        platform,
        crawl_type,
        keyword: keyword || null,
        status,
        items_count: items_count || 0,
        error_message: error_message || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Crawl log POST error:', error);
    return NextResponse.json(
      { error: error.message || '创建日志失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE 清理旧日志（保留最近N天）
 * 
 * 请求体：{ keepDays?: number } 默认保留30天
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const keepDays = body.keepDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);

    const supabase = await createClient();

    const { count, error } = await supabase
      .from('crawl_log')
      .delete({ count: 'exact' })
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deleted: count || 0,
      keepDays,
      cutoffDate: cutoffDate.toISOString(),
    });

  } catch (error: any) {
    console.error('Crawl log DELETE error:', error);
    return NextResponse.json(
      { error: error.message || '清理日志失败' },
      { status: 500 }
    );
  }
}
