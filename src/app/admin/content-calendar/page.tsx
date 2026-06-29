"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Plus, Trash2, Edit2, Search, CheckCircle, Clock, Send } from "lucide-react";

const PLATFORMS = ["小红书", "微信公众号", "抖音", "微博", "其他"];
const CONTENT_TYPES = ["新品预告", "穿搭指南", "变装视频", "客户案例", "促销海报", "品牌故事"];
const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft:       { label: "草稿", color: "text-gray-600",  bg: "bg-gray-100", icon: Edit2 },
  scheduled:   { label: "已排期", color: "text-blue-600", bg: "bg-blue-100", icon: Clock },
  published:   { label: "已发布", color: "text-green-600", bg: "bg-green-100", icon: Send },
};

interface Post {
  id?: string;
  store_id: string;
  post_date: string;
  platform: string;
  content_type: string;
  title: string;
  notes?: string;
  status: string;
  performance_notes?: string;
}

export default function ContentCalendarPage() {
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
  }, [supabase]);

  const load = async () => {
    if (!storeId) return;
    const { data } = await supabase.from("content_calendar").select("*").eq("store_id", storeId).order("post_date");
    setPosts(data || []);
  };
  useEffect(() => { load(); }, [storeId]);