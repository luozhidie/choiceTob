"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {  } from "next/navigation";
import { FEMALE_STYLES, MALE_STYLES, getStyleProLabel } from "@/lib/styles";
import {
  Trash2,
  X,
  Loader2,
  Palette,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

interface StyleTestResult {
  id: string;
  gender: "male" | "female";
  main_style: string;
  sub_style: string;
  name: string;
  phone: string;
  wechat: string;
  source: string;
  answers: Record<string, unknown>;
  created_at: string;
}

const GENDER_MAP: Record<string, string> = {
  male: "男",
  female: "女",
};

const PAGE_SIZE = 10;

export default function AdminStyleTestResultsPage() {
  const [results, setResults] = useState<StyleTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterMainStyle, setFilterMainStyle] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [detailResult, setDetailResult] = useState<StyleTestResult | null>(null);
  const [mainStyles, setMainStyles] = useState<string[]>([]);
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
    if (typeof document !== "undefined") {
      setSupabase(createClient());
    }
  }, []);

  useEffect(() => {
    
}, []);

  useEffect(() => {
    fetchResults();
  }, [page, search, filterGender, filterMainStyle]);
const fetchResults = async () => {
    setLoading(true);
    let query = supabase
      .from("style_test_results")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (filterGender) {
      query = query.eq("gender", filterGender);
    }
    if (filterMainStyle) {
      query = query.eq("main_style", filterMainStyle);
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching results:", error);
    } else {
      setResults(data || []);
      setTotal(count || 0);
      // Extract unique main styles for filter dropdown
      if (data && data.length > 0) {
        const styles = Array.from(new Set(data.map((r) => r.main_style).filter(Boolean)));
        setMainStyles((prev) => {
          const merged = Array.from(new Set([...prev, ...styles])).sort();
          return merged;
        });
      }
    }
    setLoading(false);
  };

  // Also fetch distinct main styles for filter on mount
  useEffect(() => {
    const fetchStyles = async () => {
      const { data } = await supabase
        .from("style_test_results")
        .select("main_style")
        .not("main_style", "is", null);
      if (data) {
        setMainStyles(Array.from(new Set(data.map((r) => r.main_style))).sort());
      }
    };
    fetchStyles();
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条测试记录吗？")) return;
    const res = await fetch("/api/admin/common/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, table: "style_test_results" }),
    });
    const json = await res.json();
    if (json.error) {
      alert("删除失败：" + json.error);
      return;
    }
    fetchResults();
  };

  const renderAnswers = (answers: Record<string, unknown>) => {
    if (!answers || typeof answers !== "object") return <p className="text-muted-foreground">无答题数据</p>;
    const entries = Object.entries(answers);
    if (entries.length === 0) return <p className="text-muted-foreground">无答题数据</p>;

    return (
      <div className="space-y-3">
        {entries.map(([key, value]) => (
          <div key={key} className="flex gap-2 text-sm">
            <span className="font-medium text-primary min-w-[120px] shrink-0">{key}</span>
            <span className="text-muted-foreground">
              {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">风格测试记录</h1>
          <p className="text-muted-foreground mt-1">查看用户风格测试结果与答题详情</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索姓名/手机号..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-sm"
          />
        </div>
        <select
          value={filterGender}
          onChange={(e) => {
            setFilterGender(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-sm"
        >
          <option value="">全部性别</option>
          <option value="male">男</option>
          <option value="female">女</option>
        </select>
        <select
          value={filterMainStyle}
          onChange={(e) => {
            setFilterMainStyle(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-sm"
        >
          <option value="">全部主风格</option>
          <optgroup label="── 女士八大风格 ──">
            {mainStyles.filter(s => FEMALE_STYLES.some(fs => fs.label === s || fs.value === s)).map((s) => (
              <option key={s} value={s}>{getStyleProLabel(s) || s}</option>
            ))}
          </optgroup>
          <optgroup label="── 男士五大风格 ──">
            {mainStyles.filter(s => MALE_STYLES.some(ms => ms.label === s || ms.value === s)).map((s) => (
              <option key={s} value={s}>{getStyleProLabel(s) || s}</option>
            ))}
          </optgroup>
          {/* 其他未匹配的风格 */}
          {mainStyles.filter(s => !FEMALE_STYLES.some(fs => fs.label === s || fs.value === s) && !MALE_STYLES.some(ms => ms.label === s || ms.value === s)).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Palette className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无风格测试记录</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">性别</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">主风格</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">副风格</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">姓名</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">手机号</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">微信</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">来源</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">测试时间</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${result.gender === "female" ? "bg-pink-100 text-pink-800" : "bg-blue-100 text-blue-800"}`}>
                          {GENDER_MAP[result.gender] || result.gender}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-primary">{getStyleProLabel(result.main_style) || result.main_style || "-"}</td>
                      <td className="px-4 py-3 text-sm">{getStyleProLabel(result.sub_style) || result.sub_style || "-"}</td>
                      <td className="px-4 py-3 text-sm">{result.name || "-"}</td>
                      <td className="px-4 py-3 text-sm">{result.phone || "-"}</td>
                      <td className="px-4 py-3 text-sm">{result.wechat || "-"}</td>
                      <td className="px-4 py-3 text-sm">{result.source || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{new Date(result.created_at).toLocaleDateString("zh-CN")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setDetailResult(result)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="查看详情"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(result.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                共 {total} 条，第 {page}/{totalPages} 页
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {detailResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">测试详情</h2>
              <button onClick={() => setDetailResult(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">姓名</span>
                  <p className="font-medium text-primary">{detailResult.name || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">手机号</span>
                  <p className="font-medium text-primary">{detailResult.phone || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">微信</span>
                  <p className="font-medium text-primary">{detailResult.wechat || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">来源</span>
                  <p className="font-medium text-primary">{detailResult.source || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">性别</span>
                  <p className="font-medium text-primary">{GENDER_MAP[detailResult.gender] || detailResult.gender}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">测试时间</span>
                  <p className="font-medium text-primary">{new Date(detailResult.created_at).toLocaleString("zh-CN")}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">主风格</span>
                  <p className="font-medium text-primary">{getStyleProLabel(detailResult.main_style) || detailResult.main_style || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">副风格</span>
                  <p className="font-medium text-primary">{getStyleProLabel(detailResult.sub_style) || detailResult.sub_style || "-"}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-primary mb-3">答题详情</h3>
                {renderAnswers(detailResult.answers)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
