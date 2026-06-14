import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, HeadingLevel,
  PageBreak,
} from "docx";
import { getStyleProLabel, getColorSeasonProLabel, COLOR_SEASONS_PRO } from "@/lib/styles";

// 12季色彩色卡配置（6组×5色）
const SEASON_PALETTE: Record<string, string[]> = {
  light_warm:  ["#FFE4E6", "#FFB6C1", "#FF69B4", "#FF1493", "#DB7093"],
  warm_bright:  ["#FFD700", "#FFA500", "#FF8C00", "#E9967A", "#F4A460"],
  clear_warm:  ["#FF4500", "#FF6347", "#FF7F50", "#FFA07A", "#FFDAB9"],
  light_cool:  ["#E0F7FA", "#B2EBF2", "#80DEEA", "#4DD0E1", "#26C6DA"],
  soft_cool:   ["#E8EAF6", "#C5CAE9", "#9FA8DA", "#7986CB", "#5C6BC0"],
  cool_soft:   ["#E0F2F1", "#B2DFDB", "#80CBC4", "#4DB6AC", "#26A69A"],
  warm_soft:   ["#FFF3E0", "#FFE0B2", "#FFCC80", "#FFB74D", "#FFA726"],
  soft_warm:   ["#EFEBE9", "#D7CCC8", "#BCAAA4", "#A1887F", "#8D6E63"],
  deep_warm:   ["#4E342E", "#5D4037", "#6D4C41", "#795548", "#8D6E63"],
  clear_cool:  ["#1A237E", "#283593", "#303F9F", "#3949AB", "#3F51B5"],
  cool_bright:  ["#EDE7F6", "#D1C4E9", "#B39DDB", "#9575CD", "#7E57C2"],
  deep_cool:   ["#1C2331", "#263238", "#37474F", "#455A64", "#546E7A"],
};

