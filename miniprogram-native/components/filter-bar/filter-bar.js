/* 通用筛选栏组件：排序 + 快捷筛选 + 品类标签 + 全部筛选抽屉
   与选品页（pages/buyer）保持完全一致的交互，供货架/专场等页面复用。
   使用方式：
     <filter-bar category="女装" bind:change="onFilterChange" />
   change 事件 detail：{ sortType, subCategory, selectedFilters, minPrice, maxPrice, query }
     query 形如 '&sort=sales&f[colors]=黑,白&priceMin=0&priceMax=200'，页面直接拼到商品接口后面即可。
*/

var DEFAULT_FILTER_CONFIG = {
  sorts: [
    { key: 'default', label: '综合' },
    { key: 'sales', label: '销量' },
    { key: 'newest', label: '上新' },
    { key: 'price_asc', label: '批发价' }
  ],
  quickFilters: [
    { key: 'subscribed_stall', label: '订阅的档口', type: 'toggle' },
    { key: 'is_special', label: '特价', type: 'toggle' },
    { key: 'in_stock', label: '现货', type: 'toggle' },
    { key: 'source_brand', label: '源头厂牌', type: 'toggle' },
    { key: 'bulk_price', label: '批量采购价', type: 'toggle' },
    { key: 'sizes', label: '尺码', type: 'popup', options: ['M', 'L', 'S', 'XL', 'XS', '均码'] },
    { key: 'fabrics', label: '面料', type: 'popup', options: ['棉', '麻', '丝', '毛', '化纤', '混纺', '牛仔'] }
  ],
  subCategories: [],
  filterPanel: { sections: [] }
};

