"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCategories } from "@/lib/useCategories";
import {
  Package, Plus, Trash2, Edit2, AlertTriangle,
  TrendingDown, TrendingUp, Minus, Search,
  ShoppingCart,
} from "lucide-react";

interface InventoryItem {
  id?: string;
  store_id: string;
  sku_code: string;
  product_name: string;
  category: string;
  color: string;
  size: string;
  unit_cost: number;
  stock_in_qty: number;
  current_stock: number;
  sales_qty: number;
  sell_through_pct?: number;
  turnover_days?: number;
  stock_value?: number;
  status: "normal" | "low_stock" | "out_of_stock" | "overstock";
  restock_advice?: string;
}

import { CATEGORY_OPTIONS } from "@/lib/styles";
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "均码"];

export default function InventoryPage() {
  const [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
  }, [supabase]);

  /* ── 加载库存 ───────────────────── */
  const loadInventory = async () => {
    if (!storeId) return;
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    
    // 自动计算售罄率和周转天数
    const processed = (data || []).map((item: any) => {
      const sellThrough = item.stock_in_qty > 0 
        ? (item.sales_qty / item.stock_in_qty) 
        : 0;
      const turnover = item.sales_qty > 0 
        ? Math.round(item.current_stock / (item.sales_qty / 30)) 
        : 999;
      
      let status: InventoryItem["status"] = "normal";
      let advice = "";
      
      if (item.current_stock === 0) {
        status = "out_of_stock";
        advice = "❌ 已断货，紧急补货";
      } else if (sellThrough > 0.8 && item.current_stock < 10) {
        status = "low_stock";
        advice = "⚠️ 热销款，建议补货";
      } else if (turnover > 60 && item.current_stock > 50) {
        status = "overstock";
        advice = "📦 滞销款，考虑促销或退货";
      } else {
        advice = "✅ 库存正常";
      }

      return {
        ...item,
        sell_through_pct: sellThrough,
        turnover_days: turnover,
        status,
        restock_advice: advice,
      };
    });

    setItems(processed);
  };

  useEffect(() => { loadInventory(); }, [storeId]);