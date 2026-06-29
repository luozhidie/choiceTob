"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ShoppingCart, Plus, Trash2, Edit2, FileText,
  CheckCircle2, Clock, Truck, Package, AlertCircle,
} from "lucide-react";

interface PurchaseOrder {
  id?: string;
  order_no: string;
  supplier: string;
  total_amount: number;
  order_date: string;
  delivery_date?: string;
  payment_terms: string;
  status: "draft" | "confirmed" | "shipped" | "received" | "completed";
  items?: OrderItem[];
}

interface OrderItem {
  id?: string;
  sku_code: string;
  product_name: string;
  color: string;
  size: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const PAYMENT_TERMS = [
  "预付30%",
  "货到付款",
  "月结30天",
  "月结60天",
  "季度结算",
];

const STATUS_OPTIONS = [
  { value: "draft", label: "草稿", color: "gray", icon: FileText },
  { value: "confirmed", label: "已确认", color: "blue", icon: CheckCircle2 },
  { value: "shipped", label: "已发货", color: "orange", icon: Truck },
  { value: "received", label: "已收货", color: "purple", icon: Package },
  { value: "completed", label: "已完成", color: "green", icon: CheckCircle2 },
];

export default function PurchaseOrdersPage() {
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
  }, [supabase]);

  /* ── 加载采购订单 ───────────────── */
  const loadOrders = async () => {
    let query = supabase
      .from("purchase_orders")
      .select("*")
      .order("order_date", { ascending: false });
    if (storeId) query = query.eq("store_id", storeId);
    const { data } = await query;
    setOrders(data || []);
  };

  useEffect(() => { if (storeId) loadOrders(); }, [storeId]);