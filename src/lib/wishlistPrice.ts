/**
 * 心愿单（需求聚合）模式的价格展示工具
 *
 * 设计：心愿单商品由供货商先上架「无公开价」的图，用户加入心愿单表达需求；
 *       供货商在后台填入真实拿货价（入库为 price，单位分），但前台先「打码」展示，
 *       仅露出个位、其余位打「?」，并给出「价格公开倒计时」。集满 / 倒计时结束后公开真实价格。
 *
 * 公开时间（revealAt）取值优先级：
 *   1) 商品字段 price_reveal_at（若后续加列并写入）
 *   2) 兜底：上架时间 created_at + WISH_PRICE_REVEAL_DAYS 天（无需改表结构即可生效）
 *
 * 展示规则：
 *   - wishlist_mode 且 price>0 且 未到公开时间 → 打码 "¥??9" + 倒计时
 *   - wishlist_mode 且 price>0 且 已到公开时间 → 真实价 "¥259"
 *   - wishlist_mode 且 price=0（历史遗留无价款）→ 维持 "价格待定·心愿收集"
 */

export const WISH_PRICE_REVEAL_DAYS = 7;

/** 取价格公开时间戳（ms） */
export function getPriceRevealAt(p: any, now: number = Date.now()): number {
  if (p && p.price_reveal_at) {
    const t = new Date(p.price_reveal_at).getTime();
    if (!isNaN(t)) return t;
  }
  const base = p && p.created_at ? new Date(p.created_at).getTime() : now;
  return base + WISH_PRICE_REVEAL_DAYS * 86400 * 1000;
}

/** 是否已到公开时间 */
export function isPriceRevealed(p: any, now: number = Date.now()): boolean {
  return now >= getPriceRevealAt(p, now);
}

/**
 * 打码价格：保留个位，其余位打「?」
 * ¥259 → "¥??9"；¥59 → "¥?9"；¥1259 → "¥???9"
 */
export function formatMaskedPrice(priceFen: number | null | undefined): string {
  const yuan = Math.round(Number(priceFen || 0) / 100);
  if (yuan <= 0) return "";
  const s = String(yuan);
  const units = s.slice(-1);
  const mask = "?".repeat(Math.max(0, s.length - 1));
  return "¥" + mask + units;
}

/** 距离公开还剩多少天（向上取整，最小 0） */
export function daysUntil(ts: number, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((ts - now) / 86400000));
}

/** 紧凑倒计时文本：天/时/分/秒 */
export function formatCountdownShort(ts: number, now: number = Date.now()): string {
  let diff = Math.max(0, ts - now);
  const d = Math.floor(diff / 86400000);
  diff -= d * 86400000;
  const h = Math.floor(diff / 3600000);
  diff -= h * 3600000;
  const m = Math.floor(diff / 60000);
  diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  if (d > 0) return `${d}天${h}时${m}分`;
  if (h > 0) return `${h}时${m}分${s}秒`;
  return `${m}分${s}秒`;
}

export interface WishPriceView {
  masked: boolean; // 是否处于打码展示态
  text: string; // 展示文本（¥??9 或 ¥259 或 价格待定·心愿收集）
  revealed: boolean; // 是否已公开真实价
  revealAt: number; // 公开时间戳
  unitsHint: string; // 个位提示字符，如 "9"
  hasRealPrice: boolean; // 是否有真实价可打码
}

/**
 * 计算心愿单商品的价格展示视图
 * @param p 商品对象（需含 wishlist_mode / price / created_at，可选 price_reveal_at / wish_count）
 * @param now 当前时间戳
 */
export function getWishPriceView(p: any, now: number = Date.now()): WishPriceView {
  const hasReal = Number(p?.price || 0) > 0;
  const revealAt = getPriceRevealAt(p, now);
  const revealed = now >= revealAt;
  const yuan = Math.round(Number(p?.price || 0) / 100);
  const unitsHint = String(yuan % 10);

  if (p?.wishlist_mode && hasReal) {
    if (revealed) {
      return {
        masked: false,
        text: `¥${yuan}`,
        revealed: true,
        revealAt,
        unitsHint,
        hasRealPrice: true,
      };
    }
    return {
      masked: true,
      text: formatMaskedPrice(p.price),
      revealed: false,
      revealAt,
      unitsHint,
      hasRealPrice: true,
    };
  }

  // 无真实价的历史遗留心愿款：维持原文案
  return {
    masked: false,
    text: "价格待定·心愿收集",
    revealed: false,
    revealAt,
    unitsHint,
    hasRealPrice: false,
  };
}
