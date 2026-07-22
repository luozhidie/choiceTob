/* 选品页：左侧分类导航 + 右侧分类内容（点分类进入商品列表） */

/* 占位图柔和色板：无图时按分类名生成底色，避免破图 */
var PLACEHOLDER_COLORS = ['#f3ded6','#ece6e2','#f1e7d2','#e2e9d8','#dde7f3','#ece2f2','#f3e1ea','#e1efee','#f5e9d6','#e4eef0'];
function hashStr(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%PLACEHOLDER_COLORS.length;return h;}
function placeholderStyle(name){return 'background:'+PLACEHOLDER_COLORS[hashStr(name)]+';';}

/* 主分类（左侧导航） */
var MAIN_CATEGORIES = [
  { id:'recommend',   name:'为你推荐' },
  { id:'markets',     name:'热门市场' },
  { id:'topics',      name:'专题' },
  { id:'styles',      name:'风格' },
  { id:'tops',        name:'上装' },
  { id:'bottoms',     name:'下装' },
  { id:'dresses',     name:'裙装' },
  { id:'suits',       name:'套装' },
  { id:'shoes',       name:'女鞋' },
  { id:'accessories', name:'饰品' },
  { id:'bags',        name:'女包' },
  { id:'kids',        name:'童装' },
  { id:'mens',        name:'男装' },
  { id:'lingerie',    name:'居家内衣' },
  { id:'supplies',    name:'店铺耗材' }
];

/* 分类树：每个主分类对应右侧一块内容（支持两种样式：grid 小图、market 大卡） */
var CATEGORY_TREE = {
  recommend: { title:'热门分类推荐', items:[
    '休闲裤','牛仔裤','套装','小衫','连衣裙','半身裙','背心/吊带','短袖T恤','针织衫','衬衫','童装','男装'
  ]},
  markets: { title:'热门市场', type:'market', items:[
    { name:'广州十三行', desc:'一批市场，快时尚风向标\n中档原创品牌聚集地' },
    { name:'广州沙河',   desc:'一批市场，极致性价比\n中低档品牌聚集地' },
    { name:'杭州市场',   desc:'一批市场，中高端原创\n原创原产基地' },
    { name:'濮院市场',   desc:'中国羊毛羊绒第一镇\n全球最大羊毛衫集散中心' },
    { name:'深圳南油',   desc:'一批市场，高端标杆基地\n主营欧货大牌风' }
  ]},
  topics: { title:'特色货品 为你推荐', items:[
    '大码女装','新中式','小香风','小个子','梨形'
  ]},
  styles: { title:'风格', items:[
    '休闲简约','清新简约','通勤简约','小女人','基础百搭','淑女','法式复古','网红辣妹','街头潮流',
    '纯欲','大牌简约','美式复古','高街','田园浪漫','日系简约','学院','中性休闲','甜酷'
  ]},
  tops: { title:'上装', items:[
    '小衫','衬衫','防晒衫','短袖T恤','针织开衫','长袖T恤','短外套','背心','风衣','牛仔外套','针织衫','上装'
  ]},
  bottoms: { title:'下装', items:[
    '牛仔裤','休闲裤','休闲短裤','牛仔短裤','西裤','工装裤','裙裤','背带裤','皮裤','卫衣裤','打底裤','下装'
  ]},
  dresses: { title:'裙装', items:[
    '半身裙','连衣裙','牛仔裙','背带裙'
  ]},
  suits: { title:'套装', items:[
    '套装'
  ]},
  shoes: { title:'女鞋', items:[
    '女鞋','勃肯鞋','休闲鞋','低平跟单鞋','半拖鞋','德训鞋','老爹鞋','低平跟凉鞋','中跟单鞋',
    '休闲凉鞋','乐福鞋','中跟凉鞋','短靴','高跟凉鞋','小白鞋'
  ]},
  accessories: { title:'饰品', items:[
    '袜子','披肩','帽子','丝巾','围巾','头饰','短项链','手链','长项链','耳钉','戒指','耳环','腰带/腰封','手机配饰','手表'
  ]},
  bags: { title:'女包', items:[
    '女包','单肩包','手提包','斜挎包','帆布包','双肩包'
  ]},
  kids: { title:'童装', items:[
    '童装','上装','下装','套装','休闲裤','牛仔裤','连衣裙','长袖T恤','短外套','休闲短裤','卫衣','衬衫','睡衣套装','童鞋','童配饰'
  ]},
  mens: { title:'男装', items:[
    '男装','上装','男鞋','短袖T恤','休闲裤','休闲短裤','牛仔裤','衬衫','POLO衫','短外套','内裤','夹克','睡衣套装','背心','卫衣'
  ]},
  lingerie: { title:'居家内衣', items:[
    '美背内衣','内裤','文胸','睡衣套装','内衣套装','睡裙','抹胸','睡衣','塑型内衣'
  ]},
  supplies: { title:'店铺耗材', items:[
    '购物袋','店铺搭售','陈列道具'
  ]}
};

