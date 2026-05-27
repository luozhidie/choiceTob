import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

/**
 * POST /api/magazine/crawl
 * 真实爬取互联网时尚资讯/新闻
 *
 * 数据源：
 * - vogue: Vogue中国
 * - elle: ELLE中国
 * - harpersbazaar: 时尚芭莎
 * - gq: GQ中国
 * - wwd: WWD国际时尚特讯
 * - boa: BOF商业评论
 * - bing: 搜索引擎聚合
 */

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

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

/* ============ 各资讯源爬虫 ============ */

/** Vogue中国 */
async function crawlVogue(keyword: string): Promise<NewsItem[]> {
  const items: NewsItem[] = [];
  try {
    const url = keyword
      ? `https://www.vogue.com.cn/search/?q=${encodeURIComponent(keyword)}`
      : `https://www.vogue.com.cn/fashion/`;
    const resp = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9" },
      signal: AbortSignal.timeout(12000),
    });
    const html = await resp.text();
    const $ = cheerio.load(html);

    $(".article-item, .feed-item, .search-result-item, .grid-item").each((_, el) => {
      const title = $(el).find("h2 a, h3 a, .title a, .article-title a").text().trim();
      const link = $(el).find("h2 a, h3 a, .title a, .article-title a").attr("href") || "";
      const excerpt = $(el).find("p, .excerpt, .summary, .article-summary").text().trim();
      const img = $(el).find("img").attr("src") || $(el).find("img").attr("data-src") || "";
      const time = $(el).find("time, .date, .article-date").text().trim();
      const author = $(el).find(".author, .byline").text().trim();

      if (title) {
        items.push({
          title,
          excerpt: excerpt.substring(0, 200),
          content: "",
          source: "Vogue中国",
          source_url: link.startsWith("/") ? `https://www.vogue.com.cn${link}` : link,
          image_url: img.startsWith("//") ? "https:" + img : img,
          tag: "时尚趋势",
          published_at: time,
          author,
        });
      }
    });

    // 尝试解析JSON数据（Vogue可能用Next.js SSR）
    if (items.length === 0) {
      const scriptTags = $("script").toArray();
      for (const script of scriptTags) {
        const text = $(script).html() || "";
        if (text.includes("__NEXT_DATA__")) {
          try {
            const match = text.match(/__NEXT_DATA__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/m);
            if (match) {
              const data = JSON.parse(match[1]);
              const articles = data?.props?.pageProps?.articles ||
                              data?.props?.pageProps?.searchResults || [];
              for (const article of articles.slice(0, 15)) {
                items.push({
                  title: article.title || article.name || "",
                  excerpt: (article.excerpt || article.description || "").substring(0, 200),
                  content: article.content || "",
                  source: "Vogue中国",
                  source_url: article.url || article.canonicalUrl || "",
                  image_url: article.image?.url || article.thumbnail || "",
                  tag: article.category?.name || "时尚趋势",
                  published_at: article.publishDate || article.date || "",
                  author: article.author?.name || "",
                });
              }
            }
          } catch (e) { /* 解析失败 */ }
          break;
        }
      }
    }
  } catch (e: any) {
    console.error("Vogue爬取失败:", e.message);
  }
  return items;
}

/** ELLE中国 */
async function crawlElle(keyword: string): Promise<NewsItem[]> {
  const items: NewsItem[] = [];
  try {
    const url = keyword
      ? `https://www.ellechina.com/search/?q=${encodeURIComponent(keyword)}`
      : `https://www.ellechina.com/fashion/`;
    const resp = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9" },
      signal: AbortSignal.timeout(12000),
    });
    const html = await resp.text();
    const $ = cheerio.load(html);

    $(".article-card, .article-item, .grid-item, .story-card").each((_, el) => {
      const title = $(el).find("h2 a, h3 a, .title a, .card-title a").text().trim();
      const link = $(el).find("a").first().attr("href") || "";
      const excerpt = $(el).find("p, .excerpt, .summary").text().trim();
      const img = $(el).find("img").attr("src") || $(el).find("img").attr("data-src") || "";

      if (title) {
        items.push({
          title,
          excerpt: excerpt.substring(0, 200),
          content: "",
          source: "ELLE中国",
          source_url: link.startsWith("/") ? `https://www.ellechina.com${link}` : link,
          image_url: img.startsWith("//") ? "https:" + img : img,
          tag: "时尚穿搭",
          published_at: "",
          author: "",
        });
      }
    });
  } catch (e: any) {
    console.error("ELLE爬取失败:", e.message);
  }
  return items;
}

