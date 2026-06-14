// app/api/recommendations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '6');

    if (!userId) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabase
      .from('user_recommendations')
      .select(`*, products(*)`)
      .eq('user_id', userId)
      .order('recommendation_score', { ascending: false })
      .limit(limit);

    if (error) {
      if ((error.message || '').includes('does not exist')) {
        return NextResponse.json({ data: [], fallback: true });
      }
      return NextResponse.json({ data: [], fallback: false });
    }

    return NextResponse.json({ data: data || [], fallback: false });
  } catch (error: any) {
    return NextResponse.json({ data: [], fallback: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const body = await request.json();

    const { data, error } = await supabase
      .from('user_recommendations')
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

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少 id 参数' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_recommendations')
      .update({ is_clicked: true })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}