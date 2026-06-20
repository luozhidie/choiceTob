import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * 站点图片上传 API（服务端，使用 service_role 绕过 RLS）
 * POST /api/admin/site-assets
 * Body: FormData { file: File, key: string }
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员登录状态
    const cookieHeader = request.headers.get("cookie") || "";
    const isAdminLoggedIn = cookieHeader.includes("admin_logged_in=true");
    if (!isAdminLoggedIn) {
      return NextResponse.json({ error: "未登录或无权限" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const key = formData.get("key") as string | null;

    if (!file || !key) {
      return NextResponse.json({ error: "缺少文件或key参数" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "图片不能超过10MB" }, { status: 400 });
    }

    // 使用 service_role 客户端（绕过 RLS）
    const supabase = await createServerClient();

    // 1. 上传到 Storage
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `site-assets/${key}_${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const { error: upErr } = await supabase.storage
      .from("site-assets")
      .upload(fileName, arrayBuffer, { contentType: file.type });

    if (upErr) {
      console.error("[SiteAssets API] Storage 上传失败:", upErr);
      return NextResponse.json({ error: "Storage 上传失败: " + upErr.message }, { status: 500 });
    }

    // 2. 获取公开URL
    const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    // 3. 查询是否已存在该 key 的记录
    const { data: existing } = await supabase
      .from("site_assets")
      .select("id")
      .eq("key", key)
      .maybeSingle();

    let dbError;
    if (existing) {
      // 更新现有记录
      const { error } = await supabase
        .from("site_assets")
        .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      dbError = error;
    } else {
      // 插入新记录
      const titles: Record<string, string> = {
        hero_bg: "首页 Hero 大背景",
        magazine_1: "杂志封面 — 流行趋势",
        magazine_2: "杂志封面 — 搭配灵感",
        magazine_3: "杂志封面 — 行业洞察",
        cta_bg: "CTA 行动号召区背景",
        pay_wechat_qr: "微信收款二维码",
        pay_alipay_qr: "支付宝收款二维码",
        wechat_work_qr: "企业微信二维码",
      };
      const { error } = await supabase
        .from("site_assets")
        .insert([{
          key,
          title: titles[key] || key,
          image_url: publicUrl,
          is_active: true,
        }]);
      dbError = error;
    }

    if (dbError) {
      console.error("[SiteAssets API] 数据库写入失败:", dbError);
      return NextResponse.json({ error: "数据库写入失败: " + dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: publicUrl });

  } catch (error: any) {
    console.error("[SiteAssets API] 异常:", error);
    return NextResponse.json({ error: "服务器内部错误: " + error.message }, { status: 500 });
  }
}
