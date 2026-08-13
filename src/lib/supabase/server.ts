import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 服务端 Supabase 客户端
 * - 有 SUPABASE_SERVICE_ROLE_KEY 时：用 Service Role（绕过 RLS，供 API 路由使用）
 * - 无 Service Role Key 时：用 ANON KEY（带用户 Cookie，供 Server Component 使用）
 */
export async function createClient() {
  const cookieStore = await cookies();
  const useServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    useServiceRole
      ? process.env.SUPABASE_SERVICE_ROLE_KEY!
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component 中调用 setAll 会报错，可忽略
          }
        },
      },
      ...(useServiceRole
        ? {
            global: {
              headers: {
                "X-Client-Info": "service-role",
              },
            },
          }
        : {}),
    }
  );
}
