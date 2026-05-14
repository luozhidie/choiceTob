"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  FileText,
  Image,
  Save,
  Plus,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface MagazineArticle {
  id: string;
  tag: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  imageEmoji: string;
}

// 模拟数据 — 正式版会从Supabase读取
const initialArticles: MagazineArticle[] = [
  {
    id: "1",
    tag: "流行趋势",
    title: "2026早春系列：数字薰衣草与科技面料的完美邂逅",
    excerpt: "从米兰到巴黎，从上海到东京，全球四大时装周传递出的信号惊人一致...",
    content: "这里是完整文章内容...",
    date: "2026-05-15",
    imageEmoji: "👗",
  },
  {
    id: "2",
    tag: "面料科技",
    title: "石墨烯保暖面料实测：黑科技还是营销噱头？",
    excerpt: "我们采购了市面上12款宣称含石墨烯的保暖内衣，联合第三方实验室...",
    content: "这里是完整文章内容...",
    date: "2026-05-13",
    imageEmoji: "🧪",
  },
];

export default function MagazineManagePage() {
  const [articles, setArticles] = useState<MagazineArticle[]>(initialArticles);
  const [editing, setEditing] = useState<MagazineArticle | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSave = () => {
    if (!editing) return;
    setArticles((prev) => {
      const idx = prev.findIndex((a) => a.id === editing.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = editing;
        return copy;
      }
      return [...prev, { ...editing, id: Date.now().toString() }];
    });
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-primary">时尚杂志管理</h1>
          <span className="text-sm text-muted-foreground">
            {articles.length} 篇文章
          </span>
        </div>
        <button
          onClick={() => {
            setEditing({
              id: "",
              tag: "",
              title: "",
              excerpt: "",
              content: "",
              date: new Date().toISOString().slice(0, 10),
              imageEmoji: "📰",
            });
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建文章
        </button>
      </section>

      {/* Article List */}
      <section className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="space-y-4">
          {articles.map((article) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-accent/10 text-accent text-xs font-medium">
                      {article.tag}
                    </span>
                    <span className="text-xs text-gray-400">{article.date}</span>
                  </div>
                  <h3 className="font-bold text-primary truncate">{article.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {article.excerpt}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-2xl">{article.imageEmoji}</span>
                  <button
                    onClick={() => {
                      setEditing(article);
                      setShowForm(true);
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {articles.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-5xl mb-4">📖</div>
            <p>暂无文章，点击"新建文章"发布第一篇杂志内容</p>
          </div>
        )}
      </section>

      {/* Edit Modal */}
      {showForm && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-primary mb-6">
              {editing.id ? "编辑文章" : "新建文章"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">封面Emoji</label>
                <input
                  type="text"
                  value={editing.imageEmoji}
                  onChange={(e) => setEditing({ ...editing, imageEmoji: e.target.value })}
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center text-2xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类标签</label>
                <input
                  type="text"
                  value={editing.tag}
                  onChange={(e) => setEditing({ ...editing, tag: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm"
                  placeholder="如：流行趋势"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">文章标题 *</label>
                <input
                  type="text"
                  required
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm"
                  placeholder="请输入文章标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">摘要 *</label>
                <textarea
                  value={editing.excerpt}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm resize-none"
                  placeholder="请输入文章摘要"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">完整内容 *</label>
                <textarea
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm resize-none font-mono"
                  placeholder="请输入HTML或Markdown格式的文章内容"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">发布日期</label>
                <input
                  type="date"
                  value={editing.date}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存发布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
