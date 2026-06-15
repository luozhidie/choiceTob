import { createClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);

/** 客户端权限检查：必须在 admin 页面 useEffect 中调用 */
export async function checkAdminClient(): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  return ADMIN_EMAILS.includes(user.email || "");
}

/** 服务端权限检查：用于 Route Handler 或 Server Component */
export async function checkAdminServer(cookie: string): Promise<boolean> {
  const supabase = createServerClient(cookie);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  return ADMIN_EMAILS.includes(user.email || "");
}

/** 获取当前用户（客户端）*/
export async function getCurrentAdmin(): Promise<{ email: string } | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  if (!ADMIN_EMAILS.includes(user.email)) return null;
  return { email: user.email };
}
