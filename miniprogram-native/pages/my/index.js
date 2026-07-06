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
    redPackCount:0,

    /* 认证店主 */
    isCertified:false,
  },

  onShow:function(){
    this.loadUser();
    this.loadVip();
    this.countFavs();
    this.countHistory();
    this.loadApiData();
  },

  /* ===== 用户信息 ====== */
  loadUser:function(){
    var t=this;
    var ui=wx.getStorageSync('user_info');
    var isCert = !!wx.getStorageSync('is_certified_store_owner');
    if(ui&&ui.nickName){
      t.setData({
        userId:ui.nickName||ui.openid||'用户',
        roleText:isCert ? '认证店主' : (ui.role||'已认证店主'),
        avatarUrl:ui.avatarUrl||'',
        isCertified:isCert,
      });
    } else {
      t.setData({userId:'未登录',roleText:'点击登录/注册',avatarUrl:'',isCertified:false});
    }
  },

  /* ===== VIP 状态 ====== */
  loadVip:function(){
    var t=this;
    var vip=wx.getStorageSync('vip_status');
    var mt=wx.getStorageSync('member_type')||'';
    var exp=wx.getStorageSync('vip_expire')||'';
    var level=wx.getStorageSync('vip_level')||'';

    if(vip==='active'){
      var ln='',lv=level||'V1',pt='';
      if(lv==='V1'||lv==='trial'){ln='体验会员';pt='当月拿货额 0.00，还差 2000.00 元升级白银会员';}
      else if(lv==='V2'||lv==='quarter'){ln='季卡会员';pt='当月拿货额 5000.00，还差 15000.00 元升级年卡会员';}
      else if(lv==='V3'||lv==='year'){ln='年卡会员';pt='已享受全部权益';}
      else{ln=mt||'价格会员';pt='会员权益有效中';}
      t.setData({isVip:true,levelName:ln,vipLevel:lv,progressText:pt});
    } else {
      t.setData({isVip:false,levelName:'普通会员',vipLevel:'',progressText:'开通会员享专属权益'});
    }
  },

  /* ===== 从后端加载「我的」全部数据 ====== */
  loadApiData:function(){
    var t=this;
    var token=wx.getStorageSync('token')||'';
    wx.request({
      url:'https://colour-choice.art/api/user/me',
      method:'GET',
      header:{
        'Content-Type':'application/json',
        'Authorization':'Bearer '+token,
      },
      success:function(r){
        var d=r.data;
        if(!d||!d.success)return;
        var data=d.data||{};

        t.setData({
          /* 订单统计 */
          subCount:data.orderStats? data.orderStats.unpaid||0:0,
          /* 资产 */
          walletBalance:data.walletBalance||0,
          couponCount:data.couponCount||0,
          redPackCount:data.redPackCount||0,
          /* 收藏数（后端优先，本地兜底）*/
          favCount:data.favCount||(wx.getStorageSync('favorites')||[]).length,
          historyCount:data.historyCount||(wx.getStorageSync('view_history')||[]).length,
        });
      },
      fail:function(){/* 静默失败，用本地数据 */}
    });
  },

  /* ===== 本地统计（兜底）====== */
  countFavs:function(){
    var favs=wx.getStorageSync('favorites')||[];
    if(this.data.favCount===0){this.setData({favCount:favs.length});}
  },
  countHistory:function(){
    var hists=wx.getStorageSync('view_history')||[];
    if(this.data.historyCount===0){this.setData({historyCount:hists.length});}
  },

  /* ===== 导航跳转 ====== */
  goSettings:function(){
    var ui=wx.getStorageSync('user_info');
    if(ui&&ui.nickName){
      wx.showToast({title:'设置页开发中',icon:'none'});
    } else {
      wx.navigateTo({url:'/pages/login/index'});
    }
  },
  goCoupons:function(){wx.navigateTo({url:'/pages/coupons/index'});},
  goRedPackets:function(){wx.navigateTo({url:'/pages/red-packets/index'});},
  goContact:function(){
    wx.showModal({title:'联系客服',content:'微信：luozhidie\n工作时间 9:00-18:00',showCancel:false,confirmText:'知道了'});
  },
  goVip:function(){wx.navigateTo({url:'/pages/vip/index'});},
  goBuyer:function(){wx.switchTab({url:'/pages/buyer/index'});},
  goFavorites:function(){wx.navigateTo({url:'/pages/favorites/index'});},
  goHistory:function(){wx.navigateTo({url:'/pages/history/index'});},
  goOrders:function(e){
    var s=e?e.currentTarget.dataset.status:'all';
    wx.navigateTo({url:'/pages/orders/index?status='+s});
  },
  goPromo:function(){wx.switchTab({url:'/pages/home/index'});},

  goNewCustomer:function(){wx.showToast({title:'新客权益开发中',icon:'none'});},
  goGroupBuy:function(){wx.showToast({title:'社群活动开发中',icon:'none'});},
  goLuckDraw:function(){wx.showToast({title:'集财运开发中',icon:'none'});},
  goInvite:function(){wx.showToast({title:'邀请有奖开发中',icon:'none'});},
  goOneKeyImport:function(){wx.showToast({title:'一键入库开发中',icon:'none'});},
  goImport:function(){wx.navigateTo({url:'/pages/import/index'});},
  goCart:function(){wx.switchTab({url:'/pages/cart/index'});},
  goCertify:function(){wx.navigateTo({url:'/pages/certify/index'});},
});
