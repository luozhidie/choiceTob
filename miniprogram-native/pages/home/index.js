Page({
  data:{
    banners:[],
    curB:0,
    categories:['全部','穿搭','护肤','彩妆','养生','食品','家居','文创','艺术'],
    ac:'全部',
    products:[],
    ld:true,
    mo:false,
    un:'',
    li:false,
    /* 动态模块 */
    blocks:[],          // 全部已发布模块（按 sort_order 排序）
    catNavItems:[],     // 分类导航预解析数据
    quadItems:{},       // 四宫格预解析
    circleItems:{},     // 圆形卡片行预解析
  },

  onLoad:function(){
    var t=this;
    t.loadB();
    t.loadP();
    t.loadBlocks();
    t.chkLogin();
  },
  onPullDownRefresh:function(){var t=this;t.loadP(function(){t.loadB();t.loadBlocks();wx.stopPullDownRefresh();});},
  onSwiper:function(e){this.setData({curB:e.detail.current});},

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
            if(cards.length>0)quadData[i]=cards;
          }
          /* 预处理圆形卡片行 */
          if(b.type==='circle_row'){
            var citems=[];
            var keys=Object.keys(ct).sort();
            for(var m=0;m<keys.length;m++){
              var key=keys[m];
              if(key.indexOf('item')===0&&ct[key]&&ct[key].label)citems.push(ct[key]);
            }
            if(citems.length>0)circleData[i]=citems;
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

        t.setData({
          blocks:all,
          catNavItems:catNavs,quadItems:quadData,circleItems:circleData
        });

        /* 有分类导航时更新 categories 列表 */
        if(catNavs.length>1){
          t.setData({categories:catNavs.map(function(x){return x.label;})});
        }
      }
    });
  },

  /* ====== 模块点击跳转 ====== */
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
  goCourses:function(){this.setData({mo:false});wx.navigateTo({url:'/pages/courses/index'});},
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
        l.forEach(function(p){
          var n=Number(p.price)||0;if(n>=100)n=Math.round(n/100);
          p.priceText='\u00A5'+(n%1===0?n:n.toFixed(2));
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
