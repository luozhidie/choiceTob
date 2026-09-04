import { upsertTryonEntitlement } from "@/lib/tryon-entitlement";

// 试衣套餐字典（与生产 /api/tryon/notify 一致，抽出来共用，避免漂移）
export const TRYON_PACKAGES: Record<
  string,
  { type: string; days: number; normal: number; pro: number }
> = {
  tryon_first_9_9: { type: "first", days: 365, normal: 12, pro: 0 },
  tryon_normal_month_99: { type: "normal_month", days: 30, normal: 120, pro: 0 },
  // 专业版复购包 ¥299：只加专业次数（与¥998同轨道），原 package_id 保留以兼容已配置的支付回调
  tryon_normal_month_299: { type: "pro_pack", days: 365, normal: 0, pro: 100 },
  tryon_pro_refill_299: { type: "pro_pack", days: 365, normal: 0, pro: 100 },
  tryon_pro_998: { type: "pro_pack", days: 365, normal: 0, pro: 100 },
  tryon_test_cent: { type: "test", days: 7, normal: 1, pro: 1 },
  tryon_normal_month_59: { type: "normal_month", days: 30, normal: 70, pro: 0 },
  tryon_pro_month_199: { type: "pro_month", days: 30, normal: 0, pro: 200 },
  tryon_pro_year_999: { type: "pro_year", days: 365, normal: 0, pro: 1000 },
};

// 套餐归属轨道：pro 系 → 专业版轨道；test → 双轨各给；其余 → 普通版轨道
function tierOf(type: string): ("normal" | "pro")[] {
  if (type === "test") return ["normal", "pro"];
  return type.indexOf("pro") > -1 ? ["pro"] : ["normal"];
}

// 发放/续期试衣权益（按 openid 合并，有效期内续费 normal/pro 次数分别叠加）
// svc: 任意 supabase client（service role 优先）
export async function grantTryonEntitlement(
  svc: any,
  openid: string,
  package_id: string
) {
  const fbPkg = TRYON_PACKAGES[package_id];
  if (!fbPkg) {
    console.warn("[试衣权益] 未知套餐", package_id);
    return;
  }
  // 次数后台可配：site_settings.tryon_packages 覆盖 normal/pro，未配置则用字典兜底
  let overrideMap: any = null;
  try {
    const { data: ovRow } = await svc
      .from("site_settings")
      .select("value")
      .eq("key", "tryon_packages")
      .maybeSingle();
    overrideMap = (ovRow && ovRow.value) || null;
  } catch (e) {
    // 读取失败则使用兜底，不影响发放
  }
  const ov = (overrideMap && overrideMap[package_id]) || {};
  const pkg = {
    type: fbPkg.type,
    days: fbPkg.days,
    normal: typeof ov.normal === "number" ? ov.normal : fbPkg.normal,
    pro: typeof ov.pro === "number" ? ov.pro : fbPkg.pro,
  };
  const now = Date.now();
  const windowMs = pkg.days * 86400000;
  const computedExpires = now + windowMs;

  const { data: exist } = await svc
    .from("tryon_entitlements")
    .select("*")
    .eq("openid", openid)
    .maybeSingle();

  // ===== 双轨独立发放：普通版 / 专业版 各自计数、各自计到期时间 =====
  const tiers = tierOf(pkg.type);
  const patch: any = { openid, updated_at: new Date().toISOString() };

  function calcTier(tier: "normal" | "pro", grant: number) {
    const key = tier === "normal" ? "normal" : "pro";
    // 该轨道到期时间；双轨列尚未迁移时回落单行 expires_at（行为退化为旧模型，不会丢次数）
    let existExp = exist && exist[key + "_expires_at"]
      ? new Date(exist[key + "_expires_at"]).getTime()
      : 0;
    if (!existExp && exist && exist.expires_at) existExp = new Date(exist.expires_at).getTime();

    const expired = !exist || !existExp || existExp <= now;
    const existLeft = exist ? exist[key + "_left"] || 0 : 0;
    const existType = exist ? exist[key + "_type"] : null;

    let left: number;
    let finalExp: number;
    if (!exist || expired) {
      // 首次购买或该轨道已过期 → 重置为该套餐次数，重新计时
      left = grant;
      finalExp = computedExpires;
    } else if (pkg.type === "first") {
      // 首单体验：永不超过首单上限
      left = Math.min(existLeft + grant, grant);
      finalExp = Math.max(existExp, computedExpires);
    } else {
      // 同轨道续费/复购 → 次数累加，到期取最晚
      left = existLeft + grant;
      finalExp = Math.max(existExp, computedExpires);
    }

    let newType = pkg.type;
    if (pkg.type === "first") {
      newType = existType && existType !== "first" ? existType : "first";
    }
    return { left, finalExp, newType };
  }

  if (tiers.indexOf("normal") > -1) {
    const r = calcTier("normal", pkg.normal);
    patch.normal_left = r.left;
    patch.normal_expires_at = new Date(r.finalExp).toISOString();
    patch.normal_type = r.newType;
  }
  if (tiers.indexOf("pro") > -1) {
    const r = calcTier("pro", pkg.pro);
    patch.pro_left = r.left;
    patch.pro_expires_at = new Date(r.finalExp).toISOString();
    patch.pro_type = r.newType;
  }

  // 兼容旧字段（单行共用到期）：两轨取最晚；未变动的轨道沿用原值
  const nLeft = patch.normal_left != null ? patch.normal_left : (exist ? exist.normal_left || 0 : 0);
  const pLeft = patch.pro_left != null ? patch.pro_left : (exist ? exist.pro_left || 0 : 0);
  const nExp = patch.normal_expires_at
    ? new Date(patch.normal_expires_at).getTime()
    : (exist && exist.normal_expires_at ? new Date(exist.normal_expires_at).getTime() : 0);
  const pExp = patch.pro_expires_at
    ? new Date(patch.pro_expires_at).getTime()
    : (exist && exist.pro_expires_at ? new Date(exist.pro_expires_at).getTime() : 0);
  patch.type = patch.pro_type || patch.normal_type || (exist ? exist.type : null) || pkg.type;
  patch.expires_at = new Date(Math.max(nExp, pExp) || computedExpires).toISOString();
  patch.normal_left = nLeft;
  patch.pro_left = pLeft;
  patch.tries_left = nLeft + pLeft;

  const { schema } = await upsertTryonEntitlement(svc, patch);
  console.log(`[试衣权益发放] 成功 schema=${schema}`, {
    openid,
    package_id,
    tiers,
    normalLeft: patch.normal_left,
    proLeft: patch.pro_left,
    normalExp: patch.normal_expires_at,
    proExp: patch.pro_expires_at,
  });

  // 购买 998 专业版 → 永久成为虚拟试衣代理（与店主认证、货款会员独立）
  // 覆盖小程序虚拟支付链路（网站微信支付回调 /api/tryon/notify 已标记，此处不冲突）
  if (package_id === "tryon_pro_998") {
    try {
      const { data: p1 } = await svc.from("profiles").select("id").eq("wechat_openid", openid).maybeSingle();
      const uid =
        p1?.id ||
        (await svc.from("profiles").select("id").eq("wx_openid", openid).maybeSingle()).data?.id;
      if (uid) {
        await svc
          .from("profiles")
          .update({ is_tryon_agent: true, updated_at: new Date().toISOString() })
          .eq("id", uid);
        console.log("[试衣代理] 已标记 is_tryon_agent=true (virtual-pay)", { openid, uid });
      }
    } catch (e) {
      console.error("[试衣代理] 标记失败 (virtual-pay)", e);
    }
  }
}
