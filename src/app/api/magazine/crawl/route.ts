import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

interface NewsItem {
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

/* ============ DeepSeek AI 生成时尚资讯 ============ */

async function generateFashionNewsWithAI(keyword: string, count: number = 5): Promise<NewsItem[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn("未配置 DEEPSEEK_API_KEY，跳过AI生成");
    return [];
  }

  const systemPrompt = `你是资深时尚编辑，擅长撰写专业时尚资讯文章。
请根据用户给的关键词，生成${count}篇真实、专业、有时效性的时尚资讯。
每篇文章要有：标题、摘要、正文内容、标签、来源、发布时间。
文章内容要专业、有深度，包含具体的时尚趋势分析、搭配建议、品牌动态等。
请返回严格JSON数组格式：
[
  {
    "title": "文章标题",
    "excerpt": "200字以内摘要",
    "content": "完整文章内容（1500-3000字），使用Markdown格式，可包含小标题、列表等",
    "tag": "标签，如：流行趋势/搭配技巧/品牌动态/秀场速报",
    "source": "模拟来源，如：Vogue中国/ELLE中国/时尚芭莎",
    "published_at": "2025-05-28",
    "author": "作者名"
  }
]`;

  const userPrompt = `请生成${count}篇关于「${keyword}」的时尚资讯文章。
要求：
1. 标题吸引人，有新闻感
2. 内容专业，有具体分析和建议
3. 包含至少3个具体品牌或设计师的名字
4. 包含色彩搭配建议
5. 包含穿搭场景建议
6. 正文用Markdown格式，有层级结构`;

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.error("DeepSeek API error:", res.status);
      return [];
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    const articles = Array.isArray(parsed) ? parsed : parsed.articles || parsed.items || [];

    return articles.map((a: any, i: number) => ({
      title: a.title || `时尚资讯 ${i + 1}`,
      excerpt: (a.excerpt || a.summary || "").substring(0, 200),
      content: a.content || a.body || a.excerpt || "",
      source: a.source || "时尚资讯",
      source_url: "#",
      image_url: "",
      tag: a.tag || detectTag(a.title + " " + a.excerpt),
      published_at: a.published_at || new Date().toISOString().split("T")[0],
      author: a.author || "时尚编辑部",
    }));
  } catch (e: any) {
    console.error("AI生成资讯失败:", e.message);
    return [];
  }
}

/* ============ 爬虫作为 fallback ============ */

async function crawlBingNews(keyword: string): Promise<NewsItem[]> {
  const items: NewsItem[] = [];
  try {
    const q = `${keyword} 时尚资讯 OR 流行趋势 OR 服装 OR 搭配`;
    const url = `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&setlang=zh-CN`;
    const resp = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9" },
      signal: AbortSignal.timeout(12000),
    });
    const html = await resp.text();
    const $ = cheerio.load(html);

    $(".news-card, .newsitem, .algocore .card").each((_, el) => {
      const title = $(el).find(".title a, .card-title a, h2 a").text().trim();
      const link = $(el).find(".title a, .card-title a, h2 a").attr("href") || "";
      const excerpt = $(el).find(".snippet, .card-content p, .abstract").text().trim();
      const img = $(el).find("img").attr("src") || "";
      const source = $(el).find(".source, .news-card-source").text().trim();
      const time = $(el).find(".timestamp, time, .card-time").text().trim();

      if (title && title.length > 5) {
        items.push({
          title,
          excerpt: excerpt.substring(0, 200),
          content: "",
          source: source || "综合资讯",
          source_url: link,
          image_url: img.startsWith("//") ? "https:" + img : img,
          tag: detectTag(title + " " + excerpt),
          published_at: time,
          author: "",
        });
      }
    });

    // fallback: 普通搜索
    if (items.length === 0) {
      const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
      const searchResp = await fetch(searchUrl, {
        headers: { "User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9" },
        signal: AbortSignal.timeout(12000),
      });
      const searchHtml = await searchResp.text();
      const $s = cheerio.load(searchHtml);

      $s("#b_results .b_algo").each((_, el) => {
        const title = $s(el).find("h2 a").text().trim();
        const link = $s(el).find("h2 a").attr("href") || "";
        const snippet = $s(el).find(".b_caption p, p").text().trim();

        if (title && snippet && (title.includes("时尚") || title.includes("流行") || title.includes("服装") || title.includes("搭配") || snippet.includes("时尚") || snippet.includes("流行"))) {
          try {
            const hostname = link ? new URL(link).hostname.replace("www.", "") : "";
            items.push({
              title,
              excerpt: snippet.substring(0, 200),
              content: "",
              source: hostname || "综合资讯",
              source_url: link,
              image_url: "",
              tag: detectTag(title + " " + snippet),
              published_at: "",
              author: "",
            });
          } catch { /* URL解析失败 */ }
        }
      });
    }
  } catch (e: any) {
    console.error("Bing爬取失败:", e.message);
  }
  return items;
}

function detectTag(text: string): string {
  const tags: Record<string, string[]> = {
    "流行趋势": ["趋势", "流行", "潮流", "2025", "春夏", "秋冬"],
    "搭配技巧": ["搭配", "穿搭", "造型", "outfit"],
    "品牌动态": ["品牌", "发布", "秀场", "collection", "联名"],
    "面料工艺": ["面料", "材质", "工艺"],
    "行业动态": ["市场", "行业", "零售", "消费", "销售"],
    "秀场速报": ["秀场", "时装周", "fashion week", "runway"],
  };
  for (const [tag, keywords] of Object.entries(tags)) {
    if (keywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))) return tag;
  }
  return "时尚资讯";
}

/* ============ 主接口 ============ */

export async function POST(req: NextRequest) {
  try {
    const { keyword, sources, fetchContent } = await req.json();
    const kw = keyword?.trim() || "2025时尚趋势";
    const enabledSources = sources || ["ai", "bing"];

    let allItems: NewsItem[] = [];

    // 优先使用AI生成（不受反爬限制）
    if (enabledSources.includes("ai") || enabledSources.includes("vogue") || enabledSources.includes("elle")) {
      const aiItems = await generateFashionNewsWithAI(kw, 5);
      allItems.push(...aiItems);
    }

    // Bing搜索作为补充
    if (enabledSources.includes("bing") || enabledSources.includes("搜索引擎聚合")) {
      const bingItems = await crawlBingNews(kw);
      allItems.push(...bingItems);
    }

    // 去重
    const seen = new Set<string>();
    const deduped = allItems.filter(item => {
      const key = item.title.substring(0, 30).trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({
      keyword: kw,
      items: deduped,
      total: deduped.length,
      source: deduped.length > 0 && deduped[0].content ? "ai_generated" : "crawled",
      crawledAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
