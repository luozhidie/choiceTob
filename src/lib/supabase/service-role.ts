import { createClient } from "@supabase/supabase-js";

/**
 * Service Role 客户端 —— 绕过 RLS，专供后端 API 使用
 * 警告：不要在客户端代码中暴露 SUPABASE_SERVICE_ROLE_KEY
 */
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
