import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return NextResponse.json({ error: "服务器配置错误" }, { status: 500 });
    }

    const serviceClient = createServiceClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let userId: string | null = null;

    // 1) 先尝试从 web 的 Supabase cookie session 取用户
    try {
      const cookieStore = await cookies();
      const authClient = createServerClient(supabaseUrl, anonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            /* 只读 */
          },
        },
      });
      const {
        data: { user },
      } = await authClient.auth.getUser();
      if (user) userId = user.id;
    } catch (e) {
      console.warn("[style-test submit] cookie auth 失败:", e);
    }

    // 2) 若是小程序提交且带了 user_openid,按 wx_openid 查找或创建用户
    if (!userId && body.user_openid) {
      const openid = String(body.user_openid);
      const { data: existingProfile } = await serviceClient
        .from("profiles")
        .select("id")
        .eq("wx_openid", openid)
        .single();

      if (existingProfile) {
        userId = existingProfile.id;
      } else {
        const fakeEmail = `${openid}@wx.luozhidie.com`;
        try {
          const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
            email: fakeEmail,
            password: `wx_${openid.slice(0, 16)}`,
            email_confirm: true,
            user_metadata: { wx_openid: openid },
          });

          if (createError) {
            // 兜底：email 已存在则按 email 反查 user_id
            console.error("[style-test submit] createUser 失败:", createError);
            const { data: existingUser } = await serviceClient.auth.admin.getUserByEmail(fakeEmail);
            if (existingUser) userId = existingUser.id;
          } else if (newUser?.user) {
            userId = newUser.user.id;
            await serviceClient.from("profiles").insert({
              id: userId,
              email: fakeEmail,
              wx_openid: openid,
              role: "user",
              membership_type: "none",
            });
          }
        } catch (createErr: any) {
          console.error("[style-test submit] 创建用户异常:", createErr);
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 3) 用 service-role 写入,绕过 RLS
    const { error } = await serviceClient.from("style_diagnoses").insert({
      user_id: userId,
      full_name: body.full_name || null,
      wechat_qr_url: body.wechat_id || body.wechat_qr_url || null,
      age: body.age || null,
      video_course_info: body.video_course_info || null,
      look_vs_age: body.look_vs_age || null,
      height: body.height || null,
      answers: body.answers || {},
      photo_urls_1: body.photo_urls_1 || [],
      photo_urls_2: body.photo_urls_2 || [],
      photo_urls_3: body.photo_urls_3 || [],
      photo_note: body.photo_note || null,
      gender: body.gender || null,
      status: "pending",
    });

    if (error) {
      console.error("[API] style-test submit error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[API] style-test submit exception:", err);
    return NextResponse.json({ error: err.message || "提交失败" }, { status: 500 });
  }
}
