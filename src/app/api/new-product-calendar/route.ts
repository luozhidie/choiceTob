// app/api/new-product-calendar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data, error } = await supabase
      .from('new_product_calendar')
      .select(`*, products(*)`)
      .gte('release_date', startDate)
      .lte('release_date', endDate)
      .order('release_date', { ascending: true })
      .limit(limit);

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('does not exist') || msg.includes('42p01')) {
        return NextResponse.json({ data: [], fallback: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [], fallback: false });
  } catch (error: any) {
    return NextResponse.json({ data: [], fallback: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('new_product_calendar')
      .insert([body])
      .select()
      .single();

    if (error) {
      if ((error.message || '').includes('does not exist')) {
        return NextResponse.json({ error: '数据库表尚未创建', code: 'TABLE_NOT_FOUND' }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}