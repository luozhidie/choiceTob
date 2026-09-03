var app = getApp();
var guard = require('../../utils/agent-guard.js');
var vp = require('../../utils/virtual-pay.js');

var DEFAULT_VIP_COPY={
  hero:{title:'骆芷蝶 · VIP会员',subtitle:'企划定品控方向，严选稳货源'},
  guideSection:{title:'两种会员方式',subtitle:'认证会员可先看会员价；会员折扣与退换额度按所选赛道生效'},
  tryonCard:{icon:'试',inactiveIcon:'代',nameActive:'虚拟试衣会员',nameInactive:'成为合作代理',sub:'¥998 开通 · 享会员店铺专属价与权益',features:['单件发货 3.3 折','满 5 件 2.8 折','赠 100 次专属额度'],btnActive:'继续使用 ›',btnInactive:'立即开通 ↓'},
  depositCard:{icon:'充',name:'预存货款会员',sub:'充值即同时享折扣+退换额度',features:['退换额度','会员折扣','优先发货'],btn:'选套餐 ↓'},
  agentCenter:{tag:'AGENT',title:'权益中心',descActive:'已开通会员店铺 · 享专属价 · 分享搭配',descInactive:'购买 ¥998 专业版或充值货款，即可开通会员店铺享专属价',btnActive:'进入 ›',btnInactive:'去开通 ›'},
  tryonHeader:{title:'虚拟试衣会员',sub:'¥998 开通 · 无需预存'},
  tryonPlan:{id:'tryon_pro_998',name:'虚拟试衣会员·¥998',priceLabel:'购买 ¥998',discountLabel:'3.3折起',features:['单件3.3折','满5件2.8折','赠专业版100次','无需预存'],example:'',btn:'立即开通',highlight:true},
  depositHeader:{title:'充值会员套餐',sub:'充值即得 折扣权 + 退换额度'},
  depositPlanBtn:'立即充值',
  depositPlans:[
    {id:'wholesale_6k',name:'会员·首充6000',priceLabel:'充值 ¥6,000',discountLabel:'2.8折',features:['同色同款三件起购','会员折扣2.8折','无退换额度','小批量试购'],example:'原价¥100 → ¥28 + 赠专业试衣100次',tryonTip:'充值¥6000将自动扣除¥998专业版试衣费，剩余¥5002计入预存货款（仅用于选购，不退现）',highlight:false},
    {id:'wholesale_5w',name:'充值会员·5万',priceLabel:'充值 ¥50,000',discountLabel:'2.8折',features:['同色同款三件起购','会员折扣2.8折','退换额度5%','优先发货权'],example:'原价¥100 → ¥28',highlight:false},
    {id:'wholesale_10w',name:'充值会员·10万',priceLabel:'充值 ¥100,000',discountLabel:'2.8折',features:['同色同款三件起购','会员折扣2.8折','退换额度10%','优先发货权','专属配货师'],example:'原价¥100 → ¥28',highlight:true},
    {id:'wholesale_30w',name:'充值会员·30万',priceLabel:'充值 ¥300,000',discountLabel:'2.6折',features:['同色同款三件起购','会员折扣2.6折','退换额度20%','优先发货权','专属配货师','专属服务支持'],example:'原价¥100 → ¥26',highlight:true}
  ],
  payModal:{title:'联系顾问充值',tip:'预存货款为线下对公入账，由顾问确认后开通',advisorLabel:'顾问微信',copyBtn:'复制微信号',copyDialogTitle:'已复制微信号',copyDialogContent:'请在微信中搜索添加顾问 {advisorWx}，发送「充值 + 套餐名」，顾问确认到账后立即为你开通权益。'},
  advisorWx:'luozhidie666'
};

