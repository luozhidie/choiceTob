// app/api/promotions/route.ts
// 带降级容错 - 数据库表不存在时返回示例数据
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_DATA = [
  { id: 'fb-1', title: '618大促', description: '全场2.8折起', promo_type: 'seasonal', discount_rate: 0.28, start_date: '2026-06-01', end_date: '2026-06-20', status: 'active', banner_image_url: null, link_url: '/promotion/618' },
  { id: 'fb-2', title: '新品特惠', description: '首单立减50元', promo_type: 'new_user', discount_rate: 0.30, start_date: '2026-06-10', end_date: '2026-06-30', status: 'active', banner_image_url: null, link_url: '/promotion/new' },
  { id: 'fb-3', title: '爆款返场', description: '昨日热销TOP10', promo_type: 'flash_sale', discount_rate: 0.25, start_date: '2026-06-12', end_date: '2026-06-15', status: 'active', banner_image_url: null, link_url: '/promotion/hot' },
  { id: 'fb-4', title: '邀请有礼', description: '邀友得会员权益', promo_type: 'invite', discount_rate: null, start_date: '2026-06-01', end_date: '2026-12-31', status: 'active', banner_image_url: null, link_url: '/promotion/invite' },
];

// 判断错误是否是"表不存在"
function isTableNotExistError(error: any): boolean {
  const msg = (error?.message || error?.code || '').toLowerCase();
  return msg.includes('does not exist') || msg.includes('42p01') || msg.includes('relation');
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      // 如果是表不存在错误，返回fallback数据
      if (isTableNotExistError(error)) {
        console.warn('[promotions API] 表不存在，返回降级数据');
        return NextResponse.json({ data: FALLBACK_DATA.slice(0, limit), fallback: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [], fallback: false });
  } catch (error: any) {
    // 捕获所有异常，返回降级数据
    console.warn('[promotions API] 异常:', error.message?.substring(0, 80));
    return NextResponse.json({ data: FALLBACK_DATA, fallback: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    // 鉴权：必须登录且为 admin/owner

    const body = await request.json();

    const { data, error } = await supabase
      .from('promotions')
      .insert([body])
      .select()
      .single();

    if (error && isTableNotExistError(error)) {
      return NextResponse.json({ error: '数据库表尚未创建，请联系管理员执行迁移SQL', code: 'TABLE_NOT_FOUND' }, { status: 503 });
    }
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}