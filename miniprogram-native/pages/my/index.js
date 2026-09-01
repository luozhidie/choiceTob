var guard = require('../../utils/agent-guard.js');
/* ── 小程序「我的」页 — 三态：未登录 / 已登录未认证 / 已登录已认证 ── */

/* 风格订阅：服务端（openid）持久化 + 本地兜底 */
var sub = require('../../utils/stallSubscribe.js');

/* 未认证时显示的引导权益（同行截图1）*/
var CERT_BENEFITS=[
  {icon:'价',title:'会员价选购'},
  {icon:'退',title:'无理由退'},
  {icon:'券',title:'运费券'},
  {icon:'新',title:'新款先看'}
];

/* 充值档位（折扣+退换额度只来自一次性充值） */
var RECHARGE_TIERS=[
  {amount:'首充¥6,000',val:'2.8折'},
  {amount:'充¥50,000',val:'2.8折+退换5%'},
  {amount:'充¥100,000',val:'2.8折+退换10%'},
  {amount:'充¥300,000',val:'2.6折+退换20%'}
];

/* 一次性充值档位（用于进度条） */
var DEPOSIT_TIERS=[
  {amount:998,text:'¥998 专业版 · 单件 3.3 折'},
  {amount:50000,text:'充 ¥50,000 可享 2.8折 + 退换5%'},
  {amount:100000,text:'充 ¥100,000 可享 2.8折 + 退换10%'},
  {amount:300000,text:'充 ¥300,000 可享 2.6折 + 退换20%'}
];

function formatMoney(n){
  n=Number(n)||0;
  return n.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
}

