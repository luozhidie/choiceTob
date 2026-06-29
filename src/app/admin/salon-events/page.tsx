"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar, Users, DollarSign, MapPin, Plus, Trash2, Edit2,
  TrendingUp, TrendingDown, MinusCircle, CheckCircle, XCircle,
} from "lucide-react";

interface SalonEvent {
  id?: string;
  store_id?: string;
  event_name: string;
  event_date: string;
  location: string;
  expected_attendees: number;
  actual_attendees: number;
  budget: number;
  actual_cost: number;
  status: "planned" | "ongoing" | "completed" | "cancelled";
  notes: string;
}

const STATUS_OPTIONS = [
  { value: "planned", label: "计划中", color: "blue" },
  { value: "ongoing", label: "进行中", color: "orange" },
  { value: "completed", label: "已完成", color: "green" },
  { value: "cancelled", label: "已取消", color: "gray" },
];

const STATUS_COLOR_MAP: Record<string, string> = {
  planned: "bg-blue-100 text-blue-700 border-blue-200",
  ongoing: "bg-orange-100 text-orange-700 border-orange-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function SalonEventsPage() {
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
  }, [supabase]);

  /* ── 加载活动 ───────────────────── */
  const loadEvents = async () => {
    if (!storeId) return;
    const { data } = await supabase
      .from("salon_events")
      .select("*")
      .eq("store_id", storeId)
      .order("event_date", { ascending: false });
    setEvents(data || []);
  };

  useEffect(() => { loadEvents(); }, [storeId]);