import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, full_name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "请输入邮箱和密码" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少6位字符" }, { status: 400 });
    }

    // 用 ANON Key 创建客户端（与 login 路由保持一致）
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // ── 注册新用户 ──
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || "",
        },
      },
    });

    if (error) {
      let msg = error.message;
      if (msg === "User already registered") msg = "该邮箱已注册，请直接登录";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // ── 是否需要邮箱验证 ──
    // Supabase 开启邮箱确认时，signUp 成功后 data.session 为 null
    if (!data.session) {
      return NextResponse.json({
        success: true,
        needs_confirmation: true,
        message: "注册成功，请前往邮箱完成验证后再登录",
      });
    }

    // ── 已自动登录（关闭邮箱确认时）──
    // 用 service_role 查 profiles 表获取会员信息
    let membershipType = null;
    let membershipExpiresAt = null;
    try {
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("membership_type, membership_expires_at")
        .eq("id", data.user!.id)
        .maybeSingle();
      if (profile) {
        membershipType = profile.membership_type;
        membershipExpiresAt = profile.membership_expires_at;
      }
    } catch (e) {
      console.error("[Auth Register] 查会员信息失败:", e);
    }

    const isPriceMember = !!(
      membershipType === "view_price" &&
      membershipExpiresAt &&
      new Date(membershipExpiresAt) > new Date()
    );

    return NextResponse.json({
      success: true,
      needs_confirmation: false,
      user: data.user,
      message: "注册成功",
      membership_type: membershipType,
      membership_expires_at: membershipExpiresAt,
      is_price_member: isPriceMember,
    });
  } catch (err: any) {
    console.error("[Auth Register API Error]", err);
    return NextResponse.json({ error: err.message || "注册失败，请稍后重试" }, { status: 500 });
  }
}
