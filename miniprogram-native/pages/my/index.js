/* ── 成长等级常量（与网页 /my 一致）── */
var TIERS=[
  {key:'normal',name:'普通会员',emoji:'🌱',threshold:0},
  {key:'silver',name:'白银会员',emoji:'🥈',threshold:5000},
  {key:'gold',name:'黄金会员',emoji:'🥇',threshold:50000},
  {key:'platinum',name:'铂金会员',emoji:'💎',threshold:100000},
  {key:'diamond',name:'钻石会员',emoji:'👑',threshold:300000}
];
var BENEFITS=[
  {key:'return5',title:'退货补贴5%',tier:1,icon:'💰'},
  {key:'return10',title:'退货补贴10%',tier:2,icon:'🎁'},
  {key:'return20',title:'退货补贴20%',tier:3,icon:'🏆'},
  {key:'newStyle',title:'新款抢先看',tier:2,icon:'✨'},
  {key:'vipService',title:'专属客服',tier:3,icon:'🎧'},
  {key:'dataReport',title:'数据报告',tier:4,icon:'📊'}
];

function getTierInfo(spent){
  var spentNum=Number(spent)||0;
  var idx=0;
  for(var i=TIERS.length-1;i>=0;i--){if(spentNum>=TIERS[i].threshold){idx=i;break;}}
  var cur=TIERS[idx],next=TIERS[idx+1]||null;
  return{
    idx:idx,cur:cur,next:next,
    diff:next?Math.max(0,next.threshold-spentNum):0,
    progress:next?Math.min(100,Math.round((spentNum/(cur.threshold+(next.threshold-cur.threshold))||1)*100)):100,
    totalSpent:spentNum
  };
}

Page({
  data:{
    /* 用户 */
    userId:'',
    roleText:'点击登录/注册',
    avatarUrl:'',

    /* 成长等级（渐进解锁）*/
    tiers:TIERS,
    benefits:BENEFITS,
    tierIdx:0,
    curTier:{key:'normal',name:'普通会员',emoji:'🌱',threshold:0},
    nextTier:null,
    tierDiff:0,
    tierProgress:0,
    totalSpentYuan:0,

    /* VIP 兼容 */
    vipLevel:'',
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

  /* ===== VIP / 成长等级状态 ====== */
  loadVip:function(){
    var t=this;
    var vip=wx.getStorageSync('vip_status');
    /* 用本地存储的累计拿货额算等级（元）*/
    var spent=wx.getStorageSync('total_spent_yuan')||0;
    var info=getTierInfo(spent);
    t.setData({
      isVip:vip==='active',
      tierIdx:info.idx,
      curTier:info.cur,
      nextTier:info.next,
      tierDiff:info.diff,
      tierProgress:info.progress,
      totalSpentYuan:info.totalSpent
    });
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
