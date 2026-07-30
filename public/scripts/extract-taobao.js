// ============================================================
//  淘宝/天猫 商品一键提取 + 直传脚本
//  两种用法：
//   A) 控制台版：F12 / Ctrl+Shift+I 打开控制台 → 粘贴执行 → 复制结果
//   B) 书签版（推荐）：把下方「书签代码」存为浏览器书签，
//      在淘宝/天猫商品页点一下书签 → 自动提取并跳转后台入库
//
//  书签代码：
//  javascript:(function(){window.__AUTOPUSH__=true;var s=document.createElement('script');s.src='https://colour-choice.art/scripts/extract-taobao.js';document.head.appendChild(s);})();
// ============================================================

(function extractTaobao() {
  const isTmall = /tmall\.com|tmall\.hk/.test(location.hostname);
  const isTaobao = /taobao\.com|m\.tb\.cn/.test(location.hostname);
  const result = {
    platform: isTmall ? "tmall" : "taobao",
    title: "",
    price: "",
    originalPrice: "",
    description: "",
    supplier: "",
    specs: [],
    skuOptions: {},
    images: [],
  };

  // 安全取文本
  const textOf = (el) => (el ? (el.innerText || el.textContent || "").trim() : "");

  // ── 1. 标题（优先商品标题，排除评价/评论/公司名等干扰）──
  const badTitleRe = /用户评价|用户评论|评论\s*[·\d]|已售|加购|收藏|分享|图文详情|商品详情|店铺|有限公司|旗舰店|更多|推荐|供应商|厂家|源头工厂|宝贝|淘宝网|天猫|天猫国际|登录|注册|客服|购物车/;
  try {
    const titleCandidates = [
      document.querySelector("meta[property='og:title']"),
      document.querySelector("meta[name='og:title']"),
      document.querySelector("[class*='ItemTitle']"),
      document.querySelector("[class*='itemTitle']"),
      ...Array.from(document.querySelectorAll("h1")).filter(el => {
        const t = (el.innerText || "").trim();
        return t.length > 6 && t.length < 120 && !badTitleRe.test(t);
      }),
      ...Array.from(document.querySelectorAll("[class*='title']")).filter(el => {
        const t = (el.innerText || "").trim();
        return t.length > 6 && t.length < 120 && !badTitleRe.test(t);
      }),
    ];
    for (const el of titleCandidates) {
      if (!el) continue;
      let t = "";
      if (el.tagName && el.tagName.toLowerCase() === "meta") {
        t = el.getAttribute("content") || "";
      } else {
        t = textOf(el);
      }
      t = t.replace(/\s+/g, " ").trim();
      if (t && t.length > 6 && t.length < 120 && !badTitleRe.test(t) && !t.includes("有限公司")) {
        result.title = t; break;
      }
    }
    // 兜底：document.title 去掉站点后缀
    if (!result.title && document.title && document.title.length > 6) {
      const dt = document.title.split(/[-_｜|]/)[0].trim();
      if (dt.length > 6 && dt.length < 120 && !badTitleRe.test(dt)) result.title = dt;
    }
  } catch (e) {}

  // ── 2. 价格 ──
  try {
    const priceBadRe = /运费|邮费|优惠|券|满减|减|到手价|约|低至|起|万|亿|定金|尾款|预售价|立减/;
    // 策略1：meta 优先（最准）
    const metaPrice = document.querySelector("meta[property='og:price:amount']") ||
      document.querySelector("meta[property='product:price:amount']") ||
      document.querySelector("meta[name='price']");
    if (metaPrice) {
      const m = (metaPrice.getAttribute("content") || "").match(/(\d{1,6}(?:\.\d{1,2})?)/);
      if (m && parseFloat(m[1]) > 0) result.price = m[1];
    }
    // 策略2：带 price 类节点 + 父级上下文过滤
    if (!result.price) {
      const allEls = document.querySelectorAll(
        "[class*='price'], [class*='Price'], [class*='rmb'], .tb-rmb-num, .tm-price, [itemprop='price'], [class*='amount']"
      );
      let fallbackPrice = "";
      for (const el of allEls) {
        const t = (el.innerText || "").trim();
        if (!t) continue;
        const parentText = (el.parentElement && el.parentElement.innerText || t).trim();
        if (priceBadRe.test(parentText) || priceBadRe.test(t)) continue;
        if (/¥\s*\d+/.test(t) || /^\d+(\.\d{1,2})?$/.test(t) || /¥\s*\d+/.test(parentText)) {
          const m = (parentText.match(/¥\s*(\d{1,6}(?:\.\d{1,2})?)/) || t.match(/(\d{1,6}(?:\.\d{1,2})?)/));
          if (m && parseFloat(m[1]) > 0 && parseFloat(m[1]) < 100000) {
            if (!fallbackPrice) fallbackPrice = m[1];
            const cls = (el.className || "").toString();
            if (cls.includes("price") || cls.includes("Price") || cls.includes("rmb") || cls.includes("amount")) { result.price = m[1]; break; }
          }
        }
      }
      if (!result.price && fallbackPrice) result.price = fallbackPrice;
    }
    // 策略3：全局 ¥ 数字，排除运费/优惠上下文
    if (!result.price) {
      const body = document.body.innerText;
      const priceMatches = [...body.matchAll(/¥\s*(\d{1,6}(?:\.\d{1,2})?)/g)];
      for (const m of priceMatches) {
        const idx = m.index || 0;
        const context = body.slice(Math.max(0, idx - 30), idx + 30);
        if (!priceBadRe.test(context)) { result.price = m[1]; break; }
      }
    }
    // 原价
    const origSelectors = [
      ".original-price",
      ".tm-price-ori",
      "del",
      "[class*='origin']",
      "[class*='market']",
      "[class*='original']",
    ];
    for (const sel of origSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const m = textOf(el).replace(/[^\d.]/g, "").match(/\d+(?:\.\d{1,2})?/);
        if (m && m[0] && m[0] !== result.price) { result.originalPrice = m[0]; break; }
      }
    }
  } catch (e) {}

  // ── 3. 主图（淘宝/天猫 DOM 不同，尽量多覆盖）──
  try {
    const imgSet = new Set();
    const addImg = (src) => {
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
      if (!/\.(jpg|jpeg|png|webp|gif)(\?|_|$)/i.test(src) && !src.includes("alicdn.com")) return;
      // 去掉淘宝缩略图尺寸后缀，尽量拿大图
      src = src
        .replace(/_\d+x\d+q\d+\.jpg/, "_800x800.jpg")
        .replace(/_\d+x\d+\.jpg/, "_800x800.jpg")
        .replace(/_\.webp/, "_800x800.jpg")
        .replace(/\.jpg_.+/, ".jpg");
      // 天猫 gallery 图常带参数，保留主图地址
      if (src.includes("alicdn.com") || src.includes("taobaocdn.com")) {
        imgSet.add(src.split("?")[0]);
      } else {
        imgSet.add(src.split("?")[0]);
      }
    };

    // 主图区域
    document.querySelectorAll(
      "#J_UlThumb li img, #J_ThumbList img, .tb-main-pic img, " +
      ".tm-gallery img, .tm-main-pic img, .tb-gallery img, " +
      ".item-pics img, [class*='gallery'] img, [class*='Gallery'] img"
    ).forEach(img => {
      addImg(img.src || img.dataset.src || img.getAttribute("data-original") || "");
    });

    // 兜底：全页大图
    document.querySelectorAll("img").forEach(img => {
      const src = img.src || img.dataset.src || "";
      if (!src || !/\.(jpg|jpeg|png|webp)/i.test(src)) return;
      if (src.includes("icon") || src.includes("logo") || src.includes("avatar") || src.includes("badge")) return;
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      // 淘宝详情页图通常较大，排除小图
      if ((w > 200 && h > 200) || (src.includes("alicdn.com") && !/\d{1,2}x\d{1,2}/.test(src))) {
        addImg(src);
      }
    });

    // 详情图
    document.querySelectorAll(
      ".detail-content img, .desc img, .description img, [class*='detail-desc'] img, " +
      "[class*='Desc'] img, [class*='desc--'] img"
    ).forEach(img => {
      addImg(img.src || img.dataset.src || "");
    });

    result.images = [...imgSet].slice(0, 20);
  } catch (e) {}

  // ── 4. 规格参数 ──
  try {
    const specSelectors = [
      ".attributes-list li",
      "#J_AttrList li",
      ".tm-tableAttr tr",
      "[class*='attr-list'] li",
      "[class*='Attrs--attr']",
      "[class*='Props--prop']",
      ".props-list li",
      "[class*='attribute'] tr",
    ];
    const specSeen = new Set();
    for (const sel of specSelectors) {
      document.querySelectorAll(sel).forEach(el => {
        const cells = el.querySelectorAll ? el.querySelectorAll("td, th") : [];
        let t = "";
        if (cells.length >= 2) {
          const key = cells[0].innerText.trim().replace(/[:：\s]/g, "");
          const val = cells[1].innerText.trim().replace(/\s+/g, " ");
          if (key && val) t = key + ":" + val.replace(/\s+/g, "");
        } else {
          t = textOf(el).replace(/\s+/g, " ").trim();
        }
        t = t.replace(/\s+/g, "");
        if (t && (t.includes(":") || t.includes("：")) && !specSeen.has(t)) {
          specSeen.add(t);
          result.specs.push(t);
        }
      });
    }
    // 兜底：详情区参数列表
    if (result.specs.length === 0) {
      document.querySelectorAll(".detail-attrs li, [class*='detail-attr'] li, .param-info li").forEach(el => {
        const t = textOf(el).replace(/\s+/g, "");
        if (t && (t.includes(":") || t.includes("：")) && !specSeen.has(t)) {
          specSeen.add(t);
          result.specs.push(t);
        }
      });
    }
  } catch (e) {}

  // ── 5. SKU 选项 ──
  try {
    const skuSelectors = [
      ".tb-sku li",
      ".tm-sku li",
      "[class*='SkuContent'] [class*='SkuItem']",
      "[class*='skuItem']",
      "[class*='sku--']",
      "[class*='Sku'] span",
    ];
    const seen = new Set();
    for (const sel of skuSelectors) {
      document.querySelectorAll(sel).forEach(el => {
        const v = textOf(el) || el.getAttribute("data-value") || "";
        if (v && v.length < 40 && !seen.has(v)) {
          seen.add(v);
          if (!result.skuOptions["规格"]) result.skuOptions["规格"] = [];
          if (!result.skuOptions["规格"].includes(v)) result.skuOptions["规格"].push(v);
        }
      });
    }
    for (const [k, vals] of Object.entries(result.skuOptions)) {
      if (Array.isArray(vals)) result.specs.push(k + ": " + vals.join(", "));
    }
  } catch (e) {}

  // ── 6. 描述 ──
  try {
    const descEl = document.querySelector("meta[name='description']") ||
      document.querySelector("[class*='desc--']") ||
      document.querySelector("[class*='Description']");
    if (descEl) {
      result.description = descEl.getAttribute("content") || textOf(descEl);
      result.description = result.description.trim().slice(0, 200);
    }
  } catch (e) {}

  // ── 7. 店铺 ──
  try {
    const shopSelectors = [
      ".shop-name a",
      ".shop-info .shop-name",
      "[class*='ShopHeader']",
      "[class*='shop--']",
      "meta[property='og:site_name']",
    ];
    for (const sel of shopSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const t = sel.startsWith("meta") ? el.getAttribute("content") || "" : textOf(el);
        if (t && t.length < 80) { result.supplier = t; break; }
      }
    }
  } catch (e) {}

  // ── 汇总 ──
  const output = {
    ...result,
    imageCount: result.images.length,
    exportTime: new Date().toISOString(),
    url: location.href,
  };
  const jsonStr = JSON.stringify(output, null, 2);

  // 复制兜底
  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(jsonStr).catch(() => fallbackCopy(jsonStr));
  } else { fallbackCopy(jsonStr); }

  console.log("%c📦 淘宝/天猫提取完成：" + result.title + " | ¥" + result.price + " | " + result.images.length + "张",
    "color:#2563eb;font-weight:bold;font-size:14px;");

  // 批量收集器
  window.__TaobaoBatch = window.__TaobaoBatch || [];
  window.__TaobaoBatch.push(output);
  window.exportBatch = function () {
    const arr = window.__TaobaoBatch || [];
    if (!arr.length) { console.log("无数据"); return; }
    const j = JSON.stringify(arr);
    if (navigator.clipboard) navigator.clipboard.writeText(j).catch(() => fallbackCopy(j));
    if (window.pushToChoice) window.pushToChoice();
    return arr;
  };
  window.clearBatch = function () { window.__TaobaoBatch = []; console.log("已清空"); };

  // ── 一键直传后台（书签模式核心）──
  const IMPORT_PAGE = "https://colour-choice.art/admin/image-grabber";
  window.pushToChoice = function () {
    const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
    const target = IMPORT_PAGE + "?import=" + encodeURIComponent(b64) + "&auto=1";
    window.open(target, "_blank");
    console.log("%c🚀 已打开后台导入页，将自动入库", "color:#16a34a;font-weight:bold;");
  };

  // 书签模式：脚本 URL 带 __AUTOPUSH__ 标记时自动直传
  if (window.__AUTOPUSH__) {
    window.pushToChoice();
  } else {
    console.log("%c💡 控制台版：执行 pushToChoice() 直传；或 exportBatch() 批量收集后直传", "color:#7c3aed;");
    if (location.hash.indexOf("autopush") > -1) window.pushToChoice();
  }

  return output;
})();
