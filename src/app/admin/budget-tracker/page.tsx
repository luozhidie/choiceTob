"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DollarSign, Plus, Trash2, Edit2, TrendingUp, TrendingDown } from "lucide-react";

const CATEGORIES = ["采购成本", "营销费用", "运营成本", "人力成本", "租金", "其他"];

interface BudgetItem {
  id?: string;
  store_id: string;
  category: string;
  item: string;
  budget_amount: number;
  actual_amount: number;
  variance?: number;
  variance_pct?: number;
  notes?: string;
}

export default function BudgetTrackerPage() {
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
  }, [supabase]);

  const load = async () => {
    if (!storeId) return;
    const { data } = await supabase.from("budget_tracker").select("*").eq("store_id", storeId).order("created_at");
    setItems(data || []);
  };
  useEffect(() => { load(); }, [storeId]);