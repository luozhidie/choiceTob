/* ── 双色球真实数据抓取器（方案3） ──
 *
 * 设计原则：
 * 1. 优先抓取真实开奖数据（17500.cn / 500彩票网 / 中彩网）
 * 2. 所有源失败时回退到内置演示数据，保证页面不崩
 * 3. 抓取成功后存储到 Supabase Storage，下次直接读取
 *
 * ⚠️ 注意：部分数据源有反爬（腾讯云EdgeOne/地域限制）。
 * 17500.cn 经测试沙箱可访问且数据最新（到2026年），作为首选源。
 */

import { SsqRecord } from "./analyzer";
import { generateSsqDemoData } from "./analyzer";

/* 解析红球/蓝球字符串 → 数字数组 */
function parseBalls(str: string): number[] {
  return str
    .split(/[,\s]+/)
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n) && n > 0);
}

/**
 * 首选数据源：17500.cn 完整历史 TXT
 * URL: http://data.17500.cn/ssq_asc.txt
 * 格式：期号 日期 红1..红6 蓝 [统计字段...]
 * 经测试沙箱可访问，数据更新至2026年最新一期
 */
async function fetchFrom17500(fetchImpl: typeof fetch): Promise<SsqRecord[] | null> {
  try {
    const res = await fetchImpl("http://data.17500.cn/ssq_asc.txt", {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined,
    } as any);

    if (!res.ok) return null;
    const text = await res.text();

    const lines = text.split("\n").filter(l => l.trim().length > 0);
    const records: SsqRecord[] = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      // 至少要有 期号 + 日期 + 6红 + 1蓝 = 9列
      if (parts.length < 9) continue;

      const issue = parts[0];
      const date = parts[1];
      const reds = parts.slice(2, 8).map(n => parseInt(n, 10)).filter(n => n >= 1 && n <= 33);
      const blue = parseInt(parts[8], 10);

      if (reds.length === 6 && blue >= 1 && blue <= 16 && issue && date) {
        records.push({ issue, date, reds, blue });
      }
    }

    return records.length > 100 ? records : null;
  } catch (e) {
    console.error("[SSQ Fetcher] 17500源失败:", e);
    return null;
  }
}

/**
 * 源2：500彩票网历史数据
 * URL: https://datachart.500.com/ssq/history/newinc/history.php?start=XXXXX&end=YYYYY
 */
async function fetchFrom500(fetchImpl: typeof fetch): Promise<SsqRecord[] | null> {
  try {
    const end = new Date().getFullYear() * 1000 + 999; // e.g. 2026999
    const start = 2003001; // 2003年首期
    const url = `https://datachart.500.com/ssq/history/newinc/history.php?start=${start}&end=${end}`;

    const res = await fetchImpl(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://datachart.500.com/ssq/",
        "Accept": "text/html,application/xhtml+xml",
      },
      // @ts-ignore - Node 18+ 支持
      signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined,
    } as any);

    if (!res.ok) return null;
    const html = await res.text();

    // 解析表格 <tr class="t_tr1"> ... <td>期号</td><td>日期</td><td>红1</td>...<td>蓝</td>
    const rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    const records: SsqRecord[] = [];

    for (const row of rows) {
      const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m =>
        m[1].replace(/<[^>]+>/g, "").trim()
      );
      // 500彩票网格式：期号 | 日期 | 红1 | 红2 | 红3 | 红4 | 红5 | 红6 | 蓝 | 销售额 | 奖池
      if (cells.length >= 9) {
        const issue = cells[0];
        const dateRaw = cells[1];
        const reds = cells.slice(2, 8).map(n => parseInt(n, 10)).filter(n => n > 0);
        const blue = parseInt(cells[8], 10);
        if (reds.length === 6 && blue > 0 && issue) {
          records.push({
            issue,
            date: dateRaw.replace(/\D/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""),
            reds,
            blue,
          });
        }
      }
    }

    return records.length > 100 ? records : null;
  } catch {
    return null;
  }
}

