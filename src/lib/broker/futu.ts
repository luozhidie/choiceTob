// 富途真实/模拟下单执行器
// 设计要点：
// - 本文件【不】直接依赖 futu-api，只通过 HTTP 调用「富途中继(broker-relay)」。
//   中继是常驻在 VPS 上的小服务（OpenD 网关本就要常驻，放同一台机器即可），
//   由它连 OpenD 完成真实下单。这样 Next.js 无服务器函数保持无状态、可秒级扩容。
// - 下单成功后仍向 paper_trades / paper_positions 写本地镜像，
//   使后台「模拟交易」视图在纸面/真实两种模式下展示一致。
// - 未配置 FUTU_RELAY_URL 时明确报错，不会静默走纸面，避免「以为下了单其实没下」。

import type { OrderExecutor } from "./types";

const RELAY_URL = (process.env.FUTU_RELAY_URL || "").replace(/\/$/, "");

// Yahoo 风格 "2020.HK" / "AAPL" / "700.HK" → 富途代码 "HK.02020" / "US.AAPL"
export function toFutuCode(symbol: string): string {
  const s = (symbol || "").trim().toUpperCase();
  if (s.includes(".")) {
    const [code, m] = s.split(".");
    if (m === "HK") return `HK.${code.padStart(5, "0")}`;
    if (m === "US") return `US.${code}`;
    if (m === "SH") return `SH.${code}`;
    if (m === "SZ") return `SZ.${code}`;
    return s;
  }
  if (/^[A-Z0-9]+$/.test(s)) return `US.${s}`; // 纯字母/数字默认美股
  return s;
}

export class FutuBrokerExecutor implements OrderExecutor {
  constructor(private supabase: any) {}

  private async relay(path: string, body?: any) {
    if (!RELAY_URL) {
      throw new Error("未配置 FUTU_RELAY_URL：富途中继尚未部署（详见 broker-relay/README.md）");
    }
    const r = await fetch(RELAY_URL + path, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    const d = (await r.json().catch(() => ({}))) as any;
    if (!r.ok || d.error) throw new Error(d.error || `富途中继 HTTP ${r.status}`);
    return d;
  }

  async recordTrade(trade: any) {
    // 1) 真实下单：转发给中继（中继连 OpenD 下单）
    await this.relay("/order", {
      symbol: toFutuCode(trade.symbol),
      side: trade.side === "buy" ? "BUY" : "SELL",
      price: trade.price,
      qty: trade.qty,
    });
    // 2) 本地留痕，供后台「模拟交易」视图一致展示
    await this.supabase.from("paper_trades").insert(trade);
  }

  async setPosition(pos: any) {
    // 本地镜像持仓（真实持仓可定期经中继回查覆盖，此处先保持与纸面一致）
    await this.supabase.from("paper_positions").upsert(pos, { onConflict: "symbol" });
  }
}
