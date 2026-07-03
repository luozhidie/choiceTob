Page({
  data:{
    userInfo:{},
    isVip:false,
    memberType:'',
    expireDate:'',
    orderCount:0,
    historyCount:0,
  },

  onShow:function(){this.checkUser();this.countOrders();this.countHistory();},

  checkUser:function(){
    var t=this;
    var ui=wx.getStorageSync('user_info');
    if(ui&&ui.nickName)t.setData({userInfo:ui});
    var vip=wx.getStorageSync('vip_status')==='active';
    t.setData({isVip:vip,memberType:vip?'价格会员':'',expireDate:'2027-07-03'});
  },

  countOrders:function(){/* TODO: 调后端 */this.setData({orderCount:5});},
  countHistory:function(){
    var hists=wx.getStorageSync('view_history')||[];
    this.setData({historyCount:hists.length});
  },

  goCart:function(){wx.switchTab({url:'/pages/cart/index'});},
  goOrders:function(e){var s=e?e.currentTarget.dataset.status:'all';wx.navigateTo({url:'/pages/orders/index?status='+s});},
  goVip:function(){wx.navigateTo({url:'/pages/vip/index'});},
  goBuyer:function(){wx.switchTab({url:'/pages/buyer/index'});},
  goMember:function(){wx.navigateTo({url:'/pages/member/index'});},
  goContact:function(){wx.showModal({title:'联系客服',content:'微信：luozhidie\n工作时间 9:00-18:00\n邮箱：luozhidie@live.cn',showCancel:false,confirmText:'知道了'});},
  goHistory:function(){wx.navigateTo({url:'/pages/history/index'});},
  goArticles:function(){wx.navigateTo({url:'/pages/articles/index'});},
  goStyleTest:function(){wx.navigateTo({url:'/pages/style-test/index'});},
  goAbout:function(){wx.showModal({title:'骆芷蝶智选',content:'版本 1.2.0\n服装门店一站式赋能平台\n©2026 骆芷蝶智选',showCancel:false,confirmText:'知道了'});},
});
