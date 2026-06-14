import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET: 获取品类列表 */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

/** POST: 新增品类 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      code: body.code,
      label: body.label,
      description: body.description || "",
      sort_order: body.sort_order || 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** PUT: 更新品类 */
export async function PUT(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("categories")
    .update({
      code: body.code,
      label: body.label,
      description: body.description || "",
      sort_order: body.sort_order || 0,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** DELETE: 删除品类 */
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
