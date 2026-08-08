import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 小程序认证店主提交接口
 * POST /api/auth/certify
 * Body: { token, quiz_passed, style, monthly_sales, region }
 *
 * 与网页 /api/certify 逻辑一致，但身份识别改用小程序自定义 token（base64url，含 uid），
 * 因为小程序没有 Supabase 浏览器 cookie。
 */

function decodeToken(token: string): { uid?: string } | null {
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, quiz_passed, style, monthly_sales, region } = body;

    if (!quiz_passed) {
      return NextResponse.json({ error: "请先通过认证答题" }, { status: 400 });
    }

    // ── 身份识别：解析小程序 token ──
    if (!token) {
      return NextResponse.json({ error: "未登录，请先登录后再认证" }, { status: 401 });
    }
    const decoded = decodeToken(token);
    const uid = decoded?.uid;
    if (!uid) {
      return NextResponse.json({ error: "登录态已失效，请重新登录" }, { status: 401 });
    }

    // ── service_role 写入（绕过 RLS）──
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const monthlySalesCents =
      monthly_sales != null ? Math.round(Number(monthly_sales) * 100) : null;

    // 更新 profiles：标记为认证店主
    const { error: pErr } = await serviceClient
      .from("profiles")
      .update({
        store_owner_certified: true,
        certified_at: new Date().toISOString(),
        certified_style: style || null,
        certified_monthly_sales: monthlySalesCents,
      })
      .eq("id", uid);

    if (pErr) {
      console.error("[Auth Certify] 更新 profiles 失败:", pErr);
      return NextResponse.json({ error: "认证状态保存失败：" + pErr.message }, { status: 500 });
    }

    // 写入数据积累表（用于后台店铺管理 / 数据分析）
    const { error: cErr } = await serviceClient.from("store_owner_certifications").insert({
      user_id: uid,
      quiz_passed: true,
      style: style || null,
      monthly_sales: monthlySalesCents,
      region: region || null,
    });

    if (cErr) {
      console.error("[Auth Certify] 写入 certifications 失败:", cErr);
    }

    return NextResponse.json({
      success: true,
      message: "认证成功，已开启批发价",
      store_owner_certified: true,
    });
  } catch (err: any) {
    console.error("[Auth Certify API Error]", err);
    return NextResponse.json({ error: err.message || "认证失败" }, { status: 500 });
  }
}
