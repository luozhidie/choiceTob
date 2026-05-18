import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, HeadingLevel,
  PageBreak, TableOfContents,
} from "docx";
import { getStyleProLabel, getColorSeasonProLabel } from "@/lib/styles";

export async function POST(req: NextRequest) {
  const { storeId, season } = await req.json();
  if (!storeId) return NextResponse.json({ error: "缺少 storeId" }, { status: 400 });

  const supabase = await createClient();

  // ── 1. 加载数据 ─────────────────────
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

  // ── 2. 客群分析 ─────────────────────
  const colorDist: Record<string, number> = {};
  const styleDist: Record<string, number> = {};
  (customers || []).forEach((c: any) => {
    if (c.color_season) colorDist[c.color_season] = (colorDist[c.color_season] || 0) + 1;
    if (c.main_style) styleDist[c.main_style] = (styleDist[c.main_style] || 0) + 1;
  });

  // ── 3. 生成 Word 文档 ─────────────────
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
        // ── 封面 ──
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 3000, after: 600 },
          children: [new TextRun({ text: "商品企划报告", size: 56, bold: true, color: "2E75B6" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 },
          children: [new TextRun({ text: season || "2026 春夏", size: 32, bold: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
          children: [new TextRun({ text: store?.name || "店铺名称", size: 28 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
          children: [new TextRun({ text: `生成日期：${new Date().toLocaleDateString("zh-CN")}`, size: 22, color: "888888" })] }),
        new Paragraph({ children: [new PageBreak()] }),

        // ── 第一章：品牌定位 ──
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("一、品牌定位")] }),
        new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: `店铺名称：${store?.name || "—"}`, size: 24 })] }),
        new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: `店铺地址：${store?.address || "—"}`, size: 24 })] }),
        new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: `经营理念：${store?.description || "为顾客提供专业的色彩风格搭配服务，提升个人形象竞争力。"}`, size: 24 })] }),

        // ── 第二章：客群分析 ──
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("二、客群分析")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 色彩季型分布")] }),
        buildDistTable(colorDist, "色彩季型"),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 风格类型分布")] }),
        buildDistTable(styleDist, "风格类型"),

        // ── 第三章：商品结构规划 ──
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("三、商品结构规划")] }),
        ...(structure?.items?.length > 0
          ? [buildStructureTable(structure.items)]
          : [new Paragraph({ children: [new TextRun("暂无数据，请在「商品企划」页面先完成规划。")] })]),

        // ── 第四章：96格商品矩阵 ──
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("四、96格商品矩阵")] }),
        ...(matrix?.matrix_data ? [buildMatrixTable(matrix.matrix_data)] : [new Paragraph({ children: [new TextRun("暂无数据")] })]),

        // ── 第五章：上货波段计划 ──
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("五、上货波段计划")] }),
        ...(waves && waves.length > 0 ? waves.map((w: any) => buildWaveSection(w)) : [new Paragraph({ children: [new TextRun("暂无数据")] })]),

        // ── 第六章：选品评估汇总 ──
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("六、选品评估汇总")] }),
        ...(evaluations && evaluations.length > 0 ? [buildEvaluationTable(evaluations)] : [new Paragraph({ children: [new TextRun("暂无数据")] })]),

        // ── 第七章：库存建议 ──
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("七、库存建议")] }),
        ...(inventory && inventory.length > 0 ? [buildInventoryTable(inventory)] : [new Paragraph({ children: [new TextRun("暂无数据")] })]),

        // ── 第八章：采购订单汇总 ──
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("八、采购订单汇总")] }),
        ...(orders && orders.length > 0 ? [buildOrderTable(orders)] : [new Paragraph({ children: [new TextRun("暂无数据")] })]),

        // ── 结尾 ──
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2000 },
          children: [new TextRun({ text: "—— 报告结束 ——", size: 24, color: "888888", bold: true })] }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="商品企划报告_${store?.name || "店铺"}_${season || "2026"}.docx"`,
    },
  });
}

// ═════════════════════════════════════
// 辅助函数：分布表格
// ═════════════════════════════════════
function buildDistTable(dist: Record<string, number>, label: string) {
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
  const rows = Object.entries(dist).map(([key, count]) => {
    const pct = ((count / total) * 100).toFixed(1);
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(key)], width: { size: 4000, type: WidthType.DXA } }),
        new TableCell({ children: [new Paragraph(String(count))], width: { size: 2000, type: WidthType.DXA } }),
        new TableCell({ children: [new Paragraph(pct + "%")], width: { size: 2000, type: WidthType.DXA } }),
      ],
    });
  });

  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [4000, 2000, 2000],
    rows: [
      new TableRow({
        children: [
          new TableCell({ shading: { fill: "2E75B6", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: label, color: "FFFFFF", bold: true })] })] }),
          new TableCell({ shading: { fill: "2E75B6", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "人数", color: "FFFFFF", bold: true })] })] }),
          new TableCell({ shading: { fill: "2E75B6", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "占比", color: "FFFFFF", bold: true })] })] }),
        ],
      }),
      ...rows,
    ],
  });
}

// ═════════════════════════════════════
// 辅助函数：商品结构表格
// ═════════════════════════════════════
function buildStructureTable(items: any[]) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const header = new TableRow({
    children: ["品类", "占比%", "SKU数", "毛利率%", "目标销售额"].map(h =>
      new TableCell({
        shading: { fill: "2E75B6", type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: h, color: "FFFFFF", bold: true })] })],
        borders: { top: border, bottom: border, left: border, right: border },
      })
    ),
  });

  const rows = items.map((item: any) =>
    new TableRow({
      children: [
        item.category || "—", String(item.pct || 0), String(item.sku_count || 0),
        String(item.gross_margin || 0), String(item.target_sales || 0)
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
    rows: [header, ...rows],
  });
}

// ═════════════════════════════════════
// 辅助函数：矩阵表格（简化）
// ═════════════════════════════════════
function buildMatrixTable(matrixData: any) {
  return new Paragraph({
    children: [new TextRun({ text: "（96格商品矩阵详见后台「商品企划」页面，或导出Excel查看完整矩阵。）", size: 20, color: "888888" })]
  });
}

// ═════════════════════════════════════
// 辅助函数：波段计划
// ═════════════════════════════════════
function buildWaveSection(w: any) {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    children: [
      new TextRun({ text: `第${w.wave_number}波（${w.wave_name || ""}）`, bold: true, size: 24 }),
      new TextRun({ text: `\n  上货日期：${w.plan_date || "—"}`, size: 22 }),
      new TextRun({ text: `\n  占比：${w.pct || 0}%  SKU数：${w.sku_count || 0}  金额：¥${(w.amount || 0).toLocaleString()}`, size: 22 }),
      new TextRun({ text: `\n  营销活动：${w.marketing_activity || "—"}`, size: 22 }),
    ]
  });
}

// ═════════════════════════════════════
// 辅助函数：选品评估表格
// ═════════════════════════════════════
function buildEvaluationTable(evaluations: any[]) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const header = new TableRow({
    children: ["款号", "品名", "综合评分", "决策建议"].map(h =>
      new TableCell({
        shading: { fill: "2E75B6", type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: h, color: "FFFFFF", bold: true })] })],
        borders: { top: border, bottom: border, left: border, right: border },
      })
    ),
  });

  const rows = evaluations.map((ev: any) =>
    new TableRow({
      children: [
        ev.sku_code || "—", ev.product_name || "—",
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
    columnWidths: [2000, 3000, 1800, 2560],
    rows: [header, ...rows],
  });
}

// ═════════════════════════════════════
// 辅助函数：库存表格
// ═════════════════════════════════════
function buildInventoryTable(inventory: any[]) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const header = new TableRow({
    children: ["款号", "品名", "当前库存", "已售", "售罄率", "建议"].map(h =>
      new TableCell({
        shading: { fill: "2E75B6", type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: h, color: "FFFFFF", bold: true })] })],
        borders: { top: border, bottom: border, left: border, right: border },
      })
    ),
  });

  const rows = inventory.map((inv: any) => {
    const sellThrough = inv.stock_in_qty > 0 ? (inv.sales_qty / inv.stock_in_qty * 100).toFixed(1) : "0.0";
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
    rows: [header, ...rows],
  });
}

// ═════════════════════════════════════
// 辅助函数：采购订单表格
// ═════════════════════════════════════
function buildOrderTable(orders: any[]) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const header = new TableRow({
    children: ["订单号", "供应商", "订单日期", "金额", "状态"].map(h =>
      new TableCell({
        shading: { fill: "2E75B6", type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: h, color: "FFFFFF", bold: true })] })],
        borders: { top: border, bottom: border, left: border, right: border },
      })
    ),
  });

  const rows = orders.map((o: any) =>
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
    rows: [header, ...rows],
  });
}
