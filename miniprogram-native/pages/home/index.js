/* 过滤假图/本地图链接，避免显示破图 */
function isValidImgUrl(url){
  if(!url || typeof url !== 'string') return false;
  var lower = url.toLowerCase();
  if(lower.indexOf('http://') !== 0 && lower.indexOf('https://') !== 0) return false;
  if(lower.indexOf('example.com') >= 0 || lower.indexOf('placeholder.com') >= 0 || lower.indexOf('localhost') >= 0 || lower.indexOf('127.0.0.1') >= 0 || lower.indexOf('dummy') >= 0) return false;
  return true;
}
function safeImg(url){
  return isValidImgUrl(url) ? url : '';
}

/* 上新企划倒计时：把 endTime ISO 字符串转成 { d, h, m, s }，过期返回全 00 */
function calcLaunchCountdown(endTime){
  var zero={d:'00',h:'00',m:'00',s:'00'};
  if(!endTime)return zero;
  var end=new Date(endTime).getTime();
  if(isNaN(end))return zero;
  var diff=Math.floor((end-Date.now())/1000);
  if(diff<=0)return zero;
  var d=Math.floor(diff/86400);
  var h=Math.floor((diff%86400)/3600);
  var m=Math.floor((diff%3600)/60);
  var s=diff%60;
  function pad(n){return n<10?('0'+n):(''+n);}
  return {d:pad(d),h:pad(h),m:pad(m),s:pad(s)};
}

