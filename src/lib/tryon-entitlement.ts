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

export async function upsertTryonEntitlement(supabase: any, payload: EntitlementPayload) {
  const { error } = await supabase
    .from("tryon_entitlements")
    .upsert(payload, { onConflict: "openid" });

  if (!error) return { schema: "split" as const };

  const msg = error.message || "";
  if (msg.includes("normal_left") || msg.includes("pro_left")) {
    const legacyPayload = {
      openid: payload.openid,
      type: payload.type,
      expires_at: payload.expires_at,
      tries_left: payload.tries_left,
      updated_at: payload.updated_at,
    };
    const { error: err2 } = await supabase
      .from("tryon_entitlements")
      .upsert(legacyPayload, { onConflict: "openid" });
    if (err2) throw err2;
    return { schema: "legacy" as const };
  }

  throw error;
}

export function shapeEntitlement(row: any) {
  const now = Date.now();
  const expires = row ? new Date(row.expires_at).getTime() : 0;
  const normalLeft = row ? row.normal_left || 0 : 0;
  const proLeft = row ? row.pro_left || 0 : 0;
  // 旧表结构只有 tries_left
  const triesLeft = row ? row.tries_left ?? normalLeft + proLeft : 0;
  const active = expires > now && (normalLeft > 0 || proLeft > 0 || triesLeft > 0);
  const daysLeft = expires > now ? Math.max(0, Math.ceil((expires - now) / 86400000)) : 0;
  return {
    active,
    type: row ? row.type : null,
    daysLeft,
    normalLeft,
    proLeft,
    triesLeft,
    expires: row ? row.expires_at : null,
  };
}
