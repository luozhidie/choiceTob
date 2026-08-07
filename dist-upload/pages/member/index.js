Page({
  data:{userInfo:{},isVip:false},

  onLoad:function(){this.checkUser();},
  onShow:function(){this.checkUser();},

  checkUser:function(){
    var ui=wx.getStorageSync('user_info');
    if(ui&&ui.nickName)this.setData({userInfo:ui});
    var vip=wx.getStorageSync('vip_status')==='active';
    this.setData({isVip:vip});
  },

  goVip:function(){wx.navigateTo({url:'/pages/vip/index'});},
  goBuyer:function(){wx.switchTab({url:'/pages/buyer/index'});},

  /* 商品企划中心 */
  goPlan:function(){
    wx.showModal({
      title:'商品企划中心',
      content:'AI驱动的商品开发决策\n96格货盘矩阵\n采购清单生成\n\n开发中，敬请期待',
      showCancel:false,confirmText:'知道了'
    });
  },

  /* 爆款样衣展厅 */
  goShowroom:function(){wx.switchTab({url:'/pages/buyer/index'});},

  /* 营销策划工具 */
  goMarketing:function(){
    wx.showModal({
      title:'营销策划工具',
      content:'AI营销方案生成\n推广策略建议\n投放效果预估\n\n开发中，敬请期待',
      showCancel:false,confirmText:'知道了'
    });
  },
});
