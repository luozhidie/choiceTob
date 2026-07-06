// ========== 1688商品页 → 提取图片+商品信息 ==========
// 使用方法：
// 1. 电脑浏览器打开 1688商品页（如 https://detail.1688.com/offer/xxxx.html）
// 2. F12 打开开发者工具 → Console（控制台）
// 3. 粘贴下面全部代码，回车
// 4. 自动复制结果到剪贴板，粘贴到「骆芷蝶智选」导入框即可

(function extract1688Data() {
  const result = {
    title: '',
    price: '',
    originalPrice: '',
    currency: 'CNY',
    specs: {},
    images: [],
    description: '',
    supplier: '',
  };

  // —— 1. 提取标题 ——
  try {
    // 方式1: 页面显示的标题
    const titleEl = document.querySelector('.d-title') || document.querySelector('h1') || document.querySelector('[itemprop="name"]');
    if (titleEl) result.title = titleEl.innerText.trim();

    // 方式2: JSON-LD 结构化数据
    if (!result.title) {
      const jsonLd = document.querySelector('script[type="application/ld+json"]');
      if (jsonLd) {
        const data = JSON.parse(jsonLd.innerText);
        result.title = data.name || '';
      }
    }
  } catch (e) {}

  // —— 2. 提取价格 ——
  try {
    // 方式1: 页面价格元素
    const priceEl = document.querySelector('.price-text') || document.querySelector('[itemprop="price"]') || document.querySelector('.price');
    if (priceEl) result.price = priceEl.innerText.replace(/[^\d.]/g, '').trim();

    // 方式2: 页面内的JavaScript变量
    const html = document.body.innerHTML;
    const priceMatch = html.match(/"price"\s*:\s*"?(\d+\.?\d*)"?/);
    if (priceMatch && !result.price) result.price = priceMatch[1];
  } catch (e) {}

  // —— 3. 提取主图+详情图 ——
  try {
    const imgUrls = new Set();

    // 3.1 主图（多种选择器）
    document.querySelectorAll('.img-container img, .main-img img, .tb-main-pic img, [itemprop="image"]').forEach(img => {
      const src = img.src || img.dataset.src || img.dataset.original;
      if (src) imgUrls.add(src);
    });

    // 3.2 所有图片（过滤掉图标/logo）
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.dataset.src || img.dataset.original || img.dataset.lazy;
      if (src && !src.includes('icon') && !src.includes('logo') && !src.includes('avatar')) {
        imgUrls.add(src);
      }
    });

    // 3.3 背景图片
    document.querySelectorAll('[style*="background"]').forEach(el => {
      const match = el.style.backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
      if (match) imgUrls.add(match[1]);
    });

    result.images = [...imgUrls].filter(url => {
      return /\.(jpg|jpeg|png|webp|gif)/i.test(url) && !url.includes('icon') && !url.includes('logo');
    }).slice(0, 20); // 最多20张
  } catch (e) {}

  // —— 4. 提取规格参数 ——
  try {
    document.querySelectorAll('.table table tr, .spec-table tr, .params tr').forEach(tr => {
      const tds = tr.querySelectorAll('td');
      if (tds.length >= 2) {
        const key = tds[0].innerText.trim().replace(/[:：]/, '');
        const val = tds[1].innerText.trim();
        if (key && val) result.specs[key] = val;
      }
    });
  } catch (e) {}

  // —— 5. 提取描述 ——
  try {
    const descEl = document.querySelector('[itemprop="description"]') || document.querySelector('.description');
    if (descEl) result.description = descEl.innerText.trim().slice(0, 200);
  } catch (e) {}

  // —— 6. 输出结果 ——
  const output = {
    platform: '1688',
    ...result,
    imageCount: result.images.length,
    exportTime: new Date().toISOString(),
  };

  const jsonStr = JSON.stringify(output, null, 2);

  // 自动复制到剪贴板
  if (navigator.clipboard) {
    navigator.clipboard.writeText(jsonStr).then(() => {
      console.log('%c✅ 已复制到剪贴板！', 'color:green;font-weight:bold;');
      console.log('商品信息：', output);
    });
  }

  console.log('%c📦 1688商品数据提取结果：', 'color:blue;font-weight:bold;font-size:14px;');
  console.table(output.specs);
  console.log('🖼️ 图片列表（' + output.imageCount + '张）：', output.images);

  return output;
})();
