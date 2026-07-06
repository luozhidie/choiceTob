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

      // ── 1. 标题（优先匹配商品标题而非公司名）──
      // 新版1688：标题在详情主区域，公司名在左上角
      const titleCandidates = [
        document.querySelector("[class*='detail-title']"),
        document.querySelector("[class*='offer-title']"),
        document.querySelector(".d-title"),
        // 从页面文本中找最长的合理标题（排除公司名/店铺名）
        ...Array.from(document.querySelectorAll("h1, [class*='title']")).filter(el => {
          const t = el.innerText.trim();
          return t.length > 5 && t.length < 120 && !t.includes("有限公司") && !t.includes("旗舰店") && !t.includes("店铺");
        }),
        document.querySelector("[itemprop='name']"),
        document.querySelector("h1"),
      ];
      for (const el of titleCandidates) {
        if (el) {
          const t = el.innerText.trim();
          if (t && t.length > 4 && !t.includes("有限公司")) { result.title = t; break; }
        }
      }

  // ── 2. 价格（新版1688有多种价格展示格式）──
  try {
    // 策略1：找包含¥符号且紧跟数字的元素
    const allEls = document.querySelectorAll("[class*='price'], [class*='Price'], [itemprop='price'], .cost-price, .discount-price, [class*='amount']");
    for (const el of allEls) {
      const t = (el.innerText || "").trim();
      if (/¥\s*\d+/.test(t) || /^\d+(\.\d{1,2})?$/.test(t)) {
        const m = t.match(/(\d+(?:\.\d{1,2})?)/);
        if (m && parseFloat(m[1]) > 0) { result.price = m[1]; break; }
      }
    }
    // 策略2：页面全局搜 ¥数字 模式
    if (!result.price) {
      const body = document.body.innerText;
      const priceMatch = body.match(/(?:热销款|新人价|促销价|活动价)?[^\n]*?¥[\s]*(\d+(?:\.\d{1,2})?)/);
      if (priceMatch) result.price = priceMatch[1];
    }
    // 原价
    if (!result.originalPrice) {
      const origEl = document.querySelector(".original-price, [class*='origin'], del, [class*='market']");
      if (origEl) {
        const m = origEl.innerText.replace(/[^\d.]/g, "").match(/\d+(?:\.\d{1,2})?/);
        if (m) result.originalPrice = m[0];
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
    document.querySelectorAll(
      ".obj-sku li, .sku-item, [class*='sku'] [class*='value'], " +
      "[class*='sku-item'] span, .object-main .sku-list .sku-line"
    ).forEach(el => {
      const parent = el.closest("[class*='sku'], [class*='line']");
      const label = parent ? (parent.querySelector("[class*='title'], [class*='label'], dt")?.innerText || "") : "";
      const value = el.innerText.trim() || el.getAttribute("data-value") || "";
      if (value && value.length < 30) {
        const attrName = label || "规格";
        if (!result.skuOptions[attrName]) result.skuOptions[attrName] = [];
        if (!result.skuOptions[attrName].includes(value)) result.skuOptions[attrName].push(value);
      }
    });
    for (const [k, vals] of Object.entries(result.skuOptions)) {
      if (Array.isArray(vals)) result.specs.push(k + ": " + vals.join(", "));
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
