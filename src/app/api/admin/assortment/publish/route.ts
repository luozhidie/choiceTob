// 管理员 API：把组货方案「写入商城」——品类落到 categories 分类树 + 方案置 published
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const FALLBACK_PUBLISHABLE = "sb_publishable_gQlwSK2XDm52k-z5iDhemg_yUJeBSCW";

function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

async function withClient<T>(fn: (s: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      return await fn(createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY));
    } catch {}
  }
  return await fn(createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_PUBLISHABLE));
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const { id } = await request.json();
    if (!id || String(id).startsWith("demo-")) {
      return NextResponse.json({ error: "缺少有效的方案 id" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. 读取方案
    const { data: plan, error: planErr } = await supabase
      .from("assortment_plans")
      .select("*")
      .eq("id", id)
      .single();
    if (planErr || !plan) return NextResponse.json({ error: "方案不存在" }, { status: 404 });

    const cats: any[] = Array.isArray(plan.categories) ? plan.categories : [];

    // 2. 现有分类（用于按 label 去重 + 生成新 code）
    const { data: allCats } = await supabase.from("categories").select("code,label");
    const existingByLabel = new Map<string, any>();
    (allCats || []).forEach((c: any) => existingByLabel.set(c.label, c));
    let maxAi = 0;
    (allCats || []).forEach((c: any) => {
      const m = /^AI(\d+)$/.exec(c.code || "");
      if (m) maxAi = Math.max(maxAi, Number(m[1]));
    });
    let seq = maxAi;
    const baseSort = (allCats || []).length;

    const resolved: any[] = [];
    for (const cat of cats) {
      const label = String(cat.category || "").trim();
      if (!label) continue;
      let code: string;
      const ex = existingByLabel.get(label);
      if (ex) {
        code = ex.code;
      } else {
        seq += 1;
        code = "AI" + String(seq).padStart(3, "0"); // ≤6 位，唯一
        const { error: insErr } = await supabase.from("categories").insert({
          code,
          label,
          description: cat.note || "",
          sort_order: baseSort + seq,
          is_default: false,
        });
        if (insErr) {
          // 万一 code 冲突，回退用时间戳后缀
          code = "AI" + String(Date.now()).slice(-5);
          await supabase
            .from("categories")
            .upsert({ code, label, description: cat.note || "", is_default: false }, { onConflict: "code" });
        }
        existingByLabel.set(label, { code, label });
      }
      resolved.push({ ...cat, code });
    }

    // 3. 方案置 published
    const now = new Date().toISOString();
    const { data: updated, error: updErr } = await supabase
      .from("assortment_plans")
      .update({ status: "published", categories: resolved, updated_at: now })
      .eq("id", id)
      .select()
      .single();
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ success: true, data: updated, createdCategories: resolved.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
