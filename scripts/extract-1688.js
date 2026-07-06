// ============================================================
//  1688 商品一键提取脚本（浏览器控制台版）
//  用途：在已登录1688的浏览器中自动提取商品全部数据
//  使用步骤：
//    1. 浏览器打开 1688 商品详情页（如 https://detail.1688.com/offer/xxx.html）
//    2. 按 F12 打开开发者工具 → 切到 Console（控制台）
//    3. 粘贴下面全部代码 → 按回车
//    4. 自动复制结果到剪贴板
//    5. 打开「骆芷蝶智选」后台 → 图片抓取工具 → 「商品导入」tab → 粘贴 → 开始导入
// ============================================================

(function extract1688() {
  const result = {
    platform: "1688",
    title: "",
    price: "",
    originalPrice: "",
    description: "",
    supplier: "",
    specs: [],          // 规格参数数组，如 ["材质:纯棉","颜色:白色"]
    skuOptions: {},      // SKU选项 {颜色:["白","黑"], 尺码:["S","M","L"]}
    images: [],
  };

  // ── 1. 标题 ──
  try {
    const el =
      document.querySelector(".d-title") ||
      document.querySelector("h1") ||
      document.querySelector('[itemprop="name"]') ||
      document.querySelector(".offer-title") ||
      document.querySelector(".mod-detail-title");
    if (el) result.title = el.innerText.trim();
  } catch (e) {}

  // ── 2. 价格 ──
  try {
    // 1688 价格元素
    const priceEl =
      document.querySelector(".price-text") ||
      document.querySelector(".price") ||
      document.querySelector('[itemprop="price"]') ||
      document.querySelector(".detail-price .price");
    if (priceEl) result.price = priceEl.innerText.replace(/[^\d.]/g, "").trim();

    const origEl = document.querySelector(".original-price, [class*=origin]");
    if (origEl) result.originalPrice = origEl.innerText.replace(/[^\d.]/g, "").trim();
  } catch (e) {}

  // ── 3. 主图（轮播图）──
  try {
    const imgSet = new Set();

    // 3.1 主图轮播区
    document.querySelectorAll(
      ".tab-content img, .detail-gallery-turn img, " +
      ".main-img img, .tb-main-pic img, " +
      "[id*='thumb'] img, [class*='gallery'] img, " +
      "[class*='swiper'] img, [class*='slider'] img"
    ).forEach(img => {
      let src = img.src || img.dataset.src || img.getAttribute("data-originalsrc") || "";
      if (src && !src.startsWith("data:") && src.includes("http")) {
        // 去缩放参数拿原图
        src = src.replace(/_\d+x\d+\.jpg/, ".jpg").replace(/\.jpg_.+/, ".jpg");
        imgSet.add(src.split("?")[0]);
      }
    });

    // 3.2 页面内所有大图
    document.querySelectorAll("img").forEach(img => {
      const src = img.src || img.dataset.src || "";
      if (
        src &&
        /\.(jpg|jpeg|png|webp)/i.test(src) &&
        !src.includes("icon") && !src.includes("logo") &&
        !src.includes("avatar") && !src.includes("badge") &&
        (img.naturalWidth > 100 || img.width > 100)
      ) {
        imgSet.add(src.split("?")[0]);
      }
    });

    // 3.3 详情页描述中的图片
    document.querySelectorAll(
      ".detail-desc img, .desc img, " +
      "[class*='detail-content'] img, " +
      "[class*='deco-tail'] img"
    ).forEach(img => {
      const src = img.src || img.dataset.src || "";
      if (src && /\.(jpg|jpeg|png|webp)/i.test(src)) {
        imgSet.add(src.split("?")[0]);
      }
    });

    result.images = [...imgSet].slice(0, 20);
  } catch (e) {}

  // ── 4. 规格参数表 ──
  try {
    // 4.1 标准属性表格
    document.querySelectorAll(
      ".obj-content table tr, .table table tr, " +
      ".mod-detail-property tr, .property-table tr, " +
      "[class*='attribute'] tr, [class*='param'] tr"
    ).forEach(tr => {
      const cells = tr.querySelectorAll("td, th");
      if (cells.length >= 2) {
        const key = cells[0].innerText.trim().replace(/[:：\s]/g, "");
        const val = cells[1].innerText.trim().replace(/\s+/g, " ");
        if (key && val) result.specs.push(`${key}:${val}`);
      }
    });

    // 4.2 属性列表（非表格形式）
    document.querySelectorAll(
      ".obj-content li, .attribute-item li, " +
      "[class*='prop'] li"
    ).forEach(li => {
      const text = li.innerText.replace(/\n/g, "").trim();
      if (text.includes(":") || text.includes("\uff1a")) {
        result.specs.push(text.replace(/\s+/g, ""));
      }
    });
  } catch (e) {}

  // ── 5. SKU 选项（颜色/尺码等）──
  try {
    document.querySelectorAll(
      ".obj-sku li, .sku-item, " +
      "[class*='sku'] [class*='value'], " +
      "[class*='sku-item'] span, " +
      ".object-main .sku-list .sku-line"
    ).forEach(el => {
      // 尝试找父级 label 作为属性名
      const parent = el.closest("[class*='sku'], [class*='line']");
      const label = parent ? (parent.querySelector("[class*='title'], [class*='label'], dt")?.innerText || "") : "";

      const value = el.innerText.trim() || el.getAttribute("data-value") || "";
      if (value && value.length < 30) {
        const attrName = label || "规格";
        if (!result.skuOptions[attrName]) result.skuOptions[attrName] = [];
        if (!result.skuOptions[attrName].includes(value)) result.skuOptions[attrName].push(value);
      }
    });

    // 把 SKU 也加入 specs
    for (const [k, vals] of Object.entries(result.skuOptions)) {
      if (Array.isArray(vals)) result.specs.push(`${k}: ${vals.join(", ")}`);
    }
  } catch (e) {}

  // ── 6. 描述 ──
  try {
    const descEl =
      document.querySelector("[itemprop='description']") ||
      document.querySelector(".description, .desc-content, [class*='detail-desc']");
    if (descEl) result.description = descEl.innerText.trim().slice(0, 200);
  } catch (e) {}

  // ── 7. 供应商 ──
  try {
    const supEl = document.querySelector(".company-name, [class*='supplier'], [class*='company']");
    if (supEl) result.supplier = supEl.innerText.trim();
  } catch (e) {}

  // ── 输出 & 复制 ──
  const output = {
    ...result,
    imageCount: result.images.length,
    exportTime: new Date().toISOString(),
    url: location.href,
  };

  const jsonStr = JSON.stringify(output, null, 2);

  // 自动复制到剪贴板
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(jsonStr).then(() => {
      console.log("%c✅ 已复制到剪贴板！直接粘贴到「骆芷蝶智选」导入框即可", "color:#16a34a;font-weight:bold;font-size:14px;");
    }).catch(() => fallbackCopy(jsonStr));
  } else {
    fallbackCopy(jsonStr);
  }

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); console.log("%c✅ 已复制！", "color:green;font-weight:bold;"); }
    catch(e) { console.log("%c⚠️ 请手动复制下方输出", "color:red;font-weight:bold;"); }
    document.body.removeChild(ta);
  }

  console.log("%c📦 1688 商品数据提取完成", "color:#2563eb;font-weight:bold;font-size:14px;");
  console.table(result.specs.length > 0 ? result.specs.map(s => ({ 参数: s })) : ["无"]);
  console.log(`%c🖼️ 图片 ${result.images.length} 张`, "color:#7c3aed;font-weight:bold;");
  console.log(`💰 价格: ¥${result.price}${result.originalPrice ? ` (原价¥${result.originalPrice})` : ""}`);
  console.log(`📝 标题: ${result.title}`);

  // ── 批量收集器：多次执行自动累积，exportBatch() 一次导出全部 ──
  window.__1688Batch = window.__1688Batch || [];
  window.__1688Batch.push(output);
  console.log(`%c📚 已加入批量收集（共 ${window.__1688Batch.length} 个），执行 exportBatch() 导出数组`, "color:#059669;font-weight:bold;");

  // 导出函数：把收集到的所有商品拼成一个 JSON 数组并复制到剪贴板
  window.exportBatch = function () {
    const arr = window.__1688Batch || [];
    if (arr.length === 0) { console.log("没有收集到数据"); return; }
    const json = JSON.stringify(arr, null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(json).then(() => {
        console.log(`%c✅ 已复制 ${arr.length} 个商品的 JSON 数组！直接粘贴到「骆芷蝶智选」导入框`, "color:#16a34a;font-weight:bold;");
      });
    }
    console.log(arr);
    return arr;
  };

  // 清空收集器
  window.clearBatch = function () { window.__1688Batch = []; console.log("批量收集已清空"); };

  return output;
})();
