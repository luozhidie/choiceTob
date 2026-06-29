"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckSquare, Plus, Trash2, Edit2, AlertCircle } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  not_started: { label: "未开始", color: "text-gray-600", bg: "bg-gray-100" },
  in_progress: { label: "进行中", color: "text-blue-600", bg: "bg-blue-100" },
  done:         { label: "已完成", color: "text-green-600", bg: "bg-green-100" },
};

interface Project {
  id?: string;
  store_id: string;
  task_name: string;
  owner?: string;
  deliverable?: string;
  start_date?: string;
  due_date?: string;
  status: string;
  progress_pct: number;
  notes?: string;
}

export default function ProjectTrackerPage() {
  const [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
  }, [supabase]);

  const load = async () => {
    if (!storeId) return;
    const { data } = await supabase.from("project_tracker").select("*").eq("store_id", storeId).order("due_date");
    setTasks(data || []);
  };
  useEffect(() => { load(); }, [storeId, supabase]);