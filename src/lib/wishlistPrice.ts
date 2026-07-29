/**
 * 心愿收集款 · 盲盒模式价格展示工具
 *
 * 设计：供货商把「还不知道拿货价 / 想先试探需求」的款标记为心愿收集（wishlist_mode）。
 *       用户加入心愿单即记为 1 件（wish_count 按件累计）。件数越多，解锁的价格档位越高：
 *         - 0 件        → 盲盒态：打码预览「¥??9」（仅露个位，按拿货价打码），集单中
 *         - 集齐 1 手（5 件）   → 开「拿货价」(wholesale_price)，店主可去拿货
 *         - 集齐 5 手（25 件）  → 开「批量价」(bulk_price)，店主可批量拿
 *         - 25 件以上  → 已达批量价；单量越爆，店主酌情再让利（手动调价）
 *
 * 服装行话：1 手 = 5 件（PIECES_PER_HAND）。解锁阈值以「手」为语义单位，
 * 内部乘以每手件数换算成 wish_count（件）进行比较。若行话改成 1 手 = N 件，
 * 只需改 PIECES_PER_HAND 一处即可。
 *
 * 展示规则：
 *   - wishlist_mode 且有真实价，0 件     → 打码 "¥??9" + 集单进度（再集 X 件开拿货价）
 *   - wishlist_mode 且有真实价，≥5 件    → 真实拿货价 "¥128"
 *   - wishlist_mode 且有真实价，≥25 件   → 真实批量价 "¥120"
 *   - wishlist_mode 但无任何价（店主尚未拿货）→ 维持 "价格待定·盲盒集单"
 */

/** 服装行话：1 手 = 多少件 */
export const PIECES_PER_HAND = 5;
/** 集齐多少手开「拿货价」 */
export const BLINDBOX_WHOLESALE_HANDS = 1;
/** 集齐多少手开「批量价」 */
export const BLINDBOX_BULK_HANDS = 5;

/** 解锁阈值（件）= 手数 × 每手件数 */
export const BLINDBOX_WHOLESALE_PIECES = BLINDBOX_WHOLESALE_HANDS * PIECES_PER_HAND; // 5
export const BLINDBOX_BULK_PIECES = BLINDBOX_BULK_HANDS * PIECES_PER_HAND; // 25

function yuanOf(fen: number | null | undefined): number {
  return Math.round(Number(fen || 0) / 100);
}

/**
 * 打码价格：保留个位，其余位打「?」
 * ¥259 → "¥??9"；¥59 → "¥?9"；¥1259 → "¥???9"
 */
export function formatMaskedPrice(priceFen: number | null | undefined): string {
  const yuan = yuanOf(priceFen);
  if (yuan <= 0) return "";
  const s = String(yuan);
  const units = s.slice(-1);
  const mask = "?".repeat(Math.max(0, s.length - 1));
  return "¥" + mask + units;
}

export interface WishPriceView {
  isBlindbox: boolean; // 是否盲盒（心愿收集）款
  hasPrice: boolean; // 是否有价格可打码/展示
  tier: "blind" | "wholesale" | "bulk"; // 当前已解锁档位
  masked: boolean; // 当前是否处于打码态
  text: string; // 主展示文本（¥??9 或 ¥128 或 价格待定·盲盒集单）
  unitsHint: string; // 个位提示字符，如 "9"
  revealed: boolean; // 是否已解锁真实价（tier !== blind）
  hands: number; // 当前件数（= wish_count）
  tierLabel: string; // 档位标签：盲盒·集单中 / 已开拿货价 / 已开批量价
  progressText: string; // 进度文案：再集 X 件开拿货价 / 再集 X 件开批量价 / 已达批量价…
  statusText: string; // 综合状态文案
}

/**
 * 计算心愿收集（盲盒）款的价格展示视图。
 * @param p 商品对象（需含 wishlist_mode / wish_count，可选 wholesale_price / bulk_price / price）
 */
export function getWishPriceView(p: any): WishPriceView {
  const pieces = Math.max(0, Math.floor(Number(p?.wish_count) || 0)); // 件数（wish_count）
  const wholesale = yuanOf(p?.wholesale_price); // 拿货价（元）
  const bulk = yuanOf(p?.bulk_price); // 批量价（元）
  const retail = yuanOf(p?.price); // 零售价（元）

  // 打码预览的目标价（分）：优先拿货价（即 1 手解锁的价），其次零售价
  const teaserFen = wholesale > 0 ? Number(p?.wholesale_price || 0) : Number(p?.price || 0);
  const teaser = yuanOf(teaserFen); // 元
  const hasPrice = teaser > 0;

  let tier: WishPriceView["tier"] = "blind";
  let shown = 0; // 当前展示的真实价（元）
  let text = "";
  let masked = true;

  if (pieces >= BLINDBOX_BULK_PIECES) {
    tier = "bulk";
    shown = bulk > 0 ? bulk : wholesale > 0 ? wholesale : retail;
    text = shown > 0 ? `¥${shown}` : "价格待定·盲盒集单";
    masked = false;
  } else if (pieces >= BLINDBOX_WHOLESALE_PIECES) {
    tier = "wholesale";
    shown = wholesale > 0 ? wholesale : retail;
    text = shown > 0 ? `¥${shown}` : "价格待定·盲盒集单";
    masked = false;
  } else {
    tier = "blind";
    shown = teaser;
    if (hasPrice) {
      text = formatMaskedPrice(teaserFen);
      masked = true;
    } else {
      text = "价格待定·盲盒集单";
      masked = false;
    }
  }

  const unitsHint = String(shown % 10);

  const tierLabel =
    tier === "blind"
      ? "盲盒·集单中"
      : tier === "wholesale"
        ? "已开拿货价"
        : "已开批量价";

  let progressText = "";
  let statusText = "";
  if (tier === "blind") {
    const need = BLINDBOX_WHOLESALE_PIECES - pieces;
    progressText = need > 0 ? `再集 ${need} 件开拿货价` : `集齐开拿货价`;
    statusText = `集齐 ${BLINDBOX_WHOLESALE_HANDS} 手（${BLINDBOX_WHOLESALE_PIECES} 件）· 店主去拿货开价`;
  } else if (tier === "wholesale") {
    const need = BLINDBOX_BULK_PIECES - pieces;
    progressText = need > 0 ? `再集 ${need} 件开批量价` : `集齐开批量价`;
    statusText = `已开拿货价 · 集齐 ${BLINDBOX_BULK_HANDS} 手（${BLINDBOX_BULK_PIECES} 件）开批量价`;
  } else {
    progressText = `已达批量价 · 继续集单店主再让利`;
    statusText = `已开批量价 · 单量越爆价越优`;
  }

  return {
    isBlindbox: !!p?.wishlist_mode,
    hasPrice,
    tier,
    masked,
    text,
    unitsHint,
    revealed: tier !== "blind",
    hands: pieces,
    tierLabel,
    progressText,
    statusText,
  };
}