Page({
  data:{
    banners:[],
    curB:0,
    categories:['全部','穿搭','护肤','彩妆','养生','食品','家居','文创','艺术'],  // 默认值，API成功后覆盖
    ac:'全部',
    products:[],
    ld:true,
    mo:false,
    un:'',
    li:false,
    isPriceMember:false,  // 价格会员状态
    /* 动态模块 */
    blocks:[],          // 轮播图下方模块（排除 hero_top）
    heroTopBlocks:[],   // 轮播图上方模块（position==='hero_top'）
    topBgColor:'#fcefe9', // 头部/分类标签背景：与首个内容板块 bgColor 统一
    homeBgColor:'',        // 后台「页面背景」设置的首页背景色（优先于 topBgColor）
    homeBgImage:'',        // 后台「页面背景」设置的首页背景图
    headerStyle:'background:#fcefe9;', // 头部最终样式（颜色或图片）
    pageStyle:'',                        // 整页背景（含下半截）：后台设置后注入，否则回落默认 var(--bg)
    catNavItems:[],     // 分类导航预解析数据
    quadItems:{},       // 四宫格预解析
    circleItems:{},     // 圆形卡片行预解析
    fallbackImages:[],  // 商品图兜底：无图横幅自动拼照片墙
    ver:'',              // 真实版本号（用于确认手机是否加载最新代码）
    showProductSec:false, // 首页「穿搭·精选」商品区是否展示（当前隐藏，做成专场页）
    specTabs:['特价甄选','首次降价','3折以下','反季特价'],
    specMap:{},         // 特价货架：{ blockId: { mode, products, markets } }
    /* 上新企划 launch_campaign */
    launchCountdowns:{},// 倒计时 { blockId: { d, h, m, s } }
    lcNewTab:'now',     // 今日新款当前 Tab
    lcNewCat:'',        // 今日新款当前选中分类（视觉高亮）
    launchMediaPool:[], // 真实商品图兜底池（hero/品牌/趋势空图时填充）
    launchProducts:{},  // 今日新款真实商品 { blockId: [...] }
    launchProductsView:{}, // 经 Tab 筛选后的展示列表 { blockId: [...] }
  },

  onLoad:function(){
    var app = getApp();
    var isPriceMember = !!(app && app.globalData && app.globalData.isPriceMember) || !!wx.getStorageSync('is_certified_store_owner');
    this.setData({
      isPriceMember: isPriceMember
    });
    // 读取真实版本号（CI 上传时设置的 version，与体验版版本号一致）
    try {
      var info = wx.getAccountInfoSync();
      var v = info.miniProgram && info.miniProgram.version;
      if (v) this.setData({ ver: 'v' + v });
    } catch (e) {}
    this.loadB();
    this.loadP();
    this.loadCategories();  // 从后台读取分类标签
    this.loadBlocks();
    this.loadPageBg();      // 后台「页面背景」配置
    this.loadLaunchMedia(); // 上新企划真实商品图兜底池
    this.chkLogin();
  },
  onPullDownRefresh:function(){var t=this;t.loadP(function(){t.loadB();t.loadBlocks();wx.stopPullDownRefresh();});},
  onUnload:function(){this.stopLaunchCountdowns();},
  onSwiper:function(e){this.setData({curB:e.detail.current});},

  /* ====== 从后台加载首页行业标签 ====== */
  loadCategories:function(){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/home-categories',
      method:'GET',
      success:function(r){
        var d=r.data;
        if(Array.isArray(d)&&d.length>0){
          t.setData({categories:d.map(function(x){return x.label;})});
        }
      }
    });
  },

  /* ====== 加载动态模块 ====== */
  loadBlocks:function(){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/blocks',
      method:'GET',
      success:function(r){
        var d=r.data;
        if(!d||!d.success)return;
        var all=d.data||[];
        var catNavs=[],quadData={},circleData={};

        for(var i=0;i<all.length;i++){
          var b=all[i];
          var ct=b.content||{};

          /* 预处理分类导航 */
          if(b.type==='category_nav'){
            var items=[{label:'全部',link:''}];
            for(var j=0;j<=9;j++){
              var tab=ct['tab'+j];
              if(tab&&tab.label)items.push(tab);
            }
            catNavs=items;
          }
          /* 预处理四宫格 */
          if(b.type==='card_quad'){
            var cards=[];
            for(var k=0;k<=3;k++){if(ct['card'+k])cards.push(ct['card'+k]);}
            if(cards.length>0)quadData[b.id]=cards;
          }
          /* 预处理圆形卡片行 */
          if(b.type==='circle_row'){
            var citems=[];
            var keys=Object.keys(ct).sort();
            for(var m=0;m<keys.length;m++){
              var key=keys[m];
              if(key.indexOf('item')===0&&ct[key]&&ct[key].image)citems.push(ct[key]);
            }
            if(citems.length>0)circleData[b.id]=citems;
          }
          /* 预处理 featured_banner 副图 */
          if(b.type==='featured_banner'){
            var subs=[];
            for(var s=1;s<=3;s++){
              var sub=ct['sub'+s];
              if(sub&&sub.image)subs.push(sub);
            }
            ct._subs=subs;
          }
        }

        /* 按展示位置拆分：hero_top 放到轮播图上方，其余放轮播图下方 */
        var heroTopBlocks = all.filter(function(x){return (x.content&&x.content.position)==='hero_top';});
        var restBlocks = all.filter(function(x){return (x.content&&x.content.position)!=='hero_top';});

        t.setData({
          blocks:restBlocks,
          heroTopBlocks:heroTopBlocks,
          catNavItems:catNavs,quadItems:quadData,circleItems:circleData
        });
        t.startLaunchCountdowns(all);
        t.loadLaunchNew(all); // 今日新款：拉取真实商品填充

        /* 头部/分类标签背景统一：与首个内容板块的 bgColor 保持一致（让上半部分可随后台配色同步） */
        var topBgColor = '#fcefe9';
        var firstBlock = heroTopBlocks[0] || restBlocks[0];
        if (firstBlock && firstBlock.style && firstBlock.style.bgColor) {
          topBgColor = firstBlock.style.bgColor;
        }
        t.setData({ topBgColor: topBgColor });
        t.updateHeaderStyle();

        /* 有分类导航时更新 categories 列表 */
        if(catNavs.length>1){
          t.setData({categories:catNavs.map(function(x){return x.label;})});
        }

        /* 特价货架：加载每个 special 模块的商品 */
        restBlocks.forEach(function(b){
          if(b.type==='special'){
            var ct=b.content||{};
            var banner={
              image:ct.banner_image||'',
              tag:ct.tag||'限时采购',
              headline:ct.headline||'SALE',
              subheadline:ct.subheadline||'季末·特价捡漏',
              descriptor:ct.descriptor||'全国批发市场 · 优质大牌',
              link:ct.link||'#',
              shelfId:ct.shelfId||''
            };
            var pids=ct.productIds||'';
            var eids=ct.excludeIds||'';
            t.setData({['specMap.'+b.id]:{mode:'special',products:[],loading:true,banner:banner,productIds:pids,excludeIds:eids}});
            if(pids){
              t.loadManualSpecial(b.id,pids,'special',eids);
            } else {
              t.loadSpecial(b.id,'special',eids);
            }
          }
        });
      }
    });
  },

  /* ====== 后台「页面背景」配置：首页头部 ====== */
  loadPageBg:function(){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/page-background',
      method:'GET',
      success:function(r){
        var d=r.data;
        if(!d||!d.success||!d.data)return;
        var home=d.data.home||{};
        t.setData({
          homeBgColor: home.color||'',
          homeBgImage: home.image||''
        });
        t.updateHeaderStyle();
      }
    });
  },
  /* 头部 + 整页最终背景样式：图片优先，否则用颜色（后台设置优先于首个区块 bgColor） */
  updateHeaderStyle:function(){
    var t=this;
    var hasSetting = !!(t.data.homeBgColor || t.data.homeBgImage); // 仅当后台有设置时才覆盖整页背景
    var color=t.data.homeBgColor||t.data.topBgColor||'#fcefe9';
    var img=t.data.homeBgImage;
    var headerStyle= img
      ? ('background:'+color+';background-image:url(\''+img+'\');background-size:cover;background-position:center;')
      : ('background:'+color+';');
    var pageStyle = hasSetting
      ? (img
          ? ('background:'+color+';background-image:url(\''+img+'\');background-size:cover;background-position:center;')
          : ('background:'+color+';'))
      : '';
    t.setData({ headerStyle: headerStyle, pageStyle: pageStyle });
  },

  /* ====== 上新企划：真实素材/商品加载 ====== */
  /* 拉取真实商品图，作为 hero/品牌/趋势 空图位的兜底，让活动页不再是一堆空块 */
  loadLaunchMedia:function(){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/products?limit=40',
      method:'GET',
      success:function(r){
        var l=[];
        if(r.data&&r.data.success&&r.data.data)l=r.data.data||[];
        else if(Array.isArray(r.data))l=r.data;
        var pool=l.map(function(p){return safeImg(p.image_url||p.cover_image||(p.images&&p.images[0]));}).filter(function(u){return !!u;});
        t.setData({launchMediaPool:pool});
      }
    });
  },
  /* 今日新款：拉取真实商品（按 blockId 存盘），分类标签仅作展示 */
  loadLaunchNew:function(blocks){
    var t=this;
    blocks.forEach(function(b){
      if(b.type!=='launch_campaign')return;
      var url='https://colour-choice.art/api/public/products?limit=24';
      wx.request({url:url,method:'GET',
        success:function(r){
          var l=[]; if(r.data&&r.data.success&&r.data.data)l=r.data.data||[]; else if(Array.isArray(r.data))l=r.data;
          var list=l.map(function(p){
            var price=Number(p.price)||0; if(price>=100)price=Math.round(price/100);
            return {
              id:p.id,
              image:safeImg(p.image_url||p.cover_image||(p.images&&p.images[0])),
              title:(p.name||p.title||'商品'),
              price:price,
              badge:(p.is_new?'新品':(p.is_hot?'热卖':'')),
              link:'/pages/shop/index?id='+p.id
            };
          });
          t.setData({['launchProducts.'+b.id]:list});
          t.applyLaunchView();
        },
        fail:function(){
          t.setData({['launchProducts.'+b.id]:[]});
          t.applyLaunchView();
        }
      });
    });
  },
  /* 根据当前 Tab 计算展示列表（今日新款/销量 排序） */
  applyLaunchView:function(){
    var t=this;
    var src=t.data.launchProducts||{};
    var view={};
    var tab=t.data.lcNewTab||'now';
    Object.keys(src).forEach(function(id){
      var list=src[id]||[];
      if(tab==='price'){ list=list.slice().sort(function(a,b){return (b.price||0)-(a.price||0);}); }
      view[id]=list;
    });
    t.setData({launchProductsView:view});
  },

  /* ====== 上新企划 倒计时 ====== */
  startLaunchCountdowns:function(blocks){
    var t=this;
    this.stopLaunchCountdowns();
    var has=false;
    var map={};
    for(var i=0;i<blocks.length;i++){
      var b=blocks[i];
      if(b.type==='launch_campaign' && b.content && b.content.couponSection && b.content.couponSection.endTime){
        map[b.id]=calcLaunchCountdown(b.content.couponSection.endTime);
        has=true;
      }
    }
    if(!has)return;
    t.setData({launchCountdowns:map});
    this._lcTimer=setInterval(function(){
      var cur=t.data.launchCountdowns||{};
      var keys=Object.keys(cur);
      if(keys.length===0)return;
      var next={};
      for(var j=0;j<keys.length;j++){
        var b=blocks.filter(function(x){return x.id===keys[j];})[0];
        if(b && b.content && b.content.couponSection){
          next[keys[j]]=calcLaunchCountdown(b.content.couponSection.endTime);
        }
      }
      t.setData({launchCountdowns:next});
    },1000);
  },
  stopLaunchCountdowns:function(){
    if(this._lcTimer){clearInterval(this._lcTimer);this._lcTimer=null;}
  },
  goLaunchCoupon:function(e){
    var tier=(e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.tier)||{};
    wx.showToast({title:'满'+tier.threshold+'减¥'+tier.amount+' 活动详情',icon:'none'});
  },
  goLaunchLive:function(e){
    var s=(e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.stream)||{};
    wx.showToast({title:(s.brand||'直播')+' '+s.time,icon:'none'});
  },
  goLaunchBrand:function(e){
    var b=(e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.brand)||{};
    if(b.link){wx.navigateTo({url:b.link});return;}
    wx.switchTab({url:'/pages/buyer/index'});
  },
  goLaunchProduct:function(e){
    var p=(e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.product)||{};
    if(p.link){wx.navigateTo({url:p.link});return;}
    wx.switchTab({url:'/pages/buyer/index'});
  },
  swLcNewTab:function(e){
    var t=(e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.t)||'now';
    this.setData({lcNewTab:t});
    this.applyLaunchView();
  },
  swLcNewCat:function(e){
    var c=(e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.c)||'';
    this.setData({lcNewCat:c});
  },

  /* ====== 特价货架：按模式加载折扣商品 ====== */
  loadSpecial:function(blockId,mode,excludeIds){
    var t=this;
    var url='https://colour-choice.art/api/public/special-products?mode='+mode+'&limit=20';
    if(excludeIds)url+='&exclude='+encodeURIComponent(excludeIds);
    wx.request({
      url:url,
      method:'GET',
      success:function(r){
        var l=[];
        if(r.data&&r.data.success&&r.data.data)l=r.data.data;
        else if(Array.isArray(r.data))l=r.data;
        l.forEach(function(p){
          p.image_url = safeImg(p.image_url);
          p.cover_image = safeImg(p.cover_image);
          if(p.images && Array.isArray(p.images)) p.images = p.images.filter(isValidImgUrl);
        });
        var prev=t.data.specMap[blockId]||{mode:mode,products:[],loading:true,banner:{}};
        t.setData({['specMap.'+blockId]:{mode:mode,products:l,loading:false,banner:prev.banner||{},excludeIds:excludeIds||''}});
      }
    });
  },
  /* 特价货架：手动挑选商品时，按 ids 加载指定商品（tab 仍可切换折扣类型筛选） */
  loadManualSpecial:function(blockId,ids,mode,excludeIds){
    var t=this;
    var url='https://colour-choice.art/api/public/special-products?ids='+encodeURIComponent(ids)+'&mode='+(mode||'special');
    if(excludeIds)url+='&exclude='+encodeURIComponent(excludeIds);
    wx.request({
      url:url,
      method:'GET',
      success:function(r){
        var l=[];
        if(r.data&&r.data.success&&r.data.data)l=r.data.data;
        else if(Array.isArray(r.data))l=r.data;
        l.forEach(function(p){
          p.image_url = safeImg(p.image_url);
          p.cover_image = safeImg(p.cover_image);
          if(p.images && Array.isArray(p.images)) p.images = p.images.filter(isValidImgUrl);
        });
        var prev=t.data.specMap[blockId]||{mode:mode,products:[],loading:true,banner:{}};
        t.setData({['specMap.'+blockId]:{mode:mode,products:l,loading:false,banner:prev.banner||{},productIds:ids,excludeIds:excludeIds||''}});
      }
    });
  },
  swSpecMode:function(e){
    var id=e.currentTarget.dataset.id;
    var m=e.currentTarget.dataset.m;
    var prev=this.data.specMap[id]||{mode:m,products:[],loading:true,banner:{}};
    this.setData({['specMap.'+id]:{mode:m,products:prev.products,loading:true,banner:prev.banner||{},productIds:prev.productIds||'',excludeIds:prev.excludeIds||''}});
    if(prev.productIds){
      this.loadManualSpecial(id,prev.productIds,m,prev.excludeIds);
    } else {
      this.loadSpecial(id,m,prev.excludeIds);
    }
  },

  /* ====== 模块点击跳转 ====== */
  goSearch:function(){
    wx.navigateTo({url:'/pages/search/index'});
  },
  goBlockLink:function(e){
    var link=e.currentTarget.dataset.link;
    if(!link)return;
    if(link.indexOf('/')===0){
      /* 站内路径 */
      if(link==='/buyer'||link==='/pages/buyer/index'){wx.switchTab({url:'/pages/buyer/index'});return;}
      wx.navigateTo({url:link,fail:function(){wx.switchTab({url:link.replace('/','/pages/')+'/index',fail:function(){}})}});
    } else {
      /* 外链用 web-view 或提示 */
      wx.setClipboardData({data:link,success:function(){
        wx.showToast({title:'链接已复制',icon:'none'});
      }});
    }
  },

  goShop:function(e){
    var id=e.currentTarget.dataset.id;
    if(id)wx.navigateTo({url:'/pages/shop/index?id='+id});
  },

  /* 当季系列 → 组货专题详情 */
  goSeries:function(e){
    var id=e.currentTarget.dataset.id;
    if(id)wx.navigateTo({url:'/pages/assortment/detail/index?id='+id});
  },

  goShelf:function(e){
    var id=e.currentTarget.dataset.id;
    if(id)wx.navigateTo({url:'/pages/shelf/index?id='+id});
    else wx.switchTab({url:'/pages/buyer/index'});
  },

  /* ====== 菜单 ====== */
  togMenu:function(){this.setData({mo:!this.data.mo});},
  clsMenu:function(){this.setData({mo:false});},
  noop:function(){},

  /* 登录 */
  chkLogin:function(){
    var t=this;
    var info=wx.getStorageSync('user_info');
    if(info&&info.nickName)t.setData({li:true,un:info.nickName||'已登录'});
    else t.setData({li:false,un:''});
  },
  doLogin:function(){wx.navigateTo({url:'/pages/login/index'});},
  goLoginPage:function(){wx.navigateTo({url:'/pages/login/index'});},

  /* 导航跳转 */
  goBuyer:function(e){
    if(e&&e.currentTarget&&e.currentTarget.dataset.from==='menu')this.setData({mo:false});
    wx.switchTab({url:'/pages/buyer/index'});
  },
  goCourses:function(){this.setData({mo:false});console.log('[goCourses] to /pages/courses/index');wx.navigateTo({url:'/pages/courses/index'});},
  goLooks:function(){this.setData({mo:false});wx.navigateTo({url:'/pages/looks/index'});},
  goVipPage:function(){this.setData({mo:false});wx.navigateTo({url:'/pages/vip/index'});},
  goMember:function(){this.setData({mo:false});wx.navigateTo({url:'/pages/member/index'});},
  goMy:function(){this.setData({mo:false});wx.switchTab({url:'/pages/my/index'});},
  goStyleTest:function(){this.setData({mo:false});wx.navigateTo({url:'/pages/style-test/index'});},
  goArticles:function(){this.setData({mo:false});wx.navigateTo({url:'/pages/articles/index'});},
  goContact:function(){this.setData({mo:false});wx.showModal({title:'联系客服',content:'微信：luozhidie\n工作时间 9:00-18:00',showCancel:false,confirmText:'知道了'});},

  /* ====== 数据加载 ====== */
  loadB:function(){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/banners',
      method:'GET',
      success:function(r){
        var d=r.data;
        if(Array.isArray(d)&&d.length>0)t.setData({banners:d});
      },
    });
  },

  loadP:function(cb){
    var t=this;
    t.setData({ld:true,products:[]});
    var cat=t.data.ac==='全部'?'':t.data.ac;
    var url='https://colour-choice.art/api/public/products?limit=20';
    if(cat) url+='&category='+encodeURIComponent(cat);
    wx.request({
      url:url,
      method:'GET',
      success:function(r){
        var l=[];
        var fbImgs=[];
        if(r.data&&r.data.success&&r.data.data)l=r.data.data||[];
        else if(Array.isArray(r.data))l=r.data;
        var isPriceMember = t.data.isPriceMember;
        l.forEach(function(p){
          p.image_url = safeImg(p.image_url);
          p.cover_image = safeImg(p.cover_image);
          if(p.images && Array.isArray(p.images)) p.images = p.images.filter(isValidImgUrl);

          var fbImg = p.image_url || p.cover_image || (p.images && p.images[0]);
          if(fbImg) fbImgs.push(fbImg);

          var price=Number(p.price)||0;if(price>=100)price=Math.round(price/100);
          var wp=Number(p.wholesale_price)||0;
          if(wp>=100)wp=Math.round(wp/100);
          if(isPriceMember && wp>0){
            p.priceText='\u00A5'+(wp%1===0?wp:wp.toFixed(2));
            p.wholesalePriceText='';
          } else {
            p.priceText='\u00A5'+(price%1===0?price:price.toFixed(2));
            if(wp>0)p.wholesalePriceText='批发价 \u00A5???';
            else p.wholesalePriceText='';
          }
          p.is_hot=p.is_hot||false;p.is_new=p.is_new||false;
          t.saveViewHistory(p);
        });
        t.setData({products:l,ld:false,fallbackImages:fbImgs});
      },
      fail:function(){t.setData({ld:false});},
      complete:function(){if(cb)cb();}
    });
  },

  saveViewHistory:function(p){
    if(!p.id)return;
    var hists=wx.getStorageSync('view_history')||[];
    var idx=hists.findIndex(function(h){return h.id===p.id;});
    if(idx>=0)hists.splice(idx,1);
    hists.unshift({id:p.id,name:p.name||p.title,image:safeImg(p.image_url||p.cover_image),time:Date.now()});
    if(hists.length>50)hists=hists.slice(0,50);
    wx.setStorageSync('view_history',hists);
  },

  swCat:function(e){
    var cat=e.currentTarget.dataset.c;
    this.setData({ac:cat});
    this.loadP();
  },
});
