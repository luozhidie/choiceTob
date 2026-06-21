// app/api/product-tags/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    let query = supabase.from('product_tags').select('*').order('created_at', { ascending: false });
    if (productId) query = query.eq('product_id', productId);

    const { data, error } = await query;

    if (error) {
      if ((error.message || '').includes('does not exist')) return NextResponse.json({ data: [] });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();

    const { data, error } = await supabase
      .from('product_tags')
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

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少 id 参数' }, { status: 400 });

    const { error } = await supabase.from('product_tags').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}