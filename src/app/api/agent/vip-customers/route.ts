import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 解析当前用户 uid（小程序 token 或网站 admin cookie）
async function resolveUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (token) {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser(token);
    if (data?.user?.id) return data.user.id;
  }
  const cookie = req.cookies.get("admin_user_id")?.value;
  if (cookie) return cookie;
  return null;
}

// 是否代理（与 agent/customers 保持一致）
async function resolveAgent(userId: string) {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("membership_type, deposit_amount, store_owner_certified, role")
    .eq("id", userId)
    .single();
  const isAdmin = profile?.role === "admin";
  const isAgent =
    isAdmin ||
    profile?.membership_type === "deposit_discount" ||
    (profile?.store_owner_certified && (profile?.deposit_amount || 0) > 0);
  return { isAgent, isAdmin };
}

export async function GET(req: NextRequest) {
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { isAgent } = await resolveAgent(userId);
  if (!isAgent) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("vip_customers")
    .select("*")
    .eq("agent_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("agent/vip-customers GET error:", error);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
  return NextResponse.json({ customers: data || [] });
}

export async function POST(req: NextRequest) {
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { isAgent } = await resolveAgent(userId);
  if (!isAgent) return NextResponse.json({ error: "无权限" }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "请填写客户姓名" }, { status: 400 });

  const row: any = {
    name,
    phone: (body.phone || "").trim() || null,
    wechat: (body.wechat || "").trim() || null,
    company: (body.company || "").trim() || null,
    gender: body.gender || null,
    color_season: (body.color_season || "").trim() || null,
    main_style: (body.main_style || "").trim() || null,
    sub_style: (body.sub_style || "").trim() || null,
    vip_level: (body.vip_level || "V1").trim() || "V1",
    notes: (body.notes || "").trim() || null,
    is_active: true,
    source: "agent",
    agent_id: userId,
  };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("vip_customers")
    .insert([row])
    .select()
    .single();

  if (error) {
    console.error("agent/vip-customers POST error:", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}

export async function PUT(req: NextRequest) {
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { isAgent } = await resolveAgent(userId);
  if (!isAgent) return NextResponse.json({ error: "无权限" }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }
  const id = body.id;
  if (!id) return NextResponse.json({ error: "缺少记录ID" }, { status: 400 });

  const patch: any = { updated_at: new Date().toISOString() };
  [
    "name",
    "phone",
    "wechat",
    "company",
    "gender",
    "color_season",
    "main_style",
    "sub_style",
    "vip_level",
    "notes",
    "is_active",
  ].forEach((k) => {
    if (body[k] !== undefined) {
      const v = typeof body[k] === "string" ? body[k].trim() : body[k];
      patch[k] = v === "" ? null : v;
    }
  });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("vip_customers")
    .update(patch)
    .eq("id", id)
    .eq("agent_id", userId) // 仅允许改自己创建的
    .select()
    .single();

  if (error) {
    console.error("agent/vip-customers PUT error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "记录不存在或无权限" }, { status: 404 });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(req: NextRequest) {
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { isAgent } = await resolveAgent(userId);
  if (!isAgent) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少记录ID" }, { status: 400 });

  const supabase = createClient();
  const { error } = await supabase
    .from("vip_customers")
    .delete()
    .eq("id", id)
    .eq("agent_id", userId); // 仅允许删自己创建的

  if (error) {
    console.error("agent/vip-customers DELETE error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
