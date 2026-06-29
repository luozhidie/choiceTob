"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  ShoppingBag,
  Package,
  ChevronDown,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CATEGORIES,
  CATEGORY_MAP,
  SUBCATEGORY_MAP,
  getSubcategories,
  getCategoryPath,
} from "@/lib/categories";

interface Product {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  images: string[] | null;
  price: number;
  original_price: number | null;
  category: string | null;
  subcategory: string | null;
  tags: string[] | null;
  is_published: boolean;
  stock: number;
  detail: string | null;
  created_at: string;
  // 属性编码体系扩展字段
  fabric_code?: string[] | null;
  cut_code?: string[] | null;
  pattern_code?: string[] | null;
  color_hex?: string | null;
  color_season_code?: string | null;
  style_conclusion?: string | null;
  sku?: string | null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    cover_image: "",
    images: [] as string[],
    price: "",
    original_price: "",
    category: "",
    subcategory: "",
    stock: "0",
    tags: "",
    is_published: false,
    detail: "",
    // 属性编码体系
    sku: "",
    fabric_code: [] as string[],
    cut_code: [] as string[],
    pattern_code: [] as string[],
    color_hex: "",
    color_season_code: "",
    style_conclusion: "",
    // 商品参数
    material: "",
    sizes: "",
    origin: "",
    care_instructions: "",
    weight: "",
    brand: "",
  });

  const [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
  }, [filterCategory, filterSubcategory, supabase]);

  // 切换筛选主分类时重置子分类
  useEffect(() => {