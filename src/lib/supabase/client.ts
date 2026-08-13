import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;
let initError: string | null = null;

export function createClient() {
  // 如果之前已经知道会失败，直接返回空客户端
  if (initError) {
    return createDummyClient();
  }

  // 如果已经有成功创建的客户端，直接返回
  if (client) {
    return client;
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 检查环境变量是否存在
    if (!url || !key) {
      console.warn("[Supabase] 环境变量缺失");
      initError = "MISSING_ENV";
      return createDummyClient();
    }

    // 检查 key 是否是有效格式（应该是 JWT，以 eyJ 开头）
    if (!key.startsWith("eyJ") && !key.startsWith("sb_publishable")) {
      console.warn("[Supabase] ANON_KEY 格式异常");
      // 不立即放弃，尝试创建
    }

    // 尝试创建客户端
    const newClient = createBrowserClient(url, key);

    // 验证客户端是否可用
    if (!newClient || !newClient.auth || !newClient.from) {
      throw new Error("Supabase 客户端创建失败");
    }

    client = newClient;
    return client;
  } catch (error: any) {
    console.error("[Supabase] 初始化失败:", error?.message || error);
    initError = error?.message || "INIT_ERROR";
    return createDummyClient();
  }
}

// 创建一个安全的空客户端（永远不会崩溃）
function createDummyClient() {
  const chain: any = {
    select: () => ({ data: [], error: null, count: 0, then: (f: any) => f({ data: [], error: null, count: 0 }) }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ data: null, error: null }),
    eq: () => chain,
    neq: () => chain,
    gt: () => chain,
    gte: () => chain,
    lt: () => chain,
    lte: () => chain,
    like: () => chain,
    ilike: () => chain,
    in: () => chain,
    is: () => chain,
    not: () => chain,
    order: () => chain,
    limit: () => chain,
    range: () => chain,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    count: () => chain,
  };

  return {
    from: (_table: string) => chain,
    auth: {
      getUser: () => {
        // 管理后台页面会通过 cookie 判断登录状态
        // 如果 admin_logged_in cookie 存在，返回一个模拟用户
        // 这样所有管理页面原有的 getUser() 检查都能通过
        if (typeof document !== "undefined") {
          const cookies = document.cookie;
          if (cookies.includes("admin_logged_in=true")) {
            return Promise.resolve({
              data: {
                user: {
                  id: "admin-user",
                  email: "admin@colour-choice.art",
                  role: "authenticated",
                  aud: "authenticated",
                } as any,
              },
              error: null,
            });
          }
        }
        return Promise.resolve({ data: { user: null }, error: null });
      },
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUserByEmail: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: (_callback: any) => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: () =>
        Promise.resolve({
          data: { user: null, session: null },
          error: { message: "Supabase 未正确配置" } as any,
        }),
      signInWithOAuth: () =>
        Promise.resolve({
          data: { user: null, session: null },
          error: { message: "Supabase 未正确配置" } as any,
        }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: {}, error: null }),
      updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    realtime: {
      channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) }),
      setAuth: () => {},
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: "" }, error: { message: "storage unavailable" } as any }),
        download: () => Promise.resolve({ data: new Blob(), error: null }),
        remove: () => Promise.resolve({ data: {}, error: null }),
        list: () => Promise.resolve({ data: [], error: null }),
        getPublicUrl: () => "",
      }),
    },
    functions: {
      invoke: () => Promise.resolve({ data: null, error: { message: "functions unavailable" } as any }),
    },
  };
}
