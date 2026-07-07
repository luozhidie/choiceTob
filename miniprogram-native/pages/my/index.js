/* ── 小程序「我的」页 — 三态：未登录 / 已登录未认证 / 已登录已认证 ── */

/* 等级常量 */
var TIERS=[
  {key:'normal',name:'普通会员',badge:'V1',threshold:0},
  {key:'silver',name:'白银会员',badge:'V2',threshold:2000},
  {key:'gold',name:'黄金会员',badge:'V3',threshold:50000},
  {key:'platinum',name:'铂金会员',badge:'V4',threshold:100000},
  {key:'diamond',name:'钻石会员',badge:'V5',threshold:300000}
];

/* 未认证时显示的引导权益（同行截图1）*/
var CERT_BENEFITS=[
  {icon:'🏷️',title:'批发价拿货'},
  {icon:'🔄',title:'无理由退货'},
  {icon:'🎟️',title:'¥10运费券'},
  {icon:'⚡',title:'新款抢先看'}
];

/* 已认证时等级卡内权益（同行截图2）*/
var TIER_CARD_BENEFITS=[
  {icon:'📅',title:'淡季保级'},
  {icon:'⚡',title:'会员专享'},
  {icon:'🎧',title:'VIP客服'},
  {icon:'🚚',title:'包邮特权'}
];

