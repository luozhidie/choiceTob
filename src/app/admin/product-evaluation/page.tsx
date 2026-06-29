"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Star, CheckCircle, XCircle, AlertCircle, Plus, Edit2, Trash2, Search,
} from "lucide-react";

interface EvaluationItem {
  id?: string;
  store_id: string;
  sku_code: string;
  product_name: string;
  supplier: string;
  design_score: number;
  quality_score: number;
  price_score: number;
  wearability_score: number;
  scarcity_score: number;
  total_score: number;
  decision: string;
  trial_start: string;
  trial_end: string;
  trial_result: string;
}

const DECISION_OPTIONS = ["优先采购", "可考虑", "暂不采购", "淘汰"];
const TRIAL_RESULT_OPTIONS = ["达标", "不达标", "待评估"];

function calcTotal(d: number, q: number, p: number, w: number, s: number) {
  return d + q + p + w + s;
}

function calcDecision(total: number) {
  if (total >= 85) return "优先采购";
  if (total >= 70) return "可考虑";
  if (total >= 50) return "暂不采购";
  return "淘汰";
}

const emptyForm = {
  sku_code: "",
  product_name: "",
  supplier: "",
  design_score: "0",
  quality_score: "0",
  price_score: "0",
  wearability_score: "0",
  scarcity_score: "0",
  trial_start: "",
  trial_end: "",
  trial_result: "待评估",
};

export default function ProductEvaluationPage() {
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
  }, [supabase]);

  /* ── 加载评估数据 ───────────────────── */
  const loadData = async () => {
    if (!storeId) return;
    const { data } = await supabase
      .from("product_evaluation")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    setItems(data || []);
  };

  useEffect(() => { loadData(); }, [storeId]);