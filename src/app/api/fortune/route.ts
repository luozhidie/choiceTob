// 集财运（店主福利社群）：签到 / 任务 / 财运值 / 兑换运费券
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

function parseMiniToken(token: string): { uid: string; exp?: number } | null {
  try {
    if (!token || token.includes(".")) return null;
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (!payload.uid) return null;
    if (payload.exp && payload.exp < Date.now()) return null;
    return { uid: payload.uid as string, exp: payload.exp as number | undefined };
  } catch {
    return null;
  }
}

async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;
  if (token.includes(".")) {
    const { data } = await supabase.auth.getUser(token);
    if (data.user) return data.user.id;
  } else {
    const mini = parseMiniToken(token);
    if (mini) return mini.uid;
  }
  return null;
}

// 7 天签到奖励（元→分存储金额无关，这里财运值是整数点）
const CHECKIN_REWARDS = [100, 200, 300, 500, 800, 1000, 1600];

// 任务配置：key -> { points, type: daily|once }
const TASKS: Record<string, { points: number; type: "daily" | "once" }> = {
  know_activity: { points: 300, type: "once" }, // 平台活动提前知（秋款上新福利）
  subscribe_stall: { points: 300, type: "once" }, // 订阅档口领财富值
  order_rebate: { points: 1000, type: "daily" }, // 下单返运费
  official_group: { points: 50, type: "once" }, // 一手店主官方福利群
  browse_spot: { points: 50, type: "daily" }, // 浏览现货 15s
  browse_hot: { points: 30, type: "daily" }, // 浏览档口最爆款 15s
  market_new: { points: 20, type: "daily" }, // 每日看市场新款
  browse_invite: { points: 20, type: "daily" }, // 浏览邀请 30s
};

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}
function yesterdayStr(): string {
  const d = new Date(Date.now() - 86400000);
  return d.toISOString().split("T")[0];
}

async function getState(userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("wealth_score, check_in_streak, last_check_in_date")
    .eq("id", userId)
    .maybeSingle();

  const t = todayStr();
  const last7 = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];

  const [{ data: checks }, { data: taskLogs }] = await Promise.all([
    supabase.from("check_ins").select("check_date").eq("user_id", userId).gte("check_date", last7).order("check_date"),
    supabase.from("fortune_task_log").select("task_key, day").eq("user_id", userId),
  ]);

  const weekChecks = (checks || []).map((c: any) => c.check_date);
  const checkedToday = (profile?.last_check_in_date || "") === t;
  const tasksDoneToday = (taskLogs || [])
    .filter((l: any) => l.day === t)
    .map((l: any) => l.task_key);
  const tasksDoneOnce = (taskLogs || [])
    .filter((l: any) => TASKS[l.task_key]?.type === "once")
    .map((l: any) => l.task_key);

  return {
    wealth_score: profile?.wealth_score || 0,
    check_in_streak: profile?.check_in_streak || 0,
    checkedToday,
    weekChecks,
    tasksDoneToday,
    tasksDoneOnce,
  };
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 });
  return NextResponse.json({ success: true, data: await getState(userId) });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = body.action;

  if (action === "check-in") {
    const t = todayStr();
    const { data: profile } = await supabase
      .from("profiles")
      .select("wealth_score, check_in_streak, last_check_in_date")
      .eq("id", userId)
      .maybeSingle();
    if ((profile?.last_check_in_date || "") === t) {
      return NextResponse.json({ success: true, already: true, data: await getState(userId) });
    }
    // 连续天数：昨天签到则 +1，否则重置为 1
    const continues = (profile?.last_check_in_date || "") === yesterdayStr();
    const streak = continues ? (profile?.check_in_streak || 0) + 1 : 1;
    const points = CHECKIN_REWARDS[(streak - 1) % CHECKIN_REWARDS.length];

    const { error: insErr } = await supabase.from("check_ins").insert({ user_id: userId, check_date: t, points });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    const newScore = (profile?.wealth_score || 0) + points;
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ wealth_score: newScore, check_in_streak: streak, last_check_in_date: t })
      .eq("id", userId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ success: true, gained: points, data: await getState(userId) });
  }

  if (action === "complete-task") {
    const key = body.task_key;
    const cfg = TASKS[key];
    if (!cfg) return NextResponse.json({ error: "未知任务" }, { status: 400 });
    const t = todayStr();

    // 判断是否已完成
    let query = supabase.from("fortune_task_log").select("id").eq("user_id", userId).eq("task_key", key);
    if (cfg.type === "daily") query = query.eq("day", t);
    const { data: existing } = await query.maybeSingle();
    if (existing) {
      return NextResponse.json({ success: true, already: true, data: await getState(userId) });
    }

    const { error: insErr } = await supabase.from("fortune_task_log").insert({ user_id: userId, task_key: key, day: t, points: cfg.points });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    const { data: profile } = await supabase.from("profiles").select("wealth_score").eq("id", userId).maybeSingle();
    const newScore = (profile?.wealth_score || 0) + cfg.points;
    const { error: updErr } = await supabase.from("profiles").update({ wealth_score: newScore }).eq("id", userId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ success: true, gained: cfg.points, data: await getState(userId) });
  }

  if (action === "exchange") {
    // 3000 财运值 → ¥3 运费券
    const COST = 3000;
    const AMOUNT = 300; // 分
    const { data: profile } = await supabase.from("profiles").select("wealth_score").eq("id", userId).maybeSingle();
    if ((profile?.wealth_score || 0) < COST) {
      return NextResponse.json({ error: "财运值不足，需 " + COST }, { status: 400 });
    }
    const expire = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    const { error: cErr } = await supabase.from("coupons").insert({
      user_id: userId,
      title: "¥3 运费券",
      discount_desc: "立减¥3运费",
      discount_amount: AMOUNT,
      min_amount: 0,
      coupon_type: "freight",
      status: "unused",
      expire_at: expire,
    });
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
    await supabase.from("profiles").update({ wealth_score: (profile?.wealth_score || 0) - COST }).eq("id", userId);
    return NextResponse.json({ success: true, message: "已兑换¥3运费券", data: await getState(userId) });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
