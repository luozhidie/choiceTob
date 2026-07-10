import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runStrategy } from "@/lib/signal";

export const maxDuration = 60;

// Vercel Cron 定时触发（无需 admin cookie，用内置 CRON_SECRET 鉴权）
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = await createClient();
  const result = await runStrategy(supabase);
  return NextResponse.json({ ok: true, ...result });
}