/* 把 items 字符串数组补成对象，并预生成占位底色 */
function buildTree(){
  var tree={};
  for(var k in CATEGORY_TREE){
    var sec=CATEGORY_TREE[k];
    var arr=[];
    if(sec.type==='market'){
      sec.items.forEach(function(it){arr.push({name:it.name,desc:it.desc,ps:placeholderStyle(it.name)});});
    } else {
      sec.items.forEach(function(n){arr.push({name:n,ps:placeholderStyle(n)});});
    }
    tree[k]={title:sec.title,type:sec.type||'grid',items:arr};
  }
  return tree;
}

/* 默认分类筛选配置（用于商品列表视图） */
var DEFAULT_FILTER_CONFIG = {
  sorts:[{key:'default',label:'综合'},{key:'sales',label:'销量'},{key:'newest',label:'上新'},{key:'price_asc',label:'批发价'}],
  quickFilters:[
    {key:'subscribed_stall',label:'订阅的档口',type:'toggle'},
    {key:'is_special',label:'特价',type:'toggle'},
    {key:'in_stock',label:'现货',type:'toggle'},
    {key:'source_brand',label:'源头厂牌',type:'toggle'},
    {key:'bulk_price',label:'批量采购价',type:'toggle'},
    {key:'sizes',label:'尺码',type:'popup',options:['M','L','S','XL','XS','均码']},
    {key:'fabrics',label:'面料',type:'popup',options:['棉','麻','丝','毛','化纤','混纺','牛仔']}
  ],
  subCategories:[],
  filterPanel:{sections:[]}
};

