"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Upload, Save, X, Eye, EyeOff,
  FileText, Loader2, Globe, Search, Sparkles, Download,
  Newspaper, CheckCircle2, AlertCircle,
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  tag: string;
  is_premium: boolean;
  is_published: boolean;
  created_at: string;
}

interface CrawledNews {
  title: string;
  excerpt: string;
  content: string;
  source: string;
  source_url: string;
  image_url: string;
  tag: string;
  published_at: string;
  author: string;
}

const CRAWL_SOURCES = [
  { value: "ai", label: "AI智能生成（推荐）" },
  { value: "bing", label: "搜索引擎聚合" },
];

const QUICK_KEYWORDS = ["2025春夏趋势", "时尚穿搭", "流行色彩", "街头潮流", "轻奢品牌", "国潮设计", "可持续时尚", "面料创新"];

export default function AdminMagazinePage() {
  const [tab, setTab] = useState<"manage" | "crawl">("manage");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState({
    title: "", excerpt: "", content: "", image_url: "",
    tag: "", is_premium: false, is_published: false,
  });
  const [uploading, setUploading] = useState(false);

  // 爬虫相关状态
  const [crawlKeyword, setCrawlKeyword] = useState("");
  const [crawlSources, setCrawlSources] = useState<string[]>(["ai", "bing"]);
  const [crawling, setCrawling] = useState(false);
  const [crawledNews, setCrawledNews] = useState<CrawledNews[]>([]);
  const [crawlError, setCrawlError] = useState("");
  const [importing, setImporting] = useState<string | null>(null); // 正在导入的title
  const [fetchContent, setFetchContent] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { checkUser(); fetchArticles(); }, []);

  const checkUser = async () => {

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("articles").select("*").order("created_at", { ascending: false });
    if (!error) setArticles(data || []);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("图片不能超过5MB"); return; }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("magazine-images").upload(filePath, file);
      if (uploadError) {
        if (uploadError.message.includes("bucket") || uploadError.message.includes("Bucket")) {
          alert("上传失败：magazine-images 存储桶不存在。请在 Supabase Dashboard → Storage 中创建 'magazine-images' bucket 并设置为 public。");
        } else {
          alert("上传失败：" + uploadError.message);
        }
        setUploading(false);
        return;
      }
      const { data } = supabase.storage.from("magazine-images").getPublicUrl(filePath);
      setFormData({ ...formData, image_url: data.publicUrl });
    } catch (err: any) {
      alert("上传异常：" + err.message);
    }
    setUploading(false);
  };

  // 文章内容中插入图片
  const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("图片不能超过5MB"); return; }

    try {
      const ext = file.name.split(".").pop();
      const filePath = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("magazine-images").upload(filePath, file);
      if (uploadError) {
        alert("上传失败：" + uploadError.message);
        return;
      }
      const { data } = supabase.storage.from("magazine-images").getPublicUrl(filePath);
      // 在光标位置插入Markdown图片语法
      const textarea = document.getElementById("article-content") as HTMLTextAreaElement;
      const cursorPos = textarea?.selectionStart || formData.content.length;
      const before = formData.content.substring(0, cursorPos);
      const after = formData.content.substring(cursorPos);
      const imageMarkdown = `\n![图片](${data.publicUrl})\n`;
      setFormData({ ...formData, content: before + imageMarkdown + after });
    } catch (err: any) {
      alert("上传异常：" + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingArticle) {
      const { error } = await supabase.from("articles").update(formData).eq("id", editingArticle.id);
      if (error) { alert("更新失败：" + error.message); return; }
    } else {
      const { error } = await supabase.from("articles").insert([formData]);
      if (error) { alert("创建失败：" + error.message); return; }
    }
    setShowModal(false);
    setEditingArticle(null);
    setFormData({ title: "", excerpt: "", content: "", image_url: "", tag: "", is_premium: false, is_published: false });
    fetchArticles();
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title, excerpt: article.excerpt || "", content: article.content || "",
      image_url: article.image_url || "", tag: article.tag || "",
      is_premium: article.is_premium, is_published: article.is_published,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除？")) return;
    await supabase.from("articles").delete().eq("id", id);
    fetchArticles();
  };

  const togglePublish = async (article: Article) => {
    await supabase.from("articles").update({ is_published: !article.is_published }).eq("id", article.id);
    fetchArticles();
  };

  const togglePremium = async (article: Article) => {
    await supabase.from("articles").update({ is_premium: !article.is_premium }).eq("id", article.id);
    fetchArticles();
  };

  // ========== 爬虫功能 ==========

  const handleCrawl = async () => {
    if (!crawlKeyword.trim()) return;
    setCrawling(true);
    setCrawlError("");
    setCrawledNews([]);

    try {
      const resp = await fetch("/api/magazine/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: crawlKeyword.trim(),
          sources: crawlSources,
          fetchContent,
        }),
      });
      const data = await resp.json();
      if (data.error) {
        setCrawlError(data.error);
      } else {
        setCrawledNews(data.items || []);
        if (data.items.length === 0) {
          setCrawlError("未生成到资讯，建议：1) 更换关键词 2) 勾选'AI智能生成'数据源 3) 重试");
        }
      }
    } catch (err: any) {
      setCrawlError(`请求失败: ${err.message}`);
    }
    setCrawling(false);
  };

  // 导入单条资讯到编辑弹窗（一键生成文章）
  const handleImportNews = (news: CrawledNews) => {
    setEditingArticle(null);
    setFormData({
      title: news.title,
      excerpt: news.excerpt,
      content: news.content || news.excerpt,
      image_url: news.image_url,
      tag: news.tag,
      is_premium: false,
      is_published: false,
    });
    setShowModal(true);
  };

  const handleBatchImport = async () => {
    const toImport = crawledNews.slice(0, 10);
    if (toImport.length === 0) return;
    if (!confirm(`确认导入${toImport.length}条资讯？`)) return;

    for (const news of toImport) {
      await supabase.from("articles").insert([{
        title: news.title,
        excerpt: news.excerpt,
        content: news.content || news.excerpt,
        image_url: news.image_url,
        tag: news.tag,
        is_premium: false,
        is_published: false,
      }]);
    }
    fetchArticles();
    setCrawledNews(prev => prev.slice(toImport.length));
  };

  const toggleCrawlSource = (value: string) => {
    setCrawlSources(prev => prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]);
  };

  return (
    <div>
      {/* Tab切换 */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab("manage")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "manage" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}>
          <FileText className="w-4 h-4 inline mr-1.5" />文章管理
        </button>
        <button onClick={() => setTab("crawl")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "crawl" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}>
          <Globe className="w-4 h-4 inline mr-1.5" />时尚资讯爬虫
        </button>
      </div>

      {/* ========== Tab: 文章管理 ========== */}
      {tab === "manage" && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-primary">流行资讯管理</h1>
              <p className="text-muted-foreground mt-1">发布和管理资讯文章，设置付费订阅</p>
            </div>
            <button onClick={() => { setEditingArticle(null); setFormData({ title: "", excerpt: "", content: "", image_url: "", tag: "", is_premium: false, is_published: false }); setShowModal(true); }}
              className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />新增文章
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" /><p className="text-muted-foreground">加载中...</p></div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">暂无文章，点击"新增文章"或使用"时尚资讯爬虫"采集</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">封面</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">文章标题</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">标签</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">付费</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">状态</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">创建时间</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {articles.map(article => (
                    <tr key={article.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        {article.image_url ? <img src={article.image_url} alt="" className="w-16 h-12 object-cover rounded-lg" />
                          : <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6 text-gray-400" /></div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-primary max-w-xs truncate">{article.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">{article.excerpt}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">{article.tag || "未分类"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => togglePremium(article)}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${article.is_premium ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"}`}>
                          {article.is_premium ? "付费" : "免费"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => togglePublish(article)}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${article.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {article.is_published ? <><Eye className="w-3 h-3 inline" /> 已发布</> : <><EyeOff className="w-3 h-3 inline" /> 草稿</>}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(article.created_at).toLocaleDateString("zh-CN")}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(article)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(article.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ========== Tab: 时尚资讯爬虫 ========== */}
      {tab === "crawl" && (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Globe className="w-6 h-6 text-accent" />
              时尚资讯爬虫
            </h1>
            <p className="text-muted-foreground mt-1">真实互联网时尚资讯采集，一键导入文章库</p>
          </div>

          {/* 搜索栏 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={crawlKeyword} onChange={e => setCrawlKeyword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCrawl()}
                  placeholder="输入关键词搜索时尚资讯（如：2025春夏趋势、穿搭技巧、品牌动态）"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <button onClick={handleCrawl} disabled={crawling || crawlSources.length === 0}
                className="btn-primary flex items-center gap-2 px-6 whitespace-nowrap">
                {crawling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {crawling ? "采集中..." : "采集资讯"}
              </button>
            </div>

            {/* 数据源 */}
            <div className="mt-4">
              <div className="text-xs text-gray-500 mb-2">数据源：</div>
              <div className="flex flex-wrap gap-2">
                {CRAWL_SOURCES.map(src => (
                  <button key={src.value} onClick={() => toggleCrawlSource(src.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                      crawlSources.includes(src.value) ? "bg-accent/10 text-accent border border-accent/30" : "bg-gray-50 text-gray-500 border border-gray-200"
                    }`}>
                    {src.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 选项 */}
            <div className="mt-3 flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" checked={fetchContent} onChange={e => setFetchContent(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-accent" />
                同时抓取文章详情（较慢，但内容更完整）
              </label>
            </div>

            {/* 快捷关键词 */}
            <div className="flex flex-wrap gap-2 mt-3">
              {QUICK_KEYWORDS.map(kw => (
                <button key={kw} onClick={() => setCrawlKeyword(kw)}
                  className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600 hover:bg-accent/10 hover:text-accent">
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* 错误提示 */}
          {crawlError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-600">{crawlError}</div>
            </div>
          )}

          {/* 采集结果 */}
          {crawledNews.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  采集到 <span className="font-bold text-primary">{crawledNews.length}</span> 条资讯
                </div>
                <button onClick={handleBatchImport}
                  className="btn-secondary flex items-center gap-2 text-sm">
                  <Download className="w-4 h-4" /> 批量导入前10条
                </button>
              </div>

              <div className="space-y-3">
                {crawledNews.map((news, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start gap-4">
                      {news.image_url ? (
                        <img src={news.image_url} alt="" className="w-20 h-14 object-cover rounded-lg flex-shrink-0" />
                      ) : (
                        <div className="w-20 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Newspaper className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-primary text-sm truncate">{news.title}</span>
                          <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full flex-shrink-0">{news.tag}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{news.excerpt}</div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{news.source}</span>
                          {news.published_at && <span>{news.published_at}</span>}
                          {news.source_url && (
                            <a href={news.source_url} target="_blank" rel="noopener noreferrer"
                              className="text-accent hover:underline flex items-center gap-1">
                              <Globe className="w-3 h-3" />查看原文
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleImportNews(news)}
                        disabled={importing === news.title}
                        className="px-4 py-2 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap">
                        {importing === news.title ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        导入
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!crawling && crawledNews.length === 0 && !crawlError && (
            <div className="text-center py-16">
              <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">输入关键词搜索真实互联网时尚资讯</p>
              <p className="text-xs text-gray-400 mt-1">数据来源：Vogue中国、ELLE中国、搜索引擎聚合</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">{editingArticle ? "编辑文章" : "新增文章"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">文章标题 *</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="输入文章标题" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">文章摘要</label>
                <input type="text" value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="文章摘要" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">标签</label>
                <input type="text" value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="如：流行趋势、搭配技巧" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-primary">文章内容 *</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors">
                      <Upload className="w-3 h-3" />
                      <span>插入图片</span>
                      <input type="file" accept="image/*" onChange={handleContentImageUpload} className="hidden" />
                    </label>
                    <span className="text-xs text-gray-400">支持 Markdown</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* 编辑区 */}
                  <textarea
                    id="article-content"
                    required
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    rows={12}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none font-mono"
                    placeholder="## 小标题&#10;&#10;正文内容...&#10;&#10;![图片描述](图片URL)"
                  />
                  {/* 预览区 */}
                  <div className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm overflow-y-auto max-h-80">
                    <div className="text-xs text-gray-400 mb-2 border-b border-gray-100 pb-1">实时预览</div>
                    {formData.content ? (
                      <div className="prose prose-sm max-w-none">
                        {formData.content.split('\n').map((line, i) => {
                          // 标题
                          if (line.startsWith('### ')) return <h3 key={i} className="text-base font-bold text-primary mt-3 mb-1">{line.replace('### ', '')}</h3>;
                          if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-primary mt-4 mb-2">{line.replace('## ', '')}</h2>;
                          if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-primary mt-4 mb-2">{line.replace('# ', '')}</h1>;
                          // 图片
                          const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
                          if (imgMatch) return <img key={i} src={imgMatch[2]} alt={imgMatch[1]} className="max-w-full rounded-lg my-2" />;
                          // 粗体
                          if (line.includes('**')) {
                            const parts = line.split(/(\*\*.*?\*\*)/);
                            return <p key={i} className="my-1 leading-relaxed">{parts.map((p, j) => p.startsWith('**') && p.endsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : p)}</p>;
                          }
                          // 空行
                          if (line.trim() === '') return <div key={i} className="h-2" />;
                          // 普通段落
                          return <p key={i} className="my-1 leading-relaxed">{line}</p>;
                        })}
                      </div>
                    ) : (
                      <div className="text-gray-300 text-sm italic">预览区域...</div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">封面图</label>
                {formData.image_url ? (
                  <div className="relative inline-block">
                    <img src={formData.image_url} alt="" className="w-64 h-40 object-cover rounded-lg" />
                    <button type="button" onClick={() => setFormData({...formData, image_url: ""})}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-64 h-40 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-muted-foreground">{uploading ? "上传中..." : "点击上传"}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                  </label>
                )}
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.is_premium} onChange={e => setFormData({...formData, is_premium: e.target.checked})} className="w-4 h-4 text-accent rounded" />
                  <span className="text-sm text-primary">付费文章</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.is_published} onChange={e => setFormData({...formData, is_published: e.target.checked})} className="w-4 h-4 text-accent rounded" />
                  <span className="text-sm text-primary">立即发布</span>
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editingArticle ? "保存修改" : "发布文章"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
}
