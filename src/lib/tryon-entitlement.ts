// lib/tryon-entitlement.ts
// 兼容旧版 tryon_entitlements 表结构（无 normal_left/pro_left 列时回落到 tries_left）

export interface EntitlementPayload {
  openid: string;
  type: string;
  expires_at: string;
  normal_left: number;
  pro_left: number;
  tries_left: number;
  updated_at: string;
}

export async function upsertTryonEntitlement(supabase: any, payload: any) {
  // 1) 首选：完整双轨字段写入
  const { error } = await supabase
    .from("tryon_entitlements")
    .upsert(payload, { onConflict: "openid" });
  if (!error) return { schema: "split" as const };

  // 2) 回落：双轨列不存在时，退回旧的分档字段（openid/type/expires_at/normal_left/pro_left/tries_left）
  const legacyPayload = {
    openid: payload.openid,
    type: payload.type,
    expires_at: payload.expires_at,
    normal_left: payload.normal_left,
    pro_left: payload.pro_left,
    tries_left: payload.tries_left,
    updated_at: payload.updated_at,
  };
  const { error: err2 } = await supabase
    .from("tryon_entitlements")
    .upsert(legacyPayload, { onConflict: "openid" });
  if (!err2) return { schema: "legacy" as const };

  // 3) 再回落：极旧表只有 tries_left
  const minimalPayload = {
    openid: payload.openid,
    type: payload.type,
    expires_at: payload.expires_at,
    tries_left: payload.tries_left,
    updated_at: payload.updated_at,
  };
  const { error: err3 } = await supabase
    .from("tryon_entitlements")
    .upsert(minimalPayload, { onConflict: "openid" });
  if (!err3) return { schema: "minimal" as const };

  throw err3 || err2 || error;
}

export function shapeEntitlement(row: any) {
  const now = Date.now();

  // 按轨道独立计算：轨道内 到期时间 与 剩余次数 各自判断
  function track(typeKey: string, expKey: string, leftKey: string) {
    // 双轨列尚未迁移时回落单行 expires_at（退化旧模型，不会误判为过期）
    let exp = row && row[expKey] ? new Date(row[expKey]).getTime() : 0;
    if (!exp && row && row.expires_at) exp = new Date(row.expires_at).getTime();

    const left = row ? row[leftKey] || 0 : 0;
    const alive = exp > now && left > 0;
    const days = exp > now ? Math.max(0, Math.ceil((exp - now) / 86400000)) : 0;
    return {
      active: alive,
      type: (row && row[typeKey]) || null,
      left,
      daysLeft: days,
      expires: (row && row[expKey]) || null,
    };
  }

  const normal = track("normal_type", "normal_expires_at", "normal_left");
  const pro = track("pro_type", "pro_expires_at", "pro_left");

  // 兼容旧字段（旧客户端 / 旧表结构仍读这些）
  const expires = row && row.expires_at ? new Date(row.expires_at).getTime() : 0;
  const triesLeft = row ? (row.tries_left ?? normal.left + pro.left) : 0;
  const legacyActive =
    row && row.normal_left == null && row.pro_left == null
      ? expires > now && triesLeft > 0 // 旧表只有 tries_left
      : normal.active || pro.active;

  return {
    active: legacyActive,
    type: (row && row.type) || null,
    daysLeft: Math.max(normal.daysLeft, pro.daysLeft),
    normalLeft: normal.left,
    proLeft: pro.left,
    triesLeft,
    expires: (row && row.expires_at) || null,
    // 双轨明细：普通版 / 专业版 独立
    normal,
    pro,
  };
}
