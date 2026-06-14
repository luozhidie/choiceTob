// app/api/page-view-stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const pagePath = searchParams.get('page_path');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase.from('page_view_stats').select('*').order('created_at', { ascending: false });
    if (pagePath) query = query.eq('page_path', pagePath);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error } = await query;

    if (error) {
      if ((error.message || '').includes('does not exist')) return NextResponse.json({ data: {} });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 按日期分组统计
    const stats: Record<string, { views: number; unique_users: number }> = {};
    (data || []).forEach((record: any) => {
      const date = new Date(record.created_at).toISOString().split('T')[0];
      if (!stats[date]) stats[date] = { views: 0, unique_users: 0 };
      stats[date].views += 1;
      if (record.user_id) stats[date].unique_users += 1;
    });

    return NextResponse.json({ data: stats, fallback: false });
  } catch (error: any) {
    return NextResponse.json({ data: {}, fallback: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 如果表不存在，静默成功
    const { error } = await supabase.from('page_view_stats').insert([body]).select().single();

    if (error && (error.message || '').includes('does not exist')) {
      // 表不存在时直接返回成功，不影响用户体验
      return NextResponse.json({ success: true, fallback: true });
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data: {}, success: true, fallback: false });
  } catch (error: any) {
    // 静默失败，不阻塞页面
    return NextResponse.json({ success: true, fallback: true });
  }
}