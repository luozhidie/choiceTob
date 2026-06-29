"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3, Upload, Download, Plus, Trash2,
  Calendar, TrendingUp, TrendingDown, Minus,
  RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface SaleRecord {
  id?: string;
  store_id: string;
  sale_date: string;
  period_type: "day" | "week" | "month" | "year";
  sales_amount: number;
  sales_units: number;
  avg_price: number;
  gross_margin_pct: number;
  comparison_last_week?: number;
  comparison_last_month?: number;
  comparison_last_year?: number;
  notes?: string;
}

export default function SalesDataPage() {
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
  }, [supabase]);

  /* ── 加载销售记录 ───────────────── */
  const loadRecords = async () => {
    if (!storeId) return;
    const { data } = await supabase
      .from("weekly_sales_analysis")
      .select("*")
      .eq("store_id", storeId)
      .order("sale_date", { ascending: false });
    setRecords(data || []);
  };

  useEffect(() => { loadRecords(); }, [storeId]);