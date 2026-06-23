// /api/image-grabber/fetch/route.ts
// 抓取网页/文章中的图片
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "缺少URL参数" }, { status: 400 });
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "无效的URL格式" }, { status: 400 });
    }

    console.log("[图片抓取] 开始抓取:", url);

    // 获取网页内容
    let html = "";
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      html = await response.text();
    } catch (error) {
      console.error("[图片抓取] 获取页面失败:", error);
      // 返回空数组，让前端处理错误
      return NextResponse.json({
        images: [],
        error: `无法访问该链接: ${error instanceof Error ? error.message : "未知错误"}`,
      });
    }

    // 提取所有图片URL
    const imageUrls: string[] = [];

    // 匹配 img 标签的 src
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];
      if (
        src &&
        !src.startsWith("data:") && // 排除base64
        (src.includes("http://") || src.includes("https://") || src.startsWith("//"))
      ) {
        // 处理相对路径
        let absoluteUrl = src;
        if (src.startsWith("//")) {
          absoluteUrl = "https:" + src;
        } else if (src.startsWith("/")) {
          try {
            const baseUrl = new URL(url);
            absoluteUrl = `${baseUrl.origin}${src}`;
          } catch {
            absoluteUrl = src;
          }
        }

        // 过滤掉小图标和logo（通常小于50x50）
        imageUrls.push(absoluteUrl);
      }
    }

    // 特殊处理：微信公众号文章
    if (url.includes("mp.weixin.qq.com") || url.includes("weixin")) {
      // 微信文章通常使用 data-src 属性存储高清图
      const dataSrcRegex = /data-src=["']([^"']+)["']/g;
      while ((match = dataSrcRegex.exec(html)) !== null) {
        if (match[1]) {
          imageUrls.push(match[1]);
        }
      }

      // 提取微信 CDN 图片
      const wechatCdnRegex = /https?:\/\/mmbiz\.qpic\.cn\/[^\s"'\)]+/g;
      while ((match = wechatCdnRegex.exec(html)) !== null) {
        if (match[0]) {
          imageUrls.push(match[0]);
        }
      }
    }

    // 去重并过滤有效图片
    const uniqueImages = [...new Set(imageUrls)].filter((imgUrl) => {
      const lower = imgUrl.toLowerCase();
      return (
        (lower.endsWith(".jpg") ||
          lower.endsWith(".jpeg") ||
          lower.endsWith(".png") ||
          lower.endsWith(".gif") ||
          lower.endsWith(".webp") ||
          lower.endsWith(".bmp") ||
          lower.includes("qpic.cn") || // 微信图片
          lower.includes("cdn")) && // CDN图片
        !lower.includes("icon") && // 排除图标
        !lower.includes("logo") && // 排除logo
        !lower.includes("avatar") // 排除头像
      );
    });

    console.log(
      `[图片抓取] 完成，找到 ${uniqueImages.length} 张图片`
    );

    return NextResponse.json({
      images: uniqueImages,
      total: uniqueImages.length,
      source: url,
    });
  } catch (error) {
    console.error("[图片抓取API错误]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    );
  }
}