export async function POST(req: NextRequest) {
  // 检查用户是否已登录
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  
  const { storeId, season, reportType = "basic" } = await req.json();
  if (!storeId) return NextResponse.json({ error: "缺少 storeId" }, { status: 400 });

  // 1. 加载数据
  const [{ data: store }, { data: customers }, { data: structure },
    { data: matrix }, { data: waves }, { data: evaluations },
    { data: inventory }, { data: orders }] = await Promise.all([
    supabase.from("stores").select("*").eq("id", storeId).single(),
    supabase.from("vip_customers").select("color_season, main_style").eq("store_id", storeId),
    supabase.from("product_structure_plan").select("*").eq("store_id", storeId).maybeSingle(),
    supabase.from("product_matrix_plan").select("*").eq("store_id", storeId).maybeSingle(),
    supabase.from("wave_plan").select("*").eq("store_id", storeId).order("wave_number"),
    supabase.from("product_evaluation").select("*").eq("store_id", storeId),
    supabase.from("inventory").select("*").eq("store_id", storeId),
    supabase.from("purchase_orders").select("*").eq("store_id", storeId),
  ]);

  // 2. 客群分析
  const colorDist: Record<string, number> = {};
  const styleDist: Record<string, number> = {};
  (customers || []).forEach((c: any) => {
    if (c.color_season) colorDist[c.color_season] = (colorDist[c.color_season] || 0) + 1;
    if (c.main_style) styleDist[c.main_style] = (styleDist[c.main_style] || 0) + 1;
  });

  const isPremium = reportType === "premium";

  // 3. 生成文档
  const doc = new Document({
    styles: {
      default: { document: { run: { font: "微软雅黑", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal",
          run: { size: 36, bold: true, color: "2E75B6" },
          paragraph: { spacing: { before: 480, after: 240 } } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal",
          run: { size: 28, bold: true, color: "444444" },
          paragraph: { spacing: { before: 300, after: 160 } } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal",
          run: { size: 24, bold: true },
          paragraph: { spacing: { before: 200, after: 120 } } },
      ],
    },
    sections: [{
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      children: [
        // 封面
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2400, after: 600 },
          children: [new TextRun({ text: isPremium ? "骆芷蝶智选 · 商品企划案" : "商品企划报告", size: 56, bold: true, color: "2E75B6" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 },
          children: [new TextRun({ text: season || "2025-2026 秋冬", size: 32, bold: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
          children: [new TextRun({ text: store?.name || "骆芷蝶智选", size: 28 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
          children: [new TextRun({ text: `生成日期：${new Date().toLocaleDateString("zh-CN")}`, size: 22, color: "888888" })] }),
        new Paragraph({ children: [new PageBreak()] }),

        // 第一章：品牌定位
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("一、品牌定位")] }),
        new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: `品牌名称：${store?.name || "骆芷蝶智选"}`, size: 24 })] }),
        new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: "品牌定位：Personal Color 专属色彩搭配顾问", size: 24 })] }),
        new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: "核心理念：先诊断人，再匹配货——12季色彩×13风格精准匹配", size: 24 })] }),
        new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: "服务特色：色彩诊断 + 风格测试 + 穿搭方案 + 买手选品", size: 24 })] }),
        new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: `店铺地址：${store?.address || "—"}`, size: 24 })] }),

        // 专业版：12季色彩体系色卡
        ...(isPremium ? buildAllSeasonPaletteTables() : []),

        // 第二章：客群分析
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("二、客群分析")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 色彩季型分布")] }),
        buildDistTable(colorDist, "色彩季型"),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 风格类型分布")] }),
        buildDistTable(styleDist, "风格类型"),

        // 第三章：商品结构规划
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("三、商品结构规划")] }),
        ...(structure?.items?.length > 0
          ? [buildStructureTable(structure.items)]
          : [new Paragraph({ children: [new TextRun("暂无数据，请在「商品企划」页面先完成规划。")] })]),

        // 第四章：96格商品矩阵
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("四、96格商品矩阵（季型×风格）")] }),
        ...(matrix?.matrix_data ? [buildMatrixTable(matrix.matrix_data)] : [new Paragraph({ children: [new TextRun("暂无数据")] })]),

        // 第五章：上货波段企划
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("五、上货波段企划")] }),
        ...(waves && waves.length > 0 ? waves.flatMap((w: any) => buildWaveSection(w, isPremium)) : [new Paragraph({ children: [new TextRun("暂无数据")] })]),

        // 第六章：选品评估汇总
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("六、选品评估汇总")] }),
        ...(evaluations && evaluations.length > 0 ? [buildEvaluationTable(evaluations)] : [new Paragraph({ children: [new TextRun("暂无数据")] })]),

        // 第七章：库存建议
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("七、库存建议")] }),
        ...(inventory && inventory.length > 0 ? [buildInventoryTable(inventory)] : [new Paragraph({ children: [new TextRun("暂无数据")] })]),

        // 第八章：采购订单汇总
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("八、采购订单汇总")] }),
        ...(orders && orders.length > 0 ? [buildOrderTable(orders)] : [new Paragraph({ children: [new TextRun("暂无数据")] })]),

        // 结尾
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2000 },
          children: [new TextRun({ text: "—— 报告结束 ——", size: 24, color: "888888", bold: true })] }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const fileName = isPremium
    ? `商品企划案_专业版_${store?.name || "店铺"}_${season || "2025"}.docx`
    : `商品企划报告_${store?.name || "店铺"}_${season || "2025"}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  });
}

// ========== 辅助函数 ==========

/** 判断颜色是否偏亮（用于决定文字颜色） */
function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substr(0, 2), 16);
  const g = parseInt(h.substr(2, 2), 16);
  const b = parseInt(h.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

/** 12季色彩体系色卡（专业版专属） */
function buildAllSeasonPaletteTables(): (Paragraph | Table)[] {
  const children: (Paragraph | Table)[] = [];
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const groups = [
    { label: "春（暖色调、高明度、高艳度）", keys: ["light_warm", "warm_bright", "clear_warm"] },
    { label: "夏（冷色调、高明度、低艳度）", keys: ["light_cool", "soft_cool", "cool_soft"] },
    { label: "秋（暖色调、低明度、低艳度）", keys: ["warm_soft", "soft_warm", "deep_warm"] },
    { label: "冬（冷色调、低明度、高艳度）", keys: ["clear_cool", "cool_bright", "deep_cool"] },
  ];

  for (const group of groups) {
    children.push(
      new Paragraph({ spacing: { before: 200, after: 120 }, children: [new TextRun({ text: group.label, size: 22, bold: true, color: "2E75B6" })] })
    );
    for (const key of group.keys) {
      const seasonInfo = COLOR_SEASONS_PRO.find((c: any) => c.value === key);
      const colors = SEASON_PALETTE[key] || ["#CCCCCC"];
      children.push(
        new Paragraph({ spacing: { before: 120, after: 80 }, children: [new TextRun({ text: seasonInfo?.label || key, size: 20, bold: true })] })
      );
      const colorCells = colors.map((hex: string) =>
        new TableCell({
          width: { size: 1400, type: WidthType.DXA },
          shading: { fill: hex.replace("#", ""), type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: hex, size: 14, color: isLightColor(hex) ? "000000" : "FFFFFF" })] })],
          borders: { top: border, bottom: border, left: border, right: border },
        })
      );
      children.push(
        new Table({
          width: { size: 7000, type: WidthType.DXA },
          columnWidths: [1400, 1400, 1400, 1400, 1400],
          rows: [new TableRow({ children: colorCells })],
        })
      );
    }
  }
  return children;
}

/** 分布表格 */
function buildDistTable(dist: Record<string, number>, label: string) {
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };

  const headerCells = [
    new TableCell({
      shading: { fill: "2E75B6", type: ShadingType.CLEAR },
      children: [new Paragraph({ children: [new TextRun({ text: label, color: "FFFFFF", bold: true })] })],
      borders: { top: border, bottom: border, left: border, right: border },
      width: { size: 4000, type: WidthType.DXA },
    }),
    new TableCell({
      shading: { fill: "2E75B6", type: ShadingType.CLEAR },
      children: [new Paragraph({ children: [new TextRun({ text: "人数", color: "FFFFFF", bold: true })] })],
      borders: { top: border, bottom: border, left: border, right: border },
      width: { size: 2000, type: WidthType.DXA },
    }),
    new TableCell({
      shading: { fill: "2E75B6", type: ShadingType.CLEAR },
      children: [new Paragraph({ children: [new TextRun({ text: "占比", color: "FFFFFF", bold: true })] })],
      borders: { top: border, bottom: border, left: border, right: border },
      width: { size: 2000, type: WidthType.DXA },
    }),
  ];

  const bodyRows = Object.entries(dist).map(([key, count]) => {
    const pct = ((count / total) * 100).toFixed(1);
    const display = label === "色彩季型"
      ? (getColorSeasonProLabel(key) || key)
      : (getStyleProLabel(key) || key);
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(display)], borders: { top: border, bottom: border, left: border, right: border }, width: { size: 4000, type: WidthType.DXA } }),
        new TableCell({ children: [new Paragraph(String(count))], borders: { top: border, bottom: border, left: border, right: border }, width: { size: 2000, type: WidthType.DXA } }),
        new TableCell({ children: [new Paragraph(pct + "%")], borders: { top: border, bottom: border, left: border, right: border }, width: { size: 2000, type: WidthType.DXA } }),
      ],
    });
  });

  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [4000, 2000, 2000],
    rows: [new TableRow({ children: headerCells }), ...bodyRows],
  });
}

/** 商品结构表格 */
function buildStructureTable(items: any[]) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const headerCells = ["品类", "占比%", "SKU数", "毛利率%", "目标销售额"].map(h =>
    new TableCell({
      shading: { fill: "2E75B6", type: ShadingType.CLEAR },
      children: [new Paragraph({ children: [new TextRun({ text: h, color: "FFFFFF", bold: true })] })],
      borders: { top: border, bottom: border, left: border, right: border },
    })
  );

  const bodyRows = items.map((item: any) =>
    new TableRow({
      children: [
        item.category || "—", String(item.pct || 0), String(item.sku || 0),
        String(item.margin || 0), `¥${(item.sales || 0).toLocaleString()}`
      ].map(v =>
        new TableCell({
          children: [new Paragraph(v)],
          borders: { top: border, bottom: border, left: border, right: border },
        })
      ),
    })
  );

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2360, 1400, 1400, 1800, 2400],
    rows: [new TableRow({ children: headerCells }), ...bodyRows],
  });
}

/** 96格矩阵完整表格 */
function buildMatrixTable(matrixData: any) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const ALL_STYLES = [
    { value: "shao_nv", proLabel: "少女型" },
    { value: "you_ya", proLabel: "优雅型" },
    { value: "lang_man_f", proLabel: "浪漫型" },
    { value: "shao_nian_f", proLabel: "少年型" },
    { value: "shi_shang_f", proLabel: "时尚型" },
    { value: "gu_dian_f", proLabel: "古典型" },
    { value: "zi_ran_f", proLabel: "自然型" },
    { value: "xi_ju_f", proLabel: "戏剧型" },
    { value: "xi_ju_m", proLabel: "戏剧型" },
    { value: "zi_ran_m", proLabel: "自然型" },
    { value: "gu_dian_m", proLabel: "古典型" },
    { value: "lang_man_m", proLabel: "浪漫型" },
    { value: "shi_shang_m", proLabel: "时尚型" },
  ];

  const headerCells = ALL_STYLES.map(s =>
    new TableCell({
      shading: { fill: "4F46E5", type: ShadingType.CLEAR },
      children: [new Paragraph({ children: [new TextRun({ text: s.proLabel, color: "FFFFFF", bold: true, size: 16 })] })],
      borders: { top: border, bottom: border, left: border, right: border },
    })
  );
  const headerRow = new TableRow({
    children: [
      new TableCell({
        shading: { fill: "2E75B6", type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: "季型＼风格", color: "FFFFFF", bold: true, size: 16 })] })],
        borders: { top: border, bottom: border, left: border, right: border },
      }),
      ...headerCells,
    ],
  });

  const bodyRows = COLOR_SEASONS_PRO.map((seasonInfo: any) => {
    const labelCell = new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: seasonInfo.label, size: 16, bold: true })] })],
      borders: { top: border, bottom: border, left: border, right: border },
    });
    const dataCells = ALL_STYLES.map((st) => {
      const cell = matrixData[seasonInfo.value]?.[st.value] || { sku: 0, pct: 0, budget: 0 };
      return new TableCell({
        children: [new Paragraph({ children: [
          new TextRun({ text: `SKU:${cell.sku}`, size: 14 }),
          new TextRun({ text: `\n占比:${cell.pct}%`, size: 14 }),
          new TextRun({ text: `\n¥${((cell.budget || 0) / 10000).toFixed(1)}万`, size: 14 }),
        ] })],
        borders: { top: border, bottom: border, left: border, right: border },
      });
    });
    return new TableRow({ children: [labelCell, ...dataCells] });
  });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1200, ...ALL_STYLES.map(() => 630)],
    rows: [headerRow, ...bodyRows],
  });
}

/** 波段计划（Supalema风格），返回顶级文档元素数组 */
function buildWaveSection(w: any, isPremium: boolean): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  elements.push(
    new Paragraph({ spacing: { before: 200, after: 120 },
      children: [new TextRun({ text: `第${w.wave_number}波：${w.wave_name || w.plan_date || "—"}`, bold: true, size: 24 })] })
  );

  if (w.theme_name || w.inspiration) {
    elements.push(
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `  主题：${w.theme_name || "—"}`, size: 20 })] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `  灵感来源：${w.inspiration || "—"}`, size: 20 })] }),
    );
  }

  elements.push(
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `  上货日期：${w.plan_date || "—"}`, size: 20 })] }),
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `  占比：${w.pct || 0}%  SKU数：${w.sku_count || 0}  金额：¥${(w.amount || 0).toLocaleString()}`, size: 20 })] }),
  );

  if (w.core_categories && w.core_categories.length > 0) {
    elements.push(
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `  核心品类：${w.core_categories.join("、")}`, size: 20 })] })
    );
  }

  if (w.marketing_activity) {
    elements.push(
      new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: `  营销活动：${w.marketing_activity}`, size: 20 })] })
    );
  }

  // 专业版：添加色卡
  if (isPremium && w.season_focus && w.season_focus.length > 0) {
    elements.push(
      new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "  重点季型色卡参考：", size: 18, color: "555555" })] })
    );
    const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
    const sampleColors: string[] = [];
    for (const s of (w.season_focus as string[]).slice(0, 3)) {
      const pal = SEASON_PALETTE[s];
      if (pal) sampleColors.push(...pal.slice(0, 2));
    }
    const cCells = sampleColors.slice(0, 5).map((hex: string) =>
      new TableCell({
        width: { size: 1200, type: WidthType.DXA },
        shading: { fill: hex.replace("#", ""), type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: "  ", size: 14 })] })],
        borders: { top: border, bottom: border, left: border, right: border },
      })
    );
    if (cCells.length > 0) {
      elements.push(
        new Table({ width: { size: 6000, type: WidthType.DXA }, columnWidths: cCells.map(() => 1200),
          rows: [new TableRow({ children: cCells })] })
      );
    }
  }

  return elements;
}

/** 选品评估表格 */
function buildEvaluationTable(evaluations: any[]) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const headerCells = ["款号", "品名", "设计感", "品质", "价格", "实穿性", "综合评分", "决策"].map(h =>
    new TableCell({
      shading: { fill: "2E75B6", type: ShadingType.CLEAR },
      children: [new Paragraph({ children: [new TextRun({ text: h, color: "FFFFFF", bold: true })] })],
      borders: { top: border, bottom: border, left: border, right: border },
    })
  );

  const bodyRows = evaluations.map((ev: any) =>
    new TableRow({
      children: [
        ev.sku_code || "—", ev.product_name || "—",
        String(ev.design_score || ev.score_design || 0), String(ev.quality_score || ev.score_quality || 0),
        String(ev.price_score || ev.score_price || 0), String(ev.wearability_score || ev.score_wearability || 0),
        String(ev.total_score || 0), ev.decision || "—"
      ].map(v =>
        new TableCell({
          children: [new Paragraph(v)],
          borders: { top: border, bottom: border, left: border, right: border },
        })
      ),
    })
  );

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1500, 2000, 1000, 1000, 1000, 1000, 1000, 1360],
    rows: [new TableRow({ children: headerCells }), ...bodyRows],
  });
}

/** 库存表格 */
function buildInventoryTable(inventory: any[]) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const headerCells = ["款号", "品名", "当前库存", "已售", "售罄率", "建议"].map(h =>
    new TableCell({
      shading: { fill: "2E75B6", type: ShadingType.CLEAR },
      children: [new Paragraph({ children: [new TextRun({ text: h, color: "FFFFFF", bold: true })] })],
      borders: { top: border, bottom: border, left: border, right: border },
    })
  );

  const bodyRows = inventory.map((inv: any) => {
    const sellThrough = inv.stock_in_qty > 0 ? ((inv.sales_qty / inv.stock_in_qty) * 100).toFixed(1) : "0.0";
    return new TableRow({
      children: [
        inv.sku_code || "—", inv.product_name || "—",
        String(inv.current_stock || 0), String(inv.sales_qty || 0),
        sellThrough + "%", inv.restock_advice || "—"
      ].map(v =>
        new TableCell({
          children: [new Paragraph(v)],
          borders: { top: border, bottom: border, left: border, right: border },
        })
      ),
    });
  });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1800, 2600, 1200, 1200, 1200, 1360],
    rows: [new TableRow({ children: headerCells }), ...bodyRows],
  });
}

/** 采购订单表格 */
function buildOrderTable(orders: any[]) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const headerCells = ["订单号", "供应商", "订单日期", "金额", "状态"].map(h =>
    new TableCell({
      shading: { fill: "2E75B6", type: ShadingType.CLEAR },
      children: [new Paragraph({ children: [new TextRun({ text: h, color: "FFFFFF", bold: true })] })],
      borders: { top: border, bottom: border, left: border, right: border },
    })
  );

  const bodyRows = orders.map((o: any) =>
    new TableRow({
      children: [
        o.order_no || "—", o.supplier || "—",
        o.order_date || "—", `¥${(o.total_amount || 0).toLocaleString()}`,
        o.status || "—"
      ].map(v =>
        new TableCell({
          children: [new Paragraph(v)],
          borders: { top: border, bottom: border, left: border, right: border },
        })
      ),
    })
  );

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2000, 2360, 1800, 1600, 1600],
    rows: [new TableRow({ children: headerCells }), ...bodyRows],
  });
}
