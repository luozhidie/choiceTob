import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      quiz_passed,
      style,
      monthly_sales, // 元
      region,
    } = body;

    // 必须答题通过
    if (!quiz_passed) {
      return NextResponse.json({ error: "请先通过认证答题" }, { status: 400 });
    }

    // 1) 从 cookie 取当前登录用户
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            /* 只读，不写 cookie */
          },
        },
      }
    );

    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "未登录，请先登录后再认证" }, { status: 401 });
    }

    // 2) 写入（service_role 保底绕过 RLS，避免 profiles RLS 拦截）
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const monthlySalesCents = monthly_sales != null ? Math.round(Number(monthly_sales) * 100) : null;

    // 2a) 更新 profiles：标记为认证店主
    const { error: pErr } = await serviceClient
      .from("profiles")
      .update({
        store_owner_certified: true,
        certified_at: new Date().toISOString(),
        certified_style: style || null,
        certified_monthly_sales: monthlySalesCents,
      })
      .eq("id", user.id);

    if (pErr) {
      console.error("[Certify] 更新 profiles 失败:", pErr);
      return NextResponse.json({ error: "认证状态保存失败：" + pErr.message }, { status: 500 });
    }

    // 2b) 写入数据积累表（用于后台店铺管理 / 数据分析）
    const { error: cErr } = await serviceClient.from("store_owner_certifications").insert({
      user_id: user.id,
      quiz_passed: true,
      style: style || null,
      monthly_sales: monthlySalesCents,
      region: region || null,
    });

    if (cErr) {
      // 不影响主流程，仅记录
      console.error("[Certify] 写入 certifications 失败:", cErr);
    }

    return NextResponse.json({
      success: true,
      message: "认证成功，已开启批发价",
      store_owner_certified: true,
    });
  } catch (err: any) {
    console.error("[Certify API Error]", err);
    return NextResponse.json({ error: err.message || "认证失败" }, { status: 500 });
  }
}
