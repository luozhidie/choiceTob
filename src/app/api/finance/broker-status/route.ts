import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 15;

// 回报当前下单模式（纸面 / 富途实盘）及中继连通状态，供后台「运行策略」按钮做护栏展示
export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const mode = process.env.BROKER_TYPE === "futu" ? "futu" : "paper";
  const relayUrl = (process.env.FUTU_RELAY_URL || "").replace(/\/$/, "");
  const relayConfigured = !!relayUrl;

  let relayReachable: boolean | null = null;
  if (mode === "futu" && relayConfigured) {
    try {
      const r = await fetch(relayUrl + "/health", { signal: AbortSignal.timeout(5000) });
      const d = await r.json().catch(() => null);
      relayReachable = !!(d && d.ok);
    } catch {
      relayReachable = false;
    }
  }

  return NextResponse.json({
    ok: true,
    mode,
    relayConfigured,
    relayReachable,
  });
}
