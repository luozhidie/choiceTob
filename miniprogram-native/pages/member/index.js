var mp = require('../../utils/mp-page-copy.js');

Page({
  data:{userInfo:{},isVip:false,pageCopy:{}},

  onLoad:function(){this.checkUser();},
  onShow:function(){this.checkUser();},

  checkUser:function(){
    var ui=wx.getStorageSync('user_info');
    if(ui&&ui.nickName)this.setData({userInfo:ui});
    var vip=wx.getStorageSync('vip_status')==='active';
    this.setData({isVip:vip});
  },

  onReady:function(){
    var self=this;
    mp.loadMpSection('member',function(copy){ self.setData({pageCopy:copy}); });
  },

  goVip:function(){wx.navigateTo({url:'/pages/vip/index'});},
  goBuyer:function(){wx.switchTab({url:'/pages/buyer/index'});},

  /* 商品企划中心 */
  goPlan:function(){
    var c=this.data.pageCopy.modals&&this.data.pageCopy.modals.plan||{};
    wx.showModal({
      title:c.title||'商品企划中心',
      content:c.content||'开发中，敬请期待',
      showCancel:false,confirmText:'知道了'
    });
  },

  /* 爆款样衣展厅 */
  goShowroom:function(){wx.switchTab({url:'/pages/buyer/index'});},

  /* 营销策划工具 */
  goMarketing:function(){
    var c=this.data.pageCopy.modals&&this.data.pageCopy.modals.marketing||{};
    wx.showModal({
      title:c.title||'营销策划工具',
      content:c.content||'开发中，敬请期待',
      showCancel:false,confirmText:'知道了'
    });
  }
});
