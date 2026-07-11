var app = getApp();

// 把 Markdown 正文解析成渲染块（标题/段落/图片/视频/链接）
function parseBlocks(content) {
  if (!content) return [];
  var lines = content.split("\n");
  var blocks = [];
  for (var i = 0; i < lines.length; i++) {
    var trimmed = lines[i].trim();
    if (trimmed === "") continue;

    // 跳过旧版 Vogue 视频外链行（不再引导到 Vogue 付费视频）
    if (/^>?\s*▶\s*观看秀场视频/.test(trimmed)) continue;

    // 视频行：▶ 观看秀场视频：[标题](url)
    var vMatch = trimmed.match(/^▶\s*观看秀场视频：\[([^\]]*)\]\((https?:\/\/[^)]+)\)/);
    if (vMatch) {
      blocks.push({ type: "video", title: vMatch[1], url: vMatch[2] });
      continue;
    }
    var vMatch2 = trimmed.match(/▶\s*([^[\]]*?)\s*\((https?:\/\/[^)]+)\)/);
    if (vMatch2 && /视频|youtube|bilibili|douyin|weibo|youku|qq\.com|xiaohongshu|kuaishou|ixigua/i.test(vMatch2[2])) {
      blocks.push({ type: "video", title: vMatch2[1].replace(/^观看秀场视频：/, "").trim() || "秀场视频", url: vMatch2[2] });
      continue;
    }

    // 图片：![alt](url)
    var imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
      blocks.push({ type: "img", alt: imgMatch[1], src: imgMatch[2] });
      continue;
    }

    if (trimmed.indexOf("### ") === 0) { blocks.push({ type: "h3", text: trimmed.substring(4) }); continue; }
    if (trimmed.indexOf("## ") === 0) { blocks.push({ type: "h2", text: trimmed.substring(3) }); continue; }
    if (trimmed.indexOf("# ") === 0) { blocks.push({ type: "h1", text: trimmed.substring(2) }); continue; }

    // 普通链接
    var linkMatch = trimmed.match(/\[(.*?)\]\((https?:\/\/[^)]+)\)/);
    if (linkMatch) {
      blocks.push({ type: "link", text: linkMatch[1], url: linkMatch[2] });
      continue;
    }

    blocks.push({ type: "p", text: trimmed });
  }
  return blocks;
}

// 处理 **加粗**
function renderInline(text) {
  var parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts
    .filter(function (p) { return p !== ""; })
    .map(function (p) {
      if (p.indexOf("**") === 0 && p.lastIndexOf("**") === p.length - 2) {
        return { bold: true, text: p.slice(2, -2) };
      }
      return { bold: false, text: p };
    });
}

// 趋势正文解析：按纯文本段落切分（图片已在画廊展示，正文不重复渲染图片），保留 **加粗**
function parseTrendContent(content) {
  if (!content) return [];
  return content.split("\n").map(function (line) { return line.trim(); })
    .filter(function (line) { return line !== ""; })
    .filter(function (line) { return !/^!\[.*?\]\(.*?\)/.test(line); }) // 跳过图片行（画廊已展示）
    .map(function (line) { return { type: "p", text: line, inline: renderInline(line) }; });
}

Page({
  data: { id: "", type: "article", loading: true, article: null, blocks: [], gallery: [] },

  onLoad: function (options) {
    var id = options && options.id;
    var type = (options && options.type) === "trend" ? "trend" : "article";
    this.setData({ id: id, type: type });
    this.load(id, type);
  },

  load: function (id, type) {
    var t = this;
    t.setData({ loading: true });
    var api = type === "trend"
      ? "https://colour-choice.art/api/public/fashion-trends?id=" + id
      : "https://colour-choice.art/api/public/articles?id=" + id;
    wx.request({
      url: api,
      method: "GET",
      success: function (r) {
        var list = (r.data && r.data.data) || [];
        var a = list[0];
        if (a) {
          var blocks, gallery = [];
          if (type === "trend") {
            // 趋势：画廊用 images 字段，正文按纯文本渲染
            gallery = Array.isArray(a.images) ? a.images : [];
            blocks = parseTrendContent(a.content || "");
          } else {
            blocks = parseBlocks(a.content || "");
            // 去掉与封面图重复的 content 首图，避免首图在详情页显示两次
            var cover = a.image_url;
            for (var bi = 0; bi < blocks.length; bi++) {
              if (blocks[bi].type === "img") {
                if (cover && blocks[bi].src === cover) {
                  blocks.splice(bi, 1);
                }
                break; // 只检查第一张图片
              }
            }
            blocks.forEach(function (b) {
              if (b.type === "p" || b.type === "h1" || b.type === "h2" || b.type === "h3") {
                b.inline = renderInline(b.text);
              }
            });
          }
          t.setData({ article: a, blocks: blocks, gallery: gallery, loading: false });
        } else {
          t.setData({ loading: false });
        }
      },
      fail: function () { t.setData({ loading: false }); },
    });
  },

  copyVideo: function (e) {
    var url = e.currentTarget.dataset.url;
    wx.setClipboardData({
      data: url,
      success: function () { wx.showToast({ title: "视频链接已复制", icon: "none" }); },
    });
  },

  copyLink: function (e) {
    var url = e.currentTarget.dataset.url;
    wx.setClipboardData({ data: url });
  },

  goBack: function () { wx.navigateBack(); },
});
