var app = getApp();

// 把 Markdown 正文解析成渲染块（标题/段落/图片/视频/链接）
function parseBlocks(content) {
  if (!content) return [];
  var lines = content.split("\n");
  var blocks = [];
  for (var i = 0; i < lines.length; i++) {
    var trimmed = lines[i].trim();
    if (trimmed === "") continue;

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

Page({
  data: { id: "", loading: true, article: null, blocks: [] },

  onLoad: function (options) {
    var id = options && options.id;
    this.setData({ id: id });
    this.load(id);
  },

  load: function (id) {
    var t = this;
    t.setData({ loading: true });
    wx.request({
      url: "https://colour-choice.art/api/public/articles?id=" + id,
      method: "GET",
      success: function (r) {
        var list = (r.data && r.data.data) || [];
        var a = list[0];
        if (a) {
          var blocks = parseBlocks(a.content || "");
          blocks.forEach(function (b) {
            if (b.type === "p" || b.type === "h1" || b.type === "h2" || b.type === "h3") {
              b.inline = renderInline(b.text);
            }
          });
          t.setData({ article: a, blocks: blocks, loading: false });
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