Page({
  data:{
    keyword:'',
    viewMode:'category',     // 'category' 分类视图 | 'list' 商品列表视图
    activeMainId:'recommend',// 当前左侧选中主分类
    mainCategories:MAIN_CATEGORIES,
    categoryTree:{},
    /* 商品列表视图 */
    activeTab:'全部',
    sortType:'default',
    products:[],
    loading:true,
    hasMore:true,
    page:1,
    isPriceMember:false,
    pageBgColor:'',
    pageBgImage:'',
    pageBgStyle:'background:#faf8f6;',
    /* 筛选项 */
    filterConfig:DEFAULT_FILTER_CONFIG,
    filterOpen:false,        // 全部筛选抽屉
    quickPopup:null,         // 当前弹出的 quickFilter key
    quickPopupLabel:'',
    quickPopupOptions:[],
    selectedFilters:{},      // {key:[value,...]}
    minPrice:'',
    maxPrice:'',
    /* 营销弹窗 */
    popupCfg:null,
    popupVisible:false,
  },

  onLoad:function(){
    var t=this;
    t.refreshAuth();
    t.setData({ categoryTree: buildTree() });
    t.loadPageBg();
    t.loadPopup();
    var opt=t.options||{};
    if(opt.category){ t.enterCategory(opt.category); }
  },

  /* 后台「页面背景」配置：选品页 */
  loadPageBg:function(){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/page-background',
      method:'GET',
      success:function(r){
        var d=r.data;
        if(!d||!d.success||!d.data)return;
        var b=d.data.buyer||{};
        var color=b.color||'#faf8f6';
        var img=b.image||'';
        var style= img
          ? ('background:'+color+';background-image:url(\''+img+'\');background-size:cover;background-position:center;')
          : ('background:'+color+';');
        t.setData({ pageBgColor:color, pageBgImage:img, pageBgStyle:style });
      }
    });
  },

  onShow:function(){ this.refreshAuth(); },

  refreshAuth:function(){
    var app = getApp();
    var isCertified = !!wx.getStorageSync('is_certified_store_owner');
    this.setData({
      isPriceMember: !!(app && app.globalData && app.globalData.isPriceMember) || isCertified
    });
  },

  /* ===== 分类视图交互 ===== */
  selectMainCat:function(e){
    this.setData({ activeMainId: e.currentTarget.dataset.id });
  },
  enterCategory:function(name){
    if(typeof name !== 'string'){ name = name.currentTarget.dataset.name; }
    var t=this;
    t.setData({ activeTab:name, viewMode:'list', page:1, hasMore:true, products:[], selectedFilters:{}, minPrice:'', maxPrice:'' });
    t.loadFilterConfig(name);
    t.load();
  },
  backToCategory:function(){ this.setData({ viewMode:'category', filterOpen:false, quickPopup:null }); },

  /* 加载某品类的筛选项配置 */
  loadFilterConfig:function(category){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/category-filters?category='+encodeURIComponent(category),
      method:'GET',
      success:function(r){
        var d=r.data;
        if(!d||!d.success||!d.data)return;
        var cfg=d.data;
        /* 合并默认值，防止缺字段 */
        t.setData({
          filterConfig:{
            sorts:cfg.sorts||DEFAULT_FILTER_CONFIG.sorts,
            quickFilters:cfg.quickFilters||DEFAULT_FILTER_CONFIG.quickFilters,
            subCategories:cfg.subCategories||[],
            filterPanel:cfg.filterPanel||{sections:[]}
          }
        });
      },
      fail:function(){
        t.setData({ filterConfig:DEFAULT_FILTER_CONFIG });
      }
    });
  },

  /* ===== 商品列表数据 ===== */
  buildUrl:function(){
    var url='https://colour-choice.art/api/public/products?limit=20';
    var t=this;
    if(t.data.keyword)url+='&keyword='+encodeURIComponent(t.data.keyword);
    if(t.data.activeTab!=='全部')url+='&category='+encodeURIComponent(t.data.activeTab);
    if(t.data.sortType!=='default' && t.data.sortType!=='price_desc')url+='&sort='+encodeURIComponent(t.data.sortType);
    if(t.data.sortType==='price_desc')url+='&sort=price_desc';
    if(t.data.page>1) url+='&offset='+((t.data.page-1)*20);

    /* params 过滤 */
    var sf=t.data.selectedFilters;
    for(var k in sf){
      var vals=sf[k];
      if(vals && vals.length){
        url+='&f['+encodeURIComponent(k)+']='+encodeURIComponent(vals.join(','));
      }
    }
    /* 价格区间 */
    var min=t.data.minPrice, max=t.data.maxPrice;
    if(min||max){
      url+='&priceMin='+encodeURIComponent(min||'0')+'&priceMax='+encodeURIComponent(max||'999999');
    }
    return url;
  },

  load:function(cb){
    var t=this;
    t.setData({loading:true});
    wx.request({
      url:this.buildUrl(),
      method:'GET',
      success:function(r){
        var list=[];
        if(r.data&&r.data.success&&r.data.data)list=r.data.data||[];
        else if(Array.isArray(r.data))list=r.data;
        t.applyPrice(list);
        t.setData({products:list,hasMore:list.length>=20});
      },
      fail:function(){},
      complete:function(){t.setData({loading:false});if(cb)cb();}
    });
  },

  loadMore:function(){
    var t=this;
    if(!t.data.hasMore||t.data.loading)return;
    t.setData({loading:true,page:t.data.page+1});
    wx.request({
      url:this.buildUrl(),
      method:'GET',
      success:function(r){
        var list=[];
        if(r.data&&r.data.success&&r.data.data)list=r.data.data||[];
        else if(Array.isArray(r.data))list=r.data;
        t.applyPrice(list);
        t.setData({products:t.data.products.concat(list),hasMore:list.length>=20});
      },
      complete:function(){t.setData({loading:false});}
    });
  },

  applyPrice:function(list){
    var isPriceMember=this.data.isPriceMember;
    list.forEach(function(p){
      var n=Number(p.price)||0;if(n>=100)n=Math.round(n/100);
      var wp=Number(p.wholesale_price)||0;if(wp>=100)wp=Math.round(wp/100);
      if(isPriceMember && wp>0){
        p.priceText='\u00A5'+(wp%1===0?wp:wp.toFixed(2));
        p.wholesalePriceText='';
      } else {
        p.priceText='\u00A5'+(n%1===0?n:n.toFixed(2));
        p.wholesalePriceText = wp>0 ? '\u00A5???' : '';
      }
    });
  },

  onSearchInput:function(e){this.setData({keyword:e.detail.value});},
  doSearch:function(){this.setData({page:1,hasMore:true});this.load();},
  clearSearch:function(){this.setData({keyword:''});this.setData({page:1,hasMore:true});this.load();},

  /* 排序 */
  setSort:function(e){
    var s=e.currentTarget.dataset.sort;
    if(s==='price'){
      if(this.data.sortType==='price_asc')s='price_desc';
      else s='price_asc';
    }
    this.setData({sortType:s,page:1,hasMore:true});
    this.load();
  },

  onListScrollLower:function(){ this.loadMore(); },

  /* ===== 筛选抽屉 ===== */
  openFilter:function(){ this.setData({filterOpen:true}); },
  closeFilter:function(){ this.setData({filterOpen:false}); },

  /* 全部筛选抽屉里的选项切换 */
  toggleFilter:function(e){
    var key=e.currentTarget.dataset.key;
    var val=e.currentTarget.dataset.value;
    var multiple=e.currentTarget.dataset.multiple;
    var t=this;
    var sf=JSON.parse(JSON.stringify(t.data.selectedFilters));
    var arr=sf[key]||[];
    if(multiple){
      var idx=arr.indexOf(val);
      if(idx>=0) arr.splice(idx,1); else arr.push(val);
    } else {
      arr=arr.indexOf(val)>=0?[]:[val];
    }
    if(arr.length) sf[key]=arr; else delete sf[key];
    t.setData({selectedFilters:sf});
  },

  onPriceInput:function(e){
    var t=e.currentTarget.dataset.type;
    var v=e.detail.value;
    if(t==='min') this.setData({minPrice:v}); else this.setData({maxPrice:v});
  },

  resetFilter:function(){ this.setData({selectedFilters:{},minPrice:'',maxPrice:''}); },
  confirmFilter:function(){ this.setData({filterOpen:false,page:1,hasMore:true}); this.load(); },

  /* ===== quickFilters（第二行） ===== */
  toggleQuick:function(e){
    var key=e.currentTarget.dataset.key;
    var type=e.currentTarget.dataset.type;
    if(type==='popup'){
      var t=this;
      if(t.data.quickPopup===key){ t.setData({quickPopup:null}); return; }
      var qf=t.data.filterConfig.quickFilters.find(function(x){return x.key===key;});
      t.setData({
        quickPopup:key,
        quickPopupLabel:qf?qf.label:key,
        quickPopupOptions:qf&&qf.options?qf.options:[]
      });
      return;
    }
    var t=this;
    var sf=JSON.parse(JSON.stringify(t.data.selectedFilters));
    var arr=sf[key]||[];
    arr=arr.indexOf('1')>=0?[]:['1'];
    if(arr.length) sf[key]=arr; else delete sf[key];
    t.setData({selectedFilters:sf,page:1,hasMore:true});
    t.load();
  },
  closeQuickPopup:function(){ this.setData({quickPopup:null}); },
  selectQuickPopup:function(e){
    var key=e.currentTarget.dataset.key;
    var val=e.currentTarget.dataset.value;
    var t=this;
    var sf=JSON.parse(JSON.stringify(t.data.selectedFilters));
    var arr=sf[key]||[];
    var idx=arr.indexOf(val);
    if(idx>=0) arr.splice(idx,1); else arr.push(val);
    if(arr.length) sf[key]=arr; else delete sf[key];
    t.setData({selectedFilters:sf});
  },
  confirmQuickPopup:function(){ this.setData({quickPopup:null,page:1,hasMore:true}); this.load(); },

  /* 第三行品类标签 */
  switchSubCategory:function(e){
    var name=e.currentTarget.dataset.name;
    this.setData({activeTab:name,page:1,hasMore:true,selectedFilters:{},minPrice:'',maxPrice:''});
    this.loadFilterConfig(name);
    this.load();
  },

  goShop:function(e){var id=e.currentTarget.dataset.id;if(id)wx.navigateTo({url:'/pages/shop/index?id='+id});},
  goCertify:function(){wx.navigateTo({url:'/pages/certify/index'});},
  goHome:function(){wx.switchTab({url:'/pages/home/index'});},

  addToCart:function(e){
    var p=e.currentTarget.dataset.product;
    if(!p)return;
    var cart=wx.getStorageSync('cart_v2')||[];
    var ex=cart.find(function(c){return c.id===p.id;});
    if(ex)ex.quantity+=1;
    else cart.push({id:p.id,name:p.name||p.title,price:p.price,wholesale_price:Number(p.wholesale_price)||0,image:p.image_url||p.cover_image,quantity:1});
    wx.setStorageSync('cart_v2',cart);
    wx.showToast({title:'已加购',icon:'success',duration:800});
  },

  /* ===== 营销弹窗：首次进入自动弹，关闭后不再弹 ===== */
  loadPopup:function(){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/popups?page=buyer',
      method:'GET',
      success:function(r){
        var list=[];
        if(r.data&&r.data.success&&Array.isArray(r.data.data))list=r.data.data;
        if(!list.length)return;
        var seen=wx.getStorageSync('popup_seen_ids')||{};
        var pending=null;
        for(var i=0;i<list.length;i++){
          if(!seen[list[i].id]){ pending=list[i]; break; }
        }
        if(pending){
          t.setData({ popupCfg:pending, popupVisible:true });
        }
      }
    });
  },
  onPopupClose:function(e){
    var t=this;
    var cfg=t.data.popupCfg;
    if(cfg && cfg.id){
      var seen=wx.getStorageSync('popup_seen_ids')||{};
      seen[cfg.id]=Date.now();
      wx.setStorageSync('popup_seen_ids', seen);
    }
    t.setData({ popupVisible:false });
  },
  onPopupButtonTap:function(e){
    var t=this;
    var link=(e && e.detail && e.detail.link) || '';
    t.onPopupClose();
    if(!link)return;
    /* 内部路径：/pages/xxx → 走 navigateTo；tabBar 页面走 switchTab */
    var tabPages=['pages/home/index','pages/buyer/index','pages/cart/index','pages/my/index'];
    var isTab=tabPages.some(function(p){ return link.indexOf(p)!==-1; });
    if(isTab){ wx.switchTab({ url:'/'+link.replace(/^\//,'') }); }
    else { wx.navigateTo({ url:'/'+link.replace(/^\//,''), fail:function(){ wx.switchTab({ url:'/pages/buyer/index' }); } }); }
  },
});
