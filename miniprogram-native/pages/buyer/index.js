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
  { id:'styles',      name:'风情' },
  { id:'women_styles',name:'女士风格' },
  { id:'men_styles',  name:'男士风格' },
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
  styles: { title:'风情', items:[
    '休闲简约','清新简约','通勤简约','小女人','基础百搭','淑女','法式复古','网红辣妹','街头潮流',
    '纯欲','大牌简约','美式复古','高街','田园浪漫','日系简约','学院','中性休闲','甜酷'
  ]},
  women_styles: { title:'女士风格', items:[
    '少女型','少女偏少年','少女偏时尚','少女偏古典','少女偏自然','少女偏戏剧','少女偏浪漫','少女偏优雅',
    '优雅型','优雅偏少年','优雅偏时尚','优雅偏古典','优雅偏自然','优雅偏戏剧','优雅偏浪漫','优雅偏少女',
    '浪漫型','浪漫偏少年','浪漫偏时尚','浪漫偏古典','浪漫偏自然','浪漫偏戏剧','浪漫偏优雅','浪漫偏少女',
    '少年型','少年偏少女','少年偏优雅','少年偏浪漫','少年偏时尚','少年偏古典','少年偏自然','少年偏戏剧',
    '时尚型','时尚偏少女','时尚偏优雅','时尚偏浪漫','时尚偏少年','时尚偏古典','时尚偏自然','时尚偏戏剧',
    '古典型','古典偏少女','古典偏优雅','古典偏浪漫','古典偏少年','古典偏时尚','古典偏自然','古典偏戏剧',
    '自然型','自然偏少女','自然偏优雅','自然偏浪漫','自然偏少年','自然偏时尚','自然偏古典','自然偏戏剧',
    '戏剧型','戏剧偏少女','戏剧偏优雅','戏剧偏浪漫','戏剧偏少年','戏剧偏时尚','戏剧偏古典','戏剧偏自然'
  ]},
  men_styles: { title:'男士风格', items:[
    '时尚型','时尚偏浪漫','时尚偏古典','时尚偏自然','时尚偏戏剧',
    '浪漫型','浪漫偏时尚','浪漫偏古典','浪漫偏自然','浪漫偏戏剧',
    '古典型','古典偏时尚','古典偏自然','古典偏浪漫','古典偏戏剧',
    '自然型','自然偏浪漫','自然偏时尚','自然偏古典','自然偏戏剧',
    '戏剧型','戏剧偏时尚','戏剧偏古典','戏剧偏自然','戏剧偏浪漫'
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

/* 旧硬编码主分类 id(上装/下装…) → 新层级品类名 的兼容映射（兜底用，API 覆盖后走 cat_<品类>） */
var CAT_MAP = {
  tops:'上装', bottoms:'下装', dresses:'裙装', suits:'套装', shoes:'女鞋',
  accessories:'饰品', bags:'女包', kids:'童装', mens:'男装', lingerie:'居家内衣', supplies:'店铺耗材'
};

/* 硬编码子类目兜底：当后台分类树配置未加载/失败时，仍保证两层筛选有可点标签 */
var SUB_FALLBACK = {};
(function(){
  for(var k in CATEGORY_TREE){
    if(CAT_MAP[k]){
      var cat=CAT_MAP[k];
      SUB_FALLBACK[cat]=CATEGORY_TREE[k].items.filter(function(n){ return n!==cat; });
    }
  }
})();

/* 市场卡片描述（配置里只有市场名，描述静态维护，保留原精致文案） */
var MARKET_DESC = {
  '广州十三行':'一批市场，快时尚风向标\n中档原创品牌聚集地',
  '广州沙河':'一批市场，极致性价比\n中低档品牌聚集地',
  '杭州市场':'一批市场，中高端原创\n原创原产基地',
  '濮院市场':'中国羊毛羊绒第一镇\n全球最大羊毛衫集散中心',
  '深圳南油':'一批市场，高端标杆基地\n主营欧货大牌风'
};
/* 专题（静态精选，与后台配置可不一致时回退） */
var TOPIC_ITEMS = ['大码女装','新中式','小香风','小个子','梨形'];

/* 根据后台分类层级配置(市场→风情→风格→品类→明细)构建主分类导航 + 右侧分类树
   统一使用 cat_<品类> 作为品类主分类 id；API 不可用时沿用上方硬编码 CATEGORY_TREE 兜底 */
function buildFromConfig(cfg){
  cfg = cfg || {};
  var levels = cfg.levels || [];
  function lv(key){ for(var i=0;i<levels.length;i++){ if(levels[i].key===key) return levels[i]; } return null; }
  var marketLv=lv('market'), vibeLv=lv('vibe'), styleLv=lv('style'), catLv=lv('category'), subLv=lv('subcategory');
  var marketVals=(marketLv&&marketLv.values)||[];
  var vibeVals=(vibeLv&&vibeLv.values)||[];
  var femaleStyles=(styleLv&&styleLv.genders&&styleLv.genders['女'])||[];
  var maleStyles=(styleLv&&styleLv.genders&&styleLv.genders['男'])||[];
  var catVals=(catLv&&catLv.values)||[];
  var subMap=(subLv&&subLv.valuesByParent)||{};
  var featured=(cfg.featured)||[];

  var mainCategories=[
    { id:'recommend', name:'为你推荐' },
    { id:'markets', name:'热门市场' },
    { id:'topics', name:'专题' },
    { id:'styles', name:'风情' },
    { id:'women_styles', name:'女士风格' },
    { id:'men_styles', name:'男士风格' }
  ];
  var categoryTree={};
  categoryTree.recommend={ title:'热门分类推荐', items: featured.map(function(v){ return { name:v, ps:placeholderStyle(v) }; }) };
  categoryTree.markets={ title:'热门市场', type:'market', items: marketVals.map(function(v){ return { name:v, desc:MARKET_DESC[v]||'', ps:placeholderStyle(v) }; }) };
  categoryTree.topics={ title:'特色货品 为你推荐', items: TOPIC_ITEMS.map(function(v){ return { name:v, ps:placeholderStyle(v) }; }) };
  categoryTree.styles={ title:'风情', items: vibeVals.map(function(v){ return { name:v, ps:placeholderStyle(v) }; }) };
  categoryTree.women_styles={ title:'女士风格', items: femaleStyles.map(function(v){ return { name:v, ps:placeholderStyle(v) }; }) };
  categoryTree.men_styles={ title:'男士风格', items: maleStyles.map(function(v){ return { name:v, ps:placeholderStyle(v) }; }) };
  catVals.forEach(function(c){
    var subs=subMap[c]||[];
    var items=[{ name:'全部'+c, ps:placeholderStyle('全部'+c) }].concat(subs.map(function(s){ return { name:s, ps:placeholderStyle(s) }; }));
    categoryTree['cat_'+c]={ title:c, items:items };
    mainCategories.push({ id:'cat_'+c, name:c });
  });
  return { mainCategories:mainCategories, categoryTree:categoryTree };
}

/* 默认分类筛选配置（用于商品列表视图） */
var DEFAULT_FILTER_CONFIG = {
  sorts:[{key:'default',label:'综合'},{key:'sales',label:'销量'},{key:'newest',label:'上新'},{key:'price_asc',label:'会员价'}],
  quickFilters:[
    {key:'subscribed_stall',label:'订阅的风格',type:'toggle'},
    {key:'is_special',label:'特价',type:'toggle'},
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
    activeFilters:{ market:'', vibe:'', style:'', category:'', subcategory:'', keyword:'' },
    treeConfig:null,
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
    /* 两层联动筛选：风格 + 品类 */
    categoryStyleMap:{ styles:[], subcategories:[], map:{} },
    activeStyle:'全部',
    visibleSubcats:[],
    /* 营销弹窗 */
    popupCfg:null,
    popupVisible:false,
  },

  onLoad:function(){
    var t=this;
    t.refreshAuth();
    var built=buildTree();
    t.setData({
      mainCategories: MAIN_CATEGORIES,
      categoryTree: built,
      activeFilters:{ market:'', vibe:'', style:'', category:'', subcategory:'', keyword:'' },
      treeConfig:null
    });
    t.loadPageBg();
    t.loadPopup();
    t.loadCategoryTree();
    var opt=t.options||{};
    if(opt.category){ t.enterCategoryByName(opt.category); }
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

  /* 根据主分类 id + 节点名推断层级与查询值（兼容旧 mains 与新 cat_<品类> 两套 id） */
  _makeItem:function(name, mainId){
    var item={ name:name, value:name };
    if(mainId==='markets'){ item.level='market'; }
    else if(mainId==='styles'){ item.level='vibe'; }
    else if(mainId==='women_styles'||mainId==='men_styles'){ item.level='style'; item.gender=(mainId==='women_styles'?'女':'男'); }
    else if(mainId==='topics'){ item.level='topic'; }
    else if(mainId==='recommend'){ item.level='featured'; }
    else if(mainId && mainId.indexOf('cat_')===0){ var cat=mainId.slice(4); if(name==='全部'+cat){ item.level='category'; } else { item.level='subcategory'; item.parentCategory=cat; } }
    else if(CAT_MAP[mainId]){ var c=CAT_MAP[mainId]; if(name===c){ item.level='category'; } else { item.level='subcategory'; item.parentCategory=c; } }
    else { item.level='keyword'; }
    return item;
  },

  /* 把层级节点转成查询条件（市场/风情/风格/品类/明细 各司其职），深层自动清除 */
  _enterItem:function(item){
    var t=this;
    var af={ market:'', vibe:'', style:'', category:'', subcategory:'', keyword:'' };
    if(item.level==='market') af.market=item.value;
    else if(item.level==='vibe') af.vibe=item.value;
    else if(item.level==='style') af.style=item.value;
    else if(item.level==='category') af.category=item.value;
    else if(item.level==='subcategory'){ af.category=item.parentCategory; af.subcategory=item.value; }
    else if(item.level==='featured'){
      var pc=t.findParentCategory(item.value);
      if(pc){ af.category=pc; af.subcategory=item.value; } else { af.keyword=item.value; }
    }
    else if(item.level==='topic'||item.level==='keyword'){ af.keyword=item.value; }
    t.setData({
      activeTab:item.name,
      viewMode:'list',
      page:1,
      hasMore:true,
      products:[],
      selectedFilters:{},
      minPrice:'',
      maxPrice:'',
      keyword:'',
      activeFilters:af,
      categoryStyleMap:{ styles:[], subcategories:[], map:{} },
      activeStyle:'全部',
      visibleSubcats:[]
    });
    t.loadFilterConfig(af.category);
    t.loadCategoryStyleMap(af.category);
    t.load();
  },

  enterCategory:function(e){
    if(!(e && e.currentTarget && e.currentTarget.dataset)) return;
    var name=e.currentTarget.dataset.name;
    if(typeof name!=='string') return;
    this._enterItem(this._makeItem(name, this.data.activeMainId));
  },

  /* 深链：按名称定位主分类后进入 */
  enterCategoryByName:function(name){
    var t=this;
    var tree=t.data.categoryTree||{};
    for(var mid in tree){
      var items=tree[mid].items||[];
      for(var i=0;i<items.length;i++){
        if(items[i].name===name){ t.setData({ activeMainId: mid }); t._enterItem(t._makeItem(name, mid)); return; }
      }
    }
  },

  backToCategory:function(){
    this.setData({
      viewMode:'category',
      filterOpen:false,
      quickPopup:null,
      activeFilters:{ market:'', vibe:'', style:'', category:'', subcategory:'', keyword:'' },
      categoryStyleMap:{ styles:[], subcategories:[], map:{} },
      activeStyle:'全部',
      visibleSubcats:[]
    });
  },

  /* 拉取后台分类层级配置，覆盖默认导航（市场→风情→风格→品类→明细） */
  loadCategoryTree:function(){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/category-tree',
      method:'GET',
      success:function(r){
        var d=r.data;
        if(!d||!d.success||!d.data) return;
        var built=buildFromConfig(d.data);
        t.setData({ mainCategories: built.mainCategories, categoryTree: built.categoryTree, treeConfig: d.data });
      }
    });
  },

  /* 取子类映射（明细按品类分组） */
  getSubMap:function(){
    var cfg=this.data.treeConfig||{};
    var levels=cfg.levels||[];
    for(var i=0;i<levels.length;i++){ if(levels[i].key==='subcategory') return levels[i].valuesByParent||{}; }
    return {};
  },
  getSubCategories:function(cat){
    var m=this.getSubMap();
    if(cat && m[cat] && m[cat].length) return m[cat];
    if(cat && SUB_FALLBACK[cat] && SUB_FALLBACK[cat].length) return SUB_FALLBACK[cat];
    return [];
  },
  findParentCategory:function(name){
    var m=this.getSubMap();
    for(var k in m){ if(m[k].indexOf(name)>=0) return k; }
    return '';
  },

  /* 加载某品类的筛选项配置 */
  loadFilterConfig:function(category){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/category-filters?category='+encodeURIComponent(category||''),
      method:'GET',
      success:function(r){
        var d=r.data;
        if(!d||!d.success||!d.data){ t._applySubCats(category); return; }
        var cfg=d.data;
        t.setData({
          filterConfig:{
            sorts:cfg.sorts||DEFAULT_FILTER_CONFIG.sorts,
            quickFilters:cfg.quickFilters||DEFAULT_FILTER_CONFIG.quickFilters,
            subCategories:t.getSubCategories(category),
            filterPanel:cfg.filterPanel||{sections:[]}
          }
        });
      },
      fail:function(){ t._applySubCats(category); }
    });
  },
  _applySubCats:function(category){
    var t=this;
    t.setData({ filterConfig: Object.assign({}, DEFAULT_FILTER_CONFIG, { subCategories: t.getSubCategories(category) }) });
  },

  /* 按品类拉取「风格 → 子品类」聚合映射，用于两层联动筛选
     关键点：子品类(第二行)始终以「后台分类树配置」的全量列表为准，
     保证每个品类进入列表都有可点的二级标签（即使该品类在商品库里还没上货）；
     风格(第一行)只展示商品库里真实存在的风格，避免空的/无意义的风格。 */
  loadCategoryStyleMap:function(category){
    var t=this;
    var allSubs=(category)?(t.getSubCategories(category)||[]):[];
    if(!category){
      t.setData({ categoryStyleMap:{ styles:[], subcategories:allSubs, map:{} }, activeStyle:'全部', visibleSubcats:allSubs.slice() });
      return;
    }
    wx.request({
      url:'https://colour-choice.art/api/public/category-style-map?category='+encodeURIComponent(category),
      method:'GET',
      success:function(r){
        var d=r.data||{};
        var data=(d.success&&d.data)?d.data:{ styles:[], subcategories:[], map:{} };
        // 子类目全量走配置；风格→子类目 的联动映射来自商品聚合 API
        var map=data.map||{};
        t.setData({
          categoryStyleMap:{ styles:(data.styles||[]).slice(), subcategories:allSubs.slice(), map:map },
          activeStyle:'全部',
          visibleSubcats: allSubs.slice()
        });
      },
      fail:function(){
        // 接口失败时回退到本地默认映射，保证 UI 不空白
        var map={}; map['全部']=allSubs.slice();
        t.setData({
          categoryStyleMap:{ styles:[], subcategories:allSubs.slice(), map:map },
          activeStyle:'全部',
          visibleSubcats:allSubs.slice()
        });
      }
    });
  },

  /* ===== 商品列表数据 ===== */
  buildUrl:function(){
    var url='https://colour-choice.art/api/public/products?limit=20';
    var t=this;
    var af=t.data.activeFilters||{};
    if(t.data.keyword)url+='&keyword='+encodeURIComponent(t.data.keyword);
    if(af.market)url+='&market='+encodeURIComponent(af.market);
    if(af.vibe)url+='&vibe='+encodeURIComponent(af.vibe);
    if(af.style)url+='&style='+encodeURIComponent(af.style);
    if(af.category)url+='&category='+encodeURIComponent(af.category);
    if(af.subcategory)url+='&subcategory='+encodeURIComponent(af.subcategory);
    if(af.keyword && !t.data.keyword)url+='&keyword='+encodeURIComponent(af.keyword);
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
    function maskPrice(yuan){
      if(yuan<=0)return '';
      var s=String(yuan);
      var units=s.slice(-1);
      var mask=new Array(Math.max(0,s.length-1)+1).join('?');
      return '\u00A5'+mask+units;
    }
    list.forEach(function(p){
      var n=Number(p.price)||0;if(n>=100)n=Math.round(n/100);
      var wp=Number(p.wholesale_price)||0;if(wp>=100)wp=Math.round(wp/100);
      // 心愿收集（盲盒）模式：1 手=5 件，按件数解锁档位
      if(p.wishlist_mode){
        var hands=Number(p.wish_count)||0;
        var bp=Number(p.bulk_price)||0;if(bp>=100)bp=Math.round(bp/100);
        var W_PIECES=5,B_PIECES=25;
        if(hands>=B_PIECES){
          var bShown=bp>0?bp:(wp>0?wp:n);
          p.priceText='\u00A5'+(bShown%1===0?bShown:bShown.toFixed(2));
          p.priceHint='已开批量价';
        } else if(hands>=W_PIECES){
          var wShown=wp>0?wp:n;
          p.priceText='\u00A5'+(wShown%1===0?wShown:wShown.toFixed(2));
          p.priceHint='已开会员价';
        } else {
          var teaser=wp>0?wp:n;
          if(teaser>0){ p.priceText=maskPrice(teaser); p.priceHint='再集'+(W_PIECES-hands)+'件开会员价'; }
          else { p.priceText='价格待定'; p.priceHint='盲盒集单'; }
        }
        p.wholesalePriceText='';
      } else if(isPriceMember && wp>0){
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

  /* 切换风格（一级筛选）：联动刷新第二行品类并重载商品 */
  switchStyle:function(e){
    var name=e.currentTarget.dataset.name;
    var t=this;
    var m=t.data.categoryStyleMap||{};
    var subMap=m.map||{};
    var allSubs=m.subcategories||[];
    var visible=(name==='全部') ? allSubs.slice() : ((subMap[name]&&subMap[name].length)?subMap[name]:allSubs).slice();
    var af=JSON.parse(JSON.stringify(t.data.activeFilters||{}));
    af.style=(name==='全部') ? '' : name;
    af.subcategory='';   // 风格切换时清掉上一档品类选择
    t.setData({
      activeStyle:name,
      visibleSubcats:visible,
      activeFilters:af,
      page:1,
      hasMore:true,
      selectedFilters:{},
      minPrice:'',
      maxPrice:''
    });
    t.load();
  },

  /* 第三行品类标签（明细）：在当前品类下细化 subcategory */
  switchSubCategory:function(e){
    var name=e.currentTarget.dataset.name;
    var t=this;
    var af=JSON.parse(JSON.stringify(t.data.activeFilters||{}));
    af.subcategory=name;
    t.setData({ activeTab:name, activeFilters:af, page:1, hasMore:true, selectedFilters:{}, minPrice:'', maxPrice:'' });
    t.load();
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
