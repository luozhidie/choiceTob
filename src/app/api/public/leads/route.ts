// 公开 API：提交留资线索
// 前端浏览器端直连 Supabase 会被 leads 表的 RLS 拦截（42501），
// 因此所有留资入口统一走本路由，用 service role key 写入。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const clean = (v: any): string => (typeof v === "string" ? v.trim() : "");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = clean(body.name);
    const phone = clean(body.phone);

    if (!name && !phone) {
      return NextResponse.json({ success: false, error: "请至少填写姓名或联系电话" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("leads")
      .insert({
        name: name || null,
        phone: phone || null,
        wechat: clean(body.wechat) || null,
        company: clean(body.company) || null,
        source: clean(body.source) || "contact_form",
        interest: clean(body.interest) || null,
        notes: clean(body.notes) || null,
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("[leads] 写入失败:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    console.error("[leads] 异常:", e);
    return NextResponse.json({ success: false, error: e.message || "提交失败" }, { status: 500 });
  }
}