Component({
  options: { addGlobalClass: true },

  properties: {
    /* 用于拉取该品类的筛选配置；为空时用默认配置 */
    category: { type: String, value: '', observer: '_onCategoryChange' },
    /* 是否显示第一行排序（专场页已有自己的 tab，可置 false） */
    showSort: { type: Boolean, value: true },
    /* 页面自行提取的子分类（优先于配置里的 subCategories） */
    extraSubCategories: { type: Array, value: [], observer: '_syncSubCats' }
  },

  data: {
    filterConfig: DEFAULT_FILTER_CONFIG,
    subCats: [],
    sortType: 'default',
    subCategory: '',
    filterOpen: false,
    quickPopup: null,
    quickPopupLabel: '',
    quickPopupOptions: [],
    selectedFilters: {},
    minPrice: '',
    maxPrice: '',
    hasFilter: false
  },

  attached: function () {
    this._syncSubCats();
    this.loadFilterConfig(this.data.category);
  },

  methods: {
    _onCategoryChange: function (val) {
      this.loadFilterConfig(val || '');
    },

    _syncSubCats: function () {
      var extra = this.data.extraSubCategories || [];
      var cfg = (this.data.filterConfig && this.data.filterConfig.subCategories) || [];
      this.setData({ subCats: extra.length ? extra : cfg });
    },

    /* 拉取品类筛选配置 */
    loadFilterConfig: function (category) {
      var t = this;
      category = category || '';
      if (t._loadedCat === category) return;   // 同一品类不重复请求
      t._loadedCat = category;
      var url = 'https://colour-choice.art/api/public/category-filters';
      if (category) url += '?category=' + encodeURIComponent(category);
      wx.request({
        url: url,
        method: 'GET',
        success: function (r) {
          var d = r.data;
          if (!d || !d.success || !d.data) return;
          var cfg = d.data;
          t.setData({
            filterConfig: {
              sorts: cfg.sorts || DEFAULT_FILTER_CONFIG.sorts,
              quickFilters: cfg.quickFilters || DEFAULT_FILTER_CONFIG.quickFilters,
              subCategories: cfg.subCategories || [],
              filterPanel: cfg.filterPanel || { sections: [] }
            }
          }, function () { t._syncSubCats(); });
        },
        fail: function () {
          t._loadedCat = null;   // 允许下次重试
          t.setData({ filterConfig: DEFAULT_FILTER_CONFIG }, function () { t._syncSubCats(); });
        }
      });
    },

    /* 生成拼接到商品接口后面的查询串 */
    buildQuery: function () {
      var d = this.data;
      var q = '';
      if (d.sortType && d.sortType !== 'default') q += '&sort=' + encodeURIComponent(d.sortType);
      var sf = d.selectedFilters || {};
      for (var k in sf) {
        if (sf[k] && sf[k].length) {
          q += '&f[' + encodeURIComponent(k) + ']=' + encodeURIComponent(sf[k].join(','));
        }
      }
      if (d.minPrice || d.maxPrice) {
        q += '&priceMin=' + encodeURIComponent(d.minPrice || '0') + '&priceMax=' + encodeURIComponent(d.maxPrice || '999999');
      }
      return q;
    },

    _emit: function () {
      var d = this.data;
      var sf = d.selectedFilters || {};
      var has = false;
      for (var k in sf) { if (sf[k] && sf[k].length) { has = true; break; } }
      if (d.minPrice || d.maxPrice) has = true;
      this.setData({ hasFilter: has });
      this.triggerEvent('change', {
        sortType: d.sortType,
        subCategory: d.subCategory,
        selectedFilters: sf,
        minPrice: d.minPrice,
        maxPrice: d.maxPrice,
        query: this.buildQuery()
      });
    },

    /* ===== 排序 ===== */
    setSort: function (e) {
      var s = e.currentTarget.dataset.sort;
      if (s === 'price_asc' && this.data.sortType === 'price_asc') s = 'price_desc';
      else if (s === 'price_asc' && this.data.sortType === 'price_desc') s = 'price_asc';
      this.setData({ sortType: s });
      this._emit();
    },

    /* ===== 全部筛选抽屉 ===== */
    openFilter: function () { this.setData({ filterOpen: true }); },
    closeFilter: function () { this.setData({ filterOpen: false }); },

    toggleFilter: function (e) {
      var key = e.currentTarget.dataset.key;
      var val = e.currentTarget.dataset.value;
      var multiple = e.currentTarget.dataset.multiple;
      var sf = JSON.parse(JSON.stringify(this.data.selectedFilters));
      var arr = sf[key] || [];
      if (multiple) {
        var idx = arr.indexOf(val);
        if (idx >= 0) arr.splice(idx, 1); else arr.push(val);
      } else {
        arr = arr.indexOf(val) >= 0 ? [] : [val];
      }
      if (arr.length) sf[key] = arr; else delete sf[key];
      this.setData({ selectedFilters: sf });
    },

    onPriceInput: function (e) {
      var type = e.currentTarget.dataset.type;
      var v = e.detail.value;
      if (type === 'min') this.setData({ minPrice: v }); else this.setData({ maxPrice: v });
    },

    resetFilter: function () {
      this.setData({ selectedFilters: {}, minPrice: '', maxPrice: '' });
    },

    confirmFilter: function () {
      this.setData({ filterOpen: false });
      this._emit();
    },

    /* ===== 快捷筛选（第二行） ===== */
    toggleQuick: function (e) {
      var key = e.currentTarget.dataset.key;
      var type = e.currentTarget.dataset.type;
      var t = this;
      if (type === 'popup') {
        if (t.data.quickPopup === key) { t.setData({ quickPopup: null }); return; }
        var list = (t.data.filterConfig && t.data.filterConfig.quickFilters) || [];
        var qf = null;
        for (var i = 0; i < list.length; i++) { if (list[i].key === key) { qf = list[i]; break; } }
        t.setData({
          quickPopup: key,
          quickPopupLabel: qf ? qf.label : key,
          quickPopupOptions: (qf && qf.options) ? qf.options : []
        });
        return;
      }
      var sf = JSON.parse(JSON.stringify(t.data.selectedFilters));
      var arr = sf[key] || [];
      arr = arr.indexOf('1') >= 0 ? [] : ['1'];
      if (arr.length) sf[key] = arr; else delete sf[key];
      t.setData({ selectedFilters: sf });
      t._emit();
    },

    closeQuickPopup: function () { this.setData({ quickPopup: null }); },

    selectQuickPopup: function (e) {
      var key = e.currentTarget.dataset.key;
      var val = e.currentTarget.dataset.value;
      var sf = JSON.parse(JSON.stringify(this.data.selectedFilters));
      var arr = sf[key] || [];
      var idx = arr.indexOf(val);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(val);
      if (arr.length) sf[key] = arr; else delete sf[key];
      this.setData({ selectedFilters: sf });
    },

    confirmQuickPopup: function () {
      this.setData({ quickPopup: null });
      this._emit();
    },

    /* ===== 第三行品类标签（页面内过滤，不跳品类） ===== */
    switchSubCategory: function (e) {
      var name = e.currentTarget.dataset.name || '';
      if (this.data.subCategory === name) name = '';
      this.setData({ subCategory: name });
      this._emit();
    }
  }
});
