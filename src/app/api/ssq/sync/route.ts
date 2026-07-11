import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { fetchSsqData, saveSsqData } from "@/lib/lottery/fetcher";

/* ════════════════════════════════════════
   POST /api/ssq/sync
   触发双色球真实数据同步（方案3）
   - 尝试从 500彩票网 / 中彩网 抓取
   - 成功则存储到 Supabase Storage
   - 失败则回退演示数据
   ════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();

    console.log("[SSQ Sync] 开始同步...");
    const { records, source, updatedAt } = await fetchSsqData(fetch);

    const saved = await saveSsqData(supabase, { records, source, updatedAt });

    return NextResponse.json({
      success: true,
      source, // "500" | "cwl" | "demo"
      totalDraws: records.length,
      updatedAt,
      savedToStorage: saved,
      message: source === "demo"
        ? "⚠️ 真实数据源被拦截，已回退演示数据（沙箱环境常见）。Vercel生产环境通常可正常抓取。"
        : `✅ 已从${source === "500" ? "500彩票网" : "中彩网"}同步 ${records.length} 期数据`,
    });
  } catch (error: any) {
    console.error("[SSQ Sync] 错误:", error);
    return NextResponse.json(
      { error: error.message || "同步失败" },
      { status: 500 }
    );
  }
}

/* GET 也支持触发（方便直接浏览器访问） */
export async function GET(request: NextRequest) {
  return POST(request);
}
