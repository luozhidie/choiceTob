import { NextRequest, NextResponse } from "next/server";

/**
 * 批量爬虫 API - 同时调用多个平台爬虫
 * 
 * 请求体：{
 *   platforms: ['taobao', '1688', 'douyin', 'xiaohongshu'],
 *   keyword: string,
 *   page?: number,
 *   options?: { minPrice?: number, maxPrice?: number, minOrder?: number }
 * }
 * 
 * 返回：{
 *   success: boolean,
 *   results: { platform: string, success: boolean, data: any[], count: number, error?: string }[],
 *   summary: { total: number, success: number, failed: number }
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platforms, keyword, page = 1, options = {} } = body;

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: '请提供要爬取的平台列表（platforms）' },
        { status: 400 }
      );
    }

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: '请提供搜索关键词（keyword）' },
        { status: 400 }
      );
    }

    // 并发调用各平台爬虫API（内部调用，不走HTTP）
    const results = await Promise.allSettled(
      platforms.map(async (platform) => {
        const startTime = Date.now();
        
        try {
          let apiUrl = '';
          let requestBody: any = { keyword, page };

          switch (platform) {
            case 'taobao':
              apiUrl = `${getBaseUrl(request)}/api/crawl/taobao`;
              requestBody = { keyword, page, ...options };
              break;
            case '1688':
              apiUrl = `${getBaseUrl(request)}/api/crawl/1688`;
              requestBody = { keyword, page, minOrder: options.minOrder };
              break;
            case 'douyin':
              // 抖音爬虫（如果已存在）
              apiUrl = `${getBaseUrl(request)}/api/crawl/douyin`;
              requestBody = { keyword, page };
              break;
            case 'xiaohongshu':
              // 小红书爬虫（如果已存在）
              apiUrl = `${getBaseUrl(request)}/api/crawl/xiaohongshu`;
              requestBody = { keyword, page };
              break;
            default:
              throw new Error(`不支持的平台: ${platform}`);
          }

          // 内部调用（避免循环HTTP请求，直接用fetch调用自身API）
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });

          const data = await response.json();
          const duration = Date.now() - startTime;

          return {
            platform,
            success: response.ok,
            status: response.status,
            data: data.data || [],
            count: data.count || 0,
            inserted: data.inserted || 0,
            duration,
            error: response.ok ? undefined : (data.error || `HTTP ${response.status}`),
            message: data.message,
          };

        } catch (err: any) {
          const duration = Date.now() - startTime;
          return {
            platform,
            success: false,
            status: 0,
            data: [],
            count: 0,
            inserted: 0,
            duration,
            error: err.message || '调用失败',
          };
        }
      })
    );

    // 整理结果
    const resolvedResults = results.map((r, idx) => {
      if (r.status === 'fulfilled') return r.value;
      return {
        platform: platforms[idx],
        success: false,
        status: 0,
        data: [],
        count: 0,
        inserted: 0,
        duration: 0,
        error: r.reason?.message || 'Promise rejected',
      };
    });

    const summary = {
      total: resolvedResults.length,
      success: resolvedResults.filter(r => r.success).length,
      failed: resolvedResults.filter(r => !r.success).length,
      totalItems: resolvedResults.reduce((sum, r) => sum + r.count, 0),
      totalInserted: resolvedResults.reduce((sum, r) => sum + r.inserted, 0),
    };

    return NextResponse.json({
      success: summary.failed === 0,
      results: resolvedResults,
      summary,
      keyword,
      platforms,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Batch crawl API error:', error);
    return NextResponse.json(
      { error: error.message || '批量爬虫失败' },
      { status: 500 }
    );
  }
}

// 获取基础URL（用于内部API调用）
function getBaseUrl(request: NextRequest): string {
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  return `${protocol}://${host}`;
}
