"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Headphones,
  Target,
  Users,
  Package,
  TrendingUp,
  Save,
  Sparkles,
  BarChart3,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  MessageSquare,
  DollarSign,
  Crown,
} from "lucide-react";

interface Store { id: string; name: string; business_goals?: Record<string, any>; }

const serviceCategories = ["综合销售策略", "话术培训", "VIP服务", "连带提升"];
const seasons = ["春季", "夏季", "秋季", "冬季"];

export default function AdminSalesPlanPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(true);
  const supabase = createClient();

  // 客户端权限检查
  useEffect(() => {
    if (typeof document !== "undefined") {
      const hasCookie = document.cookie.includes("admin_logged_in=true");
      if (!hasCookie) {
        setIsAdmin(false);
        router.replace("/admin/login");
      }
    }
  }, [router]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-500">正在跳转登录...</p>
        </div>
      </div>
    );
  }

  // 原有页面内容开始
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [season, setSeason] = useState("夏季");
  const [serviceCategory, setServiceCategory] = useState("综合销售策略");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [dataSources, setDataSources] = useState<Record<string, any> | null>(null);
  const [storeGoals, setStoreGoals] = useState<Record<string, any> | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ vipStrategies: true, salesScripts: true, productMatrix: true });
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"generate" | "saved">("generate");

  const fetchStores = async () => {
    const { data } = await supabase.from("stores").select("id, name").order("name");
    if (data) setStores(data);
  };

  useEffect(() => { fetchStores(); }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部 */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">销售服务</h1>
            <p className="text-sm text-gray-500 mt-1">为门店生成定制化销售方案</p>
          </div>
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            返回后台 →
          </button>
        </div>
      </header>

      {/* 内容区 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-gray-600">销售服务页面内容（待完善）</p>
          <p className="text-sm text-gray-400 mt-2">功能包括：销售策略生成、话术培训、VIP服务方案、连带提升建议</p>
        </div>
      </div>
    </div>
  );
}
