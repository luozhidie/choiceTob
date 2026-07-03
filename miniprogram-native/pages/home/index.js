Page({
  data: {
    banners: [
      { id:1, image:'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&q=80' },
      { id:2, image:'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&q=80' },
      { id:3, image:'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80' }
    ],
    curB:0,
    categories:['全部','穿搭','护肤','彩妆','养生','食品','家居','文创','艺术'],
    ac:'全部',
    products:[],
    ld:true,
    mo:false,
    un:'',
    li:false
  },

  onLoad:function(){this.loadP();this.loadB();this.chkLogin();},
  onPullDownRefresh:function(){var t=this;this.loadP(function(){wx.stopPullDownRefresh();});},
  onSwiper:function(e){this.setData({curB:e.detail.current});},

  /* 菜单 */
  togMenu:function(){this.setData({mo:!this.data.mo});},
  clsMenu:function(){this.setData({mo:false});},
  noop:function(){},

  /* 登录 */
  chkLogin:function(){
    var t=this;
    var info=wx.getStorageSync('user_info');
    if(info&&info.nickName){t.setData({li:true,un:info.nickName||'已登录'});}
    else{t.setData({li:false,un:''});}
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

  /* 数据加载 */
  loadB:function(){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/banners',
      method:'GET',
      success:function(r){if(r.data&&Array.isArray(r.data.data)&&r.data.data.length>0)t.setData({banners:r.data.data});}
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
          /* 记录浏览历史 */
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

  goShop:function(e){
    var id=e.currentTarget.dataset.id;
    if(id)wx.navigateTo({url:'/pages/shop/index?id='+id,fail:function(){wx.showToast({title:'详情开发中',icon:'none'});}});
  }
});