/** Bing搜索聚合时尚资讯 */
async function crawlBingNews(keyword: string): Promise<NewsItem[]> {
  const items: NewsItem[] = [];
  try {
    const q = `${keyword} 时尚资讯 OR 流行趋势 OR 服装 OR 搭配 2025`;
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

    // 如果新闻搜索没结果，用普通搜索
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
        }
      });
    }
  } catch (e: any) {
    console.error("Bing资讯爬取失败:", e.message);
  }
  return items;
}

/** 爬取文章详情内容 */
async function crawlArticleContent(url: string): Promise<string> {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9" },
      signal: AbortSignal.timeout(8000),
    });
    const html = await resp.text();
    const $ = cheerio.load(html);

    // 尝试常见文章内容选择器
    const contentSelectors = [
      ".article-content", ".post-content", ".entry-content",
      ".article-body", ".story-body", ".content-body",
      "article", ".main-content", "#article-content",
    ];

    for (const selector of contentSelectors) {
      const content = $(selector).text().trim();
      if (content.length > 100) {
        return content.substring(0, 5000); // 最多5000字
      }
    }

    // fallback: 取最长的p标签段落
    let longest = "";
    $("p").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > longest.length) longest = text;
    });

    return longest.substring(0, 3000);
  } catch {
    return "";
  }
}

/* ============ 辅助函数 ============ */

function detectTag(text: string): string {
  const tags: Record<string, string[]> = {
    "流行趋势": ["趋势", "流行", "潮流", "2025", "春夏", "秋冬"],
    "搭配技巧": ["搭配", "穿搭", "造型", "outfit"],
    "品牌动态": ["品牌", "发布", "秀场", "collection", "联名"],
    "面料工艺": ["面料", "材质", "工艺", "材质"],
    "行业动态": ["市场", "行业", "零售", "消费", "销售"],
    "秀场速报": ["秀场", "时装周", "fashion week", "runway"],
  };

  for (const [tag, keywords] of Object.entries(tags)) {
    if (keywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))) {
      return tag;
    }
  }
  return "时尚资讯";
}

/* ============ 主接口 ============ */

export async function POST(req: NextRequest) {
  try {
    const { keyword, sources, fetchContent } = await req.json();
    const kw = keyword?.trim() || "2025时尚趋势";
    const enabledSources = sources || ["vogue", "elle", "bing"];

    // 并行爬取
    const tasks: Promise<NewsItem[]>[] = [];
    if (enabledSources.includes("vogue")) tasks.push(crawlVogue(kw));
    if (enabledSources.includes("elle")) tasks.push(crawlElle(kw));
    if (enabledSources.includes("bing")) tasks.push(crawlBingNews(kw));

    const results = await Promise.allSettled(tasks);

    // 合并
    const allItems: NewsItem[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allItems.push(...result.value);
      }
    }

    // 去重
    const seen = new Set<string>();
    const deduped = allItems.filter(item => {
      const key = item.title.substring(0, 30).trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 如果需要抓取详情内容（可选，慢一些）
    if (fetchContent && deduped.length > 0) {
      const topItems = deduped.slice(0, 5); // 只抓前5篇详情
      await Promise.allSettled(
        topItems.map(async (item) => {
          if (item.source_url && !item.content) {
            item.content = await crawlArticleContent(item.source_url);
          }
        })
      );
    }

    return NextResponse.json({
      keyword: kw,
      items: deduped,
      total: deduped.length,
      crawledAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
