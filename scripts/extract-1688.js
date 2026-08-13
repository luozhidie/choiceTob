// ============================================================
//  1688 商品一键提取 + 直传脚本
//  两种用法：
//   A) 控制台版：F12 / Ctrl+Shift+I 打开控制台 → 粘贴执行 → 复制结果
//   B) 书签版（推荐，不用F12）：把下方「书签代码」存为浏览器书签，
//      在 1688 商品页点一下书签 → 自动提取并跳转后台入库
// ============================================================

(function extract1688() {
  const result = {
    platform: "1688",
    title: "",
    price: "",
    originalPrice: "",
    description: "",
    supplier: "",
    specs: [],
    skuOptions: {},
    images: [],
  };

  // ── 1. 标题（优先匹配商品标题而非公司名/评价区标题）──
  // 新版1688：标题在详情主区域，公司名在左上角；移动版标题常在 h1 或特定 class
  const badTitleRe = /用户评价|用户评论|评论\s*[·\d]|已售|加购|收藏|分享|图文详情|商品详情|店铺|有限公司|旗舰店|更多|推荐|供应商|厂家|源头工厂/;
  const titleCandidates = [
    document.querySelector("meta[property='og:title']"),
    document.querySelector("meta[name='og:title']"),
    document.querySelector("[itemprop='name']"),
    document.querySelector("[class*='detail-title']"),
    document.querySelector("[class*='offer-title']"),
    document.querySelector(".d-title"),
    ...Array.from(document.querySelectorAll("h1")).filter(el => {
      const t = el.innerText.trim();
      return t.length > 8 && t.length < 120 && !badTitleRe.test(t);
    }),
    ...Array.from(document.querySelectorAll("[class*='title']")).filter(el => {
      const t = el.innerText.trim();
      return t.length > 8 && t.length < 120 && !badTitleRe.test(t);
    }),
    document.querySelector("h1"),
  ];
  for (const el of titleCandidates) {
    if (!el) continue;
    let t = el.innerText ? el.innerText.trim() : (el.getAttribute("content") || "").trim();
    if (t && t.length > 8 && t.length < 120 && !badTitleRe.test(t) && !t.includes("有限公司")) {
      result.title = t; break;
    }
  }
  // 兜底：document.title 去掉站点后缀
  if (!result.title && document.title && document.title.length > 8) {
    let dt = document.title.split(/[-_｜|]/)[0].trim();
    if (dt.length > 8 && dt.length < 120 && !badTitleRe.test(dt)) result.title = dt;
  }

  // ── 2. 价格（新版1688有多种价格展示格式，移动版价格可能分散在兄弟节点）──
  try {
    const priceBadRe = /运费|邮费|优惠|券|满减|减|到手价|约|低至|起|万|亿/;
    // 策略1：优先找带 ¥ 的节点，并看父级文本
    const allEls = document.querySelectorAll("[class*='price'], [class*='Price'], [itemprop='price'], .cost-price, .discount-price, [class*='amount']");
    let fallbackPrice = "";
    for (const el of allEls) {
      const t = (el.innerText || "").trim();
      if (!t) continue;
      const parentText = (el.parentElement && el.parentElement.innerText || t).trim();
      if (priceBadRe.test(parentText)) continue;
      if (/¥\s*\d+/.test(t) || /^\d+(\.\d{1,2})?$/.test(t) || /¥\s*\d+/.test(parentText)) {
        const m = (parentText.match(/¥\s*(\d{1,6}(?:\.\d{1,2})?)/) || t.match(/(\d{1,6}(?:\.\d{1,2})?)/));
        if (m && parseFloat(m[1]) > 0 && parseFloat(m[1]) < 100000) {
          if (!fallbackPrice) fallbackPrice = m[1];
          const cls = (el.className || "").toString();
          if (cls.includes("price") || cls.includes("Price") || cls.includes("amount")) { result.price = m[1]; break; }
        }
      }
    }
    if (!result.price && fallbackPrice) result.price = fallbackPrice;

    // 策略2：页面全局搜 ¥数字，排除运费/优惠等上下文
    if (!result.price) {
      const body = document.body.innerText;
      const priceMatches = [...body.matchAll(/¥\s*(\d{1,6}(?:\.\d{1,2})?)/g)];
      for (const m of priceMatches) {
        const idx = m.index || 0;
        const context = body.slice(Math.max(0, idx - 30), idx + 30);
        if (!priceBadRe.test(context)) { result.price = m[1]; break; }
      }
    }

    // 策略3：找「起批价」「批发价」等关键词后的数字
    if (!result.price) {
      const body = document.body.innerText;
      const m = body.match(/(?:批发价|起批价|拿货价|单价|价格)[^\d]{0,10}(\d{1,6}(?:\.\d{1,2})?)/);
      if (m) result.price = m[1];
    }

    // 原价
    if (!result.originalPrice) {
      const origEl = document.querySelector(".original-price, [class*='origin'], del, [class*='market'], [class*='original']");
      if (origEl) {
        const m = origEl.innerText.replace(/[^\d.]/g, "").match(/\d+(?:\.\d{1,2})?/);
        if (m && m[0] !== result.price) result.originalPrice = m[0];
      }
    }
  } catch (e) {}

  // ── 3. 主图 ──
  try {
    const imgSet = new Set();
    document.querySelectorAll(
      ".tab-content img, .detail-gallery-turn img, .main-img img, " +
      ".tb-main-pic img, [id*='thumb'] img, [class*='gallery'] img, " +
      "[class*='swiper'] img, [class*='slider'] img"
    ).forEach(img => {
      let src = img.src || img.dataset.src || img.getAttribute("data-originalsrc") || "";
      if (src && !src.startsWith("data:") && src.includes("http")) {
        src = src.replace(/_\d+x\d+\.jpg/, ".jpg").replace(/\.jpg_.+/, ".jpg");
        imgSet.add(src.split("?")[0]);
      }
    });
    document.querySelectorAll("img").forEach(img => {
      const src = img.src || img.dataset.src || "";
      if (src && /\.(jpg|jpeg|png|webp)/i.test(src) &&
          !src.includes("icon") && !src.includes("logo") &&
          !src.includes("avatar") && !src.includes("badge") &&
          (img.naturalWidth > 100 || img.width > 100)) {
        imgSet.add(src.split("?")[0]);
      }
    });
    document.querySelectorAll(
      ".detail-desc img, .desc img, [class*='detail-content'] img, [class*='deco-tail'] img"
    ).forEach(img => {
      const src = img.src || img.dataset.src || "";
      if (src && /\.(jpg|jpeg|png|webp)/i.test(src)) imgSet.add(src.split("?")[0]);
    });
    result.images = [...imgSet].slice(0, 20);
  } catch (e) {}

  // ── 4. 规格参数表 ──
  try {
    document.querySelectorAll(
      ".obj-content table tr, .table table tr, .mod-detail-property tr, " +
      ".property-table tr, [class*='attribute'] tr, [class*='param'] tr"
    ).forEach(tr => {
      const cells = tr.querySelectorAll("td, th");
      if (cells.length >= 2) {
        const key = cells[0].innerText.trim().replace(/[:：\s]/g, "");
        const val = cells[1].innerText.trim().replace(/\s+/g, " ");
        if (key && val) result.specs.push(key + ":" + val);
      }
    });
    document.querySelectorAll(".obj-content li, .attribute-item li, [class*='prop'] li").forEach(li => {
      const text = li.innerText.replace(/\n/g, "").trim();
      if (text.includes(":") || text.includes("：")) result.specs.push(text.replace(/\s+/g, ""));
    });
  } catch (e) {}

  // ── 5. SKU 选项 ──
  try {
    const skuBadRe = /千人加购|万人加购|现货秒发|立即购买|加入进货单|收藏|分享|已选|选择|请选择/;
    document.querySelectorAll(
      ".obj-sku li, .sku-item, [class*='sku'] [class*='value'], " +
      "[class*='sku-item'] span, .object-main .sku-list .sku-line, [class*='prop'] li"
    ).forEach(el => {
      const parent = el.closest("[class*='sku'], [class*='line'], [class*='prop']");
      const label = parent ? (parent.querySelector("[class*='title'], [class*='label'], dt, [class*='name']")?.innerText || "").replace(/[:：\s]/g, "") : "";
      let value = el.innerText.trim() || el.getAttribute("data-value") || "";
      value = value.replace(/\s+/g, " ").trim();
      if (!value || value.length > 30 || skuBadRe.test(value)) return;
      const attrName = /颜色|色彩|colour|color|尺码|尺寸|size|规格|款号|款式/i.test(label) ? label : "规格";
      if (!result.skuOptions[attrName]) result.skuOptions[attrName] = [];
      if (!result.skuOptions[attrName].includes(value)) result.skuOptions[attrName].push(value);
    });
    for (const [k, vals] of Object.entries(result.skuOptions)) {
      if (Array.isArray(vals) && vals.length) result.specs.push(k + ": " + vals.join(", "));
    }
  } catch (e) {}

  // ── 6. 描述 ──
  try {
    const descEl = document.querySelector("[itemprop='description']") ||
      document.querySelector(".description, .desc-content, [class*='detail-desc']");
    if (descEl) result.description = descEl.innerText.trim().slice(0, 200);
  } catch (e) {}

  // ── 7. 供应商 ──
  try {
    const supEl = document.querySelector(".company-name, [class*='supplier'], [class*='company']");
    if (supEl) result.supplier = supEl.innerText.trim();
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

  console.log("%c📦 1688 提取完成：" + result.title + " | ¥" + result.price + " | " + result.images.length + "张",
    "color:#2563eb;font-weight:bold;font-size:14px;");

  // 批量收集器
  window.__1688Batch = window.__1688Batch || [];
  window.__1688Batch.push(output);
  window.exportBatch = function () {
    const arr = window.__1688Batch || [];
    if (!arr.length) { console.log("无数据"); return; }
    const j = JSON.stringify(arr);
    if (navigator.clipboard) navigator.clipboard.writeText(j).catch(() => fallbackCopy(j));
    if (window.pushToChoice) window.pushToChoice(); // 批量收集后也可一键直传
    return arr;
  };
  window.clearBatch = function () { window.__1688Batch = []; console.log("已清空"); };

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
    // 若脚本以书签方式(URL带 #autopush)运行也自动触发
    if (location.hash.indexOf("autopush") > -1) window.pushToChoice();
  }

  return output;
})();
