import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 解析当前用户 uid（小程序自定义 base64url token / Supabase JWT / admin cookie）
async function resolveUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    const cookie = req.cookies.get("admin_user_id")?.value;
    return cookie || null;
  }

  // 1) 三段式 JWT：走 Supabase auth.getUser（网站/admin 登录态）
  if (token.split(".").length === 3) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser(token);
      if (data?.user?.id) return data.user.id;
    } catch {}
  }

  // 2) 小程序自定义 token：base64url(JSON{uid, openid, exp})
  try {
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (payload?.uid && payload.exp && payload.exp > Date.now()) {
      return String(payload.uid);
    }
  } catch {}

  // 3) fallback admin cookie
  const cookie = req.cookies.get("admin_user_id")?.value;
  return cookie || null;
}

// 是否代理（与 agent/customers 保持一致）
async function resolveAgent(userId: string) {
  const supabase = await createClient();
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

  const supabase = await createClient();
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

  const allowedSources = ["manual", "agent", "import", "style_test", "agent_core", "agent_style", "profile"];
  const source = (body.source || "agent").trim();
  if (!allowedSources.includes(source)) return NextResponse.json({ error: "来源不合法" }, { status: 400 });

  const name = (body.name || "").trim();
  const ownerId = (body.owner_id || "").trim() || null;

  let row: any;

  if (source === "profile") {
    // 形象档案：按 owner_id(用户openid) 归属，name 可空，agent_id 留空（代理看不到）
    if (!ownerId) return NextResponse.json({ error: "缺少 owner_id" }, { status: 400 });
    row = {
      name: name || null,
      owner_id: ownerId,
      agent_id: null,
      source: "profile",
      gender: body.gender || null,
      color_season: (body.color_season || "").trim() || null,
      main_style: (body.main_style || "").trim() || null,
      sub_style: (body.sub_style || "").trim() || null,
      image_url: (body.image_url || "").trim() || null,
      notes: (body.notes || "").trim() || null,
      is_active: true,
    };
  } else if (source === "agent_core") {
    // 核心客户：按 agent_id 归属，色彩季型(季型) 必填
    const colorSeason = (body.color_season || "").trim();
    if (!colorSeason) return NextResponse.json({ error: "请选择色彩季型" }, { status: 400 });
    row = {
      name,
      owner_id: null,
      agent_id: userId,
      source: "agent_core",
      gender: body.gender || null,
      color_season: colorSeason,
      wechat: (body.wechat || body.contact || "").trim() || null,
      image_url: (body.image_url || "").trim() || null,
      notes: (body.notes || "").trim() || null,
      vip_level: "V1",
      is_active: true,
    };
  } else if (source === "agent_style") {
    // 风格盘客户：按 agent_id 归属，性别 + 主/副风格 必填
    if (!name) return NextResponse.json({ error: "请填写客户姓名" }, { status: 400 });
    const gender = body.gender === "女" || body.gender === "男" ? body.gender : null;
    const mainStyle = (body.main_style || "").trim();
    const subStyle = (body.sub_style || "").trim();
    if (!mainStyle) return NextResponse.json({ error: "请选择主风格" }, { status: 400 });
    row = {
      name,
      owner_id: null,
      agent_id: userId,
      source: "agent_style",
      gender,
      main_style: mainStyle,
      sub_style: subStyle,
      wechat: (body.wechat || body.contact || "").trim() || null,
      image_url: (body.image_url || "").trim() || null,
      notes: (body.notes || "").trim() || null,
      vip_level: "V1",
      is_active: true,
    };
  } else {
    // agent / manual / import / style_test：原有逻辑，姓名必填
    if (!name) return NextResponse.json({ error: "请填写客户姓名" }, { status: 400 });
    row = {
      name,
      owner_id: null,
      agent_id: userId,
      source,
      phone: (body.phone || "").trim() || null,
      wechat: (body.wechat || "").trim() || null,
      company: (body.company || "").trim() || null,
      gender: body.gender || null,
      color_season: (body.color_season || "").trim() || null,
      main_style: (body.main_style || "").trim() || null,
      sub_style: (body.sub_style || "").trim() || null,
      image_url: (body.image_url || "").trim() || null,
      vip_level: (body.vip_level || "V1").trim() || "V1",
      notes: (body.notes || "").trim() || null,
      is_active: true,
    };
  }

  const supabase = await createClient();
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
    "image_url",
    "vip_level",
    "notes",
    "is_active",
  ].forEach((k) => {
    if (body[k] !== undefined) {
      const v = typeof body[k] === "string" ? body[k].trim() : body[k];
      patch[k] = v === "" ? null : v;
    }
  });

  const supabase = await createClient();
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

  const supabase = await createClient();
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
