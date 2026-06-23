import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "请输入邮箱和密码" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      let msg = error.message;
      if (msg === "Invalid login credentials") msg = "邮箱或密码错误";
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    // 返回用户信息和 session token
    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    });
  } catch (err: any) {
    console.error("[Auth Login API Error]", err);
    return NextResponse.json({ error: err.message || "登录失败，请稍后重试" }, { status: 500 });
  }
}
