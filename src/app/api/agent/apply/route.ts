// 销售代理·招募申请
// POST 接收 { openid, name, phone, email, company, wechat_id, experience, store_count, message }
// 写入 agent_applications，返回 { success, message }
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      openid,
      name,
      phone,
      email,
      company,
      wechat_id,
      experience,
      store_count,
      message,
    } = body || {};

    if (!name || !phone) {
      return NextResponse.json({ error: "请填写姓名和联系电话" }, { status: 400 });
    }
    // 简单手机号校验（中国大陆 11 位）
    if (!/^1[3-9]\d{9}$/.test(String(phone))) {
      return NextResponse.json({ error: "请填写正确的手机号" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // 关联已登录用户（若有）
    let userId: string | null = null;
    if (openid) {
      const { data: p1 } = await supabase.from("profiles").select("id").eq("wechat_openid", openid).maybeSingle();
      const { data: p2 } = await supabase.from("profiles").select("id").eq("wx_openid", openid).maybeSingle();
      userId = p1?.id || p2?.id || null;
    }

    const { error } = await supabase.from("agent_applications").insert({
      openid: openid || null,
      user_id: userId,
      name: String(name).slice(0, 50),
      phone: String(phone).slice(0, 20),
      email: email ? String(email).slice(0, 120) : null,
      company: company ? String(company).slice(0, 120) : null,
      wechat_id: wechat_id ? String(wechat_id).slice(0, 60) : null,
      experience: experience ? String(experience).slice(0, 20) : null,
      store_count: store_count ? String(store_count).slice(0, 20) : null,
      message: message ? String(message).slice(0, 500) : null,
      status: "pending",
    });

    if (error) {
      console.error("[agent/apply] 写入失败", error);
      const msg = String(error.message || "");
      if (/relation "agent_applications" does not exist|42P01/.test(msg)) {
        return NextResponse.json(
          { error: "数据库未初始化：请在 Supabase 执行 agent_applications 建表 SQL" },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: "提交失败：" + msg }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "提交成功，我们会尽快联系您" });
  } catch (err: any) {
    console.error("[agent/apply]", err);
    return NextResponse.json({ error: err.message || "系统错误" }, { status: 500 });
  }
}