/**
 * 源2：中彩网官方 API
 * URL: https://www.cwl.gov.cn/cwl_admin/front/cwlkj/ssq/kjgg
 */
async function fetchFromCWL(fetchImpl: typeof fetch): Promise<SsqRecord[] | null> {
  try {
    const res = await fetchImpl(
      "https://www.cwl.gov.cn/cwl_admin/front/cwlkj/ssq/kjgg?issueStart=2003001&issueEnd=2099999",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Referer": "https://www.cwl.gov.cn/cwl_web/views/ssq/history.html",
        },
        signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined,
      } as any
    );

    if (!res.ok) return null;
    const text = await res.text();
    if (text.includes("<!DOCTYPE") || text.includes("<html")) return null;

    const json = JSON.parse(text);
    const list = json?.data?.result || json?.data || json?.list;
    if (!Array.isArray(list)) return null;

    const records: SsqRecord[] = [];
    for (const item of list) {
      const reds = parseBalls(item.red || item.redball || item.reds || "");
      const blue = parseInt(item.blue || item.blueball || item.blueball || "0", 10);
      if (reds.length === 6 && blue > 0) {
        records.push({
          issue: item.code || item.issue || item.qihao || "",
          date: (item.date || item.time || "").toString().slice(0, 10),
          reds,
          blue,
        });
      }
    }
    return records.length > 100 ? records : null;
  } catch {
    return null;
  }
}

/**
 * 主函数：尝试所有源，失败回退演示数据
 * @param fetchImpl fetch 实现（Node 全局或 polyfill）
 * @returns { records, source } source 为 "17500" | "500" | "cwl" | "demo"
 */
export async function fetchSsqData(
  fetchImpl: typeof fetch = fetch
): Promise<{ records: SsqRecord[]; source: string; updatedAt: string }> {
  // 按优先级尝试真实源（17500.cn 沙箱可访问且最新，首选）
  const sources = [
    { name: "17500", fn: fetchFrom17500 },
    { name: "500", fn: fetchFrom500 },
    { name: "cwl", fn: fetchFromCWL },
  ];

  for (const src of sources) {
    try {
      const records = await src.fn(fetchImpl);
      if (records && records.length > 100) {
        console.log(`[SSQ Fetcher] 数据源 ${src.name} 成功，共 ${records.length} 期`);
        return { records, source: src.name, updatedAt: new Date().toISOString() };
      }
    } catch (e) {
      console.error(`[SSQ Fetcher] 数据源 ${src.name} 失败:`, e);
    }
  }

  // 全部失败 → 回退演示数据
  console.log("[SSQ Fetcher] 所有真实源失败，回退演示数据");
  return { records: generateSsqDemoData(), source: "demo", updatedAt: new Date().toISOString() };
}

/* ── Supabase Storage 键 ── */
export const SSQ_DATA_PATH = "lottery/ssq-data.json";

/**
 * 保存抓取结果到 Supabase Storage
 */
export async function saveSsqData(
  supabaseAdmin: any,
  data: { records: SsqRecord[]; source: string; updatedAt: string }
): Promise<boolean> {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const { error } = await supabaseAdmin.storage
      .from("products")
      .upload(SSQ_DATA_PATH, blob, { upsert: true });
    if (error) {
      console.error("[SSQ Fetcher] 保存失败:", error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.error("[SSQ Fetcher] 保存异常:", e.message);
    return false;
  }
}

/**
 * 从 Supabase Storage 读取真实数据（如果存在）
 */
export async function loadSsqData(
  supabaseAdmin: any
): Promise<{ records: SsqRecord[]; source: string; updatedAt: string } | null> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from("products")
      .download(SSQ_DATA_PATH);
    if (error || !data) return null;
    const text = await data.text();
    const json = JSON.parse(text);
    if (json?.records && Array.isArray(json.records) && json.records.length > 100) {
      return json;
    }
    return null;
  } catch {
    return null;
  }
}
