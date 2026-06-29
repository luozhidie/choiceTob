"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Loader2, Search, Filter, Eye, XCircle, ChevronLeft, ChevronRight
} from "lucide-react";

interface Diagnosis {
  id: string;
  full_name: string;
  wechat_qr_url: string | null;
  age: string | null;
  video_course_info: string | null;
  look_vs_age: string | null;
  height: string | null;
  answers: Record<string, string>;
  photo_urls_1: string[] | null;
  photo_urls_2: string[] | null;
  photo_urls_3: string[] | null;
  status: string;
  created_at: string;
  profiles?: { full_name: string; company_name: string; email: string; phone: string };
}

const CHOICE_LABELS: Record<string, string> = {
  q7: "看起来身高vs实际身高", q8: "擅长体育项目", q9: "正装vs休闲装",
  q10: "裤装vs裙装", q11: "连衣裙vs半裙", q12: "上衣长度",
  q13: "面料价值感", q14: "小时候调皮", q15: "青春期发育",
  q16: "洗脸后肤色", q17: "容易脸红",
};

export default function AdminStyleTestsPage() {
  const [items, setItems] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Diagnosis | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
    if (typeof document !== "undefined") {
      setSupabase(createClient());
    }
  }, []);
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("style_diagnoses")
        .select("*, profiles(full_name, company_name, email, phone)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error, count } = await query;
      if (error) throw error;
      let filtered = data || [];
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter((item: any) =>
          (item.full_name?.toLowerCase().includes(s)) ||
          (item.profiles?.company_name?.toLowerCase().includes(s)) ||
          (item.profiles?.email?.toLowerCase().includes(s))
        );
      }
      setItems(filtered);
      setTotal(count || 0);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filter, page]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("style_diagnoses").update({ status }).eq("id", id);
    if (!error) { setSelected(null); fetchData(); }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pending: "bg-amber-100 text-amber-700", reviewed: "bg-green-100 text-green-700", archived: "bg-gray-100 text-gray-600" };
    const labels: Record<string, string> = { pending: "待审核", reviewed: "已审核", archived: "已归档" };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[s] || map.pending}`}>{labels[s] || s}</span>;
  };

  if (loading && items.length === 0) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">色彩风格诊断问卷</h1>
            <p className="text-sm text-muted-foreground mt-1">共 {total} 条提交记录</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchData()} placeholder="搜索姓名/店铺/邮箱..." className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none w-64" />
            </div>
            <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(0); }} className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary outline-none bg-white">
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="reviewed">已审核</option>
              <option value="archived">已归档</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">姓名</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">店铺/公司</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">年龄</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">提交时间</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">{item.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.profiles?.company_name || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{item.age || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(item.created_at).toLocaleDateString("zh-CN")}</td>
                  <td className="px-4 py-3">{statusBadge(item.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelected(item)} className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium">
                      <Eye className="w-4 h-4" /> 查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <div className="p-12 text-center text-gray-400"><Filter className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>暂无记录</p></div>}
        </div>

        {total > pageSize && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">第 {page + 1} 页，共 {Math.ceil(total / pageSize)} 页</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-30 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * pageSize >= total} className="px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-30 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">问卷详情</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><label className="text-xs text-gray-400">姓名</label><p className="font-medium">{selected.full_name}</p></div>
                <div><label className="text-xs text-gray-400">年龄</label><p className="font-medium">{selected.age || "-"}</p></div>
                <div><label className="text-xs text-gray-400">身高</label><p className="font-medium">{selected.height || "-"}</p></div>
                <div><label className="text-xs text-gray-400">视频课信息</label><p className="font-medium">{selected.video_course_info || "-"}</p></div>
                <div><label className="text-xs text-gray-400">看上去比同年人</label><p className="font-medium">{selected.look_vs_age || "-"}</p></div>
              </div>

              {selected.wechat_qr_url && (
                <div>
                  <label className="text-xs text-gray-400">微信二维码</label>
                  <img src={selected.wechat_qr_url} alt="二维码" className="mt-1 w-32 h-32 rounded-lg border object-cover" />
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm mb-3">问卷答案</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(CHOICE_LABELS).map(([key, label]) => (
                    selected.answers?.[key] ? (
                      <div key={key} className="flex">
                        <span className="text-gray-500 w-32 shrink-0">{label}：</span>
                        <span className="text-gray-800">{selected.answers[key]}</span>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>

              {([["图片文件一", selected.photo_urls_1], ["图片文件二", selected.photo_urls_2], ["图片文件三", selected.photo_urls_3]] as [string, string[] | null][]).map(([label, urls]) => (
                urls && urls.length > 0 ? (
                  <div key={label} className="border-t pt-4">
                    <label className="text-xs text-gray-400">{label}</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(urls as string[]).map((url, i) => <a key={i} href={url} target="_blank" rel="noreferrer"><img src={url} alt="" className="w-20 h-20 rounded-lg border object-cover hover:opacity-80 transition-opacity" /></a>)}
                    </div>
                  </div>
                ) : null
              ))}

              <div className="flex gap-3 pt-4 border-t">
                {selected.status !== "reviewed" && <button onClick={() => updateStatus(selected.id, "reviewed")} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">标记为已审核</button>}
                {selected.status !== "archived" && <button onClick={() => updateStatus(selected.id, "archived")} className="flex-1 py-2.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700">归档</button>}
                {selected.status !== "pending" && <button onClick={() => updateStatus(selected.id, "pending")} className="flex-1 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">重置为待审核</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
