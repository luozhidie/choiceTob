import { createClient as createServerClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);

/**
 * 检查当前请求是否为管理员
 * 使用 service role 绕过 RLS
 */
export async function checkAdminRequest(req: Request): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    return ADMIN_EMAILS.includes(user.email || "");
  } catch {
    return false;
  }
}

/**
 * 获取当前管理员用户信息
 */
export async function getAdminUser(req: Request): Promise<{ id: string; email: string } | null> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return null;
    if (!ADMIN_EMAILS.includes(user.email)) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}
