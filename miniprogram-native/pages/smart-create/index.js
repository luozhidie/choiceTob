var app = getApp();

// 从分类树配置提取风格值（按性别取全量并去重；兼容 flat values 旧结构）
function extractStyles(tree) {
  if (!tree || !tree.levels) return [];
  for (var i = 0; i < tree.levels.length; i++) {
    var lv = tree.levels[i];
    if (lv && lv.key === 'style') {
      if (lv.genders) {
        var merged = (lv.genders['女'] || []).concat(lv.genders['男'] || []);
        var seen = {}, out = [];
        merged.forEach(function (s) { if (!seen[s]) { seen[s] = 1; out.push(s); } });
        return out;
      }
      if (Array.isArray(lv.values)) return lv.values;
      return [];
    }
  }
  return [];
}

Page({
  data: {
    images: [],          // 已选本地图（tempFilePath）
    uploadedUrls: [],    // 已上传到 Storage 的公开 URL
    note: '',            // 供应商报价文字
    extracting: false,
    product: null,       // AI 抽取结果（可编辑）
    saving: false,
    toastText: '',
    toastType: '',
    categoryOptions: ['上装', '下装', '连衣裙', '外套', '套装', '鞋靴', '箱包', '配饰', '珠宝首饰', '其他'],
    seasonOptions: ['春', '夏', '秋', '冬', '四季'],
    categoryCustomMode: false,
    seasonCustomMode: false,
    styleOptions: [],        // 风格（来自分类树配置，按性别取全量去重）
    styleCustomMode: false,
    // 套装拆分价：部件名 + 零售价/批发价/批量价/成本价(元)，保存时换算成分并入 params.set_items
    setItems: [],
    setSumR: 0,
    setSumW: 0,
    setSumB: 0,
    setSumC: 0,
    // 模特图 / 详情图 / 视频
    modelImages: [],        // 本地模特图（tempFilePath）
    uploadedModelUrls: [],  // 已上传 URL（保留，便于回填）
    detailImages: [],       // 本地详情图
    uploadedDetailUrls: [],
    videoPath: '',          // 本地视频临时路径
    videoSize: 0,
    uploadedVideoUrl: '',
    // 成本价自动换算快照（避免覆盖手填价格，同时支持连续输入更新）
    lastAutoCalc: null,
    // 原价 → 零售价 自动联动快照（手填零售价时被锁定）
    originalPriceSnap: null,
    // 定时下架日期（季节性货品），格式 YYYY-MM-DD，留空=不下架
    unpublishAt: ''
  },

  /* 套装拆分价 */
  recalcSet: function () {
    var sumR = 0, sumW = 0, sumB = 0, sumC = 0;
    this.data.setItems.forEach(function (s) {
      sumR += parseFloat(s.retail) || 0;
      sumW += parseFloat(s.wholesale) || 0;
      sumB += parseFloat(s.bulk) || 0;
      sumC += parseFloat(s.cost) || 0;
    });
    this.setData({ setSumR: sumR, setSumW: sumW, setSumB: sumB, setSumC: sumC });
  },
  addSetItem: function () {
    var items = this.data.setItems.concat([{ name: '', retail: '', wholesale: '', bulk: '', cost: '' }]);
    this.setData({ setItems: items });
    this.recalcSet();
  },
  removeSetItem: function (e) {
    var i = e.currentTarget.dataset.i;
    var items = this.data.setItems.slice();
    items.splice(i, 1);
    this.setData({ setItems: items });
    this.recalcSet();
  },
  onSetItem: function (e) {
    var i = e.currentTarget.dataset.i;
    var f = e.currentTarget.dataset.f;
    var items = this.data.setItems.map(function(s){ return Object.assign({}, s); });
    if (!items[i]) items[i] = { name: '', retail: '', wholesale: '', bulk: '', cost: '' };
    items[i][f] = e.detail.value;
    if (f === 'cost') {
      var costY = parseFloat(e.detail.value) || 0;
      if (costY > 0) {
        var retail = Math.round(costY / 0.26 * 1.10);
        var wholesale = Math.round(retail * 0.33);
        var bulk = Math.round(retail * 0.28);
        items[i].retail = String(retail);
        items[i].wholesale = String(wholesale);
        items[i].bulk = String(bulk);
      }
    }
    this.setData({ setItems: items });
    this.recalcSet();
  },
  applySetTotal: function () {
    var p = Object.assign({}, this.data.product);
    var newSnap = null;
    if (this.data.setSumR) {
      // 与网站端一致：原价 = 部件价格之和（划线参考价）；零售价 = 原价 × 50%（五折促销）
      p.original_price = String(this.data.setSumR);
      p.price = String(Math.round(this.data.setSumR * 0.5));
      newSnap = { originalY: this.data.setSumR, price: p.price };
    }
    if (this.data.setSumW) p.wholesale_price = String(this.data.setSumW);
    if (this.data.setSumB) p.bulk_price = String(this.data.setSumB);
    if (this.data.setSumC) p.cost_price = String(this.data.setSumC);
    this.setData({ product: p, originalPriceSnap: newSnap });
  },

  /* 选图（转发/相册里的供应商图） */
  chooseImages: function () {
    var t = this;
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: function (r) {
        var paths = r.tempFiles.map(function (f) { return f.tempFilePath; });
        t.setData({ images: t.data.images.concat(paths).slice(0, 9) });
      }
    });
  },

  removeImage: function (e) {
    var i = e.currentTarget.dataset.i;
    var images = this.data.images.slice();
    images.splice(i, 1);
    this.setData({ images: images });
  },

  /* 模特图（最多6张） */
  chooseModelImages: function () {
    var t = this;
    wx.chooseMedia({
      count: 6 - t.data.modelImages.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: function (r) {
        var paths = r.tempFiles.map(function (f) { return f.tempFilePath; });
        t.setData({ modelImages: t.data.modelImages.concat(paths).slice(0, 6) });
      }
    });
  },
  removeModelImage: function (e) {
    var i = e.currentTarget.dataset.i;
    var arr = this.data.modelImages.slice();
    arr.splice(i, 1);
    this.setData({ modelImages: arr });
  },
  /* 详情图（最多15张，保存时拼成详情页 HTML） */
  chooseDetailImages: function () {
    var t = this;
    wx.chooseMedia({
      count: 15 - t.data.detailImages.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: function (r) {
        var paths = r.tempFiles.map(function (f) { return f.tempFilePath; });
        t.setData({ detailImages: t.data.detailImages.concat(paths).slice(0, 15) });
      }
    });
  },
  removeDetailImage: function (e) {
    var i = e.currentTarget.dataset.i;
    var arr = this.data.detailImages.slice();
    arr.splice(i, 1);
    this.setData({ detailImages: arr });
  },
  /* 展示视频（短视频） */
  chooseVideo: function () {
    var t = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      success: function (r) {
        var f = r.tempFiles[0];
        t.setData({ videoPath: f.tempFilePath, videoSize: f.size || 0 });
      }
    });
  },
  removeVideo: function () {
    this.setData({ videoPath: '', videoSize: 0, uploadedVideoUrl: '' });
  },

  onNote: function (e) { this.setData({ note: e.detail.value }); },

  /* 上传图片列表到 Storage（base64 + wx.request 绕过 uploadFile 域名白名单限制） */
  uploadImages: function (paths, cb) {
    var t = this;
    var token = wx.getStorageSync('token') || '';
    var urls = [];
    var queue = (paths || []).slice();
    if (queue.length === 0) { cb([], ''); return; }
    var idx = 0;
    var lastErr = '';

    function readAndUpload(path, done) {
      wx.getFileSystemManager().readFile({
        filePath: path,
        encoding: 'base64',
        success: function (res) {
          var b64 = 'data:image/jpeg;base64,' + res.data;
          wx.request({
            url: 'https://colour-choice.art/api/upload-base64',
            method: 'POST',
            header: { 'Content-Type': 'application/json', 'Authorization': token ? 'Bearer ' + token : '' },
            data: { image: b64 },
            success: function (r) {
              if (r.statusCode === 200 && r.data && r.data.success && r.data.url) {
                urls.push(r.data.url);
              } else {
                lastErr = (r.data && r.data.error) || ('HTTP' + r.statusCode);
              }
              done();
            },
            fail: function (res) {
              lastErr = 'request失败: ' + (res && res.errMsg || '未知');
              done();
            }
          });
        },
        fail: function () {
          lastErr = '读取文件失败';
          done();
        }
      });
    }

    function uploadOne(path, done) {
      // 先压缩，避免 base64 过大
      if (wx.compressImage) {
        wx.compressImage({
          src: path,
          quality: 80,
          success: function (res) { readAndUpload(res.tempFilePath, done); },
          fail: function () { readAndUpload(path, done); }
        });
      } else {
        readAndUpload(path, done);
      }
    }

    function next() {
      if (idx >= queue.length) { cb(urls, lastErr); return; }
      var p = queue[idx++];
      uploadOne(p, next);
    }

    next();
  },

  /* 上传单个视频（base64 + wx.request） */
  uploadVideo: function (path, cb) {
    var token = wx.getStorageSync('token') || '';
    wx.getFileSystemManager().readFile({
      filePath: path,
      encoding: 'base64',
      success: function (res) {
        wx.request({
          url: 'https://colour-choice.art/api/upload-video',
          method: 'POST',
          header: { 'Content-Type': 'application/json', 'Authorization': token ? 'Bearer ' + token : '' },
          data: { video: 'data:video/mp4;base64,' + res.data },
          success: function (r) {
            if (r.statusCode === 200 && r.data && r.data.success && r.data.url) cb(r.data.url, '');
            else cb('', (r.data && r.data.error) || ('HTTP' + r.statusCode));
          },
          fail: function (res) {
            cb('', 'request失败: ' + (res && res.errMsg || '未知'));
          }
        });
      },
      fail: function () {
        cb('', '读取视频失败');
      }
    });
  },

  /* 上传所有本地商品图（兼容旧调用 uploadAll） */
  uploadAll: function (cb) {
    this.uploadImages(this.data.images, cb);
  },

  /* 拉取分类树，填充风格选择器（两级联动筛选的数据基础） */
  onLoad: function () {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/category-tree',
      method: 'GET',
      success: function (r) {
        var tree = (r.data && r.data.data) || {};
        t.setData({ styleOptions: extractStyles(tree) });
      }
    });
  },

  /* 风格选择（写入 params.style，供两级联动筛选与商品检索） */
  onStyle: function (e) {
    var p = Object.assign({}, this.data.product);
    p.style = this.data.styleOptions[e.detail.value];
    this.setData({ product: p, styleCustomMode: false });
  },
  toggleStyleCustom: function () { this.setData({ styleCustomMode: !this.data.styleCustomMode }); },
  onStyleCustomInput: function (e) {
    var p = Object.assign({}, this.data.product);
    p.style = e.detail.value;
    this.setData({ product: p });
  },

  /* AI 识别 */
  extract: function () {
    var t = this;
    if (t.data.images.length === 0 && !t.data.note) {
      t.showToast('请先选图或填写供应商文字');
      return;
    }
    t.setData({ extracting: true });
    t.uploadAll(function (urls, lastErr) {
      if (urls.length === 0 && t.data.images.length > 0) {
        t.setData({ extracting: false });
        t.showToast(lastErr || '图片上传失败，请重试');
        return;
      }
      var token = wx.getStorageSync('token') || '';
      wx.request({
        url: 'https://colour-choice.art/api/ai/extract-product',
        method: 'POST',
        header: { 'Content-Type': 'application/json', 'Authorization': token ? 'Bearer ' + token : '' },
        data: { images: urls, note: t.data.note },
        success: function (res) {
          t.setData({ extracting: false });
          var p = res.data && res.data.product;
          if (p) {
            // 保留用户已手动选择的风格（AI 不返回 style，避免重识别时覆盖）
            if (t.data.product && t.data.product.style && !p.style) p.style = t.data.product.style;
            // 默认草稿就在当前，用户可改；用成本价初始化自动换算快照
            var costY = parseFloat(p && p.cost_price) || 0;
            var snap = null;
            if (costY > 0) {
              var r = Math.round(costY / 0.26 * 1.10); // 原价 = 成本价÷0.26×110%
              var retail = Math.round(r * 0.5);         // 零售价 = 原价×50%（五折促销）
              var w = Math.round(r * 0.33);
              var b = Math.round(r * 0.28);
              snap = { costY: costY, price: String(retail), original_price: String(r), wholesale_price: String(w), bulk_price: String(b) };
            }
            t.setData({ product: p, uploadedUrls: urls, setItems: [], setSumR: 0, setSumW: 0, setSumB: 0, setSumC: 0, lastAutoCalc: snap, originalPriceSnap: null });
            if (res.data.source === 'mock') t.showToast('AI 识别超时，已按备注生成草稿');
            else t.showToast('识别完成，请核对');
          } else {
            t.showToast((res.data && res.data.error) || '识别失败');
          }
        },
        fail: function () {
          // 服务/网络不可达：本地按备注生成草稿，保证始终能落单
          var draft = t.buildLocalDraft(t.data.note, urls);
          t.setData({
            extracting: false,
            product: draft,
            uploadedUrls: urls,
            setItems: [],
            setSumR: 0, setSumW: 0, setSumB: 0, setSumC: 0,
            lastAutoCalc: null,
            originalPriceSnap: null
          });
          t.showToast('识别服务暂不可用，已按备注生成草稿');
        }
      });
    });
  },

  /* 本地兜底：AI 服务不可达时，按备注+已上传图片生成草稿，保证始终可落单 */
  buildLocalDraft: function (note, urls) {
    var product = {
      title: '导入商品（待核对）',
      category: '其他',
      price: '',
      wholesale_price: '',
      sizes: '',
      color: '',
      material: '',
      season: '四季',
      description: '',
      tags: ['待核对'],
      images: urls || []
    };
    if (note) {
      var lines = note.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      var first = lines[0] || '';
      if (first) product.title = first.slice(0, 30);
      var nums = (note.match(/\d{2,4}/g) || [])
        .map(function (n) { return parseInt(n, 10); })
        .filter(function (v) { return v >= 10 && v <= 99999; });
      if (nums.length) product.price = String(nums[0]);
      if (nums.length > 1) product.wholesale_price = String(nums[1]);
      var sm = note.match(/[SsMmLlXx]{1,5}|均码/);
      if (sm) product.sizes = sm[0].toUpperCase();
      var mm = first.match(/(羊毛|棉|涤纶|真丝|麻|混纺|雪纺|针织|牛仔|皮革|聚酯纤维|锦纶|氨纶|黏胶|莫代尔|呢|绒)/);
      if (mm) product.material = mm[0];
      var cm = first.match(/(黑|白|灰|红|蓝|绿|黄|粉|紫|杏|卡其|驼|藏青|军绿|米|橙|棕|咖|酒红|天蓝|湖蓝|浅|深)\S{0,2}/);
      if (cm) product.color = cm[0];
      product.description = note.slice(0, 20);
    }
    return product;
  },

  /* 表单编辑 */
  onField: function (e) {
    var field = e.currentTarget.dataset.field;
    var product = Object.assign({}, this.data.product);
    product[field] = e.detail.value;
    // 与网站端一致：原价 → 零售价 = 原价 × 50%（仅当零售价留空或仍等于「原价×0.5 快照」时自动覆盖）
    if (field === 'original_price') {
      var originalY = parseFloat(product.original_price) || 0;
      var snap = this.data.originalPriceSnap;
      var matchesSnap = !!(snap && String(product.price) === snap.price);
      var isEmpty = !product.price || String(product.price) === '';
      if (originalY > 0 && (isEmpty || matchesSnap)) {
        var newPrice = String(Math.round(originalY * 0.5));
        product.price = newPrice;
        this.setData({ product: product, originalPriceSnap: { originalY: originalY, price: newPrice } });
        return;
      }
      this.setData({ product: product, originalPriceSnap: null });
      return;
    }
    this.setData({ product: product });
  },
  onCategory: function (e) { var p = Object.assign({}, this.data.product); p.category = this.data.categoryOptions[e.detail.value]; this.setData({ product: p, categoryCustomMode: false }); },
  onSeason: function (e) { var p = Object.assign({}, this.data.product); p.season = this.data.seasonOptions[e.detail.value]; this.setData({ product: p, seasonCustomMode: false }); },
  toggleCategoryCustom: function () { this.setData({ categoryCustomMode: !this.data.categoryCustomMode }); },
  onCategoryCustomInput: function (e) { var p = Object.assign({}, this.data.product); p.category = e.detail.value; this.setData({ product: p }); },
  toggleSeasonCustom: function () { this.setData({ seasonCustomMode: !this.data.seasonCustomMode }); },
  onSeasonCustomInput: function (e) { var p = Object.assign({}, this.data.product); p.season = e.detail.value; this.setData({ product: p }); },
  /* 成本价输入自动换算价格体系（覆盖仍等于快照值的字段，保护手填） */
  onCostPrice: function (e) {
    var t = this;
    var costY = parseFloat(e.detail.value) || 0;
    var p = Object.assign({}, t.data.product || {});
    p.cost_price = e.detail.value;
    if (costY > 0) {
      var original = Math.round(costY / 0.26 * 1.10); // 原价 = 成本价÷0.26×110%（30万会员拿货价 = 原价×0.26）
      var retail = Math.round(original * 0.5);          // 零售价 = 原价×50%（五折促销）
      var wholesale = Math.round(original * 0.33);      // 一件起批 = 原价×33%
      var bulk = Math.round(original * 0.28);           // 5件拿货 = 原价×28%
      var snap = t.data.lastAutoCalc;
      function shouldUpdate(v, k) {
        if (!snap) return true;
        return v === '' || v === snap[k];
      }
      if (shouldUpdate(p.price, 'price')) p.price = String(retail);
      // 原价 = 成本价÷0.26×110%；零售价 = 原价×50%
      var originalY2 = 0;
      if (shouldUpdate(p.original_price, 'original_price')) { p.original_price = String(original); originalY2 = original; }
      if (shouldUpdate(p.wholesale_price, 'wholesale_price')) p.wholesale_price = String(wholesale);
      if (shouldUpdate(p.bulk_price, 'bulk_price')) p.bulk_price = String(bulk);
      t.setData({
        product: p,
        lastAutoCalc: { costY: costY, price: String(retail), original_price: String(original), wholesale_price: String(wholesale), bulk_price: String(bulk) },
        // 原价 → 零售价 联动快照（零售价与快照一致时，编辑原价可继续按 0.5 倍覆盖零售价）
        originalPriceSnap: originalY2 > 0 ? { originalY: originalY2, price: String(retail) } : null
      });
    } else {
      t.setData({ product: p, lastAutoCalc: null, originalPriceSnap: null });
    }
  },

  /* 定时下架日期：日期选择器 */
  pickUnpublish: function (e) {
    this.setData({ unpublishAt: e.detail.value });
  },
  /* 定时下架：季节预设（取下一个尚未到来的该日期，当天 23:59 下架） */
  setSeasonUnpublish: function (e) {
    var m = parseInt(e.currentTarget.dataset.m, 10);
    var d = parseInt(e.currentTarget.dataset.d, 10);
    var now = new Date();
    var year = now.getFullYear();
    var cand = new Date(year, m - 1, d, 23, 59, 0, 0);
    if (cand.getTime() < now.getTime()) year += 1;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    this.setData({ unpublishAt: year + '-' + pad(m) + '-' + pad(d) });
  },
  clearUnpublish: function () {
    this.setData({ unpublishAt: '' });
  },

  /* 保存：草稿 / 直接上架 */
  save: function (e) {
    var t = this;
    var publish = e.currentTarget.dataset.publish === '1';
    var p = t.data.product;
    if (!p) { t.showToast('请先 AI 识别'); return; }
    if (!p.title) { t.showToast('请填写标题'); return; }
    t.setData({ saving: true });

    function finalize(modelUrls, detailUrls, videoUrl) {
      var priceY = parseFloat(p.price) || 0;
      var wsY = parseFloat(p.wholesale_price) || 0;
      var costY = parseFloat(p.cost_price) || 0;
      var bkY = parseFloat(p.bulk_price) || 0;
      var payload = {
        title: p.title,
        category: p.category || '待分类',
        price: Math.round(priceY * 100),
        wholesale_price: wsY ? Math.round(wsY * 100) : null,
        bulk_price: bkY ? Math.round(bkY * 100) : null,
        cost_price: costY ? Math.round(costY * 100) : null,
        original_price: (p.original_price ? Math.round(parseFloat(p.original_price) * 100) : null) || Math.round(priceY * 100),
        sizes: p.sizes || '',
        color: p.color || '',
        material: p.material || '',
        description: p.description || '',
        cover_image: (t.data.uploadedUrls[0]) || (p.images && p.images[0]) || null,
        images: t.data.uploadedUrls.length ? t.data.uploadedUrls : (p.images || []),
        model_images: modelUrls && modelUrls.length ? modelUrls : (p.model_images || []),
        video_url: videoUrl || (p.video_url || ''),
        detail: (detailUrls && detailUrls.length)
          ? detailUrls.map(function (u) { return '<img src="' + u + '" style="width:100%;display:block;margin-bottom:8px;"/>'; }).join('')
          : (p.detail || ''),
        is_published: publish,
        stock: 100,
        tags: Array.isArray(p.tags) ? p.tags : []
      };
      // 季节、套装拆分价等存入 params JSONB（products 表没有 season 列，不能作为顶层字段）
      var paramsObj = {};
      if (p.season) paramsObj.season = p.season;
      if (p.style) paramsObj.style = p.style;
      // 套装拆分价：换算成分(cent)
      var setArr = t.data.setItems
        .filter(function (s) { return s.name || s.retail || s.wholesale || s.bulk || s.cost; })
        .map(function (s) {
          return {
            name: s.name || '',
            retail: s.retail ? Math.round(parseFloat(s.retail) * 100) : 0,
            wholesale: s.wholesale ? Math.round(parseFloat(s.wholesale) * 100) : 0,
            bulk: s.bulk ? Math.round(parseFloat(s.bulk) * 100) : 0,
            cost: s.cost ? Math.round(parseFloat(s.cost) * 100) : 0
          };
        });
      if (setArr.length) paramsObj.set_items = setArr;
      // 定时下架时间（季节性货品）：存于 params，本地日期 23:59 → ISO(UTC)
      if (t.unpublishAt) {
        var udt = new Date(t.unpublishAt + 'T23:59:00');
        if (!isNaN(udt.getTime())) paramsObj.unpublish_at = udt.toISOString();
      }
      if (Object.keys(paramsObj).length) payload.params = paramsObj;
      var token = wx.getStorageSync('token') || '';
      wx.request({
        url: 'https://colour-choice.art/api/admin/products/create',
        method: 'POST',
        header: { 'Content-Type': 'application/json', 'Authorization': token ? 'Bearer ' + token : '' },
        data: payload,
        success: function (res) {
          t.setData({ saving: false });
          if (res.data && res.data.success) {
            t.showToast(publish ? '已上架' : '已存草稿');
            setTimeout(function () { wx.navigateBack(); }, 1200);
          } else {
            t.showToast((res.data && res.data.error) || '保存失败');
          }
        },
        fail: function () {
          t.setData({ saving: false });
          t.showToast('网络错误');
        }
      });
    }

    // 依次上传：模特图 → 详情图 → 视频，再 finalize 写入商品
    t.uploadImages(t.data.modelImages, function (modelUrls, errM) {
      if (t.data.modelImages.length && (!modelUrls || modelUrls.length === 0)) {
        t.setData({ saving: false });
        t.showToast(errM || '模特图上传失败');
        return;
      }
      t.uploadImages(t.data.detailImages, function (detailUrls, errD) {
        if (t.data.detailImages.length && (!detailUrls || detailUrls.length === 0)) {
          t.setData({ saving: false });
          t.showToast(errD || '详情图上传失败');
          return;
        }
        if (!t.data.videoPath) {
          finalize(modelUrls, detailUrls, t.data.uploadedVideoUrl || '');
          return;
        }
        t.uploadVideo(t.data.videoPath, function (videoUrl, errV) {
          if (!videoUrl) {
            t.setData({ saving: false });
            t.showToast(errV || '视频上传失败');
            return;
          }
          finalize(modelUrls, detailUrls, videoUrl);
        });
      });
    });
  },

  showToast: function (msg) {
    var t = this;
    t.setData({ toastText: msg, toastType: 'error' });
    setTimeout(function () { t.setData({ toastText: '' }); }, 2500);
  },

  previewImg: function (e) {
    wx.previewImage({ current: e.currentTarget.dataset.src, urls: this.data.images });
  },
  previewModel: function (e) {
    wx.previewImage({ current: e.currentTarget.dataset.src, urls: this.data.modelImages });
  },
  previewDetail: function (e) {
    wx.previewImage({ current: e.currentTarget.dataset.src, urls: this.data.detailImages });
  }
});