function calcDepositProgress(depositAmount){
  // depositAmount 单位：元
  var yuan=Number(depositAmount)||0;
  var next=null;
  for(var i=0;i<DEPOSIT_TIERS.length;i++){
    if(yuan<DEPOSIT_TIERS[i].amount){next=DEPOSIT_TIERS[i];break;}
  }
  var target=next?next.amount:DEPOSIT_TIERS[DEPOSIT_TIERS.length-1].amount;
  var pct=Math.min(100,(yuan/target)*100);
  return {
    depositAmountStr:formatMoney(yuan),
    depositProgress:Math.max(0,Math.round(pct)),
    nextTierText:next?next.text:'已解锁最高档位'
  };
}

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

    /* ===== 代理状态 ===== */
    isAgent:false,

    /* ===== 会员服务解锁态（认证会员/代理/管理员 = true）===== */
    isUnlocked:false,

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
    rechargeTiers:RECHARGE_TIERS,

    /* ===== 后台「页面背景」设置：我的页头部 ===== */
    myHeaderColor:'',
    myHeaderImage:'',
    myHeaderStyle:'',

    /* 营销弹窗 */
    popupCfg:null,
    popupVisible:false
  },

  onShow:function(){
    this.initAll();
    this.loadPageBg();
    this.loadPopup();
  },

  /* 营销弹窗：首次进入自动弹，关闭后不再弹 */
  loadPopup:function(){
    var t=this;
    if(t.data.popupVisible)return;
    wx.request({
      url:'https://colour-choice.art/api/public/popups?page=my',
      method:'GET',
      success:function(r){
        var list=[];
        if(r.data&&r.data.success&&Array.isArray(r.data.data))list=r.data.data;
        if(!list.length)return;
        var seen=wx.getStorageSync('popup_seen_ids')||{};
        var pending=null;
        for(var i=0;i<list.length;i++){
          if(!seen[list[i].id]){ pending=list[i]; break; }
        }
        if(pending) t.setData({ popupCfg:pending, popupVisible:true });
      }
    });
  },
  onPopupClose:function(){
    var t=this;
    var cfg=t.data.popupCfg;
    if(cfg&&cfg.id){
      var seen=wx.getStorageSync('popup_seen_ids')||{};
      seen[cfg.id]=Date.now();
      wx.setStorageSync('popup_seen_ids', seen);
    }
    t.setData({ popupVisible:false });
  },
  onPopupButtonTap:function(e){
    var t=this;
    var link=(e&&e.detail&&e.detail.link)||'';
    t.onPopupClose();
    if(!link)return;
    var tabPages=['pages/home/index','pages/buyer/index','pages/cart/index','pages/my/index'];
    var isTab=tabPages.some(function(p){ return link.indexOf(p)!==-1; });
    if(isTab) wx.switchTab({ url:'/'+link.replace(/^\//,'') });
    else wx.navigateTo({ url:'/'+link.replace(/^\//,''), fail:function(){ wx.switchTab({ url:'/pages/buyer/index' }); } });
  },

  /* 后台「页面背景」配置：我的页头部 */
  loadPageBg:function(){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/page-background',
      method:'GET',
      success:function(r){
        var d=r.data;
        if(!d||!d.success||!d.data)return;
        var m=d.data.my||{};
        var color=m.color||'';
        var img=m.image||'';
        // 图片优先；其次颜色；都为空则沿用 wxss 默认粉色渐变
        var style= img
          ? ('background:'+(color||'#fff5f8')+';background-image:url(\''+img+'\');background-size:cover;background-position:center;')
          : (color ? ('background:'+color+';') : '');
        t.setData({ myHeaderColor:color, myHeaderImage:img, myHeaderStyle:style });
      }
    });
  },

  initAll:function(){
    var t=this;
    var ui=wx.getStorageSync('user_info');
    var isCert=!!wx.getStorageSync('is_certified_store_owner');
    var certStyle=wx.getStorageSync('certified_style')||'';
    var token=wx.getStorageSync('token')||'';
    var isAdmin=!!wx.getStorageSync('is_admin');
    var isAgentCache=!!wx.getStorageSync('is_agent');
    t.setData({isAdmin:isAdmin,isUnlocked:!!(isCert||isAdmin||isAgentCache)});

    if(ui&&ui.nickName){
      /* 已登录 */
      t.setData({
        isLoggedIn:true,
        userId:ui.nickName||ui.openid||'用户',
        roleText:isCert?'已认证会员':'未认证会员',
        avatarUrl:ui.avatarUrl||'',
        isCertified:isCert,
        certifiedStyle:certStyle
      });
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
        isAgent:false,
        isUnlocked:false,
        subCount:'--',favCount:'--',historyCount:'--',
        walletBalance:'--',couponCount:'--',redPackCount:'--'
      });
    }
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
        var depositAmount=(data.depositAmount!=null?data.depositAmount:data.deposit_amount)||0;
        var depositInfo=calcDepositProgress(depositAmount);
        t.setData({
          walletBalance:data.walletBalance!=null?data.walletBalance:'--',
          couponCount:data.couponCount!=null?data.couponCount:'--',
          redPackCount:data.redPackCount!=null?data.redPackCount:'--',
          favCount:data.favCount||(wx.getStorageSync('favorites')||[]).length,
          historyCount:data.historyCount||(wx.getStorageSync('view_history')||[]).length,
          isAdmin:!!data.isAdmin,
          isCertified:isCert,
          certifiedStyle:certStyle,
          roleText:isCert?'已认证会员':'未认证会员',
          depositAmountStr:depositInfo.depositAmountStr,
          depositProgress:depositInfo.depositProgress,
          nextTierText:depositInfo.nextTierText,
          isUnlocked:!!(isCert||t.data.isAgent||data.isAdmin)
        });
        wx.setStorageSync('is_certified_store_owner',isCert);
        wx.setStorageSync('certified_style',certStyle);
        var app=getApp();
        if(app&&app.globalData)app.globalData.isCertifiedStoreOwner=isCert;
        t.loadAgentStatus(token);
      },
      fail:function(){}
    });
  },

  /* 代理状态（决定“我的”页是否显示代理中心/专属服务） */
  loadAgentStatus:function(token){
    var t=this;
    if(!token)return;
    wx.request({
      url:'https://colour-choice.art/api/agent/me',
      method:'GET',
      header:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      success:function(r){
        var d=r.data;
        var isAgent=!!(d&&(d.active||d.isAdmin||d.valid));
        t.setData({isAgent:isAgent,isUnlocked:!!(t.data.isCertified||isAgent||t.data.isAdmin)});
        wx.setStorageSync('is_agent',isAgent);
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
  goWishlist:function(){wx.navigateTo({url:'/pages/wishlist/index'});},
  goHistory:function(){wx.navigateTo({url:'/pages/history/index'});},
  goCart:function(){wx.switchTab({url:'/pages/cart/index'});},
  goOrders:function(e){var s=e?e.currentTarget.dataset.status:'all';wx.navigateTo({url:'/pages/orders/index?status='+s});},
  goCoupons:function(){wx.navigateTo({url:'/pages/coupons/index'});},
  goRedPackets:function(){wx.navigateTo({url:'/pages/red-packets/index'});},
  goContact:function(){wx.showModal({title:'联系客服',content:'微信：luozhidie666\n工作时间 9:00-18:00',showCancel:false,confirmText:'知道了'});},
  goSettings:function(){wx.navigateTo({url:'/pages/settings/index'});},
  goPromo:function(){wx.navigateTo({url:'/pages/newcustomer/index'});},
  goImport:function(){wx.navigateTo({url:'/pages/import/index'});},
  goAlbumGrab:function(){wx.navigateTo({url:'/pages/album-grab/index'});},
  goWardrobe:function(){wx.navigateTo({url:'/pages/wardrobe/index'});},
  goBooking:function(){wx.navigateTo({url:'/pages/booking/index'});},
  goAddress:function(){wx.navigateTo({url:'/pages/address/index'});},
  goFeedback:function(){wx.navigateTo({url:'/pages/feedback/index'});},
  goPersonalImage:function(){wx.navigateTo({url:'/pages/personal-image/index'});},
  goStyleTest:function(){wx.navigateTo({url:'/pages/diagnosis-form/index'});},
  goLookStudio:function(){
    var t=this;
    if (!guard.isAllowed()) { wx.showToast({ title: '该功能仅对合作代理开放', icon: 'none', duration: 2000 }); return; }
    if(!t.data.isLoggedIn){
      wx.navigateTo({url:'/pages/login/index?redirect='+encodeURIComponent('/pages/tryon-promo/index?from=my')});
      return;
    }
    wx.navigateTo({url:'/pages/tryon-promo/index?from=my'});
  },
  goStyleProfile:function(){wx.navigateTo({url:'/pages/style-profile/index'});},
  /* 会员服务门禁：未认证 → 弹窗引导去免费认证 */
  guardUnlock:function(){
    if(this.data.isUnlocked)return true;
    wx.showModal({
      title:'会员专享服务',
      content:'完成免费会员认证后，即可解锁全部 7 项专业服务与 AI 辅助方案。现在去认证？',
      confirmText:'去认证',
      cancelText:'稍后',
      success:function(res){ if(res.confirm){ wx.navigateTo({url:'/pages/certify/index'}); } }
    });
    return false;
  },
  goFashionStylist:function(e){
    if(!this.guardUnlock())return;
    var s=e?e.currentTarget.dataset.service:'outfit';wx.navigateTo({url:'/pages/fashion-stylist/index?service='+s});
  },
  goBuyerService:function(e){
    if(!this.guardUnlock())return;
    var s=e?e.currentTarget.dataset.service:'buyer_group';wx.navigateTo({url:'/pages/buyer-service/index?service='+s});
  },
  goBuyerRequest:function(){wx.navigateTo({url:'/pages/buyer-request/index'});},

  goNewCustomer:function(){wx.showToast({title:'新客权益开发中',icon:'none'});},
  goGroupBuy:function(){wx.navigateTo({url:'/pages/group/index'});},
  goLuckDraw:function(){wx.navigateTo({url:'/pages/fortune/index'});},
  goAgentRecruit:function(){wx.navigateTo({url:'/pages/agent-recruit/index'});},
  goAgentCenter:function(){wx.navigateTo({url:'/pages/agent-center/index'});},
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
          roleText:'未认证会员',
          avatarUrl:'',
          isCertified:false,
          isAgent:false,
          isUnlocked:false
        });
        wx.showToast({title:'已退出登录',icon:'success'});
      }
    });
  },

  goRules:function(){wx.showModal({
    title:'会员权益规则',
    content:'【认证会员·免费】认证后即解锁全部商品会员价查看权。\n\n【虚拟试衣代理·¥998】购买专业版 ¥998 即成为永久代理，无需预存货款：\n· 单件代发：3.3 折\n· 单笔满 5 件：2.8 折\n· 无退换额度\n\n【充值解锁·付费】一次性充值货款，同时获得会员折扣 + 退换额度：\n· 首充¥6,000：选购2.8折\n· 充¥50,000：选购2.8折 + 退换5%\n· 充¥100,000：选购2.8折 + 退换10%\n· 充¥300,000：选购2.6折 + 退换20%\n\n退换额度在退货时按档位自动抵扣。',
    showCancel:false,confirmText:'知道了'
  });}
});
