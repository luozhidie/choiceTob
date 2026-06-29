"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileDown, FileText, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

const SEASONS = [
  { value: "spring_summer", label: "2026 春夏" },
  { value: "autumn_winter", label: "2026 秋冬" },
  { value: "full_year", label: "2026 全年" },
];

const REPORT_TYPES = [
  { value: "basic", label: "标准版", desc: "8章节完整报告，数据齐全，适合内部使用", icon: FileText },
  { value: "premium", label: "专业版", desc: "含12季色卡+波段色板，适合拿货/展示给客户", icon: Sparkles },
];

export default function ReportPage() {
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
  }, [supabase]);

  /* ── 加载数据统计 ──────────────── */
  const loadStats = async () => {
    if (!storeId) return;
    const [{ count: c }, { data: s }, { data: m },
      { count: w }, { count: e }, { count: inv }, { count: o }] = await Promise.all([
      supabase.from("vip_customers").select("*", { count: "exact", head: true }).eq("store_id", storeId),
      supabase.from("product_structure_plan").select("id").eq("store_id", storeId).maybeSingle(),
      supabase.from("product_matrix_plan").select("id").eq("store_id", storeId).maybeSingle(),
      supabase.from("wave_plan").select("*", { count: "exact", head: true }).eq("store_id", storeId),
      supabase.from("product_evaluation").select("*", { count: "exact", head: true }).eq("store_id", storeId),
      supabase.from("inventory").select("*", { count: "exact", head: true }).eq("store_id", storeId),
      supabase.from("purchase_orders").select("*", { count: "exact", head: true }).eq("store_id", storeId),
    ]);
    setStats({
      customers: c || 0,
      structure: !!s,
      matrix: !!m,
      waves: w || 0,
      evaluations: e || 0,
      inventory: inv || 0,
      orders: o || 0,
    });
  };
  useEffect(() => { loadStats(); }, [storeId]);