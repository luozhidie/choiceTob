"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_CATEGORIES } from "@/lib/styles";

interface Category {
  id: string;
  code: string;
  label: string;
  description: string;
  sort_order: number;
  is_default?: boolean;
}

/**
 * 统一品类列表 Hook
 * 优先从数据库读取，如果数据库为空则用预设列表
 */
export function useCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("categories")
          .select("code, label")
          .order("sort_order");

        if (data && data.length > 0) {
          // 数据库有数据：用 "编号-名称" 格式
          setCategories(data.map((c: any) => `${c.code}-${c.label}`));
        } else {
          // 数据库为空：用预设列表
          setCategories(PRODUCT_CATEGORIES.map(c => `${c.code}-${c.label}`));
        }
      } catch {
        // 出错时用预设列表兜底
        setCategories(PRODUCT_CATEGORIES.map(c => `${c.code}-${c.label}`));
      }
      setLoading(false);
    })();
  }, []);

  return { categories, loading };
}
