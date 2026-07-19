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
    catNavItems:[],     // 分类导航预解析数据
    quadItems:{},       // 四宫格预解析
    circleItems:{},     // 圆形卡片行预解析
    ver:'',              // 真实版本号（用于确认手机是否加载最新代码）
    specTabs:['特价甄选','首次降价','3折以下','反季特价'],
    specMap:{},         // 特价货架：{ blockId: { mode, products, markets } }
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
    this.chkLogin();
  },
  onPullDownRefresh:function(){var t=this;t.loadP(function(){t.loadB();t.loadBlocks();wx.stopPullDownRefresh();});},
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

        /* 有分类导航时更新 categories 列表 */
        if(catNavs.length>1){
          t.setData({categories:catNavs.map(function(x){return x.label;})});
        }

        /* 特价货架：加载每个 special 模块的商品 */
        restBlocks.forEach(function(b){
          if(b.type==='special'){
            var ct=b.content||{};
            var markets=[];
            for(var i=0;i<2;i++){
              var n=ct['market'+i+'Name'];
              if(n)markets.push({name:n,link:ct['market'+i+'Link']||'#',desc:''});
            }
            t.setData({['specMap.'+b.id]:{mode:'special',products:[],markets:markets}});
            t.loadSpecial(b.id,'special');
          }
        });
      }
    });
  },

  /* ====== 特价货架：按模式加载折扣商品 ====== */
  loadSpecial:function(blockId,mode){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/special-products?mode='+mode+'&limit=20',
      method:'GET',
      success:function(r){
        var l=[];
        if(r.data&&r.data.success&&r.data.data)l=r.data.data;
        else if(Array.isArray(r.data))l=r.data;
        var prev=t.data.specMap[blockId]||{mode:mode,products:[],markets:[]};
        t.setData({['specMap.'+blockId]:{mode:mode,products:l,markets:prev.markets||[]}});
      }
    });
  },
  swSpecMode:function(e){
    var id=e.currentTarget.dataset.id;
    var m=e.currentTarget.dataset.m;
    var prev=this.data.specMap[id]||{mode:m,products:[],markets:[]};
    this.setData({['specMap.'+id]:{mode:m,products:prev.products,markets:prev.markets||[]}});
    this.loadSpecial(id,m);
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
        if(r.data&&r.data.success&&r.data.data)l=r.data.data||[];
        else if(Array.isArray(r.data))l=r.data;
        var isPriceMember = t.data.isPriceMember;
        l.forEach(function(p){
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
        t.setData({products:l,ld:false});
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
    hists.unshift({id:p.id,name:p.name||p.title,image:p.image_url||p.cover_image,time:Date.now()});
    if(hists.length>50)hists=hists.slice(0,50);
    wx.setStorageSync('view_history',hists);
  },

  swCat:function(e){
    var cat=e.currentTarget.dataset.c;
    this.setData({ac:cat});
    this.loadP();
  },
});
