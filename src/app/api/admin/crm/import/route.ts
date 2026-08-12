// CRM 批量导入 API - 使用 service_role 绕过 RLS
// 支持：门店(stores) / 联系人(contacts) 两种类型
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const VALID_INDUSTRIES = new Set(["服装店", "轮胎店", "滋补行", "其他"]);
const VALID_SOURCES = new Set(["manual", "import", "scrape"]);
const VALID_STATUSES = new Set(["active", "inactive", "closed"]);

function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量，请联系管理员在 .env.local / Vercel 中配置"
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { type, records } = body;

    if (!type || (type !== "stores" && type !== "contacts")) {
      return NextResponse.json({ error: "缺少或无效 type（应为 stores/contacts）" }, { status: 400 });
    }
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "缺少 records" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    if (type === "stores") {
      const rows = records.map((r: any) => ({
        name: r.name || "",
        owner_phone: r.owner_phone || r.phone || "待补充",
        address: r.address || "",
        owner_name: r.owner_name || "",
        industry: VALID_INDUSTRIES.has(r.industry) ? r.industry : "其他",
        business_scope: r.business_scope || "",
        source: VALID_SOURCES.has(r.source) ? r.source : "import",
        source_detail: r.source_detail || "",
        status: VALID_STATUSES.has(r.status) ? r.status : "active",
        notes: r.notes || r.remark || "",
      }));

      const { error } = await supabase.from("crm_stores").insert(rows);

      if (error) {
        errors.push(`批量插入失败：${error.message}`);
        failed = rows.length;
      } else {
        success = rows.length;
      }
    } else {
      // contacts：按 store_name 匹配 store_id
      const storeNames = [
        ...new Set(records.map((r: any) => r.store_name).filter(Boolean)),
      ];

      const { data: stores, error: storeError } = await supabase
        .from("crm_stores")
        .select("id, name")
        .in("name", storeNames)
        .is("deleted_at", null);

      if (storeError) {
        return NextResponse.json(
          { error: `查询门店失败：${storeError.message}` },
          { status: 500 }
        );
      }

      const storeMap = new Map((stores || []).map((s: any) => [s.name, s.id]));
      const contactRows: any[] = [];

      for (const r of records) {
        const storeId = storeMap.get(r.store_name);
        if (!storeId) {
          errors.push(`${r.name || "联系人"}：未找到门店"${r.store_name}"`);
          failed++;
          continue;
        }
        contactRows.push({
          store_id: storeId,
          name: r.name || "",
          phone: r.phone || "",
          position: r.position || "",
          wechat_id: r.wechat_id || "",
          is_decision_maker:
            r.is_decision_maker === true ||
            r.is_decision_maker === "是" ||
            r.is_decision_maker === "true",
          remark: r.remark || "",
        });
      }

      if (contactRows.length > 0) {
        const { error } = await supabase.from("crm_contacts").insert(contactRows);
        if (error) {
          errors.push(`批量插入失败：${error.message}`);
          failed += contactRows.length;
        } else {
          success += contactRows.length;
        }
      }
    }

    return NextResponse.json({
      ok: errors.length === 0 || (type === "contacts" && success > 0),
      total: records.length,
      success,
      failed,
      errors,
    });
  } catch (err: any) {
    console.error("[CRM导入API] 错误:", err);
    return NextResponse.json(
      { success: false, error: err.message || "未知错误" },
      { status: 500 }
    );
  }
}
