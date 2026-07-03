Page({
  data:{userInfo:{},isVip:false},

  onLoad:function(){this.checkUser();},
  onShow:function(){this.checkUser();},

  checkUser:function(){
    var ui=wx.getStorageSync('user_info');
    if(ui&&ui.nickName)this.setData({userInfo:ui});
    /* TODO: 查后端真实会员状态 */
    var vip=wx.getStorageSync('vip_status')==='active';
    this.setData({isVip:vip});
  },

  goVip:function(){wx.navigateTo({url:'/pages/vip/index'});},
  goBuyer:function(){wx.switchTab({url:'/pages/buyer/index'});},
  noop:function(){wx.showToast({title:'该功能开发中',icon:'none'});},
});
