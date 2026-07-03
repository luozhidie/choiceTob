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
  chkLogin:function(){var t=this;wx.getSetting({success:function(r){if(r.authSetting['scope.userInfo'])t.setData({li:true,un:'已登录'});}});},
  doLogin:function(){var t=this;wx.getUserProfile({desc:'完善会员资料',success:function(r){t.setData({un:r.userInfo.nickName||'已登录',li:true,mo:false});wx.showToast({title:'登录成功',icon:'success'});},fail:function(){wx.showToast({title:'取消登录',icon:'none'});}});},

  goVipPage:function(){this.setData({mo:false});wx.showToast({title:'VIP开发中',icon:'none'});},
  goContact:function(){this.setData({mo:false});wx.showModal({title:'联系客服',content:'微信：luozhidie\n工作时间 9:00-18:00',showCancel:false,confirmText:'知道了'});},

  loadB:function(){var t=this;wx.request({url:'https://colour-choice.art/api/public/banners',method:'GET',success:function(r){if(r.data&&Array.isArray(r.data.data)&&r.data.data.length>0)t.setData({banners:r.data.data});}});},
  loadP:function(cb){var t=this;t.setData({ld:true});wx.request({url:'https://colour-choice.art/api/public/products?limit=20',method:'GET',success:function(r){var l=[];if(r.data&&r.data.success&&r.data.data)l=r.data.data||[];else if(Array.isArray(r.data))l=r.data;l.forEach(function(p){var n=Number(p.price)||0;if(n>=100)n=Math.round(n/100);p.priceText='\u00A5'+(n%1===0?n:n.toFixed(2));p.is_hot=p.is_hot||false;p.is_new=p.is_new||false;});t.setData({products:l,ld:false});},fail:function(){t.setData({ld:false});},complete:function(){if(cb)cb();}});},

  swCat:function(e){this.setData({ac:e.currentTarget.dataset.c});},
  goBuyer:function(e){if(e&&e.currentTarget&&e.currentTarget.dataset.from==='menu')this.setData({mo:false});wx.switchTab({url:'/pages/buyer/index'});},
  goCourses:function(){this.setData({mo:false});wx.showToast({title:'课程开发中',icon:'none'});},
  goLooks:function(){this.setData({mo:false});wx.showToast({title:'搭配开发中',icon:'none'});},
  goMy:function(){this.setData({mo:false});wx.switchTab({url:'/pages/my/index'});},
  goShop:function(e){var id=e.currentTarget.dataset.id;if(id)wx.navigateTo({url:'/pages/shop/index?id='+id,fail:function(){wx.showToast({title:'详情开发中',icon:'none'});}});}
});
