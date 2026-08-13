// 集财运（店主福利社群）：签到 / 任务 / 财运值 / 兑换运费券
// 配置（签到奖励、任务、兑换比例）全部读 site_settings，后台「活动配置」可改，不再写死
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

// 兜底默认值（与首次 seed 一致），site_settings 未配置时使用
const DEFAULT_CHECKIN = [100, 200, 300, 500, 800, 1000, 1600];
const DEFAULT_EXCHANGE = { cost: 3000, amount_cents: 300 };
const DEFAULT_TASKS = [
  { key: "know_activity", label: "平台活动提前知（秋款上新福利）", icon: "📣", points: 300, type: "once" as const },
  { key: "subscribe_stall", label: "订阅档口领财富值", icon: "🔔", points: 300, type: "once" as const },
  { key: "order_rebate", label: "下单返运费", icon: "🛒", points: 1000, type: "daily" as const },
  { key: "official_group", label: "加入一手店主官方福利群", icon: "👥", points: 50, type: "once" as const, nav: "/pages/group/index" },
  { key: "browse_spot", label: "浏览现货 15s", icon: "👀", points: 50, type: "daily" as const },
  { key: "browse_hot", label: "浏览档口最爆款 15s", icon: "🔥", points: 30, type: "daily" as const },
  { key: "market_new", label: "每日看市场新款", icon: "✨", points: 20, type: "daily" as const },
  { key: "browse_invite", label: "浏览邀请 30s", icon: "🔗", points: 20, type: "daily" as const },
];

async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as T) ?? fallback;
}

async function loadConfig() {
  const [checkinRewards, tasks, exchange] = await Promise.all([
    getSetting<number[]>("fortune_checkin_rewards", DEFAULT_CHECKIN),
    getSetting<any[]>("fortune_tasks", DEFAULT_TASKS),
    getSetting<{ cost: number; amount_cents: number }>("fortune_exchange", DEFAULT_EXCHANGE),
  ]);
  return {
    checkinRewards: Array.isArray(checkinRewards) ? checkinRewards : DEFAULT_CHECKIN,
    tasks: Array.isArray(tasks) ? tasks : DEFAULT_TASKS,
    exchange: exchange && typeof exchange.cost === "number" ? exchange : DEFAULT_EXCHANGE,
  };
}

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

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}
function yesterdayStr(): string {
  const d = new Date(Date.now() - 86400000);
  return d.toISOString().split("T")[0];
}

async function getState(userId: string, tasks: any[]) {
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
  const onceKeys = new Set(tasks.filter((tk) => tk.type === "once").map((tk) => tk.key));
  const tasksDoneToday = (taskLogs || [])
    .filter((l: any) => l.day === t)
    .map((l: any) => l.task_key);
  const tasksDoneOnce = (taskLogs || [])
    .filter((l: any) => onceKeys.has(l.task_key))
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
  const cfg = await loadConfig();
  return NextResponse.json({ success: true, data: await getState(userId, cfg.tasks) });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = body.action;
  const cfg = await loadConfig();

  if (action === "check-in") {
    const t = todayStr();
    const { data: profile } = await supabase
      .from("profiles")
      .select("wealth_score, check_in_streak, last_check_in_date")
      .eq("id", userId)
      .maybeSingle();
    if ((profile?.last_check_in_date || "") === t) {
      return NextResponse.json({ success: true, already: true, data: await getState(userId, cfg.tasks) });
    }
    const continues = (profile?.last_check_in_date || "") === yesterdayStr();
    const streak = continues ? (profile?.check_in_streak || 0) + 1 : 1;
    const points = cfg.checkinRewards[(streak - 1) % cfg.checkinRewards.length];

    const { error: insErr } = await supabase.from("check_ins").insert({ user_id: userId, check_date: t, points });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    const newScore = (profile?.wealth_score || 0) + points;
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ wealth_score: newScore, check_in_streak: streak, last_check_in_date: t })
      .eq("id", userId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ success: true, gained: points, data: await getState(userId, cfg.tasks) });
  }

  if (action === "complete-task") {
    const key = body.task_key;
    const cfgTask = cfg.tasks.find((tk: any) => tk.key === key);
    if (!cfgTask) return NextResponse.json({ error: "未知任务" }, { status: 400 });
    const t = todayStr();

    let query = supabase.from("fortune_task_log").select("id").eq("user_id", userId).eq("task_key", key);
    if (cfgTask.type === "daily") query = query.eq("day", t);
    const { data: existing } = await query.maybeSingle();
    if (existing) {
      return NextResponse.json({ success: true, already: true, data: await getState(userId, cfg.tasks) });
    }

    const { error: insErr } = await supabase.from("fortune_task_log").insert({ user_id: userId, task_key: key, day: t, points: cfgTask.points });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    const { data: profile } = await supabase.from("profiles").select("wealth_score").eq("id", userId).maybeSingle();
    const newScore = (profile?.wealth_score || 0) + cfgTask.points;
    const { error: updErr } = await supabase.from("profiles").update({ wealth_score: newScore }).eq("id", userId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ success: true, gained: cfgTask.points, data: await getState(userId, cfg.tasks) });
  }

  if (action === "exchange") {
    const COST = cfg.exchange.cost;
    const AMOUNT = cfg.exchange.amount_cents;
    const { data: profile } = await supabase.from("profiles").select("wealth_score").eq("id", userId).maybeSingle();
    if ((profile?.wealth_score || 0) < COST) {
      return NextResponse.json({ error: "财运值不足，需 " + COST }, { status: 400 });
    }
    const expire = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    const { error: cErr } = await supabase.from("coupons").insert({
      user_id: userId,
      title: "¥" + (AMOUNT / 100) + " 运费券",
      discount_desc: "立减¥" + (AMOUNT / 100) + "运费",
      discount_amount: AMOUNT,
      min_amount: 0,
      coupon_type: "freight",
      status: "unused",
      expire_at: expire,
    });
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
    await supabase.from("profiles").update({ wealth_score: (profile?.wealth_score || 0) - COST }).eq("id", userId);
    return NextResponse.json({ success: true, message: "已兑换¥" + (AMOUNT / 100) + "运费券", data: await getState(userId, cfg.tasks) });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
