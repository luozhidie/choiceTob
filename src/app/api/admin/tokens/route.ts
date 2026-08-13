// 词元资产管理 API - 使用 service_role 绕过 RLS
// 支持：列表(GET) / 新建(POST) / 更新(PUT) / 软删除(DELETE)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const VALID_DOMAINS = new Set(["服装", "金融", "股票", "艺术", "其他"]);
const VALID_CATEGORIES = new Set(["选品判断", "搭配方案", "客户画像", "销售方法", "行业经验", "其他"]);
const VALID_STATUSES = new Set(["draft", "published"]);

function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量");
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const supabase = getServiceRoleClient();
    let query = supabase
      .from("selection_tokens")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (domain) query = query.eq("domain", domain);
    if (category) query = query.eq("category", category);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const body = await request.json();
    const title = (body.title || "").trim();
    if (!title) return NextResponse.json({ error: "标题不能为空" }, { status: 400 });

    const row = {
      domain: VALID_DOMAINS.has(body.domain) ? body.domain : "服装",
      category: VALID_CATEGORIES.has(body.category) ? body.category : "选品判断",
      title,
      summary: body.summary || "",
      fields: body.fields && typeof body.fields === "object" ? body.fields : {},
      prompt: body.prompt || "",
      tags: Array.isArray(body.tags) ? body.tags : [],
      metric: body.metric || "",
      status: VALID_STATUSES.has(body.status) ? body.status : "draft",
      owner: body.owner || "",
    };

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase.from("selection_tokens").insert(row).select().single();
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

    const patch: any = {};
    if (typeof body.domain === "string") patch.domain = VALID_DOMAINS.has(body.domain) ? body.domain : "服装";
    if (typeof body.category === "string") patch.category = VALID_CATEGORIES.has(body.category) ? body.category : "选品判断";
    if (typeof body.title === "string") patch.title = body.title.trim();
    if (typeof body.summary === "string") patch.summary = body.summary;
    if (body.fields && typeof body.fields === "object") patch.fields = body.fields;
    if (typeof body.prompt === "string") patch.prompt = body.prompt;
    if (Array.isArray(body.tags)) patch.tags = body.tags;
    if (typeof body.metric === "string") patch.metric = body.metric;
    if (typeof body.status === "string" && VALID_STATUSES.has(body.status)) patch.status = body.status;
    if (typeof body.owner === "string") patch.owner = body.owner;

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("selection_tokens")
      .update(patch)
      .eq("id", body.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from("selection_tokens")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}
