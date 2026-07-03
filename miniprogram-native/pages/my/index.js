Page({
  data:{userInfo:{},isVip:false,historyCount:0},

  onShow:function(){
    this.checkLogin();
    this.checkVip();
    this.countHistory();
  },

  checkLogin:function(){
    var t=this;
    var ui=wx.getStorageSync('user_info');
    if(ui&&ui.nickName){
      t.setData({userInfo:ui});
    }else{
      t.setData({userInfo:{}});
    }
  },

  checkVip:function(){
    var vip=wx.getStorageSync('vip_status')==='active';
    this.setData({isVip:vip});
  },

  countHistory:function(){
    var hists=wx.getStorageSync('view_history')||[];
    this.setData({historyCount:hists.length});
  },

  doLogin:function(){wx.navigateTo({url:'/pages/login/index'});},

  goVip:function(){wx.navigateTo({url:'/pages/vip/index'});},

  goOrders:function(e){
    var s=e.currentTarget.dataset.status||'all';
    wx.navigateTo({url:'/pages/orders/index?status='+s});
  },

  goFavorites:function(){wx.showToast({title:'收藏功能开发中',icon:'none'});},
  goHistory:function(){wx.navigateTo({url:'/pages/history/index'});},
  goAddress:function(){wx.showToast({title:'地址管理开发中',icon:'none'});},
  goContact:function(){wx.showModal({title:'联系客服',content:'微信：luozhidie\n工作时间 9:00-18:00\n邮箱：luozhidie@live.cn',showCancel:false,confirmText:'知道了'});},
  goAbout:function(){wx.showModal({title:'骆芷蝶智选',content:'版本 1.1.0\n服装门店一站式赋能平台\n©2026 骆芷蝶智选',showCancel:false,confirmText:'知道了'});},
  goArticles:function(){wx.navigateTo({url:'/pages/articles/index'});},
  goStyleTest:function(){wx.navigateTo({url:'/pages/style-test/index'});},
});
