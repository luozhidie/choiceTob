/* ── 小程序「我的」页 — 三态：未登录 / 已登录未认证 / 已登录已认证 ── */

/* 档口订阅：服务端（openid）持久化 + 本地兜底 */
var sub = require('../../utils/stallSubscribe.js');

/* 拿货会员等级（累计拿货额自动升级，连续6月不拿货降级） */
var TIERS=[
  {key:'normal',name:'普通',badge:'L1',threshold:0,discount:''},
  {key:'level5w',name:'5万会员',badge:'L2',threshold:50000,discount:'2.8折'},
  {key:'level10w',name:'10万会员',badge:'L3',threshold:100000,discount:'2.8折'},
  {key:'level30w',name:'30万会员',badge:'L4',threshold:300000,discount:'2.6折'}
];

/* 未认证时显示的引导权益（同行截图1）*/
var CERT_BENEFITS=[
  {icon:'价',title:'批发价拿货'},
  {icon:'退',title:'无理由退'},
  {icon:'券',title:'运费券'},
  {icon:'新',title:'新款先看'}
];

/* 已认证时等级卡内权益（拿货会员累计赛道——只有折扣权，退换需充值） */
var TIER_CARD_BENEFITS=[
  {icon:'价',title:'批发价'},
  {icon:'折',title:'拿货折扣'},
  {icon:'新',title:'新款抢先'},
  {icon:'荐',title:'精准推荐'}
];

/* 各等级一句话说明（累计拿货额→折扣权，退换需单独充值） */
var TIER_DESC=[
  '认证即享批发价，累计拿货解锁折扣',
  '累计5万：拿货折扣2.8折',
  '累计10万：拿货折扣2.8折 + 新款优先',
  '累计30万：拿货折扣2.6折 + 数据报告'
];

Page({
  data:{
    /* ===== 登录状态 ===== */
    isLoggedIn:false,
    isAdmin:false,
    userId:'',
    roleText:'登录/注册',
    avatarUrl:'',

    /* ===== 认证状态 ===== */
    isCertified:false,
    certifiedStyle:'',

    /* ===== 拿货等级（累计制） ===== */
    tierIdx:0,
    tierBadge:'L1',
    tierName:'普通',
    tierDesc:'认证即享批发价，累计拿货解锁折扣',
    spentYuan:0,
    nextTierName:'5万会员',
    nextTierDiff:50000,
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
        isAdmin:false,
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
      tierDesc:TIER_DESC[idx]||'',
      spentYuan:spent.toFixed(2),
      nextTierName:next?next.name:'',
      nextTierDiff:diff,
      nextTierDiscount:next?next.discount||'':'',
      tierProgress:progress
    });
  },

  /* 统计数 */
  loadStats:function(){
    var t=this;
    var favs=(wx.getStorageSync('favorites')||[]).length;
    var hists=(wx.getStorageSync('view_history')||[]).length;
    var subs=(wx.getStorageSync('subscribed_stalls')||[]).length;
    t.setData({favCount:favs||'--',historyCount:hists||'--',subCount:subs||'--'});
    // 服务端订阅数（openid）为准，本地兜底
    sub.getOpenid().then(function(openid){
      sub.fetchSubscribedIds(openid).then(function(ids){
        if(ids&&Array.isArray(ids))t.setData({subCount:ids.length||'--'});
      }).catch(function(){});
    }).catch(function(){});
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
        var isCert=!!data.storeOwnerCertified;
        var certStyle=data.certifiedStyle||'';
        t.setData({
          walletBalance:data.walletBalance!=null?data.walletBalance:'--',
          couponCount:data.couponCount!=null?data.couponCount:'--',
          redPackCount:data.redPackCount!=null?data.redPackCount:'--',
          favCount:data.favCount||(wx.getStorageSync('favorites')||[]).length,
          historyCount:data.historyCount||(wx.getStorageSync('view_history')||[]).length,
          isAdmin:!!data.isAdmin,
          isCertified:isCert,
          certifiedStyle:certStyle,
          roleText:isCert?'已认证店主':'未认证店主'
        });
        wx.setStorageSync('is_certified_store_owner',isCert);
        wx.setStorageSync('certified_style',certStyle);
        var app=getApp();
        if(app&&app.globalData)app.globalData.isCertifiedStoreOwner=isCert;
      },
      fail:function(){}
    });
  },

  /* ===== 导航 ===== */
  goLogin:function(){wx.navigateTo({url:'/pages/login/index'});},
  goCertify:function(){wx.navigateTo({url:'/pages/certify/index'});},
  goVip:function(){wx.navigateTo({url:'/pages/vip/index'});},
  goVipDeposit:function(){wx.navigateTo({url:'/pages/vip/index?tab=deposit'});},
  goBuyer:function(){wx.switchTab({url:'/pages/buyer/index'});},
  goMarkets:function(){wx.navigateTo({url:'/pages/stall/markets/index'});},
  goSubscribedStalls:function(){wx.navigateTo({url:'/pages/stall/subscribed/index'});},
  goFavorites:function(){wx.navigateTo({url:'/pages/favorites/index'});},
  goHistory:function(){wx.navigateTo({url:'/pages/history/index'});},
  goCart:function(){wx.switchTab({url:'/pages/cart/index'});},
  goOrders:function(e){var s=e?e.currentTarget.dataset.status:'all';wx.navigateTo({url:'/pages/orders/index?status='+s});},
  goCoupons:function(){wx.navigateTo({url:'/pages/coupons/index'});},
  goRedPackets:function(){wx.navigateTo({url:'/pages/red-packets/index'});},
  goContact:function(){wx.showModal({title:'联系客服',content:'微信：luozhidie\n工作时间 9:00-18:00',showCancel:false,confirmText:'知道了'});},
  goPromo:function(){wx.switchTab({url:'/pages/home/index'});},
  goImport:function(){wx.navigateTo({url:'/pages/import/index'});},
  goAlbumGrab:function(){wx.navigateTo({url:'/pages/album-grab/index'});},
  goWardrobe:function(){wx.navigateTo({url:'/pages/wardrobe/index'});},
  goBooking:function(){wx.navigateTo({url:'/pages/booking/index'});},
  goAddress:function(){wx.navigateTo({url:'/pages/address/index'});},
  goFeedback:function(){wx.navigateTo({url:'/pages/feedback/index'});},
  goPersonalImage:function(){wx.navigateTo({url:'/pages/personal-image/index'});},
  goStyleTest:function(){wx.navigateTo({url:'/pages/diagnosis-form/index'});},

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
    title:'拿货会员权益规则',
    content:'【累计赛道·免费】认证后拿货累计金额自动升折扣等级（无退换额度）\nL1 普通(≥0): 批发价查看权\nL2/L3 5万~10万: 拿货2.8折\nL4 30万: 拿货2.6折 + 数据报告\n\n【充值赛道·付费】充值即同时获得 拿货折扣 + 退换额度(5%/10%/20%)，独立权益\n\n【保级规则】连续6个月无拿货记录将降级\n\n【价格会员】单独购买，时间制，到期收回权益',
    showCancel:false,confirmText:'知道了'
  });}
});
