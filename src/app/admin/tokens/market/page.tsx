"use client";

import { useState, useEffect } from "react";
import { Loader2, Tag, ShoppingCart, CheckCircle2 } from "lucide-react";

const DOMAINS = ["全部", "服装", "金融", "股票", "艺术", "其他"];

// 买家询价联系方式：这里先放默认信息，后续可在后台设置页替换
const CONTACT = { name: "骆芷蝶", email: "luozhidie@live.cn", wechat: "请替换为你的微信号" };

interface Token {
  id: string;
  domain: string;
  category: string;
  title: string;
  summary: string;
  fields: any;
  metric: string;
  status: string;
  usage_count: number;
}

export default function TokenMarketPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState("全部");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/admin/tokens", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setTokens(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = tokens.filter(
    (t) =>
      t.status === "published" &&
      t.fields?.trade?.status === "quoted" &&
      (domain === "全部" || t.domain === domain)
  );

  const copyContact = () => {
    const text = `${CONTACT.name} · ${CONTACT.email} · 微信:${CONTACT.wechat}`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">词元市场</h1>
          <p className="text-muted-foreground mt-1">把沉淀的词元摆上货架，按价值标价，有意向的客户可联系你购买/授权</p>
        </div>
        <a href="/tokens-market" target="_blank" className="btn-secondary text-sm">查看对外公开页 ↗</a>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {DOMAINS.map((d) => (
          <button
            key={d}
            onClick={() => setDomain(d)}
            className={`px-3 py-1.5 rounded-lg text-sm ${domain === d ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {d}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin inline" /> 加载中…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-muted-foreground">
          暂无上架词元。去「选品判断词元」页把词元的上架状态设为「上架展示，可询价」并填写价格。
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-primary truncate">{t.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{t.domain}</span>
                    <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">{t.category}</span>
                    {t.fields?.layer && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-xs">{t.fields.layer}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-bold text-orange-600">¥{t.fields?.trade?.price ?? 0}</div>
                  <div className="text-xs text-muted-foreground">/{t.fields?.trade?.unit || "按次"}</div>
                </div>
              </div>
              {t.summary && <p className="text-sm text-muted-foreground mt-3">{t.summary}</p>}
              {t.fields?.trade?.note && <p className="text-xs text-gray-500 mt-2">💡 {t.fields.trade.note}</p>}
              <div className="flex items-center flex-wrap gap-3 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> 计量：{t.metric || "—"}</span>
                <span>已调用 {t.usage_count || 0} 次</span>
                {Array.isArray(t.fields?.depends_on) && t.fields.depends_on.length > 0 && (
                  <span>组合 {t.fields.depends_on.length} 条词元</span>
                )}
              </div>
              <button onClick={copyContact} className="mt-4 w-full btn-primary flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" /> 我要询价
              </button>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
          <p>📌 这是词元市场预览。买家看到的价格和说明就是上面的内容。点击「我要询价」会复制你的联系方式。</p>
          <p className="mt-1">当前联系方式：{CONTACT.name} · {CONTACT.email} · 微信：{CONTACT.wechat}</p>
          {copied && <p className="mt-1 text-green-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> 已复制联系方式</p>}
        </div>
      )}
    </div>
  );
}