Page({
  data:{
    activeTab:'deposit',
    isMember:false,
    memberLabel:'',
    expireDate:'',
    /* 后台可配置文案（VIP 页） */
    vipCopy:DEFAULT_VIP_COPY,
    /* 别名：充值套餐 / 试衣套餐，代码逻辑仍用这两个 key */
    depositPlans:DEFAULT_VIP_COPY.depositPlans,
    tryonAgentPlan:DEFAULT_VIP_COPY.tryonPlan,
    advisorWx:DEFAULT_VIP_COPY.advisorWx,
    showTryonAgent:false,
    showPay:false,
    selectedPlan:null,
    /* 代理中心 */
    isAgent:false,
    agentStatus:{active:false,depositAmount:0,discountRate:1,returnRate:0},
  },

  onLoad:function(options){
    this.setData({showTryonAgent:guard.isAllowed()});
    if(options&&options.tab&&(options.tab==='price'||options.tab==='deposit')){
      this.setData({activeTab:options.tab});
    }
    this.chkLogin();
    this.loadAgentStatus();
    this.loadVipCopy();
  },

  /* 加载后台 VIP 页文案 */
  loadVipCopy:function(){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/settings?keys=vip_page_copy',
      success:function(r){
        var d=(r.data||{}).data||{};
        var vc=d.vip_page_copy;
        if(!vc)return;
        var merged={};
        for(var k in DEFAULT_VIP_COPY){ if(DEFAULT_VIP_COPY.hasOwnProperty(k)) merged[k]=(vc[k]!==undefined?vc[k]:DEFAULT_VIP_COPY[k]); }
        t.setData({
          vipCopy:merged,
          depositPlans:merged.depositPlans,
          tryonAgentPlan:merged.tryonPlan,
          advisorWx:merged.advisorWx
        });
      }
    });
  },

  onShow:function(){ this.loadAgentStatus(); },

  chkLogin:function(){
    var t=this;
    var ui=wx.getStorageSync('user_info');
    if(ui){
      t.setData({isMember:true,memberLabel:'充值会员',expireDate:'2027-07-03'});
    }
  },

  switchTab:function(e){this.setData({activeTab:e.currentTarget.dataset.tab});},

  /* 加载代理状态 */
  loadAgentStatus:function(){
    var t=this;
    app.getOpenid().then(function(openid){
      wx.request({
        url:'https://colour-choice.art/api/agent/me?openid='+encodeURIComponent(openid),
        success:function(r){
          var d=r.data||{};
          t.setData({
            isAgent:!!(d.active||d.isAdmin),
            agentStatus:{
              active:!!d.active,
              depositAmount:d.depositAmount||0,
              discountRate:d.discountRate||1,
              returnRate:d.returnRate||0,
            }
          });
        }
      });
    }).catch(function(){});
  },

  /* 去代理中心 */
  goAgentCenter:function(){ wx.navigateTo({url:'/pages/agent-center/index'}); },

  /* 引导卡：充值 → 滚动到套餐区 */
  scrollToDeposit:function(){
    var t=this;
    setTimeout(function(){
      wx.createSelectorQuery().select("#deposit").boundingClientRect(function(rect){
        if(!rect)return;
        wx.pageScrollTo({scrollTop:Math.max(0,rect.top-10),duration:300});
      }).exec();
    },100);
  },

  selectPlan:function(e){
    var plan=e.currentTarget.dataset.plan;
    this.setData({selectedPlan:plan,showPay:true});
  },

  /* 统一支付方法：先获取openid，再调起支付 */
  doWechatPay:function(planData){
    var t=this;
    wx.showLoading({title:'正在调起支付...'});

    /* 先获取openid */
    app.getOpenid().then(function(openid){
      wx.request({
        url:'https://colour-choice.art/api/wechat-pay/unified-order',
        method:'POST',
        data:{
          product_id:planData.id,
          product_title:planData.name,
          total_fee:t.getFee(planData.id),
          quantity:1,
          platform:'mini',
          openid:openid,
        },
        success:function(r){
          wx.hideLoading();
          var d=r.data||{};
          if(d.error){wx.showModal({title:'下单失败',content:d.error,showCancel:false});return;}
          var params=d.jsapi||d;
          wx.requestPayment({
            timeStamp:params.timeStamp,
            nonceStr:params.nonceStr,
            package:params.package,
            signType:params.signType||'MD5',
            paySign:params.paySign,
            success:function(){
              wx.showToast({title:'支付成功',icon:'success'});
              t.setData({showPay:false,selectedPlan:null});
              t.chkLogin();
            },
            fail:function(err){
              if(!(err&&err.errMsg&&err.errMsg.indexOf('cancel')>-1)){
                wx.showToast({title:'支付失败',icon:'none'});
              }
            }
          });
        },
        fail:function(){wx.hideLoading();wx.showToast({title:'网络错误',icon:'none'});}
      });
    }).catch(function(err){
      wx.hideLoading();
      console.error('获取openid失败',err);
      wx.showToast({title:'无法调起微信支付',icon:'none'});
    });
  },

  closePay:function(){this.setData({showPay:false,selectedPlan:null});},

  /* 998 合作代理开通：直接虚拟支付购买，成功后解锁试衣代理权 */
  buyTryonAgent:function(){
    var t=this;
    vp.pay({
      goodsKey:'tryon_pro_998',
      success:function(){
        wx.showToast({ title:'开通成功', icon:'success' });
        wx.setStorageSync('is_agent', true);
        t.setData({ isAgent:true, showTryonAgent:true });
        setTimeout(function(){ t.loadAgentStatus(); }, 600);
      },
      fail:function(err){
        if(err && err.errMsg && String(err.errMsg).indexOf('cancel') > -1) return;
        wx.showToast({ title:'支付失败，请重试', icon:'none' });
      },
      legacy:function(){ t.legacyBuyTryonAgent(); }
    });
  },

  /* 兜底：虚拟支付不可用时走原 JSAPI 通道 */
  legacyBuyTryonAgent:function(){
    var t=this;
    wx.showLoading({ title:'调起支付...' });
    app.getOpenid().then(function(openid){
      wx.request({
        url:'https://colour-choice.art/api/tryon/create',
        method:'POST',
        data:{ package_id:'tryon_pro_998', openid:openid },
        success:function(r){
          wx.hideLoading();
          var d=r.data||{};
          if(d.error){ wx.showModal({ title:'下单失败', content:d.error, showCancel:false }); return; }
          wx.requestPayment({
            timeStamp:d.timeStamp, nonceStr:d.nonceStr, package:d.package,
            signType:d.signType||'MD5', paySign:d.paySign,
            success:function(){
              wx.showToast({ title:'开通成功', icon:'success' });
              wx.setStorageSync('is_agent', true);
              t.setData({ isAgent:true, showTryonAgent:true });
            },
            fail:function(err){
              if(err && err.errMsg && err.errMsg.indexOf('cancel') > -1) return;
              wx.showToast({ title:'支付失败', icon:'none' });
            }
          });
        },
        fail:function(){ wx.hideLoading(); wx.showToast({ title:'网络错误', icon:'none' }); }
      });
    });
  },

  /* 预存货款属预付资金，小程序内不提供在线支付入口，改联系顾问线下入账 */
  copyAdvisor:function(){
    var t=this;
    var cfg=(t.data.vipCopy&&t.data.vipCopy.payModal)||DEFAULT_VIP_COPY.payModal;
    var wxid=t.data.advisorWx||DEFAULT_VIP_COPY.advisorWx;
    wx.setClipboardData({
      data:wxid,
      success:function(){
        wx.showModal({
          title:cfg.copyDialogTitle,
          content:(cfg.copyDialogContent||'').replace(/{advisorWx}/g, wxid),
          showCancel:false,
          confirmText:'知道了'
        });
      }
    });
  },

  getFee:function(pid){
    if(pid==='price_trial')return 1990;
    if(pid==='price_3m')return 12800;
    if(pid==='price_1y')return 39900;
    if(pid==='wholesale_6k')return 600000;
    if(pid==='wholesale_5w')return 5000000;
    if(pid==='wholesale_10w')return 10000000;
    if(pid==='wholesale_30w')return 30000000;
    return 100;
  }
});
