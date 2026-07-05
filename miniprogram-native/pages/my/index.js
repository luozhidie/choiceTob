Page({
  data:{
    /* 用户 */
    userId:'',
    roleText:'点击登录/注册',
    avatarUrl:'',

    /* VIP */
    vipLevel:'',
    levelName:'普通会员',
    progressText:'开通会员享专属权益',
    isVip:false,

    /* 统计 */
    subCount:0,
    favCount:0,
    historyCount:0,

    /* 资产 */
    walletBalance:0,
    couponCount:0,
    redpackCount:0,
  },

  onShow:function(){
    this.loadUser();
    this.loadVip();
    this.countSubs();
    this.countFavs();
    this.countHistory();
  },

  loadUser:function(){
    var t=this;
    var ui=wx.getStorageSync('user_info');
    if(ui&&ui.nickName){
      t.setData({
        userId:ui.nickName||ui.openid||'用户',
        roleText:ui.role||'已认证店主',
        avatarUrl:ui.avatarUrl||''
      });
    } else {
      t.setData({userId:'未登录',roleText:'点击登录/注册'});
    }
  },

  loadVip:function(){
    var t=this;
    var vip=wx.getStorageSync('vip_status');
    var mt=wx.getStorageSync('member_type')||'';
    var exp=wx.getStorageSync('vip_expire')||'';
    var level=wx.getStorageSync('vip_level')||'';

    if(vip==='active'){
      var ln='', lv=level||'V1', pt='';
      if(lv==='V1'||lv==='trial'){ln='体验会员';pt='当月拿货额 0.00，还差 2000.00 元升级白银会员';}
      else if(lv==='V2'||lv==='quarter'){ln='季卡会员';pt='当月拿货额 5000.00，还差 15000.00 元升级年卡会员';}
      else if(lv==='V3'||lv==='year'){ln='年卡会员';pt='已享受全部权益';}
      else{ln=mt||'价格会员';pt='会员权益有效中';}

      t.setData({isVip:true,levelName:ln,vipLevel:lv,progressText:pt});
    } else {
      var ln='普通会员', lv='', pt='开通会员享专属权益';
      t.setData({isVip:false,levelName:ln,vipLevel:lv,progressText:pt});
    }
  },

  countSubs:function(){/* TODO: API */this.setData({subCount:0});},
  countFavs:function(){
    var favs=wx.getStorageSync('favorites')||[];
    this.setData({favCount:favs.length});
  },
  countHistory:function(){
    var hists=wx.getStorageSync('view_history')||[];
    this.setData({historyCount:hists.length});
  },

  /* ===== 导航跳转 ====== */
  goSettings:function(){
    wx.showToast({title:'设置页开发中',icon:'none'});
  },
  goContact:function(){
    wx.showModal({title:'联系客服',content:'微信：luozhidie\n工作时间 9:00-18:00',showCancel:false,confirmText:'知道了'});
  },
  goVip:function(){wx.navigateTo({url:'/pages/vip/index'});},
  goBuyer:function(){wx.switchTab({url:'/pages/buyer/index'});},
  goFavorites:function(){wx.navigateTo({url:'/pages/favorites/index'});},
  goHistory:function(){wx.navigateTo({url:'/pages/history/index'});},
  goOrders:function(e){var s=e?e.currentTarget.dataset.status:'all';wx.navigateTo({url:'/pages/orders/index?status='+s});},
  goPromo:function(){wx.switchTab({url:'/pages/home/index'});},

  goNewCustomer:function(){wx.showToast({title:'新客权益开发中',icon:'none'});},
  goGroupBuy:function(){wx.showToast({title:'社群活动开发中',icon:'none'});},
  goLuckDraw:function(){wx.showToast({title:'集财运开发中',icon:'none'});},
  goInvite:function(){wx.showToast({title:'邀请有奖开发中',icon:'none'});},
  goOneKeyImport:function(){wx.showToast({title:'一键入库开发中',icon:'none'});},
  goCart:function(){wx.switchTab({url:'/pages/cart/index'});},
});
