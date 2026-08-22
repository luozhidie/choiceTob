import { upsertTryonEntitlement } from "@/lib/tryon-entitlement";

// 试衣套餐字典（与生产 /api/tryon/notify 一致，抽出来共用，避免漂移）
export const TRYON_PACKAGES: Record<
  string,
  { type: string; days: number; normal: number; pro: number }
> = {
  tryon_first_9_9: { type: "first", days: 365, normal: 10, pro: 0 },
  tryon_normal_month_99: { type: "normal_month", days: 30, normal: 100, pro: 0 },
  tryon_normal_month_299: { type: "normal_month", days: 30, normal: 100, pro: 0 },
  tryon_pro_998: { type: "pro_pack", days: 365, normal: 0, pro: 100 },
  tryon_test_cent: { type: "test", days: 7, normal: 1, pro: 1 },
  tryon_normal_month_59: { type: "normal_month", days: 30, normal: 70, pro: 0 },
  tryon_pro_month_199: { type: "pro_month", days: 30, normal: 0, pro: 200 },
  tryon_pro_year_999: { type: "pro_year", days: 365, normal: 0, pro: 1000 },
};

// 发放/续期试衣权益（按 openid 合并，有效期内续费 normal/pro 次数分别叠加）
// svc: 任意 supabase client（service role 优先）
export async function grantTryonEntitlement(
  svc: any,
  openid: string,
  package_id: string
) {
  const pkg = TRYON_PACKAGES[package_id];
  if (!pkg) {
    console.warn("[试衣权益] 未知套餐", package_id);
    return;
  }
  const now = Date.now();
  const windowMs = pkg.days * 86400000;
  const computedExpires = now + windowMs;

  const { data: exist } = await svc
    .from("tryon_entitlements")
    .select("*")
    .eq("openid", openid)
    .maybeSingle();

  let normalLeft: number;
  let proLeft: number;
  let finalExpires: number;
  let type: string;

  if (exist) {
    const existExpires = new Date(exist.expires_at).getTime();
    finalExpires = Math.max(existExpires, computedExpires);
    const expired = existExpires <= now;
    if (pkg.type === "first") {
      normalLeft = Math.min((exist.normal_left || 0) + pkg.normal, pkg.normal);
      proLeft = Math.min((exist.pro_left || 0) + pkg.pro, pkg.pro);
    } else if (expired) {
      normalLeft = pkg.normal;
      proLeft = pkg.pro;
    } else {
      normalLeft = (exist.normal_left || 0) + pkg.normal;
      proLeft = (exist.pro_left || 0) + pkg.pro;
    }
    type = pkg.type === "first" ? (exist.type !== "first" ? exist.type : "first") : pkg.type;
  } else {
    finalExpires = computedExpires;
    normalLeft = pkg.normal;
    proLeft = pkg.pro;
    type = pkg.type;
  }

  const { schema } = await upsertTryonEntitlement(svc, {
    openid,
    type,
    expires_at: new Date(finalExpires).toISOString(),
    normal_left: normalLeft,
    pro_left: proLeft,
    tries_left: normalLeft + proLeft,
    updated_at: new Date().toISOString(),
  });
  console.log(`[试衣权益发放] 成功 schema=${schema}`, { openid, type, normalLeft, proLeft });
}