Page({
  data:{
    /* ===== 登录状态 ===== */
    isLoggedIn:false,
    userId:'',
    roleText:'登录/注册',
    avatarUrl:'',

    /* ===== 认证状态 ===== */
    isCertified:false,
    certifiedStyle:'',

    /* ===== 成长等级 ===== */
    tierIdx:0,
    tierBadge:'V1',
    tierName:'普通会员',
    spentYuan:0,
    nextTierName:'白银会员',
    nextTierDiff:2000,
    tierProgress:0,

    /* ===== 统计 ===== */
    subCount:'--',
    favCount:'--',
    historyCount:'--',

    /* ===== 资产 ===== */
    walletBalance:'--',
    couponCount:'--',
    redPackCount:'--',

    /* ===== 常量（模板用）===== */
    certBenefits:CERT_BENEFITS,
    tierCardBenefits:TIER_CARD_BENEFITS,
    tiers:TIERS
  },

  onShow:function(){
    this.initAll();
  },

  initAll:function(){
    var t=this;
    var ui=wx.getStorageSync('user_info');
    var isCert=!!wx.getStorageSync('is_certified_store_owner');
    var certStyle=wx.getStorageSync('certified_style')||'';
    var token=wx.getStorageSync('token')||'';

    if(ui&&ui.nickName){
      /* 已登录 */
      t.setData({
        isLoggedIn:true,
        userId:ui.nickName||ui.openid||'用户',
        roleText:isCert?'已认证店主':'未认证店主',
        avatarUrl:ui.avatarUrl||'',
        isCertified:isCert,
        certifiedStyle:certStyle
      });
      t.loadTierData();
      t.loadStats();
      t.loadAssets(token);
    } else {
      /* 未登录 */
      t.setData({
        isLoggedIn:false,
        userId:'',
        roleText:'登录/注册',
        avatarUrl:'',
        isCertified:false,
        subCount:'--',favCount:'--',historyCount:'--',
        walletBalance:'--',couponCount:'--',redPackCount:'--'
      });
    }
  },

  /* 计算等级数据 */
  loadTierData:function(){
    var t=this;
    var spent=Number(wx.getStorageSync('total_spent_yuan'))||0;
    var idx=0;
    for(var i=TIERS.length-1;i>=0;i--){
      if(spent>=TIERS[i].threshold){idx=i;break;}
    }
    var cur=TIERS[idx];
    var next=TIERS[idx+1]||null;
    var progress=0,diff=0;
    if(next){
      var span=next.threshold-cur.threshold||1;
      progress=Math.min(100,Math.round(((spent-cur.threshold)/span)*100));
      diff=Math.max(0,next.threshold-spent);
    }else{
      progress=100;
    }
    t.setData({
      tierIdx:idx,
      tierBadge:cur.badge,
      tierName:cur.name,
      spentYuan:spent.toFixed(2),
      nextTierName:next?next.name:'',
      nextTierDiff:diff,
      tierProgress:progress
    });
  },

  /* 统计数 */
  loadStats:function(){
    var t=this;
    var favs=(wx.getStorageSync('favorites')||[]).length;
    var hists=(wx.getStorageSync('view_history')||[]).length;
    t.setData({favCount:fav||'--',historyCount:hists||'--'});
  },

  /* 资产（后端）*/
  loadAssets:function(token){
    var t=this;
    if(!token)return;
    wx.request({
      url:'https://colour-choice.art/api/user/me',
      method:'GET',
      header:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      success:function(r){
        var d=r.data;
        if(!d||!d.success)return;
        var data=d.data||{};
        t.setData({
          subCount:data.orderStats?(data.orderStats.unpaid||0):'--',
          walletBalance:data.walletBalance!=null?data.walletBalance:'--',
          couponCount:data.couponCount!=null?data.couponCount:'--',
          redPackCount:data.redPackCount!=null?data.redPackCount:'--',
          favCount:data.favCount||(wx.getStorageSync('favorites')||[]).length,
          historyCount:data.historyCount||(wx.getStorageSync('view_history')||[]).length
        });
      },
      fail:function(){}
    });
  },

  /* ===== 导航 ===== */
  goLogin:function(){wx.navigateTo({url:'/pages/login/index'});},
  goCertify:function(){wx.navigateTo({url:'/pages/certify/index'});},
  goVip:function(){wx.navigateTo({url:'/pages/vip/index'});},
  goBuyer:function(){wx.switchTab({url:'/pages/buyer/index'});},
  goFavorites:function(){wx.navigateTo({url:'/pages/favorites/index'});},
  goHistory:function(){wx.navigateTo({url:'/pages/history/index'});},
  goCart:function(){wx.switchTab({url:'/pages/cart/index'});},
  goOrders:function(e){var s=e?e.currentTarget.dataset.status:'all';wx.navigateTo({url:'/pages/orders/index?status='+s});},
  goCoupons:function(){wx.navigateTo({url:'/pages/coupons/index'});},
  goRedPackets:function(){wx.navigateTo({url:'/pages/red-packets/index'});},
  goContact:function(){wx.showModal({title:'联系客服',content:'微信：luozhidie\n工作时间 9:00-18:00',showCancel:false,confirmText:'知道了'});},
  goPromo:function(){wx.switchTab({url:'/pages/home/index'});},
  goImport:function(){wx.navigateTo({url:'/pages/import/index'});},

  goNewCustomer:function(){wx.showToast({title:'新客权益开发中',icon:'none'});},
  goGroupBuy:function(){wx.showToast({title:'社群活动开发中',icon:'none'});},
  goLuckDraw:function(){wx.showToast({title:'集财运开发中',icon:'none'});},
  goInvite:function(){wx.showToast({title:'邀请有奖开发中',icon:'none'});},
  goOneKeyImport:function(){wx.showToast({title:'一键入库开发中',icon:'none'});},

  /* ===== 退出登录 ===== */
  goLogout:function(){
    var t=this;
    wx.showModal({
      title:'退出登录',
      content:'确定要退出当前账号吗？',
      confirmText:'退出',
      confirmColor:'#e11d48',
      success:function(res){
        if(!res.confirm)return;
        // 清除所有本地状态
        wx.removeStorageSync('token');
        wx.removeStorageSync('user_info');
        wx.removeStorageSync('vip_status');
        wx.removeStorageSync('member_type');
        wx.removeStorageSync('vip_level');
        wx.removeStorageSync('vip_expire');
        wx.removeStorageSync('is_price_member');
        wx.removeStorageSync('is_certified_store_owner');
        wx.removeStorageSync('certified_style');
        wx.removeStorageSync('certified_monthly_sales');
        // 重置全局状态
        var app=getApp();
        if(app&&app.globalData){
          app.globalData.isPriceMember=false;
          app.globalData.isCertifiedStoreOwner=false;
        }
        // 刷新页面显示未登录态
        t.setData({
          isLoggedIn:false,
          userId:'',
          roleText:'未认证店主',
          avatarUrl:'',
          isCertified:false
        });
        wx.showToast({title:'已退出登录',icon:'success'});
      }
    });
  },

  goRules:function(){wx.showModal({
    title:'会员权益领取规则',
    content:'【解锁条件】\n白银(≥2k):批发价查看\n黄金(≥5w):新款抢先+退货5%\n铂金(≥10w):专属客服+退货10%\n钻石(≥30w):数据报告+退货20%\n\n【认证店主·免费赛道】\n答题通过即可免费看批发价。\n\n详细规则请登录网页 colour-choice.art/my 查看',
    showCancel:false,confirmText:'知道了'
  });}
});
