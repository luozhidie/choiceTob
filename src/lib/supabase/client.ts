import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn("[Supabase] 环境变量缺失，使用空客户端");
      return createDummyClient();
    }

    if (client) return client;

    client = createBrowserClient(url, key);
    return client;
  } catch (error) {
    console.error("[Supabase] 初始化失败:", error);
    return createDummyClient();
  }
}

// 创建一个安全的空客户端（所有方法返回空结果）
function createDummyClient() {
  return {
    from: () => ({
      select: () => ({ data: [], error: null, count: 0 }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      eq: () => this,
      order: () => this,
      limit: () => this,
      range: () => this,
      single: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: (_callback: any) => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: () => Promise.resolve({ data: { user: null }, error: { message: "未初始化" } as any }),
      signOut: () => Promise.resolve({ error: null }),
    },
  } as any;
}
